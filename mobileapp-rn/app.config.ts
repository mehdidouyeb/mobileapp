import 'dotenv/config';

export default ({ config }) => ({
  expo: {
    name: 'mobileapp-rn',
    slug: 'mobileapp-rn',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobileapprn',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
    plugins: [
      'expo-secure-store',
      'expo-router',
      ['expo-splash-screen', { 
        image: './assets/images/splash-icon.png', 
        imageWidth: 200, 
        resizeMode: 'contain', 
        backgroundColor: '#ffffff', 
        dark: { backgroundColor: '#000000' } 
      }],
      // Additional plugins can be added here
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: 'This app needs access to the microphone for voice chat.',
        NSSpeechRecognitionUsageDescription: 'This app needs speech recognition to transcribe your voice.',
      },
      bundleIdentifier: 'com.anonymous.mobileapprn',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.anonymous.mobileapprn',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
  ...config
});
