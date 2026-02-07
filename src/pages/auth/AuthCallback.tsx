import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle error from OAuth provider
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMessage(searchParams.get('error_description') || error);
          return;
        }

        // Handle magic link token from OAuth proxy
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        const isNewUser = searchParams.get('new_user') === 'true';

        if (token && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'magiclink',
          });

          if (verifyError) {
            setStatus('error');
            setErrorMessage(verifyError.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            const destination = isNewUser ? '/onboarding/wizard' : redirectTo;
            setTimeout(() => navigate(destination, { replace: true }), 800);
            return;
          }
        }

        // Handle PKCE code exchange (fallback for standard Supabase OAuth)
        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
          if (data.session) {
            setStatus('success');
            setTimeout(() => navigate('/dashboard', { replace: true }), 800);
            return;
          }
        }

        // No valid auth data found
        navigate('/auth/login', { replace: true });
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="text-center">
        {status === 'processing' && (
          <div className="space-y-6">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
              <p className="text-blue-200/70 text-sm">Verifying your credentials</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome back!</h2>
              <p className="text-emerald-200/70 text-sm">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 max-w-sm">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
              <p className="text-red-200/70 text-sm mb-6">{errorMessage}</p>
              <button
                onClick={() => navigate('/auth/login')}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
