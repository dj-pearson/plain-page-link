# Quick Start Guide - AgentBio Mobile

Get your AgentBio mobile app running in **5 minutes**!

## 🚀 Quick Setup (First Time)

### 1. Install Dependencies
```bash
cd mobile-native-js
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
```

## ▶️ Run the App

### iOS (macOS only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

That's it! The app should launch in the simulator/emulator.

## 🔑 What You Need

### Required for Development:
- Node.js 18+ installed
- Your Supabase URL and Anon Key (from main project)

### For iOS:
- macOS computer
- Xcode 14+ installed
- Run: `sudo gem install cocoapods`

### For Android:
- Android Studio installed
- Android SDK configured

## 📱 Testing on Real Devices

### iOS Device
```bash
# Connect your iPhone via USB
npm run ios -- --device "Your iPhone Name"
```

### Android Device
```bash
# Enable USB debugging on your Android phone
# Connect via USB
npm run android
```

## 🏪 Ready for App Stores?

See the main [README.md](README.md) for detailed instructions on:
- Building production versions
- App Store submission
- Google Play submission

## ⚠️ Common First-Time Issues

**"Unable to find a specification for..."**
```bash
cd ios && pod install && cd ..
```

**"Execution failed for task ':app:installDebug'"**
- Make sure Android emulator is running
- Or connect a physical device with USB debugging

**Metro bundler won't start**
```bash
npx react-native start --reset-cache
```

## 💡 Tips

1. **First build takes longer** - Subsequent builds are faster
2. **Keep Metro running** - Don't close the Metro terminal
3. **Enable Fast Refresh** - Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
4. **Hot reload** - Your changes appear instantly in the app!

## 📚 Next Steps

1. ✅ Get the app running (you're here!)
2. 📝 Customize features in `src/screens/`
3. 🎨 Update styling as needed
4. 🧪 Test on real devices
5. 🚀 Build for production
6. 📱 Submit to app stores

Need help? Check the full [README.md](README.md) for detailed documentation.
