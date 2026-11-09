import type { ImgHTMLAttributes } from 'react';
import { avatarImage, fallBackToAvatarOriginal } from '@/lib/avatarVariant';

interface AvatarImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** profiles.avatar_url. */
  url: string;
}

/**
 * The agent's headshot on a public page, drawn from its 256px companion when
 * the upload stored one (US-604) and from the photo otherwise. If the
 * companion fails to load, the photo is loaded instead.
 */
export function AvatarImage({ url, alt, ...rest }: AvatarImageProps) {
  const image = avatarImage(url);
  return (
    <img
      {...rest}
      // A new avatar_url must not inherit the previous photo's fallback state.
      key={url}
      src={image.src}
      alt={alt}
      onError={(e) => fallBackToAvatarOriginal(e.currentTarget, image.original)}
    />
  );
}
