import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse, unauthorizedResponse, handleUnexpectedError } from '../_shared/response.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return unauthorizedResponse(req, 'No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return unauthorizedResponse(req, 'Unauthorized');
    }

    const { username } = await req.json();

    if (!username) {
      return errorResponse('Username is required', 'REQUEST_VALIDATION_FAILED', req, 400);
    }

    const { data, error } = await supabase.rpc('check_username_available', {
      _username: username,
      _current_user_id: user.id,
    });

    if (error) throw error;

    return successResponse({ available: data }, req);
  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
