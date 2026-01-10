/**
 * useEncryption Hook
 *
 * Provides encryption/decryption functionality for PII fields in the application.
 * Uses server-side encryption for highly sensitive data (OAuth tokens, MFA secrets)
 * and client-side encryption for user-visible PII.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  encryptData,
  decryptData,
  createUserSecret,
  encryptSensitiveFields,
  decryptSensitiveFields,
  isEncryptedData,
  PII_FIELDS,
  type EncryptedData,
} from '@/lib/encryption';

interface UseEncryptionResult {
  // Client-side encryption
  encrypt: (plaintext: string) => Promise<EncryptedData>;
  decrypt: (encryptedData: EncryptedData) => Promise<string>;
  encryptFields: <T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ) => Promise<T>;
  decryptFields: <T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ) => Promise<T>;

  // Server-side encryption (for highly sensitive data)
  serverEncrypt: (
    data: Record<string, string>,
    fields: string[],
    table: string,
    recordId?: string
  ) => Promise<Record<string, unknown>>;
  serverDecrypt: (
    data: Record<string, unknown>,
    fields: string[],
    table: string,
    recordId?: string
  ) => Promise<Record<string, string>>;

  // Helpers
  isEncrypted: (value: unknown) => value is EncryptedData;
  getEncryptedFieldsForTable: (table: keyof typeof PII_FIELDS) => readonly string[];

  // State
  isProcessing: boolean;
  error: string | null;
}

// App-level secret (should be set in environment)
const APP_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'agentbio-default-secret-change-in-production';

export function useEncryption(): UseEncryptionResult {
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get user-specific encryption secret
   */
  const getUserSecret = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error('User must be authenticated for encryption');
    }
    return createUserSecret(user.id, APP_SECRET);
  }, [user?.id]);

  /**
   * Encrypt a single value
   */
  const encrypt = useCallback(async (plaintext: string): Promise<EncryptedData> => {
    setError(null);
    setIsProcessing(true);

    try {
      const secret = await getUserSecret();
      return await encryptData(plaintext, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Encryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [getUserSecret]);

  /**
   * Decrypt a single value
   */
  const decrypt = useCallback(async (encryptedData: EncryptedData): Promise<string> => {
    setError(null);
    setIsProcessing(true);

    try {
      const secret = await getUserSecret();
      return await decryptData(encryptedData, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Decryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [getUserSecret]);

  /**
   * Encrypt multiple fields in an object
   */
  const encryptFields = useCallback(async <T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ): Promise<T> => {
    setError(null);
    setIsProcessing(true);

    try {
      const secret = await getUserSecret();
      return await encryptSensitiveFields(data, fields, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Field encryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [getUserSecret]);

  /**
   * Decrypt multiple fields in an object
   */
  const decryptFields = useCallback(async <T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ): Promise<T> => {
    setError(null);
    setIsProcessing(true);

    try {
      const secret = await getUserSecret();
      return await decryptSensitiveFields(data, fields, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Field decryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [getUserSecret]);

  /**
   * Server-side encryption for highly sensitive data
   */
  const serverEncrypt = useCallback(async (
    data: Record<string, string>,
    fields: string[],
    table: string,
    recordId?: string
  ): Promise<Record<string, unknown>> => {
    setError(null);
    setIsProcessing(true);

    try {
      const { data: response, error: funcError } = await supabase.functions.invoke(
        'encrypt-pii',
        {
          body: {
            action: 'encrypt',
            data,
            fields,
            table,
            recordId,
          },
        }
      );

      if (funcError) {
        throw new Error(funcError.message || 'Server encryption failed');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Server encryption failed');
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Server encryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Server-side decryption for highly sensitive data
   */
  const serverDecrypt = useCallback(async (
    data: Record<string, unknown>,
    fields: string[],
    table: string,
    recordId?: string
  ): Promise<Record<string, string>> => {
    setError(null);
    setIsProcessing(true);

    try {
      const { data: response, error: funcError } = await supabase.functions.invoke(
        'encrypt-pii',
        {
          body: {
            action: 'decrypt',
            data,
            fields,
            table,
            recordId,
          },
        }
      );

      if (funcError) {
        throw new Error(funcError.message || 'Server decryption failed');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Server decryption failed');
      }

      return response.data as Record<string, string>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Server decryption failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Get the list of PII fields for a table
   */
  const getEncryptedFieldsForTable = useCallback(
    (table: keyof typeof PII_FIELDS): readonly string[] => {
      return PII_FIELDS[table] || [];
    },
    []
  );

  return {
    encrypt,
    decrypt,
    encryptFields,
    decryptFields,
    serverEncrypt,
    serverDecrypt,
    isEncrypted: isEncryptedData,
    getEncryptedFieldsForTable,
    isProcessing,
    error,
  };
}

/**
 * Helper hook for automatically encrypting/decrypting lead data
 */
export function useEncryptedLeads() {
  const { encryptFields, decryptFields, isProcessing, error } = useEncryption();
  const leadFields = PII_FIELDS.leads;

  const encryptLead = useCallback(async <T extends Record<string, unknown>>(
    lead: T
  ): Promise<T> => {
    return encryptFields(lead, leadFields as unknown as (keyof T)[]);
  }, [encryptFields, leadFields]);

  const decryptLead = useCallback(async <T extends Record<string, unknown>>(
    lead: T
  ): Promise<T> => {
    return decryptFields(lead, leadFields as unknown as (keyof T)[]);
  }, [decryptFields, leadFields]);

  const decryptLeads = useCallback(async <T extends Record<string, unknown>>(
    leads: T[]
  ): Promise<T[]> => {
    return Promise.all(leads.map(decryptLead));
  }, [decryptLead]);

  return {
    encryptLead,
    decryptLead,
    decryptLeads,
    isProcessing,
    error,
  };
}

/**
 * Helper hook for automatically encrypting/decrypting profile data
 */
export function useEncryptedProfile() {
  const { encryptFields, decryptFields, isProcessing, error } = useEncryption();
  const profileFields = PII_FIELDS.profiles;

  const encryptProfile = useCallback(async <T extends Record<string, unknown>>(
    profile: T
  ): Promise<T> => {
    return encryptFields(profile, profileFields as unknown as (keyof T)[]);
  }, [encryptFields, profileFields]);

  const decryptProfile = useCallback(async <T extends Record<string, unknown>>(
    profile: T
  ): Promise<T> => {
    return decryptFields(profile, profileFields as unknown as (keyof T)[]);
  }, [decryptFields, profileFields]);

  return {
    encryptProfile,
    decryptProfile,
    isProcessing,
    error,
  };
}

export default useEncryption;
