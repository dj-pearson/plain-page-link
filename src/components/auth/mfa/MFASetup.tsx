import { useState, useEffect } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Copy, Check, Shield, AlertCircle, Loader2 } from "lucide-react";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MFASetup = ({ onComplete, onCancel }: MFASetupProps) => {
  const { setupMFA, verifyMFA, getDeviceFingerprint, getBrowserInfo } = useMFA();
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "backup" | "complete">("intro");
  const [setupData, setSetupData] = useState<{
    secret: string;
    totpUri: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Generate QR code URL
  const getQRCodeUrl = (totpUri: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`;
  };

  const handleStartSetup = async () => {
    setError("");
    try {
      const result = await setupMFA.mutateAsync();
      setSetupData({
        secret: result.secret,
        totpUri: result.totpUri,
        backupCodes: result.backupCodes,
      });
      setStep("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start MFA setup");
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setError("");
    try {
      const { browser, os } = getBrowserInfo();
      await verifyMFA.mutateAsync({
        code: verificationCode,
        isSetupVerification: true,
        trustDevice: true,
        deviceFingerprint: getDeviceFingerprint(),
        deviceName: `${browser} on ${os}`,
        browser,
        os,
      });
      setStep("backup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      await navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const handleComplete = () => {
    setStep("complete");
    onComplete?.();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Intro Step */}
      {step === "intro" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Enable Two-Factor Authentication
            </h2>
            <p className="mt-2 text-gray-600">
              Add an extra layer of security to your account by requiring a code
              from your authenticator app when signing in.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">What you'll need:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  An authenticator app like{" "}
                  <span className="font-medium">Google Authenticator</span>,{" "}
                  <span className="font-medium">Authy</span>, or{" "}
                  <span className="font-medium">1Password</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>A safe place to store your backup codes</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleStartSetup}
              disabled={setupMFA.isPending}
              className="flex-1"
            >
              {setupMFA.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Setup Step */}
      {step === "setup" && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Scan QR Code
            </h2>
            <p className="mt-2 text-gray-600">
              Scan this QR code with your authenticator app
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <img
                src={getQRCodeUrl(setupData.totpUri)}
                alt="QR Code for authenticator"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center">
              Can't scan the code? Enter this key manually:
            </p>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono break-all">
                {setupData.secret}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySecret}
                className="flex-shrink-0"
              >
                {copiedSecret ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button onClick={() => setStep("verify")} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {/* Verify Step */}
      {step === "verify" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Verify Setup
            </h2>
            <p className="mt-2 text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setVerificationCode(value);
              }}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("setup")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifyMFA.isPending || verificationCode.length !== 6}
              className="flex-1"
            >
              {verifyMFA.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === "backup" && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Save Your Backup Codes
            </h2>
            <p className="mt-2 text-gray-600">
              Store these codes securely. You can use each code once if you lose
              access to your authenticator app.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">
                Backup Codes
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyBackupCodes}
              >
                {copiedBackupCodes ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy all
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="bg-white text-sm font-mono p-2 rounded border text-center"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Important:</strong> Each backup code can only be used once.
            Keep them in a safe place!
          </div>

          <Button onClick={handleComplete} className="w-full">
            I've saved my backup codes
          </Button>
        </div>
      )}

      {/* Complete Step */}
      {step === "complete" && (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Two-Factor Authentication Enabled
          </h2>
          <p className="text-gray-600">
            Your account is now protected with two-factor authentication.
            You'll need to enter a code from your authenticator app each time
            you sign in.
          </p>
        </div>
      )}
    </div>
  );
};

export default MFASetup;
