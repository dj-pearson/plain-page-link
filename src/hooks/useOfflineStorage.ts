/**
 * useOfflineStorage Hook
 * React hook for accessing offline storage
 */

import { useState, useEffect } from "react";
import { offlineStorage } from "@/lib/offline-storage";

export function useOfflineStorage() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const init = async () => {
            await offlineStorage.init();
            setIsInitialized(true);
        };

        init();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return {
        isInitialized,
        isOnline,
        storage: offlineStorage,
    };
}
