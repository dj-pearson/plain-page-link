/**
 * Username rules for the Settings page and the live availability check.
 *
 * Plain checks, not a zod schema (US-498). This module was the only reason the
 * Settings route downloaded form-vendor (react-hook-form + zod, 23.4 KB gzip):
 * nothing else on that page builds a form schema. Register keeps its own zod
 * schema in src/utils/validation.ts because it already uses react-hook-form.
 *
 * The checks run in the order the zod schema reported them, and the first
 * failure wins, so every message is unchanged. usernameValidation.test.ts
 * holds the two together against the old schema.
 */

// Common profanity list (add more as needed)
const PROFANITY_LIST = [
  'damn',
  'hell',
  'crap',
  'shit',
  'fuck',
  'ass',
  'bitch',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'slut',
  'whore',
  'fag',
  'nigger',
  'chink',
  // Add more as needed
];

const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'support',
  'help',
  'api',
  'www',
  'mail',
  'smtp',
  'ftp',
  'blog',
  'dev',
  'test',
  'staging',
  'prod',
  'dashboard',
  'settings',
  'profile',
  'login',
  'logout',
  'signup',
  'register',
  'auth',
  'pricing',
  'about',
  'contact',
  'terms',
  'privacy',
  'agentbio',
  'agent',
  'bio',
  'realtor',
  'realestate',
  'open-house',
  // /:username/listing/:id is a listing page (US-275).
  'listing',
  // The Unsubscribe link in marketing email (US-425).
  'unsubscribe',
];

export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lowerText.includes(word));
};

export const isReservedUsername = (username: string): boolean => {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
};

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** The first rule `username` breaks, or null when it breaks none. */
export const usernameError = (username: string): string | null => {
  if (username.length < USERNAME_MIN_LENGTH) return 'Username must be at least 3 characters';
  if (username.length > USERNAME_MAX_LENGTH) return 'Username must be less than 30 characters';
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores';
  }
  if (containsProfanity(username)) return 'Username contains inappropriate language';
  if (isReservedUsername(username)) return 'This username is reserved';
  return null;
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (typeof username !== 'string') return { valid: false, error: 'Invalid username' };
  const error = usernameError(username);
  return error === null ? { valid: true } : { valid: false, error };
};
