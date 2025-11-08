import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 25;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

export function useListingImageUpload() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ current: 0, total: 0, percentage: 0 });

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.name}. Please upload JPG, PNG, or WEBP images`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${file.name}. Maximum size is 5MB`;
    }
    return null;
  };

  const uploadListingImages = async (files: File[], listingId?: string): Promise<string[]> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return [];
    }

    if (files.length === 0) {
      return [];
    }

    if (files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images per listing`,
        variant: "destructive",
      });
      return [];
    }

    // Validate all files
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Invalid file",
          description: validationError,
          variant: "destructive",
        });
        return [];
      }
    }

    setUploading(true);
    setProgress({ current: 0, total: files.length, percentage: 0 });

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${listingId || timestamp}/${randomId}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        // Update progress
        const newProgress = {
          current: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100)
        };
        setProgress(newProgress);
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading listing images:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images. Please try again.",
        variant: "destructive",
      });

      // Clean up any successfully uploaded images
      if (uploadedUrls.length > 0) {
        await deleteListingImages(uploadedUrls);
      }

      return [];
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const deleteListingImages = async (imageUrls: string[]): Promise<boolean> => {
    if (!user?.id || imageUrls.length === 0) {
      return false;
    }

    try {
      // Extract file paths from public URLs
      const filePaths = imageUrls.map(url => {
        const match = url.match(/listings\/(.+)$/);
        return match ? match[1] : null;
      }).filter(Boolean) as string[];

      if (filePaths.length === 0) {
        return false;
      }

      const { error } = await supabase.storage
        .from('listings')
        .remove(filePaths);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting listing images:', error);
      return false;
    }
  };

  return {
    uploadListingImages,
    deleteListingImages,
    uploading,
    progress,
    acceptedTypes: ACCEPTED_FILE_TYPES.join(', '),
    maxSize: MAX_FILE_SIZE,
    maxImages: MAX_IMAGES,
  };
}
