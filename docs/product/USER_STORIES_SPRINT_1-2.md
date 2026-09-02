# User Stories: Sprint 1-2 - Mobile PWA Foundation

**Sprint Duration:** 4 weeks (Weeks 1-4)  
**Epic:** Mobile Management App/PWA  
**Priority:** 🔴 Critical for MVP

---

## Epic Overview

**As a** real estate agent  
**I want to** manage my AgentBio.net profile from my mobile phone  
**So that** I can update listings and respond to leads while on the go between showings

**Value Proposition:**

-   70% of agents work primarily from their phones
-   Agents need to update listing status immediately after offers
-   Mobile-first admin reduces friction for busy agents

**Acceptance Criteria for Epic:**

-   ✅ All core admin functions accessible on mobile
-   ✅ Works offline for basic operations
-   ✅ Loads in <3 seconds on 4G connection
-   ✅ Installable as PWA on iOS and Android
-   ✅ Push notifications for new leads

---

## Story 1: PWA Installation & Offline Foundation

### Story 1.1: Install as PWA

**As a** real estate agent  
**I want to** install AgentBio.net as an app on my phone  
**So that** I can access it quickly from my home screen without opening a browser

**Acceptance Criteria:**

-   [ ] Web app manifest configured with proper icons and metadata
-   [ ] "Add to Home Screen" prompt appears on compatible browsers
-   [ ] App installs with correct name "AgentBio Admin"
-   [ ] App icon displays correctly on home screen (512x512 PNG)
-   [ ] Splash screen shows during app launch
-   [ ] Works on iOS Safari and Android Chrome
-   [ ] Theme color matches brand (set in manifest)

**Technical Requirements:**

```json
// manifest.json
{
  "name": "AgentBio Admin",
  "short_name": "AgentBio",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [...]
}
```

**Testing:**

-   [ ] Test installation on iOS 16+ Safari
-   [ ] Test installation on Android 12+ Chrome
-   [ ] Verify offline launch works
-   [ ] Check all icons render correctly

**Story Points:** 3  
**Dependencies:** None

---

### Story 1.2: Service Worker for Offline Support

**As a** real estate agent  
**I want to** continue working even when my connection is poor  
**So that** I don't lose work when signal drops during showings

**Acceptance Criteria:**

-   [ ] Service worker registered and activated
-   [ ] Critical assets cached (CSS, JS, fonts)
-   [ ] Dashboard loads from cache when offline
-   [ ] "You're offline" indicator displays when no connection
-   [ ] Changes sync automatically when connection restored
-   [ ] Background sync for failed requests
-   [ ] Cache strategy: Network-first for API, Cache-first for assets

**Technical Requirements:**

```javascript
// Service worker cache strategy
const CACHE_VERSION = "v1";
const CACHE_CRITICAL = [
    "/dashboard",
    "/assets/app.js",
    "/assets/app.css",
    "/assets/fonts/inter.woff2",
];

// Network-first with cache fallback for API
// Cache-first for static assets
```

**Offline Capabilities:**

-   View existing listings (cached data)
-   Draft new listings (saved locally)
-   View leads (cached data)
-   Queue status updates for sync

**Not Available Offline:**

-   Fetch new leads
-   Upload photos (requires connection)
-   Send notifications

**Testing:**

-   [ ] DevTools offline mode testing
-   [ ] Real device testing with airplane mode
-   [ ] Verify background sync works
-   [ ] Test cache invalidation strategy

**Story Points:** 5  
**Dependencies:** Story 1.1

---

## Story 2: Mobile-Optimized Admin Navigation

### Story 2.1: Responsive Bottom Navigation

**As a** real estate agent  
**I want to** navigate quickly between key sections on mobile  
**So that** I can access listings, leads, and analytics with one tap

**Acceptance Criteria:**

-   [ ] Bottom navigation bar (fixed position)
-   [ ] 4-5 main tabs: Dashboard, Listings, Leads, Analytics, Profile
-   [ ] Active tab highlighted with color + icon
-   [ ] Tap targets minimum 44x44px (iOS guidelines)
-   [ ] Smooth transitions between tabs
-   [ ] Navigation persists across page changes
-   [ ] Badge count on Leads tab showing unread count

**Design Specs:**

```
┌─────────────────────────────────────┐
│                                     │
│         Content Area                │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🏠     📋      👤      📊      ⚙️  │
│ Home  Listings Leads  Stats  More  │
└─────────────────────────────────────┘
```

**Mobile Breakpoints:**

-   Show bottom nav: <768px (mobile)
-   Show sidebar: ≥768px (tablet/desktop)

**Testing:**

-   [ ] Works on iOS Safari
-   [ ] Works on Android Chrome
-   [ ] Touch targets pass accessibility audit
-   [ ] Badge updates in real-time

**Story Points:** 3  
**Dependencies:** None

