# AgentBio Mobile - Native JavaScript Build

This is a **pure JavaScript** React Native mobile app for AgentBio, built separately from the main web build to avoid TypeScript compilation issues and ensure reliable native builds for iOS and Android.

## Why This Approach?

- **Pure JavaScript**: No TypeScript compilation errors
- **Native Performance**: True native iOS and Android apps
- **Separate Build**: Doesn't affect the main web application
- **App Store Ready**: Direct submission to Apple App Store and Google Play Store

## Prerequisites

### macOS (for iOS development)
- **Xcode** 14.0 or later
- **CocoaPods**: `sudo gem install cocoapods`
- **Node.js** 18 or later
- **iOS Simulator** (included with Xcode)

### For Android Development
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17
- **Node.js** 18 or later
- **Android Emulator** or physical Android device

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile-native-js
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Self-Hosted Supabase Configuration
SUPABASE_URL=https://api.agentbio.net
SUPABASE_ANON_KEY=your-anon-key-here
API_URL=https://api.agentbio.net
APP_URL=https://agentbio.net
```

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 4. Android Setup

No additional setup required. The Gradle build system will handle dependencies automatically.

## Running the App

### iOS (macOS only)

```bash
# Run on iOS Simulator
npm run ios

# Run on specific iOS device
npm run ios -- --device "iPhone Name"
```

### Android

```bash
# Run on Android Emulator
npm run android

# Run on specific device
npm run android -- --deviceId=DEVICE_ID
```

### Development Server

The Metro bundler should start automatically. If not:

```bash
npm start
```

## Building for Production

### iOS (App Store)

1. **Open Xcode Project**
   ```bash
   open ios/AgentBioMobile.xcworkspace
   ```

2. **Configure Signing**
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Select your development team
   - Configure bundle identifier (e.g., `com.yourcompany.agentbio`)

3. **Archive for App Store**
   - In Xcode: Product → Archive
   - Once archived, click "Distribute App"
   - Choose "App Store Connect"
   - Follow the prompts to upload

4. **Submit to App Store**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Complete app information
   - Submit for review

### Android (Google Play Store)

1. **Generate Release Keystore**
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias agentbio-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Gradle for Signing**

   Edit `android/gradle.properties` and add:
   ```properties
   AGENTBIO_UPLOAD_STORE_FILE=release.keystore
   AGENTBIO_UPLOAD_KEY_ALIAS=agentbio-key
   AGENTBIO_UPLOAD_STORE_PASSWORD=your-keystore-password
   AGENTBIO_UPLOAD_KEY_PASSWORD=your-key-password
   ```

   Edit `android/app/build.gradle` to add the release signing config:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('AGENTBIO_UPLOAD_STORE_FILE')) {
                   storeFile file(AGENTBIO_UPLOAD_STORE_FILE)
                   storePassword AGENTBIO_UPLOAD_STORE_PASSWORD
                   keyAlias AGENTBIO_UPLOAD_KEY_ALIAS
                   keyPassword AGENTBIO_UPLOAD_KEY_PASSWORD
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               ...
           }
       }
   }
   ```

3. **Build Release APK/AAB**
   ```bash
   cd android
   ./gradlew bundleRelease  # For AAB (recommended for Play Store)
   # OR
   ./gradlew assembleRelease  # For APK
   ```

4. **Upload to Google Play**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app
   - Upload the AAB file from `android/app/build/outputs/bundle/release/app-release.aab`
   - Complete app information
   - Submit for review

## Project Structure

```
mobile-native-js/
├── App.js                    # Main app entry point
├── index.js                  # React Native registration
├── package.json              # Dependencies
├── src/
│   ├── screens/              # App screens
│   │   ├── auth/            # Login, Register
│   │   ├── dashboard/       # Dashboard screens
│   │   └── public/          # Public profile view
│   ├── services/            # API services
│   │   └── supabase.js      # Supabase client & helpers
│   ├── components/          # Reusable components
│   └── utils/               # Utility functions
├── ios/                      # iOS native files
│   ├── Podfile              # CocoaPods dependencies
│   └── AgentBioMobile/      # iOS app files
└── android/                  # Android native files
    ├── app/                 # Android app module
    └── build.gradle         # Gradle build config
```

## Features Implemented

✅ **Authentication**
- Login with email/password
- Registration with email verification
- Persistent sessions with AsyncStorage

✅ **Dashboard**
- Overview with stats
- Link management (create, edit, delete)
- Profile editing
- Analytics view
- Settings

✅ **Public Profile**
- View profile as visitors see it
- Click tracking for links

✅ **Supabase Integration**
- Database operations
- Authentication
- Real-time ready

## Troubleshooting

### iOS Build Issues

**Pod install fails:**
```bash
cd ios
pod deintegrate
pod install
```

**Code signing errors:**
- Ensure you have a valid Apple Developer account
- Check that your signing certificates are up to date in Xcode

### Android Build Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
./gradlew build
```

**Metro bundler connection issues:**
```bash
npx react-native start --reset-cache
```

### Common Issues

**"Unable to resolve module":**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

**Environment variables not loading:**
- Ensure `.env` file exists in the root of `mobile-native-js/`
- Restart the Metro bundler after changing `.env`

## Testing

### iOS
```bash
# Run on iOS Simulator
npm run ios

# Test on physical device
npm run ios -- --device "Your iPhone Name"
```

### Android
```bash
# Run on Android Emulator
npm run android

# Test on physical device (with USB debugging enabled)
npm run android
```

## Deployment Checklist

### Before Submitting to App Stores:

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Configure production Supabase credentials
- [ ] Update app version in `package.json`
- [ ] Update iOS version in `Info.plist`
- [ ] Update Android version in `build.gradle`
- [ ] Test all authentication flows
- [ ] Test link creation and editing
- [ ] Test profile updates
- [ ] Create app icons for iOS and Android
- [ ] Create splash screens
- [ ] Configure app permissions (camera, storage, etc.)
- [ ] Test offline behavior
- [ ] Review and accept App Store/Play Store guidelines

## App Store Assets Required

### iOS App Store
- App Icon (1024x1024)
- Screenshots for various iPhone sizes
- App description
- Keywords
- Support URL
- Privacy Policy URL

### Google Play Store
- App Icon (512x512)
- Feature Graphic (1024x500)
- Screenshots for phone and tablet
- App description
- Privacy Policy URL
- Content rating questionnaire

## Support

For issues specific to this mobile build, check:
1. React Native documentation: https://reactnative.dev
2. Supabase documentation: https://supabase.com/docs
3. iOS deployment: https://reactnative.dev/docs/publishing-to-app-store
4. Android deployment: https://reactnative.dev/docs/signed-apk-android

## License

Same as the main AgentBio project.
