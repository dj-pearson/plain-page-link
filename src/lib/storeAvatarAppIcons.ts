/**
 * Render and store the home-screen icons for a just-uploaded avatar (US-481),
 * returning the object names stored.
 *
 * Shared by every avatar upload path: the dashboard (useProfileImageUpload)
 * and the onboarding wizard (US-493), which uploads with its own storage code
 * and so used to store no icons. A photo chosen during onboarding is the first
 * one most agents ever set, so their installed page showed the AgentBio logo.
 *
 * Best effort: the photo is what the agent asked for, so a browser that cannot
 * draw it, or an icon upload that fails, costs only the icon (the manifest then
 * keeps the platform icon) and never the upload. Never throws.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { APP_ICON_SIZES, appIconObjectName } from '@/lib/avatarAppIcon';
import { renderAppIcons } from '@/lib/renderAppIcons';
import { PROFILE_IMAGE_CACHE_CONTROL } from '@/lib/shrinkProfileImage';

export async function storeAvatarAppIcons(
  bucket: 'avatars' | 'brokerage-logos',
  userId: string,
  objectName: string,
  file: Blob
): Promise<string[]> {
  try {
    const icons = await renderAppIcons(file);
    const stored: string[] = [];
    for (const size of APP_ICON_SIZES) {
      const icon = icons.get(size);
      if (!icon) continue;
      const name = appIconObjectName(objectName, size);
      const { error } = await supabase.storage.from(bucket).upload(`${userId}/${name}`, icon, {
        // Named after a timestamped photo and never rewritten (US-591).
        cacheControl: PROFILE_IMAGE_CACHE_CONTROL,
        contentType: 'image/png',
        upsert: true,
      });
      if (error) throw error;
      stored.push(name);
    }
    return stored;
  } catch (error) {
    logger.warn('Could not make the home-screen icon from this photo', { error });
    return [];
  }
}
