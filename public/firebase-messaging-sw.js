// Firebase Cloud Messaging Service Worker
// This file handles background push notifications when the app is not in focus

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
// Note: Firebase config will be loaded from environment variables when the app initializes
// This service worker uses a simplified configuration
let messaging = null;

// Listen for messages from the main app to initialize Firebase
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    try {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();

      console.log('[SW] Firebase initialized successfully');
    } catch (error) {
      console.error('[SW] Failed to initialize Firebase:', error);
    }
  }
});

// CRITICAL: Bypass service worker for authentication and API requests
// This prevents the SW from interfering with Supabase auth and API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // List of patterns to bypass (let browser handle directly)
  const bypassPatterns = [
    'supabase.co',           // Supabase API/Auth
    'auth/v1',               // Auth endpoints
    '/rest/v1/',             // Supabase REST API
    '/storage/v1/',          // Supabase Storage
    'api.agentbio.net',      // Your backend API
    'functions.agentbio.net' // Edge functions
  ];
  
  // If the request matches any bypass pattern, let it pass through without caching
  const shouldBypass = bypassPatterns.some(pattern => url.href.includes(pattern));
  
  if (shouldBypass) {
    // Return immediately - don't cache, don't intercept
    return;
  }
  
  // For all other requests, also let them pass through
  // This SW is only for Firebase messaging, not for caching
  return;
});

// Handle background messages
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event);

  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    const notificationTitle = data.notification?.title || 'New Notification';
    const notificationOptions = {
      body: data.notification?.body || '',
      icon: data.notification?.icon || '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.data?.tag || 'default',
      data: data.data || {},
      requireInteraction: data.data?.requireInteraction === 'true',
      actions: data.data?.actions ? JSON.parse(data.data.actions) : [],
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window exists, open a new one
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/dashboard/leads';
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);

  // Track notification dismissal if needed
  const dismissalData = {
    tag: event.notification.tag,
    timestamp: Date.now(),
  };

  // Could send analytics here
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});

console.log('[SW] Firebase Messaging Service Worker loaded');
