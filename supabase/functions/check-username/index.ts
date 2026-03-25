import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';

export default async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { username } = await req.json();

    if (!username) {
      return errorResponse('Username is required', 'REQUEST_VALIDATION_FAILED', req, 400);
    }

    // Try to get the current user if an auth token is provided (optional)
    let currentUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        currentUserId = user.id;
      }
    }

    // Check username availability - use a simple query if no RPC or no user
    if (currentUserId) {
      const { data, error } = await supabase.rpc('check_username_available', {
        _username: username,
        _current_user_id: currentUserId,
      });

      if (error) throw error;
      return successResponse({ available: data }, req);
    } else {
      // For unauthenticated checks (registration flow), query directly
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return successResponse({ available: !data }, req);
    }
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
};
