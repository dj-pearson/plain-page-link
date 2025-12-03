import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MFASetup } from "./MFASetup";
import {
  Shield,
  ShieldOff,
  Smartphone,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MFASettings = () => {
  const {
    mfaSettings,
    trustedDevices,
    isLoading,
    isMFAEnabled,
    isLocked,
    disableMFA,
    revokeTrustedDevice,
    refetchSettings,
  } = useMFA();

  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");

  const handleDisableMFA = async () => {
    if (!disableCode) {
      setDisableError("Please enter your verification code");
      return;
    }

    setDisableError("");
    try {
      await disableMFA.mutateAsync({ code: disableCode });
      setShowDisable(false);
      setDisableCode("");
    } catch (err) {
      setDisableError(
        err instanceof Error ? err.message : "Failed to disable MFA"
      );
    }
  };

  const handleRevokDevice = async (deviceId: string) => {
    try {
      await revokeTrustedDevice.mutateAsync(deviceId);
    } catch (err) {
      console.error("Failed to revoke device:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MFA Status Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isMFAEnabled ? "bg-green-100" : "bg-gray-100"
              )}
            >
              {isMFAEnabled ? (
                <Shield className="w-6 h-6 text-green-600" />
              ) : (
                <ShieldOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isMFAEnabled
                  ? "Your account is protected with two-factor authentication"
                  : "Add an extra layer of security to your account"}
              </p>
              {isMFAEnabled && mfaSettings?.verified_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Enabled on {formatDate(mfaSettings.verified_at)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMFAEnabled ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <Check className="w-3 h-3" />
                  Enabled
                </span>
                <Dialog open={showDisable} onOpenChange={setShowDisable}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Disable
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                      <DialogDescription>
                        Enter your authenticator code or backup code to disable
                        two-factor authentication.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {disableError && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span>{disableError}</span>
                        </div>
                      )}
                      <Input
                        type="text"
                        placeholder="Enter verification code"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        className="text-center font-mono"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDisable(false);
                            setDisableCode("");
                            setDisableError("");
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisableMFA}
                          disabled={disableMFA.isPending}
                          className="flex-1"
                        >
                          {disableMFA.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Disabling...
                            </>
                          ) : (
                            "Disable MFA"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogTrigger asChild>
                  <Button>Enable</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <MFASetup
                    onComplete={() => {
                      setShowSetup(false);
                      refetchSettings();
                    }}
                    onCancel={() => setShowSetup(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 flex items-center gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              MFA verification is temporarily locked due to too many failed
              attempts. Try again later.
            </span>
          </div>
        )}
      </div>

      {/* Trusted Devices */}
      {isMFAEnabled && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trusted Devices
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These devices can skip two-factor authentication when signing in.
          </p>

          {trustedDevices && trustedDevices.length > 0 ? (
            <div className="space-y-3">
              {trustedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {device.device_name || "Unknown Device"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {device.browser} on {device.os} • Last used{" "}
                        {formatDate(device.last_used_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokDevice(device.id)}
                    disabled={revokeTrustedDevice.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {revokeTrustedDevice.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No trusted devices. When you sign in and choose to trust a device,
              it will appear here.
            </p>
          )}
        </div>
      )}

      {/* Security Recommendations */}
      {!isMFAEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Security Recommendation
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                We strongly recommend enabling two-factor authentication to
                protect your account from unauthorized access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASettings;
