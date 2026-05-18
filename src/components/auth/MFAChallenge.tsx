import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { MFAVerification } from '@/components/auth/mfa';

/**
 * MFA challenge screen shown after a successful password login when the
 * account has MFA enabled. Routed at /auth/mfa. Wraps the existing
 * MFAVerification component and, on success, marks the session
 * MFA-verified and continues to the dashboard.
 *
 * Guards:
 *  - no user OR MFA not required  -> /auth/login
 *  - MFA already verified         -> /dashboard
 */
export default function MFAChallenge() {
  const navigate = useNavigate();
  const { user, requiresMFA, mfaVerified, setMFAVerified } = useAuthStore();

  useEffect(() => {
    if (user && mfaVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, mfaVerified, navigate]);

  if (!user || !requiresMFA) {
    return <Navigate to="/auth/login" replace />;
  }
  if (mfaVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <MFAVerification
          onSuccess={() => {
            setMFAVerified(true);
            const saved = localStorage.getItem('lastVisitedRoute');
            navigate(saved && !saved.startsWith('/auth') ? saved : '/dashboard', {
              replace: true,
            });
          }}
        />
      </div>
    </div>
  );
}
