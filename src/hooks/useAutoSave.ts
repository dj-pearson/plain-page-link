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

    // Auto-save effect
    useEffect(() => {
        if (!enabled || !data) return;

        const currentDataStr = JSON.stringify(data);

        // Check if data has changed
        if (currentDataStr !== savedDataRef.current) {
            setHasUnsavedChanges(true);
        }

        const timer = setInterval(() => {
            if (hasUnsavedChanges && currentDataStr !== savedDataRef.current) {
                saveToStorage(data);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [data, enabled, interval, hasUnsavedChanges, storageKey]);

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
