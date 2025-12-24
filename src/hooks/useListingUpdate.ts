import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpdateListingData {
  id: string;
  address: string;
  city: string;
  price: string;
  beds: number;
  baths: number;
  sqft?: number;
  status: string;
  image?: string;
  description?: string;
  mls_number?: string;
  property_type?: string;
}

export const useListingUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateListingData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Destructure data fields to use in the update
      const {
        id,
        address,
        city,
        price,
        beds,
        baths,
        sqft,
        status,
        image,
        description,
        mls_number,
        property_type,
      } = data;

      const { data: result, error } = await supabase
        .from('listings')
        .update({
          address,
          city,
          price,
          beds,
          baths,
          sqft,
          status,
          image,
          description,
          mls_number,
          property_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
