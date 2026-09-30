import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { sendEmail, escapeHtml } from '../_shared/email.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { generateInviteToken, hashInviteToken, inviteAcceptUrl, INVITE_TOKEN_RE } from './invites.ts';

/**
 * Teams CRUD + membership.
 *   POST { action: 'create', name }
 *   POST { action: 'invite', teamId, email, role? }
 *   POST { action: 'accept', teamId, token }   (token from the emailed link, US-226)
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

      // user_id is left null until the invitee accepts.
      //
      // US-200: this used to look the invitee up with
      // `.from('profiles').eq('email', ...)`. `profiles` has no `email` column —
      // the account address lives in auth.users, which is the whole reason
      // _shared/agent-contact.ts exists (US-070). PostgREST answered 400, the
      // `{ data }` destructure dropped the error, and `existing` was always
      // undefined, so the branch never did anything but cost a round trip.
      //
      // Nothing is lost by removing it: the 'accept' action below links the row
      // by email (`user_id.eq.<id>,email.eq.<address>`), which is the only
      // moment the invitee is actually present to be linked.
      // US-226: the invite used to stop here — a row nobody was told about and
      // no page could accept. It now carries a one-time token (stored hashed)
      // and the invitee gets a link to /team/accept.
      const token = generateInviteToken();
      const inviteEmail = String(email).trim().toLowerCase();
      const { data: member, error } = await service
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: null,
          email: inviteEmail,
          role: role === 'admin' ? 'admin' : 'member',
          invite_token_hash: await hashInviteToken(token),
          invite_sent_at: new Date().toISOString(),
        })
        .select('id, team_id, email, role, invited_at, accepted_at')
        .single();
      if (error) throw error;

      const { data: teamRow } = await service.from('teams').select('name').eq('id', teamId).maybeSingle();
      const teamName = (teamRow?.name as string | undefined) ?? 'their team';
      const link = inviteAcceptUrl(getSiteUrl(), teamId, token);
      const sent = await sendEmail({
        to: inviteEmail,
        subject: `You're invited to join ${teamName} on AgentBio`,
        body: `${user.email} invited you to join ${teamName} on AgentBio.\n\nAccept the invitation: ${link}\n\nIf you weren't expecting this, you can ignore it.`,
        html: `<p>${escapeHtml(user.email ?? 'A teammate')} invited you to join <strong>${escapeHtml(teamName)}</strong> on AgentBio.</p><p><a href="${escapeHtml(link)}">Accept the invitation</a></p><p>If you weren't expecting this, you can ignore it.</p>`,
      });
      if (!sent.ok) console.error(`[teams] invite email to ${inviteEmail} failed: ${sent.error}`);

      return successResponse({ member, emailed: sent.ok }, req);
    }

    if (action === 'accept') {
      // US-226: by token. This matched on the caller's email instead,
      // interpolated into a PostgREST filter string, so anyone able to sign up
      // under an invited address could take the seat.
      const { teamId, token } = body;
      if (!teamId || typeof token !== 'string' || !INVITE_TOKEN_RE.test(token)) {
        return errorResponse('teamId and token are required', 'REQUEST_VALIDATION_FAILED', req);
      }
      const { data: accepted, error } = await service
        .from('team_members')
        .update({ user_id: user.id, accepted_at: new Date().toISOString(), invite_token_hash: null })
        .eq('team_id', teamId)
        .eq('invite_token_hash', await hashInviteToken(token))
        .is('accepted_at', null)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!accepted) {
        return errorResponse('This invitation is invalid or has already been used', 'NOT_FOUND', req, 404);
      }
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
