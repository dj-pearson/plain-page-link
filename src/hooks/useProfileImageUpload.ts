import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { validateUpload } from '@/lib/fileValidation';

/** The profile columns that hold a single uploaded image. */
export type ProfileImageColumn = 'avatar_url' | 'brokerage_logo';

export interface ProfileImageUploadConfig {
  /** Storage bucket (20260808000005). Its first path segment must be the uid. */
  bucket: 'avatars' | 'brokerage-logos';
  /** The profiles column the public URL is written to. */
  column: ProfileImageColumn;
  /** Object name prefix inside `<uid>/`. */
  filePrefix: string;
  /** MIME types accepted; the bucket's allowed_mime_types must cover them. */
  accept: string[];
  /** Must not exceed the bucket's file_size_limit. */
  maxBytes: number;
  /** Lower-case noun for messages, e.g. "profile picture". */
  label: string;
}

/**
 * Upload one image to a profile column: validate (magic number, US-076),
 * upload under a fresh timestamped name (US-107), point the profile at it,
 * then delete the objects it replaced.
 *
 * The old objects are removed only after the profile points at the new one.
 * useAvatarUpload used to delete first, so a failed upload left the profile
 * pointing at an object that no longer existed — a broken image on the public
 * page until the agent noticed.
 */
export function useProfileImageUpload(config: ProfileImageUploadConfig) {
  const { bucket, column, filePrefix, accept, maxBytes, label } = config;
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: `You must be logged in to upload a ${label}`,
        variant: 'destructive',
      });
      return null;
    }

    const validationError = await validateUpload(file, { accept, maxBytes });
    if (validationError) {
      toast({ title: 'Invalid file', description: validationError, variant: 'destructive' });
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const objectName = `${filePrefix}-${Date.now()}.${fileExt}`;
      const path = `${user.id}/${objectName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: publicUrl })
        .eq('id', user.id)
        .select('id')
        .single();
      if (updateError) throw updateError;

      // Best effort: a leftover object costs storage, not correctness.
      try {
        const { data: existing } = await supabase.storage.from(bucket).list(user.id);
        const stale = (existing ?? [])
          .filter((f) => f.name !== objectName)
          .map((f) => `${user.id}/${f.name}`);
        if (stale.length > 0) await supabase.storage.from(bucket).remove(stale);
      } catch (cleanupError) {
        logger.warn(`Could not remove the previous ${label}`, { error: cleanupError });
      }

      // US-237: patch only this column in the cached profile. Invalidating it
      // handed the editor a new object and reset every unsaved field.
      queryClient.setQueryData<Record<string, unknown> | null | undefined>(
        ['profile', user.id],
        (old) => (old ? { ...old, [column]: publicUrl } : old)
      );
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });

      const noun = label.charAt(0).toUpperCase() + label.slice(1);
      toast({ title: 'Success', description: `${noun} updated successfully` });

      return publicUrl;
    } catch (error) {
      logger.error(`Error uploading ${label}`, error);
      toast({
        title: 'Error',
        description: `Failed to upload ${label}. Please try again.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, acceptedTypes: accept.join(', '), maxSize: maxBytes };
}
