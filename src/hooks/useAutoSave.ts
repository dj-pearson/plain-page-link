/**
 * Auto-Save Hook
 * Automatically saves form state to localStorage and restores on mount
 */

import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import { logger } from '@/lib/logger';

interface UseAutoSaveOptions {
  key: string; // Unique key for localStorage
  data: any; // Form data to save
  enabled?: boolean; // Enable/disable auto-save
  interval?: number; // Auto-save interval in milliseconds (default: 30000 = 30s)
  onRestore?: (data: any) => void; // Callback when data is restored
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  interval = 30000,
  onRestore,
}: UseAutoSaveOptions) {
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const savedDataRef = useRef<string>('');
  // Always holds the latest data so the periodic timer can read it without
  // being torn down and recreated on every change.
  const dataRef = useRef(data);
  dataRef.current = data;
  const storageKey = `autosave_${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedAt = new Date(parsed.timestamp);
        const isRecent = Date.now() - savedAt.getTime() < 24 * 60 * 60 * 1000; // 24 hours

        if (isRecent && parsed.data) {
          setDraftData(parsed.data);
          setShowRestorePrompt(true);
        }
      }
    } catch (error) {
      logger.error('Failed to load auto-saved data', error);
    }
  }, [storageKey, enabled]);

  // Flag unsaved changes as data changes (cheap; does not touch the timer).
  useEffect(() => {
    if (!enabled || !data) return;
    if (JSON.stringify(data) !== savedDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [data, enabled]);

  // Single periodic auto-save timer. Depends only on enabled/interval/key so
  // it is NOT recreated on every keystroke (which previously prevented the
  // interval from ever elapsing while the user was actively editing).
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      const current = dataRef.current;
      if (!current) return;
      if (JSON.stringify(current) !== savedDataRef.current) {
        saveToStorage(current);
      }
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, storageKey]);

  // Save data to localStorage
  const saveToStorage = (dataToSave: any) => {
    try {
      const payload = {
        data: dataToSave,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(payload));
      savedDataRef.current = JSON.stringify(dataToSave);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      logger.debug(`Auto-saved: ${key}`);
    } catch (error) {
      logger.error('Failed to auto-save', error);
    }
  };

  // Manually save current data
  const save = () => {
    if (data) {
      saveToStorage(data);
      toast({
        title: 'Draft Saved',
        description: 'Your changes have been saved.',
      });
    }
  };

  // Restore draft data
  const restoreDraft = () => {
    if (draftData && onRestore) {
      onRestore(draftData);
      setShowRestorePrompt(false);
      toast({
        title: 'Draft Restored',
        description: 'Your previous draft has been restored.',
      });
    }
  };

  // Discard draft
  const discardDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setShowRestorePrompt(false);
      setDraftData(null);
      toast({
        title: 'Draft Discarded',
        description: 'The saved draft has been removed.',
      });
    } catch (error) {
      logger.error('Failed to discard draft', error);
    }
  };

  // Clear saved data (call after successful form submission)
  const clearSaved = () => {
    try {
      localStorage.removeItem(storageKey);
      savedDataRef.current = '';
      setLastSaved(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      logger.error('Failed to clear saved data', error);
    }
  };

  return {
    hasUnsavedChanges,
    lastSaved,
    save,
    clearSaved,
    showRestorePrompt,
    restoreDraft,
    discardDraft,
  };
}

/**
 * Format time ago for last saved display
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