---

### Story 2.2: Hamburger Menu for Secondary Actions

**As a** real estate agent  
**I want to** access secondary settings and actions  
**So that** I can find all features without cluttering the main navigation

**Acceptance Criteria:**

-   [ ] Hamburger icon in top-right (or "More" tab in bottom nav)
-   [ ] Slide-out menu with full-height overlay
-   [ ] Menu items: Settings, Help, Preview Profile, Logout
-   [ ] Close menu via X button, outside tap, or swipe
-   [ ] Smooth slide animation (300ms)
-   [ ] Menu accessible via keyboard (Esc to close)

**Menu Structure:**

```
Settings
├── Profile Settings
├── Notification Preferences
├── Theme Customization
├── Connected Accounts
└── Billing & Subscription

Tools
├── Preview Profile
├── QR Code Generator
└── Import/Export Data

Support
├── Help Center
├── Video Tutorials
├── Contact Support
└── Report Bug

Account
└── Logout
```

**Testing:**

-   [ ] Smooth animations on all devices
-   [ ] No scroll issues when menu open
-   [ ] Keyboard accessible

**Story Points:** 2  
**Dependencies:** Story 2.1

---

## Story 3: Touch-Optimized Listing Management

### Story 3.1: Mobile Listing List View

**As a** real estate agent  
**I want to** see all my listings in an easy-to-scan mobile view  
**So that** I can quickly find and edit any property

**Acceptance Criteria:**

-   [ ] Card-based layout (one column on mobile)
-   [ ] Each card shows: Thumbnail, address, price, status
-   [ ] Swipe left to reveal quick actions (Edit, Mark Pending, Delete)
-   [ ] Pull-to-refresh to reload listings
-   [ ] Infinite scroll or pagination
-   [ ] "Last updated" timestamp on each card
-   [ ] Visual indicators for stale content (>7 days old)
-   [ ] Tap card to open detail view

**Card Layout:**

```
┌───────────────────────────────────┐
│ [Photo]  123 Main St       $450K │
│          🏠 3bd 2ba        Active │
│          Updated 2 days ago       │
└───────────────────────────────────┘
← Swipe to reveal: Edit | Pending | Delete
```

**Performance:**

-   Lazy load images (only visible cards)
-   Virtualized scrolling for 50+ listings
-   Skeleton screens while loading

**Testing:**

-   [ ] Swipe gestures work smoothly
-   [ ] Pull-to-refresh works
-   [ ] Performance with 100+ listings
-   [ ] Works on low-end Android devices

**Story Points:** 5  
**Dependencies:** API endpoints for listings

---

### Story 3.2: Mobile Listing Editor

**As a** real estate agent  
**I want to** edit listing details on my phone  
**So that** I can update prices, descriptions, and status on the go

**Acceptance Criteria:**

-   [ ] Full-screen editor on mobile
-   [ ] Single-column form layout
-   [ ] Large touch-friendly inputs
-   [ ] Auto-save draft every 30 seconds
-   [ ] "Unsaved changes" warning if navigating away
-   [ ] Numeric keyboard for price fields
-   [ ] Address autocomplete with geocoding
-   [ ] Status dropdown (Active, Pending, Sold, Off Market)
-   [ ] Save button fixed at bottom (sticky)
-   [ ] Success toast after save

**Form Fields (Mobile-Optimized):**

1. Property address (autocomplete)
2. Price (formatted $XXX,XXX)
3. Bedrooms (stepper: - 3 +)
4. Bathrooms (stepper: - 2.5 +)
5. Square feet (number input)
6. Description (textarea, 1000 char limit with counter)
7. Status (dropdown)
8. Open house date (date picker)
9. MLS number (optional text)

**Smart Inputs:**

-   Price: Show number keyboard, auto-format with commas
-   Bed/Bath: Use stepper instead of text input
-   Description: Show character count, suggest snippets
-   Date: Native date picker for open house

**Testing:**

-   [ ] All keyboards show correctly (numeric, text, date)
-   [ ] Auto-save works reliably
-   [ ] Unsaved changes warning prevents data loss
-   [ ] Form validation messages clear on mobile

**Story Points:** 8  
**Dependencies:** Story 3.1, Auto-save infrastructure

---

## Story 4: Camera Integration for Photos

### Story 4.1: Take Photo from Phone Camera

**As a** real estate agent  
**I want to** take photos with my phone camera and add them directly to listings  
**So that** I can update property photos immediately during showings

**Acceptance Criteria:**

-   [ ] "Add Photo" button opens native camera
-   [ ] Supports both camera and photo library
-   [ ] Photo preview before adding
-   [ ] Basic crop/rotate functionality
-   [ ] Auto-compress to max 2MB per image
-   [ ] Multiple photo selection from gallery
-   [ ] Drag to reorder photos
-   [ ] Set primary photo (first in list)
-   [ ] Delete photo with confirmation
-   [ ] Upload progress indicator

