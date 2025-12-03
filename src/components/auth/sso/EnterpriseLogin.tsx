import { useState } from "react";
import { useSSO } from "@/hooks/useSSO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, ArrowRight, Loader2, AlertCircle, Mail } from "lucide-react";

interface EnterpriseLoginProps {
  onBack?: () => void;
  redirectUri?: string;
}

export const EnterpriseLogin = ({ onBack, redirectUri }: EnterpriseLoginProps) => {
  const { initiateSSOLogin } = useSSO();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [ssoInfo, setSSOInfo] = useState<{
    available: boolean;
    provider?: string;
    organizationName?: string;
  } | null>(null);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    try {
      const result = await initiateSSOLogin.mutateAsync({
        email,
        redirectUri,
      });

      if (result.ssoAvailable && result.authUrl) {
        setSSOInfo({
          available: true,
          provider: result.provider,
          organizationName: result.organizationName,
        });
        // Redirect to IdP
        window.location.href = result.authUrl;
      } else {
        setSSOInfo({ available: false });
        setError(
          "No enterprise SSO is configured for your organization. Please use email/password login."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate SSO. Please try again."
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Enterprise Sign In
        </h2>
        <p className="mt-2 text-gray-600">
          Sign in with your organization's identity provider
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {initiateSSOLogin.isPending && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-blue-600">
            {ssoInfo?.organizationName
              ? `Redirecting to ${ssoInfo.organizationName}...`
              : "Checking your organization..."}
          </span>
        </div>
      )}

      <form onSubmit={handleCheckEmail} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Work Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSSOInfo(null);
              }}
              className="pl-10"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter your work email to sign in with your organization's SSO
          </p>
        </div>

        <Button
          type="submit"
          disabled={initiateSSOLogin.isPending || !email}
          className="w-full"
        >
          {initiateSSOLogin.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Continue with SSO
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {onBack && (
        <div className="text-center">
          <Button variant="ghost" onClick={onBack}>
            Back to login options
          </Button>
        </div>
      )}

      <div className="text-center text-xs text-gray-500">
        <p>
          Your organization must have SSO configured with AgentBio.
          <br />
          Contact your IT administrator if you're having trouble.
        </p>
      </div>
    </div>
  );
};

export default EnterpriseLogin;
