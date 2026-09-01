import { useNavigate } from 'react-router-dom';
import { NativeMFAVerification } from '@/components/auth/mfa/NativeMFAVerification';
import { useAuthStore } from '@/stores/useAuthStore';

const LAST_ROUTE_KEY = 'lastVisitedRoute';

/**
 * MFA Challenge page (route: /auth/mfa).
 *
 * Shown during the login flow when the session is aal1 and a second factor is
 * outstanding. SecureRoute redirects here when an MFA-protected route is
 * reached without one. On success the user is returned to where they were
 * heading — and, more importantly, their token is now aal2, which is what RLS
 * will check (US-085).
 */
export const MFAChallenge = () => {
  const navigate = useNavigate();
  const { setMFAVerified, signOut, session } = useAuthStore();

  const handleSuccess = () => {
    setMFAVerified(true);
    const destination = localStorage.getItem(LAST_ROUTE_KEY) || '/dashboard';
    navigate(destination, { replace: true });
  };

  const handleCancel = async () => {
    // Abandoning the second factor aborts the login entirely.
    if (session) {
      await signOut();
    }
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
        <NativeMFAVerification onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default MFAChallenge;