**Camera Access:**

```html
<!-- HTML5 Camera API -->
<input type="file" accept="image/*" capture="environment" multiple />
```

**Image Processing:**

-   Max resolution: 1920x1080 (optimize for web)
-   Format: JPEG or WebP
-   Quality: 85%
-   Max file size: 2MB after compression
-   EXIF data stripped (privacy)

**Upload Flow:**

1. Tap "Add Photos"
2. Choose: Take Photo | Choose from Library
3. Capture/select image(s)
4. Review and crop if needed
5. Upload with progress bar
6. Photos appear in listing gallery

**Testing:**

-   [ ] Works on iOS Safari (camera permission)
-   [ ] Works on Android Chrome
-   [ ] Multiple photo selection works
-   [ ] Compression reduces file size appropriately
-   [ ] Upload progress accurate

**Story Points:** 5  
**Dependencies:** Image upload API, S3/R2 storage

---

### Story 4.2: Photo Gallery Management

**As a** real estate agent  
**I want to** reorder and manage photos easily on mobile  
**So that** I can showcase properties in the best light

**Acceptance Criteria:**

-   [ ] Grid view of all photos (3 columns on mobile)
-   [ ] Long-press and drag to reorder
-   [ ] Tap to view full screen
-   [ ] Swipe in full screen to navigate photos
-   [ ] Delete button in full screen view
-   [ ] Set as primary photo (star icon)
-   [ ] Batch delete (select multiple)
-   [ ] Photo count: "12/25 photos"

**Gallery Layout:**

```
┌──────┬──────┬──────┐
│ ⭐ 1 │  2   │  3   │  (Primary marked with star)
├──────┼──────┼──────┤
│  4   │  5   │  6   │
└──────┴──────┴──────┘
Long-press to drag and reorder
```

**Testing:**

-   [ ] Drag and drop smooth on all devices
-   [ ] Full screen swipe gestures work
-   [ ] Batch operations work
-   [ ] Primary photo indicator clear

**Story Points:** 3  
**Dependencies:** Story 4.1

---

## Story 5: Voice-to-Text for Descriptions

### Story 5.1: Voice Input for Listing Descriptions

**As a** real estate agent  
**I want to** dictate listing descriptions using my voice  
**So that** I can create listings faster while at properties

**Acceptance Criteria:**

-   [ ] Microphone button on description field
-   [ ] Native speech-to-text integration
-   [ ] Real-time transcription display
-   [ ] Ability to pause/resume recording
-   [ ] Auto-punctuation (periods, commas)
-   [ ] Edit text after dictation
-   [ ] Works offline (device speech recognition)
-   [ ] Privacy: Audio not sent to third-party servers

**UI Design:**

```
Description Field
┌─────────────────────────────────────┐
│ Beautiful 3 bedroom home with...   │
│                                     │
└─────────────────────────────────────┘
[🎤 Tap to dictate]  [0/1000 chars]

(While recording)
[🔴 Recording... Tap to stop]
[Real-time transcription appears above]
```

**Browser Support:**

-   iOS: Safari SpeechRecognition API
-   Android: Chrome Web Speech API
-   Fallback: Show keyboard if not supported

**Technical:**

```javascript
// Web Speech API
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";
```

**Testing:**

-   [ ] Works in quiet environment
-   [ ] Works with background noise
-   [ ] Punctuation auto-added correctly
-   [ ] User can edit after dictation
-   [ ] Permission prompts clear

**Story Points:** 5  
**Dependencies:** None

---

## Story 6: Push Notifications for Leads

### Story 6.1: Push Notification Setup

**As a** real estate agent  
**I want to** receive push notifications for new leads  
**So that** I can respond immediately even when the app is closed

**Acceptance Criteria:**

-   [ ] Permission request on first login (or in onboarding)
-   [ ] Firebase Cloud Messaging (FCM) integration
-   [ ] Store push token per device in database
-   [ ] Notification settings page (toggle on/off)
-   [ ] Support for multiple devices per user
-   [ ] Notification payload includes lead details
-   [ ] Tap notification opens lead detail page
-   [ ] Badge count updates on app icon

**Notification Types:**

1. New lead received
2. Hot lead detected (viewed 3+ listings)
3. Appointment booked
4. Message from visitor (if chat implemented)

**Notification Format:**

```
🔔 New Lead from 123 Main St
John Doe is interested in your listing
Tap to respond →
```

**Testing:**

-   [ ] Permission flow works on iOS
-   [ ] Permission flow works on Android
-   [ ] Notifications received when app closed
-   [ ] Deep linking works (tap → open lead)
-   [ ] Multiple devices supported

**Story Points:** 8  
**Dependencies:** FCM setup, backend notification service

---

