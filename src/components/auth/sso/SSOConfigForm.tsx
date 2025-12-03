import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSSO, SSOConfig } from "@/hooks/useSSO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Check } from "lucide-react";

const ssoConfigSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  organization_domain: z
    .string()
    .min(1, "Domain is required")
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid domain format"),
  sso_provider: z.enum(["saml", "oidc", "azure_ad", "okta", "google_workspace"]),
  // SAML fields
  saml_entity_id: z.string().optional(),
  saml_sso_url: z.string().url().optional().or(z.literal("")),
  saml_slo_url: z.string().url().optional().or(z.literal("")),
  saml_certificate: z.string().optional(),
  saml_metadata_url: z.string().url().optional().or(z.literal("")),
  // OIDC fields
  oidc_client_id: z.string().optional(),
  oidc_client_secret: z.string().optional(),
  oidc_issuer: z.string().url().optional().or(z.literal("")),
  oidc_authorization_endpoint: z.string().url().optional().or(z.literal("")),
  oidc_token_endpoint: z.string().url().optional().or(z.literal("")),
  oidc_userinfo_endpoint: z.string().url().optional().or(z.literal("")),
  // Settings
  default_role: z.enum(["user", "admin"]).default("user"),
  auto_provision_users: z.boolean().default(true),
});

type SSOConfigFormData = z.infer<typeof ssoConfigSchema>;

interface SSOConfigFormProps {
  config?: SSOConfig;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SSOConfigForm = ({
  config,
  onSuccess,
  onCancel,
}: SSOConfigFormProps) => {
  const { createSSOConfig, updateSSOConfig } = useSSO();
  const [error, setError] = useState("");

  const isEditing = !!config;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SSOConfigFormData>({
    resolver: zodResolver(ssoConfigSchema),
    defaultValues: {
      organization_name: config?.organization_name || "",
      organization_domain: config?.organization_domain || "",
      sso_provider: config?.sso_provider || "saml",
      saml_entity_id: config?.saml_entity_id || "",
      saml_sso_url: config?.saml_sso_url || "",
      saml_slo_url: config?.saml_slo_url || "",
      saml_certificate: config?.saml_certificate || "",
      saml_metadata_url: config?.saml_metadata_url || "",
      oidc_client_id: config?.oidc_client_id || "",
      oidc_client_secret: "",
      oidc_issuer: config?.oidc_issuer || "",
      oidc_authorization_endpoint: config?.oidc_authorization_endpoint || "",
      oidc_token_endpoint: config?.oidc_token_endpoint || "",
      oidc_userinfo_endpoint: config?.oidc_userinfo_endpoint || "",
      default_role: config?.default_role || "user",
      auto_provision_users: config?.auto_provision_users ?? true,
    },
  });

  const provider = watch("sso_provider");
  const isSAML =
    provider === "saml" || provider === "azure_ad" || provider === "okta";
  const isOIDC = provider === "oidc" || provider === "google_workspace";

  const onSubmit = async (data: SSOConfigFormData) => {
    setError("");
    try {
      // Clean up data based on provider type
      const cleanedData: Partial<SSOConfig> = {
        organization_name: data.organization_name,
        organization_domain: data.organization_domain.toLowerCase(),
        sso_provider: data.sso_provider,
        default_role: data.default_role,
        auto_provision_users: data.auto_provision_users,
      };

      if (isSAML) {
        cleanedData.saml_entity_id = data.saml_entity_id;
        cleanedData.saml_sso_url = data.saml_sso_url;
        cleanedData.saml_slo_url = data.saml_slo_url || undefined;
        cleanedData.saml_certificate = data.saml_certificate;
        cleanedData.saml_metadata_url = data.saml_metadata_url || undefined;
      }

      if (isOIDC) {
        cleanedData.oidc_client_id = data.oidc_client_id;
        if (data.oidc_client_secret) {
          cleanedData.oidc_client_secret = data.oidc_client_secret;
        }
        cleanedData.oidc_issuer = data.oidc_issuer;
        cleanedData.oidc_authorization_endpoint = data.oidc_authorization_endpoint;
        cleanedData.oidc_token_endpoint = data.oidc_token_endpoint;
        cleanedData.oidc_userinfo_endpoint = data.oidc_userinfo_endpoint || undefined;
      }

      if (isEditing && config) {
        await updateSSOConfig.mutateAsync({
          id: config.id,
          updates: cleanedData,
        });
      } else {
        await createSSOConfig.mutateAsync(cleanedData);
      }

      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save SSO configuration"
      );
    }
  };

