import 'dotenv/config';

export default ({ config }: { config: any }) => ({
  expo: {
    name: 'FluentFlo',
    slug: 'fluentflo',
    owner: 'jonjonthefox',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobileapprn',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: 'f929cbb7-a19a-49e8-9977-01f245fa7323'
      },
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY,
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
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.jonjonthefox.fluentflo',
      infoPlist: {
        NSMicrophoneUsageDescription: 'This app needs access to the microphone for voice chat.',
        NSSpeechRecognitionUsageDescription: 'This app needs speech recognition to transcribe your voice.',
        ITSAppUsesNonExemptEncryption: false
      }
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
      package: 'com.jonjonthefox.fluentflo',
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
