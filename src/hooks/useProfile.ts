import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  theme?: string;

  // Professional Information
  title?: string;
  license_number?: string;
  license_state?: string;
  brokerage_name?: string;
  brokerage_logo?: string;
  years_experience?: number;
  specialties?: string[];
  certifications?: string[];

  // Contact Information
  phone?: string;
  email_display?: string;
  website_url?: string;

  // Service Areas
  service_cities?: string[];
  service_zip_codes?: string[];

  // Social Media URLs
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  zillow_url?: string;
  realtor_com_url?: string;

  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
  };
}
