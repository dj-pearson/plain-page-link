import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctions } from "@/lib/edgeFunctions";
import { useAuthStore } from "@/stores/useAuthStore";

export interface SSOConfig {
  id: string;
  organization_name: string;
  organization_domain: string;
  sso_provider: 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google_workspace';
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_slo_url?: string;
  saml_certificate?: string;
  saml_metadata_url?: string;
  oidc_client_id?: string;
  oidc_issuer?: string;
  oidc_authorization_endpoint?: string;
  oidc_token_endpoint?: string;
  oidc_userinfo_endpoint?: string;
  oidc_jwks_uri?: string;
  oidc_scopes?: string[];
  attribute_mappings?: Record<string, string>;
  allowed_groups?: string[];
  default_role: 'user' | 'admin';
  auto_provision_users: boolean;
  active: boolean;
  verified_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SSOAuditLog {
  id: string;
  config_id: string;
  user_id?: string;
  event_type: string;
  event_details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SSOInitiateResponse {
  ssoAvailable: boolean;
  provider?: string;
  organizationName?: string;
  authUrl?: string;
  requestId?: string;
  message?: string;
}

export interface SSOCallbackResponse {
  success: boolean;
  userId?: string;
  email?: string;
  redirectUrl?: string;
  error?: string;
}

export function useSSO() {
  const { user, session, role } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = role === 'admin';

  // Fetch all SSO configs (admin only)
  const {
    data: ssoConfigs,
    isLoading: isLoadingConfigs,
    error: configsError,
    refetch: refetchConfigs,
  } = useQuery({
    queryKey: ["sso-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_sso_config")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SSOConfig[];
    },
    enabled: isAdmin,
  });

  // Fetch SSO audit logs (admin only)
  const {
    data: auditLogs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["sso-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sso_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SSOAuditLog[];
    },
    enabled: isAdmin,
  });

  // Check if SSO is available for an email domain
  const checkSSOAvailability = useMutation({
    mutationFn: async (email: string): Promise<SSOInitiateResponse> => {
      const response = await edgeFunctions.invoke("sso-initiate", {
        body: { email },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as SSOInitiateResponse;
    },
  });

  // Initiate SSO login
  const initiateSSOLogin = useMutation({
    mutationFn: async ({
      email,
      redirectUri,
    }: {
      email: string;
      redirectUri?: string;
    }): Promise<SSOInitiateResponse> => {
      const response = await edgeFunctions.invoke("sso-initiate", {
        body: { email, redirectUri },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data as SSOInitiateResponse;

      // Store the state/requestId in sessionStorage for CSRF validation
      // This will be verified when the callback is received
      if (data.requestId) {
        sessionStorage.setItem('sso_oauth_state', data.requestId);
        sessionStorage.setItem('sso_oauth_timestamp', Date.now().toString());
      }

      return data;
    },
  });

  // Handle SSO callback
  const handleSSOCallback = useMutation({
    mutationFn: async (params: {
      SAMLResponse?: string;
      RelayState?: string;
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    }): Promise<SSOCallbackResponse> => {
      const response = await edgeFunctions.invoke("sso-callback", {
        body: params,
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as SSOCallbackResponse;
    },
  });

  // Create SSO config (admin only)
  const createSSOConfig = useMutation({
    mutationFn: async (config: Partial<SSOConfig>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("enterprise_sso_config")
        .insert({
          ...config,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SSOConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-configs"] });
    },
  });

  // Update SSO config (admin only)
  const updateSSOConfig = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SSOConfig>;
    }) => {
      const { data, error } = await supabase
        .from("enterprise_sso_config")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SSOConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-configs"] });
    },
  });

  // Delete SSO config (admin only)
  const deleteSSOConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("enterprise_sso_config")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-configs"] });
    },
  });

  // Toggle SSO config active status
  const toggleSSOConfig = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from("enterprise_sso_config")
        .update({ active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SSOConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-configs"] });
    },
  });

  // Get SSO config by domain
  const getSSOConfigByDomain = async (
    domain: string
  ): Promise<SSOConfig | null> => {
    const { data, error } = await supabase
      .from("enterprise_sso_config")
      .select("*")
      .eq("organization_domain", domain)
      .eq("active", true)
      .single();

    if (error) return null;
    return data as SSOConfig;
  };

  /**
   * Validate the OAuth state parameter to prevent CSRF attacks
   * @param state - The state parameter received from the IdP callback
   * @returns true if valid, throws error if invalid
   */
  const validateSSOState = (state: string | null): boolean => {
    const storedState = sessionStorage.getItem('sso_oauth_state');
    const storedTimestamp = sessionStorage.getItem('sso_oauth_timestamp');

    // Clear stored state after validation attempt (one-time use)
    sessionStorage.removeItem('sso_oauth_state');
    sessionStorage.removeItem('sso_oauth_timestamp');

    // State must match
    if (!state || !storedState || state !== storedState) {
      throw new Error('Invalid SSO state - possible CSRF attack detected');
    }

    // State must not be expired (15 minute timeout)
    if (storedTimestamp) {
      const elapsed = Date.now() - parseInt(storedTimestamp, 10);
      const maxAge = 15 * 60 * 1000; // 15 minutes
      if (elapsed > maxAge) {
        throw new Error('SSO request expired - please try again');
      }
    }

    return true;
  };

  /**
   * Clear any stored SSO state (e.g., on logout or error)
   */
  const clearSSOState = () => {
    sessionStorage.removeItem('sso_oauth_state');
    sessionStorage.removeItem('sso_oauth_timestamp');
  };

  return {
    // State
    ssoConfigs,
    auditLogs,
    isLoading: isLoadingConfigs || isLoadingLogs,
    error: configsError,
    isAdmin,

    // Auth Actions
    checkSSOAvailability,
    initiateSSOLogin,
    handleSSOCallback,

    // Admin Actions
    createSSOConfig,
    updateSSOConfig,
    deleteSSOConfig,
    toggleSSOConfig,
    refetchConfigs,
    refetchLogs,

    // Utilities
    getSSOConfigByDomain,
    validateSSOState,
    clearSSOState,
  };
}
