/**
 * Store the avatar's 256px companion (US-604, src/lib/avatarVariant.ts) and
 * return its object name, or null when none was stored.
 *
 * Called before the photo itself is stored, because the photo's name records
 * whether the companion exists: the caller names it `-full` only on success.
 * Shared by the dashboard upload (useProfileImageUpload) and the onboarding
 * wizard, like storeAvatarAppIcons.
 *
 * Best effort, never throws: without a companion the page draws the photo, as
 * it did before.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { AVATAR_VARIANT_SIDE, avatarVariantObjectName } from '@/lib/avatarVariant';
import { PROFILE_IMAGE_CACHE_CONTROL, renderAvatarVariant } from '@/lib/shrinkProfileImage';

export async function storeAvatarVariant(
  userId: string,
  stem: string,
  photo: Blob
): Promise<string | null> {
  try {
    const variant = await renderAvatarVariant(photo, AVATAR_VARIANT_SIDE);
    if (!variant) return null;
    const name = avatarVariantObjectName(stem);
    const { error } = await supabase.storage.from('avatars').upload(`${userId}/${name}`, variant, {
      // Named after a timestamped photo and never rewritten (US-591).
      cacheControl: PROFILE_IMAGE_CACHE_CONTROL,
      contentType: 'image/webp',
      upsert: true,
    });
    if (error) throw error;
    return name;
  } catch (error) {
    logger.warn('Could not store the small copy of this photo', { error });
    return null;
  }
}