### Story 6.2: Notification Preferences

**As a** real estate agent  
**I want to** control which notifications I receive  
**So that** I'm not overwhelmed but don't miss important leads

**Acceptance Criteria:**

-   [ ] Settings page: Notification Preferences
-   [ ] Toggle for each notification type
-   [ ] Quiet hours setting (e.g., 10 PM - 7 AM)
-   [ ] Sound/vibration preferences
-   [ ] Digest mode: Daily summary instead of real-time
-   [ ] Test notification button
-   [ ] Changes save immediately
-   [ ] Syncs across devices

**Preference Options:**

```
Push Notifications
├── New Leads [ON]
├── Hot Leads (viewed 3+ properties) [ON]
├── Appointments Booked [ON]
├── Form Abandonments [OFF]
└── Daily Summary [OFF]

Quiet Hours
├── Enable [ON]
├── Start Time: 10:00 PM
└── End Time: 7:00 AM

Delivery
├── Sound [ON]
└── Vibration [ON]
```

**Testing:**

-   [ ] Settings persist correctly
-   [ ] Quiet hours respected
-   [ ] Test notification works
-   [ ] All toggles functional

**Story Points:** 3  
**Dependencies:** Story 6.1

---

## Story 7: Quick Actions from Notifications

### Story 7.1: Actionable Notifications

**As a** real estate agent  
**I want to** take quick actions from notifications  
**So that** I can respond to leads without fully opening the app

**Acceptance Criteria:**

-   [ ] Notification action buttons (iOS/Android)
-   [ ] "Reply" button → Opens quick reply modal
-   [ ] "Call" button → Opens phone dialer
-   [ ] "View" button → Opens lead detail
-   [ ] Pre-filled templates for quick reply
-   [ ] Send reply directly from notification
-   [ ] Success confirmation after action

**Notification Actions:**

```
New Lead from 123 Main St
John Doe: "I'd like to schedule a showing"

[Reply]  [Call]  [View]
```

**Quick Reply Options:**

1. "Thanks! I'll call you shortly."
2. "I'd love to show you this property. When are you available?"
3. "Let me send you more details."
4. [Custom message]

**Testing:**

-   [ ] Actions work on iOS
-   [ ] Actions work on Android
-   [ ] Quick reply sends successfully
-   [ ] Call button opens dialer with correct number

**Story Points:** 5  
**Dependencies:** Story 6.1, lead response API

---

## Technical Architecture

### PWA Stack

**Service Worker:**

-   Workbox library for caching strategies
-   Background sync for failed requests
-   Push notification handling

**State Management:**

-   Zustand or Redux for global state
-   IndexedDB for offline data storage
-   Sync queue for pending actions

**UI Framework:**

-   React Native Web (consideration) OR
-   React + Tailwind + mobile-first components
-   Capacitor for native features (camera, notifications)

**APIs:**

-   Web Speech API (voice input)
-   MediaDevices API (camera)
-   Push API (notifications)
-   Service Worker API (offline)

---

## Definition of Done

A user story is considered "Done" when:

-   [ ] Code complete and peer-reviewed
-   [ ] Unit tests written and passing
-   [ ] Integration tests passing
-   [ ] Tested on iOS Safari (latest 2 versions)
-   [ ] Tested on Android Chrome (latest 2 versions)
-   [ ] Accessibility audit passed (WCAG 2.1 AA)
-   [ ] Performance: <3 second load on 4G
-   [ ] Designer approved UI implementation
-   [ ] Product owner accepted story
-   [ ] Deployed to staging environment
-   [ ] Documentation updated

---

## Sprint 1-2 Velocity

**Total Story Points:** 52 points

**Story Breakdown:**

-   Story 1 (PWA Foundation): 8 points
-   Story 2 (Navigation): 5 points
-   Story 3 (Listing Management): 13 points
-   Story 4 (Camera Integration): 8 points
-   Story 5 (Voice Input): 5 points
-   Story 6 (Push Notifications): 11 points
-   Story 7 (Quick Actions): 5 points

**Team Capacity:** ~25-30 points per sprint (2 weeks)
**Sprints Required:** 2 sprints (4 weeks)

---

## Success Metrics

**Sprint 1 Goals:**

-   PWA installable on both iOS and Android
-   Basic offline functionality working
-   Mobile navigation implemented
-   Camera integration complete

**Sprint 2 Goals:**

-   Listing management fully mobile-optimized
-   Voice input working
-   Push notifications sending
-   All acceptance criteria met

**Post-Sprint Metrics:**

-   50% of agent admin actions done via mobile (within 30 days)
-   <3 second load time on 4G
-   Push notification delivery: >95%
-   PWA installation rate: >40% of mobile users

---

**Document Status:** ✅ Ready for Development  
**Last Updated:** October 31, 2025  
**Review Date:** End of Sprint 2
