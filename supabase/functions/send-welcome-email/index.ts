import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendEmail } from '../_shared/email.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts'
import { requireAuth } from '../_shared/auth.ts'
import { isServiceRoleRequest } from '../_shared/service-auth.ts'
import { getSiteUrl } from '../_shared/env.ts';
import { buildWelcomeEmail } from '../_shared/welcome-email.ts';

/**
 * The welcome email, sent to the agent who just finished onboarding.
 *
 * US-119: this took `to`, `full_name` and `username` from the request body with
 * no authentication and no limit — an AgentBio-branded relay from
 * noreply@agentbio.net to any address, carrying any name and a link to any
 * path on the site. That is a phishing tool with the product's own domain and
 * reputation behind it.
 *
 * Nothing about the message is caller-supplied now: the address comes from the
 * verified JWT, and the display name and username come from that user's own
 * profile row. The body is a fixed template.
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // The caller must be who the email is for. A service-role caller (the
    // signup path) is allowed to name a user_id, because there is no session
    // yet at that point — but even then the address is read from auth.users,
    // never from the body.
    let userId: string | null = null

    if (isServiceRoleRequest(req)) {
      const body = await req.json().catch(() => ({}))
      userId = typeof body?.user_id === 'string' ? body.user_id : null
      if (!userId) {
        return errorResponse('A user_id is required', 'REQUEST_VALIDATION_FAILED', req)
      }
    } else {
      try {
        const user = await requireAuth(req, supabase)
        userId = user.id
      } catch {
        return errorResponse('Unauthorized', 'UNAUTHORIZED', req, 401)
      }
    }

    // The address: from auth.users, not from the request.
    const { data: authUser, error: authLookupError } = await supabase.auth.admin.getUserById(userId)
    const recipient = authUser?.user?.email

    if (authLookupError || !recipient) {
      console.error(`[send-welcome-email] no account email for ${userId}`)
      return errorResponse(
        'Could not resolve the account address',
        'AGENT_EMAIL_UNRESOLVED',
        req
      )
    }

    // The name and the profile URL: from the agent's own profile row.
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, is_published')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.username) {
      return errorResponse('That account has no profile yet', 'PROFILE_NOT_FOUND', req, 404)
    }

    // US-616: the copy lives in _shared/welcome-email.ts, where it is tested
    // and scanned for unsupported claims.
    const email = buildWelcomeEmail({
      displayName: profile.full_name || profile.username,
      username: profile.username,
      siteUrl: getSiteUrl(),
      isPublished: profile.is_published,
    })

    // sendEmail never throws; it reports. This used to ignore the result and
    // answer 'Welcome email sent' to every call, so onboarding told the agent
    // to check their inbox for a message that was never sent.
    const sent = await sendEmail({
      to: recipient,
      subject: email.subject,
      body: email.text,
      html: email.html,
    })

    if (!sent.ok) {
      console.error(`[send-welcome-email] send failed for ${userId}: ${sent.error ?? 'unknown error'}`)
      return errorResponse('The welcome email could not be sent', 'EMAIL_SEND_FAILED', req, 502)
    }

    return successResponse({ message: 'Welcome email sent' }, req)

  } catch (error) {
    return handleUnexpectedError(error, req)
  }
})
