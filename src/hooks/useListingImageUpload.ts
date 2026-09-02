import { useState } from 'react';
import { validateUpload } from '@/lib/fileValidation';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 25;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

  // US-076: file.type is inferred from the extension, so sniff the bytes too.
  const validateFile = (file: File): Promise<string | null> =>
    validateUpload(file, { accept: ACCEPTED_FILE_TYPES, maxBytes: MAX_FILE_SIZE });

  /**
   * Uploads listing photos and returns their public URLs.
   *
   * THROWS on failure. It used to return [] for every failure — logged in or
   * not, file too large, storage error — which the caller could not tell apart
   * from "no images were selected". Listings.tsx read that as a normal `return`
   * and closed the six-step form, so a 6 MB photo against a 5 MB limit meant
   * the agent re-entered the entire listing (US-107).
   */
  const uploadListingImages = async (files: File[], listingId?: string): Promise<string[]> => {
    if (!user?.id) {
      const message = 'You must be logged in to upload images';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      throw new Error(message);
    }

    if (files.length === 0) {
      return [];
    }

    if (files.length > MAX_IMAGES) {
      const message = `You can upload a maximum of ${MAX_IMAGES} images per listing`;
      toast({ title: 'Too many images', description: message, variant: 'destructive' });
      throw new Error(message);
    }

    // Validate all files
    for (const file of files) {
      const validationError = await validateFile(file);
      if (validationError) {
        toast({ title: 'Invalid file', description: validationError, variant: 'destructive' });
        throw new Error(validationError);
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
          .from('listing-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          logger.error('Upload error', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('listing-photos').getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        // Kick off WebP optimization (200/400/800 variants) in the background.
        // Best-effort: the original is already usable and OptimizedImage falls
        // back to it, so a failure here must never break the upload.
        void edgeFunctions
          // The bucket is 'listing-photos'. This said 'listings', which is not a
          // bucket, so optimize-image 404'd on every upload — caught as a debug
          // log — and every public listing served the untouched original, up to
          // 5 MB per photo (US-107).
          .invoke('optimize-image', { body: { bucket: 'listing-photos', path: fileName } })
          .catch((err) =>
            logger.debug('Image optimization failed (non-blocking)', {
              error: err instanceof Error ? err.message : String(err),
            })
          );

        // Update progress
        const newProgress = {
          current: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100),
        };
        setProgress(newProgress);
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: 'Success',
          description: `Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      logger.error('Error uploading listing images', error);
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });

      // Roll back whatever did upload, so a partial batch does not orphan
      // objects in the bucket.
      if (uploadedUrls.length > 0) {
        await deleteListingImages(uploadedUrls);
      }

      throw error instanceof Error ? error : new Error('Failed to upload images');
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
      // Extract the storage path from each public URL. The pattern was
      // /listings\/(.+)$/ — but a public URL reads
      // .../object/public/listing-photos/<user>/<listing>/<file>, which
      // contains no "listings/" segment. It never matched, so the rollback
      // above always had nothing to delete and every partial upload orphaned
      // its objects (US-107).
      const filePaths = imageUrls
        .map((url) => {
          const match = url.match(/\/listing-photos\/(.+)$/);
          return match ? decodeURIComponent(match[1]) : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length !== imageUrls.length) {
        logger.warn('Some image URLs did not look like listing-photos objects', {
          given: imageUrls.length,
          parsed: filePaths.length,
        });
      }

      if (filePaths.length === 0) {
        return false;
      }

      const { error } = await supabase.storage.from('listing-photos').remove(filePaths);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting listing images', error);
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
