import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSSO } from "@/hooks/useSSO";
import { useAuthStore } from "@/stores/useAuthStore";
import { sanitizeRedirectUrl } from "@/lib/url-validation";
import { Loader2, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SSOCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleSSOCallback, validateSSOState, clearSSOState } = useSSO();
  const { initialize } = useAuthStore();
  const [status, setStatus] = useState<"processing" | "success" | "error" | "csrf_error">(
    "processing"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const SAMLResponse = searchParams.get("SAMLResponse");
        const RelayState = searchParams.get("RelayState");
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth errors
        if (errorParam) {
          clearSSOState();
          throw new Error(errorDescription || errorParam);
        }

        if (!SAMLResponse && !code) {
          clearSSOState();
          throw new Error("Invalid SSO callback - missing required parameters");
        }

        // CSRF Protection: Validate state parameter for OIDC flows
        // Note: SAML flows use RelayState which is validated differently
        if (code && state) {
          try {
            validateSSOState(state);
          } catch (csrfError) {
            setStatus("csrf_error");
            setError(csrfError instanceof Error ? csrfError.message : "Security validation failed");
            return;
          }
        }

        // Process callback
        const result = await handleSSOCallback.mutateAsync({
          SAMLResponse: SAMLResponse || undefined,
          RelayState: RelayState || undefined,
          code: code || undefined,
          state: state || undefined,
        });

        if (result.success) {
          setStatus("success");

          // If we have a redirect URL with magic link, navigate there
          if (result.redirectUrl) {
            // Validate redirect URL to prevent open redirect attacks (defense in depth)
            const safeRedirectUrl = sanitizeRedirectUrl(
              result.redirectUrl,
              '/dashboard',
              ['*.agentbio.net', 'localhost:8080', '127.0.0.1:8080']
            );

            // The redirect URL might be a magic link - let Supabase handle it
            window.location.href = safeRedirectUrl;
          } else {
            // Re-initialize auth state and redirect to dashboard
            await initialize();
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          }
        } else {
          throw new Error(result.error || "SSO authentication failed");
        }
      } catch (err) {
        console.error("SSO Callback Error:", err);
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {status === "processing" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Completing Sign In
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your identity...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sign In Successful
            </h2>
            <p className="text-gray-600">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === "csrf_error" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Security Check Failed
            </h2>
            <p className="text-amber-600">{error}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4 text-left">
              <p className="text-sm text-amber-800">
                <strong>What happened?</strong>
              </p>
              <p className="text-sm text-amber-700 mt-1">
                This security check protects against cross-site request forgery attacks.
                This can happen if:
              </p>
              <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                <li>The SSO request took too long (over 15 minutes)</li>
                <li>You opened the login link in a different browser/tab</li>
                <li>Your browser cleared session data</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => navigate("/auth/login")}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sign In Failed
            </h2>
            <p className="text-red-600">{error}</p>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => navigate("/auth/login")}>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth/login")}
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSOCallback;
