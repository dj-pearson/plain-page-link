-- US-119: anyone could lock anyone else out of their account.
--
-- check_login_throttle counted failed attempts for an email across ALL source
-- addresses, and blocked at five. login-security's record_attempt takes the
-- email from the request body with no authentication, so five POSTs of
-- {action:'record_attempt', email:'victim@example.com', success:false} locked
-- that account for thirty minutes. Repeat on a timer and the lockout is
-- permanent. It costs an attacker nothing and needs no knowledge of the
-- password.
--
-- The fix is to scope the per-account counter to the source address. An
-- attacker can then only lock themselves out; a real brute-force attempt
-- against one account from one machine is still stopped after five tries, which
-- is what the control is for. The IP-wide counter is unchanged and is what
-- bounds someone working through many accounts from one place.
--
-- A distributed attacker with many addresses can still burn attempts, but they
-- can no longer produce a lockout that a legitimate visitor from their own
-- address would see, which is the denial-of-service this closes.

-- `inet`, matching the column and the original signature. Declaring `text`
-- here would create a second overload rather than replacing the function, and
-- a call would then be ambiguous.
CREATE OR REPLACE FUNCTION public.check_login_throttle(
  p_email text,
  p_ip_address inet,
  p_window_minutes integer DEFAULT 15,
  p_max_attempts integer DEFAULT 5
)
RETURNS TABLE(is_blocked boolean, attempts_remaining integer, blocked_until timestamptz, reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Failed attempts for this email FROM THIS ADDRESS. The address predicate is
  -- the whole fix: without it, a stranger's five failures locked the owner out.
  --
  -- A NULL address (the edge function cannot always determine one) falls back
  -- to the old email-wide count. That is the conservative direction: it can
  -- over-block, never under-block, and getClientIP returning nothing is rare.
  SELECT COUNT(*) INTO v_email_attempts
  FROM login_attempts
  WHERE email = p_email
    AND (p_ip_address IS NULL OR ip_address = p_ip_address)
    AND success = false
    AND created_at > v_window_start;

  -- Failed attempts from this address, against any account.
  SELECT COUNT(*) INTO v_ip_attempts
  FROM login_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND created_at > v_window_start;

  IF v_email_attempts >= p_max_attempts THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes * 2 || ' minutes')::INTERVAL,
      'Too many failed attempts for this email';
    RETURN;
  END IF;

  IF v_ip_attempts >= p_max_attempts * 3 THEN
    RETURN QUERY SELECT
      true,
      0,
      v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'Too many failed attempts from this IP address';
    RETURN;
  END IF;

  RETURN QUERY SELECT
    false,
    LEAST(p_max_attempts - v_email_attempts, (p_max_attempts * 3) - v_ip_attempts),
    NULL::TIMESTAMPTZ,
    NULL::TEXT;
END;
$function$;

COMMENT ON FUNCTION public.check_login_throttle(text, inet, integer, integer) IS
  'US-119: the per-account counter is scoped to the source address, so an unauthenticated caller cannot lock another person out.';

-- The index the scoped count needs. Without it this is a sequential scan of
-- login_attempts on every login.
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip_created
  ON public.login_attempts (email, ip_address, created_at DESC)
  WHERE success = false;
