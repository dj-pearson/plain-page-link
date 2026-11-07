import { useProfileImageUpload } from '@/hooks/useProfileImageUpload';

// The brokerage-logos bucket allows 2MB and no SVG (20260808000005, US-076):
// the bucket is public, and an SVG served from our storage origin can run script.
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * US-374 (US-280): the brokerage logo is uploaded, not typed as a URL. A free
 * text field let an agent point their public page at any third-party image
 * host, hot-linked and unvalidated, and most agents have no hosted URL to give.
 */
export function useBrokerageLogoUpload() {
  const { upload, uploading, acceptedTypes, maxSize } = useProfileImageUpload({
    bucket: 'brokerage-logos',
    column: 'brokerage_logo',
    filePrefix: 'logo',
    accept: ACCEPTED_FILE_TYPES,
    maxBytes: MAX_FILE_SIZE,
    label: 'brokerage logo',
  });

  return { uploadLogo: upload, uploading, acceptedTypes, maxSize };
}
