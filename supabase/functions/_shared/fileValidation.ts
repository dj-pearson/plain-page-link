/**
 * Server-Side File Validation Utilities
 * Security: Validates file types by magic numbers to prevent MIME spoofing
 */

/**
 * File type signatures (magic numbers)
 * First bytes of files that identify their true type
 */
const FILE_SIGNATURES: { [mimeType: string]: number[][] } = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG with EXIF
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG with Canon
    [0xFF, 0xD8, 0xFF, 0xDB], // JPEG raw
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Validate file type by checking magic numbers
 * @param fileBuffer - File content as ArrayBuffer
 * @param declaredMimeType - MIME type declared by client
 * @returns true if file matches declared type
 */
export function validateFileType(
  fileBuffer: ArrayBuffer,
  declaredMimeType: string
): boolean {
  const signatures = FILE_SIGNATURES[declaredMimeType];
  if (!signatures) {
    console.warn(`No signature validation for MIME type: ${declaredMimeType}`);
    return false;
  }

  const bytes = new Uint8Array(fileBuffer);
  const maxSigLength = Math.max(...signatures.map(sig => sig.length));
  const fileHeader = Array.from(bytes.slice(0, maxSigLength));

  // Check if file starts with any of the valid signatures
  return signatures.some(signature =>
    signature.every((byte, index) => fileHeader[index] === byte)
  );
}

/**
 * Validate file size
 * @param fileSize - File size in bytes
 * @param maxSizeMB - Maximum allowed size in megabytes
 * @returns true if within limit
 */
export function validateFileSize(fileSize: number, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxBytes;
}

/**
 * Sanitize filename to prevent path traversal and XSS
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const baseName = filename.split('/').pop()?.split('\\').pop() || 'file';

  // Remove potentially dangerous characters
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure extension is safe (no double extensions like .php.jpg)
  const parts = safe.split('.');
  if (parts.length > 2) {
    // Keep only last extension
    return `${parts.slice(0, -1).join('_')}.${parts[parts.length - 1]}`;
  }

  return safe;
}

/**
 * Check if file extension is allowed
 * @param filename - Filename to check
 * @param allowedExtensions - Array of allowed extensions (e.g., ['jpg', 'png'])
 * @returns true if extension is allowed
 */
export function hasAllowedExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Comprehensive file validation
 * @param file - File blob or buffer
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export async function validateFile(
  file: { buffer: ArrayBuffer; name: string; type: string; size: number },
  options: {
    maxSizeMB?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const {
    maxSizeMB = 5,
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'],
  } = options;

  // Check file size
  if (!validateFileSize(file.size, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check extension
  if (!hasAllowedExtension(file.name, allowedExtensions)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${allowedMimeTypes.join(', ')}`,
    };
  }

  // Validate actual file type by magic numbers
  if (!validateFileType(file.buffer, file.type)) {
    return {
      valid: false,
      error: 'File type mismatch. File content does not match declared type.',
    };
  }

  return { valid: true };
}

/**
 * Generate safe storage path for file
 * @param userId - User ID
 * @param filename - Original filename
 * @param folder - Storage folder (e.g., 'avatars', 'listings')
 * @returns Safe storage path
 */
export function generateStoragePath(
  userId: string,
  filename: string,
  folder: string = 'uploads'
): string {
  const safeFilename = sanitizeFilename(filename);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${folder}/${userId}/${timestamp}-${randomSuffix}-${safeFilename}`;
}
