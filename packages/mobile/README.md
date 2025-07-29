# KYC Mobile App

This directory contains the iOS and Android mobile applications built with Capacitor.

## Directory Structure

```
mobile/
├── ios/           # iOS Xcode project
├── android/       # Android Studio project
└── package.json   # Mobile workspace scripts
```

## Development

### Prerequisites

- **iOS Development**: macOS with Xcode
- **Android Development**: Android Studio with SDK

### Build and Sync

```bash
# Build web app and sync to mobile platforms
yarn mobile:build

# Sync only (after web changes)
yarn mobile:sync
```

### Platform Development

```bash
# Open iOS project in Xcode
yarn mobile:ios

# Open Android project in Android Studio
yarn mobile:android

# Run on connected device/simulator
yarn mobile:ios:run
yarn mobile:android:run
```

## Features

- ✅ Camera access for face capture and ID card photos
- ✅ Face recognition and verification
- ✅ File upload and processing
- ✅ Responsive UI optimized for mobile
- ✅ Native permissions handling

## Permissions

### iOS (Info.plist)
- `NSCameraUsageDescription`: Camera access for identity verification
- `NSPhotoLibraryUsageDescription`: Photo library access for ID card selection

### Android (AndroidManifest.xml)
- `CAMERA`: Camera access
- `READ_EXTERNAL_STORAGE`: Read photo files
- `WRITE_EXTERNAL_STORAGE`: Save captured images

## App Configuration

- **App ID**: `com.seksaatech.kyc`
- **App Name**: KYC Compare ID Card
- **Web Directory**: `../web/out` (static export)

## Notes

- Web app is statically exported for mobile compatibility
- API routes are disabled in mobile build
- All features work offline except face recognition service calls