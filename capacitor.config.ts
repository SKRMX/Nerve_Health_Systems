import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nervehealth.app',
  appName: 'NERVE',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://nervehealthsystems.com',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050B14',
    },
    Keyboard: {
      resizeOnFullScreen: true,
      style: 'DARK',
    }
  }
};

export default config;
