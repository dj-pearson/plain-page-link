import { useInRouterContext } from 'react-router-dom';
import { FullPageLoader } from './LoadingSpinner';

/**
 * Component to verify Router context is available before rendering children.
 * This prevents the "Cannot destructure property 'basename'" error.
 *
 * Uses useInRouterContext() — a hook that synchronously reports whether the
 * component tree is inside a Router — instead of wrapping useNavigate() in a
 * try/catch. The previous approach called hooks conditionally, violating the
 * rules of hooks.
 */
export function RouterCheck({ children }: { children: React.ReactNode }) {
  const inRouterContext = useInRouterContext();

  if (!inRouterContext) {
    return <FullPageLoader text="Initializing..." />;
  }

  return <>{children}</>;
}
