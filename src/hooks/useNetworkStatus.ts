/**
 * useNetworkStatus Hook
 * Provides network quality information for adaptive loading strategies
 * Uses the Network Information API when available
 */

import { useState, useEffect, useCallback } from 'react';

export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
export type ConnectionSpeed = 'fast' | 'medium' | 'slow' | 'offline';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  connectionSpeed: ConnectionSpeed;
  effectiveType: string;
  downlink: number | null; // Mbps
  rtt: number | null; // Round-trip time in ms
  saveData: boolean;
  isSlowConnection: boolean;
  isFastConnection: boolean;
}

interface NetworkInformation extends EventTarget {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
}

function determineConnectionSpeed(effectiveType: string, downlink: number | null): ConnectionSpeed {
  if (!navigator.onLine) return 'offline';

  if (effectiveType === '4g' || (downlink && downlink >= 5)) {
    return 'fast';
  }
  if (effectiveType === '3g' || (downlink && downlink >= 1)) {
    return 'medium';
  }
  return 'slow';
}

function getNetworkStatus(): NetworkStatus {
  const connection = getConnection();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const effectiveType = connection?.effectiveType || 'unknown';
  const downlink = connection?.downlink ?? null;
  const rtt = connection?.rtt ?? null;
  const saveData = connection?.saveData ?? false;

  const connectionType = (effectiveType === 'unknown' ? 'unknown' : effectiveType) as ConnectionType;
  const connectionSpeed = determineConnectionSpeed(effectiveType, downlink);

  return {
    isOnline,
    connectionType,
    connectionSpeed,
    effectiveType,
    downlink,
    rtt,
    saveData,
    isSlowConnection: connectionSpeed === 'slow' || connectionSpeed === 'offline',
    isFastConnection: connectionSpeed === 'fast',
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);

  const updateStatus = useCallback(() => {
    setStatus(getNetworkStatus());
  }, []);

  useEffect(() => {
    const connection = getConnection();

    // Listen for online/offline changes
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen for connection quality changes
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);

      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, [updateStatus]);

  return status;
}

/**
 * Utility hook to determine if reduced data mode should be used
 * Considers: save data preference, slow connection, or explicit user preference
 */
export function useShouldReduceData(): boolean {
  const { saveData, isSlowConnection } = useNetworkStatus();
  return saveData || isSlowConnection;
}

/**
 * Utility to get recommended image quality based on network
 */
export function useImageQuality(): 'high' | 'medium' | 'low' {
  const { connectionSpeed, saveData } = useNetworkStatus();

  if (saveData || connectionSpeed === 'offline') return 'low';
  if (connectionSpeed === 'slow') return 'low';
  if (connectionSpeed === 'medium') return 'medium';
  return 'high';
}
