import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { validateUpload } from '@/lib/fileValidation';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function useAvatarUpload() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // US-076: file.type is inferred from the extension and a caller can set it to
  // anything, so this now sniffs the magic number too.
  const validateFile = (file: File): Promise<string | null> =>
    validateUpload(file, { accept: ACCEPTED_FILE_TYPES, maxBytes: MAX_FILE_SIZE });

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload an avatar',
        variant: 'destructive',
      });
      return null;
    }

    const validationError = await validateFile(file);
    if (validationError) {
      toast({
        title: 'Invalid file',
        description: validationError,
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    try {
      // Timestamped, not a fixed `avatar.<ext>`.
      //
      // The old name was stable and the object is served with
      // cacheControl: 3600, so replacing a headshot kept serving the previous
      // one — from the CDN and from every browser that had it — for an hour.
      // The agent uploaded a new photo, saw the old one, and uploaded again
      // (US-107). A new path is a new URL, so the change is visible at once.
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map((f) => `${user.id}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select('id')
        .single();

      if (updateError) throw updateError;

      // Without this the dashboard header and profile preview go on rendering
      // the cached avatar_url until something else refetches.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading avatar', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    uploading,
    acceptedTypes: ACCEPTED_FILE_TYPES.join(', '),
    maxSize: MAX_FILE_SIZE,
  };
}
