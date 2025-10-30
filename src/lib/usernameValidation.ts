import { z } from "zod";

// Common profanity list (add more as needed)
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'ass', 'bitch', 'bastard',
  'dick', 'cock', 'pussy', 'slut', 'whore', 'fag', 'nigger', 'chink',
  // Add more as needed
];

const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'support', 'help', 'api', 'www',
  'mail', 'smtp', 'ftp', 'blog', 'dev', 'test', 'staging', 'prod',
  'dashboard', 'settings', 'profile', 'login', 'logout', 'signup',
  'register', 'auth', 'pricing', 'about', 'contact', 'terms', 'privacy',
  'agentbio', 'agent', 'bio', 'realtor', 'realestate'
];

export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
};

export const isReservedUsername = (username: string): boolean => {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
};

export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
  .refine(
    (username) => !containsProfanity(username),
    "Username contains inappropriate language"
  )
  .refine(
    (username) => !isReservedUsername(username),
    "This username is reserved"
  );

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  try {
    usernameSchema.parse(username);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: "Invalid username" };
  }
};