import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export interface MFASettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  mfa_method: 'totp' | 'email' | 'sms' | null;
  verified_at: string | null;
  last_used_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  backup_codes_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustedDevice {
  id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  last_used_at: string;
  trusted_until: string;
  revoked: boolean;
  created_at: string;
}

export interface MFASetupResponse {
  success: boolean;
  secret: string;
  totpUri: string;
  backupCodes: string[];
  message: string;
}

export interface MFAVerifyResponse {
  success: boolean;
  verified: boolean;
  mfaEnabled: boolean;
  remainingBackupCodes: number;
  message: string;
}

export function useMFA() {
  const { user, session } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch MFA settings
  const {
    data: mfaSettings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["mfa-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_mfa_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MFASettings | null;
    },
    enabled: !!user?.id,
  });

  // Fetch trusted devices
  const {
    data: trustedDevices,
    isLoading: isLoadingDevices,
    refetch: refetchDevices,
  } = useQuery({
    queryKey: ["mfa-trusted-devices", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("mfa_trusted_devices")
        .select("*")
        .eq("user_id", user.id)
        .eq("revoked", false)
        .gte("trusted_until", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrustedDevice[];
    },
    enabled: !!user?.id && !!mfaSettings?.mfa_enabled,
  });

  // Setup MFA mutation
  const setupMFA = useMutation({
    mutationFn: async (): Promise<MFASetupResponse> => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("setup-mfa", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as MFASetupResponse;
    },
  });

  // Verify MFA code mutation
  const verifyMFA = useMutation({
    mutationFn: async ({
      code,
      isSetupVerification = false,
      trustDevice = false,
      deviceFingerprint,
      deviceName,
      browser,
      os,
    }: {
      code: string;
      isSetupVerification?: boolean;
      trustDevice?: boolean;
      deviceFingerprint?: string;
      deviceName?: string;
      browser?: string;
      os?: string;
    }): Promise<MFAVerifyResponse> => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("verify-mfa", {
        body: {
          code,
          isSetupVerification,
          trustDevice,
          deviceFingerprint,
          deviceName,
          browser,
          os,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as MFAVerifyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-settings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["mfa-trusted-devices", user?.id] });
    },
  });

  // Disable MFA mutation
  const disableMFA = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("disable-mfa", {
        body: { code },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-settings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["mfa-trusted-devices", user?.id] });
    },
  });

  // Revoke trusted device
  const revokeTrustedDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mfa_trusted_devices")
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq("id", deviceId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-trusted-devices", user?.id] });
    },
  });

  // Check if current device is trusted
  const checkDeviceTrust = async (deviceFingerprint: string): Promise<boolean> => {
    if (!user?.id || !mfaSettings?.mfa_enabled) return false;

    const { data, error } = await supabase.rpc("is_device_trusted", {
      p_user_id: user.id,
      p_device_fingerprint: deviceFingerprint,
    });

    if (error) {
      console.error("Error checking device trust:", error);
      return false;
    }

    return data === true;
  };

  // Get device fingerprint (simple implementation - can be enhanced)
  const getDeviceFingerprint = (): string => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ];

    // Simple hash function
    const str = components.join("|");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  // Get browser info
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";

    // Detect browser
    if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("Opera")) browser = "Opera";

    // Detect OS
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    return { browser, os };
  };

  return {
    // State
    mfaSettings,
    trustedDevices,
    isLoading: isLoadingSettings || isLoadingDevices,
    error: settingsError,
    isMFAEnabled: mfaSettings?.mfa_enabled ?? false,
    isVerified: !!mfaSettings?.verified_at,
    isLocked: mfaSettings?.locked_until
      ? new Date(mfaSettings.locked_until) > new Date()
      : false,

    // Actions
    setupMFA,
    verifyMFA,
    disableMFA,
    revokeTrustedDevice,
    refetchSettings,
    refetchDevices,

    // Utilities
    checkDeviceTrust,
    getDeviceFingerprint,
    getBrowserInfo,
  };
}
