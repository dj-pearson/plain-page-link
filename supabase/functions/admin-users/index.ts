/**
 * Admin users (US-231).
 *
 * UserManagementPanel called supabase.auth.admin.listUsers() from the browser.
 * That needs the service-role key, the browser holds the anon key, so the call
 * always failed and the admin Users list was always empty: the operator could
 * not find, let alone support, a single user. This does the listing server-
 * side, for admins only.
 *
 *   POST { search?: string }  → { users: AdminUserRow[], stats: AdminUserStats }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { mergeUsers, searchUsers, userStats, type AuthUserLike } from './merge.ts';

/** Enough for this stage of the business; page through when it is not. */
const MAX_USERS = 5000;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);

  try {
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await requireAdmin(req, service);

    const { search } = (await req.json().catch(() => ({}))) as { search?: string };

    const users: AuthUserLike[] = [];
    for (let page = 1; users.length < MAX_USERS; page++) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...(data.users as AuthUserLike[]));
      if (data.users.length < 1000) break;
    }

    const [profiles, roles, subs] = await Promise.all([
      service.from('profiles').select('id, username, full_name'),
      service.from('user_roles').select('user_id, role'),
      service.from('subscriptions').select('user_id, plan_name, status, stripe_customer_id'),
    ]);
    for (const r of [profiles, roles, subs]) if (r.error) throw r.error;

    const rows = mergeUsers(users, profiles.data ?? [], roles.data ?? [], subs.data ?? []);
    return successResponse({ users: searchUsers(rows, search), stats: userStats(rows) }, req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
