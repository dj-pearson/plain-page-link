/**
 * Offline Sync Manager
 * Handles background synchronization of offline changes
 */

import { offlineStorage } from "./offline-storage";
import { supabase } from "@/integrations/supabase/client";

export class SyncManager {
    private static instance: SyncManager;
    private syncInterval: number = 5000; // 5 seconds
    private syncTimer?: NodeJS.Timeout;
    private isSyncing: boolean = false;

    private constructor() {
        this.startSync();
        this.setupOnlineListener();
    }

    static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    private setupOnlineListener() {
        window.addEventListener("online", () => {
            console.log("[SyncManager] Network connection restored");
            this.syncNow();
        });

        window.addEventListener("offline", () => {
            console.log("[SyncManager] Network connection lost");
        });
    }

    private startSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.processSyncQueue();
            }
        }, this.syncInterval);
    }

    async syncNow() {
        if (navigator.onLine && !this.isSyncing) {
            await this.processSyncQueue();
        }
    }

    private async processSyncQueue() {
        if (this.isSyncing) return;

        this.isSyncing = true;

        try {
            const queue = await offlineStorage.getSyncQueue();
            console.log(`[SyncManager] Processing ${queue.length} items`);

            for (const item of queue) {
                // Skip if too many attempts
                if (item.attempts >= 5) {
                    console.warn(
                        `[SyncManager] Max attempts reached for item ${item.id}`
                    );
                    // You might want to move this to a failed queue or alert the user
                    await offlineStorage.removeFromSyncQueue(item.id);
                    continue;
                }

                try {
                    await this.syncItem(item);
                    await offlineStorage.removeFromSyncQueue(item.id);
                    console.log(
                        `[SyncManager] Successfully synced item ${item.id}`
                    );
                } catch (error) {
                    console.error(
                        `[SyncManager] Failed to sync item ${item.id}:`,
                        error
                    );
                    await offlineStorage.incrementSyncAttempts(item.id);
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    private async syncItem(item: any) {
        const { type, action, data } = item;

        switch (type) {
            case "listing_create":
                return await this.syncListingCreate(data);

            case "listing_update":
                return await this.syncListingUpdate(data);

            case "listing_delete":
                return await this.syncListingDelete(data);

            case "lead_response":
                return await this.syncLeadResponse(data);

            default:
                console.warn(`[SyncManager] Unknown sync type: ${type}`);
        }
    }

    private async syncListingCreate(data: any) {
        const { data: result, error } = await supabase
            .from("pages")
            .insert(data)
            .select()
            .single();

        if (error) throw error;

        // Update local storage with server ID
        if (result) {
            await offlineStorage.saveListing({
                ...data,
                id: result.id,
                lastSync: Date.now(),
                localChanges: false,
            });
        }

        return result;
    }

    private async syncListingUpdate(data: any) {
        const { id, ...updates } = data;

        const { data: result, error } = await supabase
            .from("pages")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Update local storage
        if (result) {
            await offlineStorage.saveListing({
                ...result,
                lastSync: Date.now(),
                localChanges: false,
            });
        }

        return result;
    }

    private async syncListingDelete(data: any) {
        const { id } = data;

        const { error } = await supabase.from("pages").delete().eq("id", id);

        if (error) throw error;

        // Remove from local storage
        await offlineStorage.deleteListing(id);
    }

    private async syncLeadResponse(data: any) {
        // Implement lead response sync
        // This would typically involve sending an email or updating lead status
        console.log("[SyncManager] Syncing lead response:", data);
    }

    async queueListingUpdate(listing: any) {
        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "listing_update" as const,
            action: "update" as const,
            data: listing,
            timestamp: Date.now(),
            attempts: 0,
        };

        await offlineStorage.addToSyncQueue(syncItem);

        // Also save to local storage with pending changes flag
        await offlineStorage.saveListing({
            ...listing,
            lastSync: Date.now(),
            localChanges: true,
        });

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.syncNow();
        }
    }

    async queueListingCreate(listing: any) {
        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "listing_create" as const,
            action: "create" as const,
            data: listing,
            timestamp: Date.now(),
            attempts: 0,
        };

        await offlineStorage.addToSyncQueue(syncItem);
        await offlineStorage.saveListing({
            ...listing,
            lastSync: Date.now(),
            localChanges: true,
        });

        if (navigator.onLine) {
            this.syncNow();
        }
    }

    async queueListingDelete(id: string) {
        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "listing_delete" as const,
            action: "delete" as const,
            data: { id },
            timestamp: Date.now(),
            attempts: 0,
        };

        await offlineStorage.addToSyncQueue(syncItem);

        if (navigator.onLine) {
            this.syncNow();
        }
    }

    stop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
    }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
