import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';

/**
 * Teams CRUD + membership.
 *   POST { action: 'create', name }
 *   POST { action: 'invite', teamId, email, role? }
 *   POST { action: 'accept', teamId }
 *   POST { action: 'remove', teamId, memberId }
 *   POST { action: 'updateRole', teamId, memberId, role }
 *
 * Authorization is enforced with the is_team_admin RPC (owner/admin only for
 * mutations beyond create/accept).
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);

  try {
    const authed = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const user = await requireAuth(req, authed);
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const action = body.action as string;

    const isAdmin = async (teamId: string): Promise<boolean> => {
      const { data } = await service.rpc('is_team_admin', { p_team_id: teamId, p_user_id: user.id });
      return data === true;
    };

    if (action === 'create') {
      const name = (body.name as string)?.trim();
      if (!name) return errorResponse('Team name is required', 'REQUEST_VALIDATION_FAILED', req);

      const { data: team, error } = await service
        .from('teams')
        .insert({ name, owner_id: user.id })
        .select('*')
        .single();
      if (error) throw error;

      // Owner is a member automatically (accepted).
      await service.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        email: user.email,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

      return successResponse({ team }, req);
    }

    if (action === 'invite') {
      const { teamId, email, role } = body;
      if (!teamId || !email) return errorResponse('teamId and email are required', 'REQUEST_VALIDATION_FAILED', req);
      if (!(await isAdmin(teamId))) return errorResponse('Forbidden', 'FORBIDDEN', req, 403);

      // Seat limit check.
      const { data: team } = await service.from('teams').select('max_seats').eq('id', teamId).single();
      const { count } = await service
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId);
      if (team && (count ?? 0) >= team.max_seats) {
        return errorResponse('Seat limit reached for this plan', 'RATE_LIMIT', req, 429);
      }

      // Link to an existing user if the email matches.
      const { data: existing } = await service
        .from('profiles')
        .select('id')
        .eq('email', String(email).toLowerCase())
        .maybeSingle();

      const { data: member, error } = await service
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: existing?.id ?? null,
          email: String(email).toLowerCase(),
          role: role === 'admin' ? 'admin' : 'member',
        })
        .select('*')
        .single();
      if (error) throw error;
      return successResponse({ member }, req);
    }

    if (action === 'accept') {
      const { teamId } = body;
      if (!teamId) return errorResponse('teamId is required', 'REQUEST_VALIDATION_FAILED', req);
      const { error } = await service
        .from('team_members')
        .update({ user_id: user.id, accepted_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .or(`user_id.eq.${user.id},email.eq.${String(user.email).toLowerCase()}`);
      if (error) throw error;
      return successResponse({ accepted: true }, req);
    }

    if (action === 'remove') {
      const { teamId, memberId } = body;
      if (!teamId || !memberId) return errorResponse('teamId and memberId are required', 'REQUEST_VALIDATION_FAILED', req);
      if (!(await isAdmin(teamId))) return errorResponse('Forbidden', 'FORBIDDEN', req, 403);
      const { error } = await service
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', teamId)
        .neq('role', 'owner'); // never remove the owner
      if (error) throw error;
      return successResponse({ removed: true }, req);
    }

    if (action === 'updateRole') {
      const { teamId, memberId, role } = body;
      if (!teamId || !memberId || !role) return errorResponse('teamId, memberId, role required', 'REQUEST_VALIDATION_FAILED', req);
      if (!(await isAdmin(teamId))) return errorResponse('Forbidden', 'FORBIDDEN', req, 403);
      if (!['admin', 'member'].includes(role)) return errorResponse('Invalid role', 'REQUEST_VALIDATION_FAILED', req);
      const { error } = await service
        .from('team_members')
        .update({ role })
        .eq('id', memberId)
        .eq('team_id', teamId)
        .neq('role', 'owner');
      if (error) throw error;
      return successResponse({ updated: true }, req);
    }

    return errorResponse('Unknown action', 'REQUEST_VALIDATION_FAILED', req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
