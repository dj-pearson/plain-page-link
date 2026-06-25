import { useNavigate } from 'react-router-dom';
import { MFAVerification } from '@/components/auth/mfa';
import { useAuthStore } from '@/stores/useAuthStore';

const LAST_ROUTE_KEY = 'lastVisitedRoute';

/**
 * MFA Challenge page (route: /auth/mfa).
 *
 * Shown during the login flow after a successful password authentication
 * when the account has MFA enabled. SecureRoute redirects here when an
 * MFA-protected route is accessed without a verified second factor.
 * On success the user is returned to the route they were heading to.
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
        <MFAVerification onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default MFAChallenge;
