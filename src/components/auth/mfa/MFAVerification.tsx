import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, AlertCircle, Loader2, KeyRound } from "lucide-react";

interface MFAVerificationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showTrustDevice?: boolean;
}

export const MFAVerification = ({
  onSuccess,
  onCancel,
  showTrustDevice = true,
}: MFAVerificationProps) => {
  const { verifyMFA, getDeviceFingerprint, getBrowserInfo } = useMFA();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    const expectedLength = useBackupCode ? 8 : 6;
    const normalizedCode = code.replace(/-/g, "");

    if (!normalizedCode || normalizedCode.length !== expectedLength) {
      setError(
        useBackupCode
          ? "Please enter a valid backup code"
          : "Please enter a 6-digit code"
      );
      return;
    }

    setError("");
    try {
      const { browser, os } = getBrowserInfo();
      await verifyMFA.mutateAsync({
        code: normalizedCode,
        isSetupVerification: false,
        trustDevice,
        deviceFingerprint: getDeviceFingerprint(),
        deviceName: `${browser} on ${os}`,
        browser,
        os,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-gray-600">
          {useBackupCode
            ? "Enter one of your backup codes"
            : "Enter the code from your authenticator app"}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <Input
          type="text"
          inputMode={useBackupCode ? "text" : "numeric"}
          pattern={useBackupCode ? undefined : "[0-9]*"}
          maxLength={useBackupCode ? 9 : 6}
          placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
          value={code}
          onChange={(e) => {
            const value = useBackupCode
              ? e.target.value.toUpperCase()
              : e.target.value.replace(/\D/g, "");
            setCode(value);
          }}
          onKeyDown={handleKeyDown}
          className="text-center text-2xl tracking-widest font-mono"
          autoFocus
        />

        {showTrustDevice && !useBackupCode && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Trust this device for 30 days</span>
          </label>
        )}
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleVerify}
          disabled={verifyMFA.isPending}
          className="w-full"
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

        <div className="flex items-center gap-3">
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
            variant="ghost"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
              setError("");
            }}
            className="flex-1"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {useBackupCode ? "Use authenticator" : "Use backup code"}
          </Button>
        </div>
      </div>

      {useBackupCode && (
        <p className="text-xs text-center text-gray-500">
          Backup codes are one-time use. After using one, it cannot be used again.
        </p>
      )}
    </div>
  );
};

export default MFAVerification;
