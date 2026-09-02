# AgentBio Mobile Build Guide

## Overview

This project now includes a **separate native mobile build** located in the `mobile-native-js/` folder. This build is specifically designed to avoid TypeScript compilation issues and provide a reliable path to the iOS App Store and Google Play Store.

## Why a Separate Mobile Build?

Your Expo build was crashing immediately after installation. Common causes include:
- TypeScript compilation errors in native environment
- Incompatible web dependencies
- Missing native modules
- Build configuration issues

The solution: **Pure JavaScript React Native** in a completely separate folder.

## Key Differences

| Main Build (/) | Mobile Build (mobile-native-js/) |
|---|---|
| TypeScript | Pure JavaScript |
| Web (Vite + React) | Native (React Native) |
| Browser-based | iOS/Android Native Apps |
| npm run build | iOS/Android specific builds |
| Cloudflare/Web hosting | App Store/Play Store |

## Project Structure

```
plain-page-link/
├── src/                      # Main web app (TypeScript)
├── dist/                     # Web build output
├── mobile-native-js/         # 📱 Native mobile app (JavaScript)
│   ├── src/
│   │   ├── screens/         # Mobile screens
│   │   └── services/        # Supabase integration
│   ├── ios/                 # iOS native code
│   ├── android/             # Android native code
│   └── README.md            # Mobile-specific docs
└── package.json             # Web dependencies
```

## Quick Start

### For Mobile Development:

```bash
# Navigate to mobile folder
cd mobile-native-js

# Install dependencies
npm install

# Setup iOS (macOS only)
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### For Web Development (unchanged):

```bash
# Stay in root directory
npm run dev        # Development
npm run build      # Production build
```

## Features Implemented in Mobile App

✅ **Core Features**
- User authentication (login/register)
- Dashboard with stats
- Link management (CRUD operations)
- Profile editing
- Analytics view
- Public profile view
- Supabase integration

✅ **Mobile Optimizations**
- Native navigation (React Navigation)
- AsyncStorage for offline support
- Native performance
- Pull-to-refresh
- Mobile-optimized UI/UX

## Development Workflow

### 1. Making Changes to Mobile App

```bash
cd mobile-native-js
# Edit files in src/
npm run ios    # Test on iOS
npm run android  # Test on Android
```

### 2. Syncing Features from Web to Mobile

If you add features to the web app that should appear in mobile:

1. Identify the web component/feature
2. Create equivalent React Native component in `mobile-native-js/src/`
3. Use React Native components instead of HTML:
   - `<div>` → `<View>`
   - `<span>`, `<p>` → `<Text>`
   - `<button>` → `<TouchableOpacity>`
   - `<input>` → `<TextInput>`

### 3. Shared Backend (Supabase)

Both builds use the **same Supabase backend**:
- Same database
- Same authentication
- Same storage buckets
- Same API endpoints

Configuration in mobile: `mobile-native-js/.env`

## Building for Production

### iOS App Store

```bash
cd mobile-native-js
# See mobile-native-js/README.md for detailed steps
```

Key steps:
1. Open Xcode workspace
2. Configure code signing
3. Archive the app
4. Upload to App Store Connect
5. Submit for review

### Google Play Store

```bash
cd mobile-native-js/android
./gradlew bundleRelease
# Upload AAB to Play Console
```

Key steps:
1. Generate release keystore
2. Configure signing in Gradle
3. Build release AAB
4. Upload to Play Console
5. Submit for review

## Environment Variables

### Web App (.env in root)
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Mobile App (mobile-native-js/.env)
```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

**Note:** Use the **same credentials** from your main `.env` file.

## Testing Strategy

1. **Develop features in web first** (faster iteration)
2. **Port to mobile** when stable
3. **Test on real devices** before release
4. **Submit to stores** when ready

## Common Issues

### "Pod install failed" (iOS)
```bash
cd mobile-native-js/ios
pod deintegrate
pod install
```

### "Build failed" (Android)
```bash
cd mobile-native-js/android
./gradlew clean
./gradlew build
```

### "Module not found"
```bash
cd mobile-native-js
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

## Deployment Checklist

Before submitting to app stores:

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] All features work offline/online
- [ ] Authentication flows tested
- [ ] Production Supabase credentials configured
- [ ] App icons created (iOS: 1024x1024, Android: 512x512)
- [ ] Screenshots prepared for stores
- [ ] Privacy policy URL ready
- [ ] App descriptions written
- [ ] Version numbers updated

## Resources

- **Mobile App README**: `mobile-native-js/README.md`
- **Quick Start**: `mobile-native-js/QUICK_START.md`
- **React Native Docs**: https://reactnative.dev
- **iOS Deployment**: https://reactnative.dev/docs/publishing-to-app-store
- **Android Deployment**: https://reactnative.dev/docs/signed-apk-android

## Support

For mobile-specific issues:
1. Check `mobile-native-js/README.md`
2. Review React Native troubleshooting docs
3. Check Supabase React Native guide

For web app issues:
- Continue using the main project documentation

---

**Key Takeaway**: The `mobile-native-js/` folder is a **completely independent** React Native project. Changes to the main web app don't affect it, and vice versa. This isolation ensures your mobile builds are reliable and won't crash due to TypeScript or web-specific issues.
