import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seksaatech.kyc',
  appName: 'KYC Compare ID Card',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  // Custom platform directories pointing to mobile workspace
  ios: {
    path: '../mobile/ios'
  },
  android: {
    path: '../mobile/android'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;