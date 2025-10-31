/**
 * IndexedDB Offline Storage Manager
 * Handles offline data storage for listings, leads, and sync queue
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface OfflineDB extends DBSchema {
    listings: {
        key: string;
        value: {
            id: string;
            title: string;
            description: string;
            price: number;
            status: "active" | "pending" | "sold" | "draft";
            images: string[];
            lastSync: number;
            localChanges: boolean;
            createdAt: string;
            updatedAt: string;
        };
        indexes: { "by-status": string; "by-lastSync": number };
    };

    leads: {
        key: string;
        value: {
            id: string;
            name: string;
            email: string;
            phone?: string;
            message: string;
            listingId?: string;
            source: string;
            timestamp: number;
            read: boolean;
        };
        indexes: { "by-read": number; "by-timestamp": number };
    };

    syncQueue: {
        key: string;
        value: {
            id: string;
            type:
                | "listing_create"
                | "listing_update"
                | "listing_delete"
                | "lead_response";
            action: "create" | "update" | "delete";
            data: any;
            timestamp: number;
            attempts: number;
            lastAttempt?: number;
            error?: string;
        };
        indexes: { "by-timestamp": number; "by-attempts": number };
    };

    userPreferences: {
        key: string;
        value: {
            key: string;
            value: any;
            lastSync: number;
        };
    };
}

export class OfflineStorageManager {
    private static instance: OfflineStorageManager;
    private db?: IDBPDatabase<OfflineDB>;
    private dbName = "agentbio_offline";
    private dbVersion = 1;

    private constructor() {}

    static getInstance(): OfflineStorageManager {
        if (!OfflineStorageManager.instance) {
            OfflineStorageManager.instance = new OfflineStorageManager();
        }
        return OfflineStorageManager.instance;
    }

    async init(): Promise<void> {
        try {
            this.db = await openDB<OfflineDB>(this.dbName, this.dbVersion, {
                upgrade(db) {
                    // Listings store
                    if (!db.objectStoreNames.contains("listings")) {
                        const listingsStore = db.createObjectStore("listings", {
                            keyPath: "id",
                        });
                        listingsStore.createIndex("by-status", "status");
                        listingsStore.createIndex("by-lastSync", "lastSync");
                    }

                    // Leads store
                    if (!db.objectStoreNames.contains("leads")) {
                        const leadsStore = db.createObjectStore("leads", {
                            keyPath: "id",
                        });
                        leadsStore.createIndex("by-read", "read");
                        leadsStore.createIndex("by-timestamp", "timestamp");
                    }

                    // Sync queue store
                    if (!db.objectStoreNames.contains("syncQueue")) {
                        const syncQueueStore = db.createObjectStore(
                            "syncQueue",
                            { keyPath: "id" }
                        );
                        syncQueueStore.createIndex("by-timestamp", "timestamp");
                        syncQueueStore.createIndex("by-attempts", "attempts");
                    }

                    // User preferences store
                    if (!db.objectStoreNames.contains("userPreferences")) {
                        db.createObjectStore("userPreferences", {
                            keyPath: "key",
                        });
                    }
                },
            });

            console.log("[OfflineStorage] Database initialized");
        } catch (error) {
            console.error(
                "[OfflineStorage] Failed to initialize database:",
                error
            );
            throw error;
        }
    }

    // Listings operations
    async saveListing(listing: OfflineDB["listings"]["value"]): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.put("listings", listing);
    }

    async getListing(
        id: string
    ): Promise<OfflineDB["listings"]["value"] | undefined> {
        if (!this.db) await this.init();
        return await this.db!.get("listings", id);
    }

    async getAllListings(): Promise<OfflineDB["listings"]["value"][]> {
        if (!this.db) await this.init();
        return await this.db!.getAll("listings");
    }

    async getListingsByStatus(
        status: string
    ): Promise<OfflineDB["listings"]["value"][]> {
        if (!this.db) await this.init();
        return await this.db!.getAllFromIndex("listings", "by-status", status);
    }

    async deleteListing(id: string): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.delete("listings", id);
    }

    // Leads operations
    async saveLead(lead: OfflineDB["leads"]["value"]): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.put("leads", lead);
    }

    async getLead(
        id: string
    ): Promise<OfflineDB["leads"]["value"] | undefined> {
        if (!this.db) await this.init();
        return await this.db!.get("leads", id);
    }

    async getAllLeads(): Promise<OfflineDB["leads"]["value"][]> {
        if (!this.db) await this.init();
        return await this.db!.getAll("leads");
    }

    async getUnreadLeads(): Promise<OfflineDB["leads"]["value"][]> {
        if (!this.db) await this.init();
        return await this.db!.getAllFromIndex("leads", "by-read", 0);
    }

    // Sync queue operations
    async addToSyncQueue(item: OfflineDB["syncQueue"]["value"]): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.put("syncQueue", item);
    }

    async getSyncQueue(): Promise<OfflineDB["syncQueue"]["value"][]> {
        if (!this.db) await this.init();
        return await this.db!.getAll("syncQueue");
    }

    async removeFromSyncQueue(id: string): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.delete("syncQueue", id);
    }

    async incrementSyncAttempts(id: string): Promise<void> {
        if (!this.db) await this.init();
        const item = await this.db!.get("syncQueue", id);
        if (item) {
            item.attempts += 1;
            item.lastAttempt = Date.now();
            await this.db!.put("syncQueue", item);
        }
    }

    // Preferences operations
    async savePreference(key: string, value: any): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.put("userPreferences", {
            key,
            value,
            lastSync: Date.now(),
        });
    }

    async getPreference(key: string): Promise<any> {
        if (!this.db) await this.init();
        const pref = await this.db!.get("userPreferences", key);
        return pref?.value;
    }

    // Clear all data (for logout)
    async clearAllData(): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.clear("listings");
        await this.db!.clear("leads");
        await this.db!.clear("syncQueue");
        await this.db!.clear("userPreferences");
        console.log("[OfflineStorage] All data cleared");
    }
}

// Export singleton instance
export const offlineStorage = OfflineStorageManager.getInstance();