  const isPending = createSSOConfig.isPending || updateSSOConfig.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Organization Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Organization Name *
            </label>
            <Input
              {...register("organization_name")}
              placeholder="Acme Corporation"
            />
            {errors.organization_name && (
              <p className="text-sm text-red-600">
                {errors.organization_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email Domain *
            </label>
            <Input
              {...register("organization_domain")}
              placeholder="acme.com"
            />
            {errors.organization_domain && (
              <p className="text-sm text-red-600">
                {errors.organization_domain.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            SSO Provider *
          </label>
          <Select
            value={provider}
            onValueChange={(value) =>
              setValue("sso_provider", value as SSOConfigFormData["sso_provider"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saml">SAML 2.0</SelectItem>
              <SelectItem value="azure_ad">Azure AD</SelectItem>
              <SelectItem value="okta">Okta</SelectItem>
              <SelectItem value="oidc">OpenID Connect</SelectItem>
              <SelectItem value="google_workspace">Google Workspace</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SAML Configuration */}
      {isSAML && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">SAML Configuration</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              IdP Entity ID *
            </label>
            <Input
              {...register("saml_entity_id")}
              placeholder="https://idp.example.com/saml/metadata"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              IdP SSO URL *
            </label>
            <Input
              {...register("saml_sso_url")}
              placeholder="https://idp.example.com/saml/sso"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              IdP SLO URL (optional)
            </label>
            <Input
              {...register("saml_slo_url")}
              placeholder="https://idp.example.com/saml/slo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              X.509 Certificate *
            </label>
            <Textarea
              {...register("saml_certificate")}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Metadata URL (optional)
            </label>
            <Input
              {...register("saml_metadata_url")}
              placeholder="https://idp.example.com/saml/metadata.xml"
            />
            <p className="text-xs text-gray-500">
              If provided, configuration can be auto-fetched from this URL
            </p>
          </div>
        </div>
      )}

      {/* OIDC Configuration */}
      {isOIDC && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">OIDC Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Client ID *
              </label>
              <Input
                {...register("oidc_client_id")}
                placeholder="your-client-id"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Client Secret {isEditing ? "(leave blank to keep)" : "*"}
              </label>
              <Input
                type="password"
                {...register("oidc_client_secret")}
                placeholder="your-client-secret"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Issuer URL *
            </label>
            <Input
              {...register("oidc_issuer")}
              placeholder="https://accounts.google.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Authorization Endpoint *
            </label>
            <Input
              {...register("oidc_authorization_endpoint")}
              placeholder="https://accounts.google.com/o/oauth2/v2/auth"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Token Endpoint *
            </label>
            <Input
              {...register("oidc_token_endpoint")}
              placeholder="https://oauth2.googleapis.com/token"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              UserInfo Endpoint (optional)
            </label>
            <Input
              {...register("oidc_userinfo_endpoint")}
              placeholder="https://openidconnect.googleapis.com/v1/userinfo"
            />
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Settings</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Default Role
          </label>
          <Select
            value={watch("default_role")}
            onValueChange={(value) =>
              setValue("default_role", value as "user" | "admin")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Role assigned to new users created via SSO
          </p>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("auto_provision_users")}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            Automatically create accounts for new users
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Configuration"
          ) : (
            "Create Configuration"
          )}
        </Button>
      </div>
    </form>
  );
};

export default SSOConfigForm;
