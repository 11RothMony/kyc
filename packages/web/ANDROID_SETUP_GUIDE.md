# Android Setup Guide for KYC Capacitor App

## Current Issues Identified

1. **Java Version**: Android Gradle plugin requires Java 17, but Java 11 is currently installed
2. **Android Studio**: Not installed (required for development and testing)
3. **Android SDK**: Not configured

## Solutions

### Option 1: Complete Android Development Setup (Recommended)

#### Step 1: Install Java 17
```bash
# Install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Set Java 17 as default
sudo update-alternatives --config java
# Select Java 17 from the list

# Verify installation
java --version
```

#### Step 2: Install Android Studio
```bash
# Download Android Studio from: https://developer.android.com/studio
# Or install via snap:
sudo snap install android-studio --classic

# After installation, run Android Studio:
android-studio
```

#### Step 3: Configure Android SDK
1. Open Android Studio
2. Go to File → Settings → Appearance & Behavior → System Settings → Android SDK
3. Install the following:
   - Android API 34 (Android 14)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Tools

#### Step 4: Set Environment Variables
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Then reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

### Option 2: Quick Build Fix (Gradle Only)

If you just want to build the APK without Android Studio:

#### Step 1: Install Java 17
```bash
sudo apt update
sudo apt install openjdk-17-jdk
sudo update-alternatives --config java  # Select Java 17
```

#### Step 2: Set JAVA_HOME for Gradle
```bash
cd /home/rothmony/Applications/kyc/packages/web/android
echo "org.gradle.java.home=/usr/lib/jvm/java-17-openjdk-amd64" >> gradle.properties
```

#### Step 3: Build APK
```bash
./gradlew assembleDebug
```

## Testing Your App

### After Setup, Use These Commands:

```bash
# Build and sync the app
npm run mobile:build

# Open in Android Studio (Option 1 setup)
npm run mobile:android

# Or build APK directly (Option 2)
cd android && ./gradlew assembleDebug
```

### Install APK on Device:
```bash
# Connect Android device via USB with Developer Options enabled
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Common Issues:

1. **"SDK not found"**: Make sure ANDROID_HOME is set correctly
2. **"Java 17 required"**: Verify Java 17 is selected as default
3. **"ADB not found"**: Make sure platform-tools are in PATH
4. **"Device not found"**: Enable USB Debugging on your Android device

### Verify Setup:
```bash
java --version      # Should show Java 17
echo $ANDROID_HOME  # Should show SDK path
adb devices         # Should list connected devices
```

## Alternative: Use Android Emulator

If you don't have a physical device:

1. Open Android Studio
2. Go to Tools → AVD Manager
3. Create a new Virtual Device
4. Start the emulator
5. Run: `npx cap run android`

## Project Status

✅ **What's Working:**
- Capacitor configuration is correct
- Android project structure is properly generated
- Permissions are configured in AndroidManifest.xml
- Gradle wrapper is functional

❌ **What Needs Setup:**
- Java 17 installation
- Android Studio/SDK installation
- Environment variables configuration

Once you complete the setup above, your KYC app will be ready for Android development and testing!