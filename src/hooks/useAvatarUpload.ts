import { useProfileImageUpload } from '@/hooks/useProfileImageUpload';
import { AVATAR_SHRINK } from '@/lib/shrinkProfileImage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, the avatars bucket limit
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * The agent's headshot. Validation (US-076), the timestamped object name
 * (US-107) and the cache patch (US-237) live in useProfileImageUpload, shared
 * with the brokerage logo (US-374).
 */
export function useAvatarUpload() {
  const { upload, uploading, acceptedTypes, maxSize } = useProfileImageUpload({
    bucket: 'avatars',
    column: 'avatar_url',
    filePrefix: 'avatar',
    accept: ACCEPTED_FILE_TYPES,
    maxBytes: MAX_FILE_SIZE,
    label: 'profile picture',
    // The installed agent page's home-screen icon (US-481).
    appIcons: true,
    // Stored downscaled: the public page draws it small (US-591).
    shrink: AVATAR_SHRINK,
  });

  return { uploadAvatar: upload, uploading, acceptedTypes, maxSize };
}
