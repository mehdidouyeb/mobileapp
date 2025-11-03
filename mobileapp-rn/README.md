# Fluent Flo - AI Language Learning Assistant 🤖📚

A modern React Native app built with Expo that helps users learn languages through AI-powered conversations. Practice speaking with Gemini AI, get instant feedback, and improve your language skills naturally.

## ✨ Features

- **Voice Conversations**: Speak naturally with AI in your target language
- **Language Selection**: Choose from 12 languages (English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi)
- **Text-to-Speech**: AI responses spoken in your native language
- **Conversation Starters**: Guided prompts to start meaningful conversations
- **Real-time Feedback**: Get corrections and suggestions as you speak
- **Multi-platform**: iOS, Android, and Web support

## 🛠️ Development Setup

### Prerequisites

#### For All Platforms:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`

#### For iOS Development (macOS only):
- **macOS** 10.15+ (Catalina or later)
- **Xcode** 14.0+ ([Download from App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **Command Line Tools**: `xcode-select --install`
- **iOS Simulator** (comes with Xcode)

### 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo-url>
   cd mobileapp-rn
   npm install
   ```

2. **Set up Environment**:
   ```bash
   cp app.json.example app.json
   # Edit app.json with your API keys:
   # - GEMINI_API_KEY (from Google AI Studio)
   # - SUPABASE_URL and SUPABASE_ANON_KEY (from Supabase)
   ```

3. **Database Setup**:
   - Create a [Supabase](https://supabase.com) account
   - Run the SQL from `supabase-setup-fixed.sql` in your Supabase SQL Editor
   - Update your `app.json` with the Supabase credentials

## 📱 iOS Development Setup

### Step 1: Install Xcode
```bash
# Check if Xcode is installed
xcode-select -p

# If not installed, install from App Store or:
# Download from: https://developer.apple.com/xcode/
```

### Step 2: Install iOS Simulator
```bash
# Open Xcode and accept license
sudo xcodebuild -license accept

# Install iOS Simulator (if not already installed)
xcodebuild -downloadPlatform iOS
```

### Step 3: Verify iOS Setup
```bash
# Check Xcode version
xcodebuild -version

# List available simulators
xcrun simctl list devices

# Clean and prepare
xcodebuild -runFirstLaunch
```

### Step 4: Run on iOS Simulator
```bash
# Start the development server
npx expo start

# In Expo DevTools (opens automatically):
# - Press 'i' to open iOS Simulator
# - Or use: npx expo run:ios
```

### Step 5: Run on Physical iOS Device (Optional)
```bash
# Connect your iPhone via USB
# Trust the device when prompted

# Run on device
npx expo run:ios --device
```

## 🎯 Testing Your Setup

### Basic App Flow:
1. **Launch App** → Sign up/Login screen
2. **Create Account** → Choose native language + target language
3. **Start Chat** → Try voice input or text messages
4. **Use Features** → Try TTS, conversation starters, settings

### Troubleshooting iOS Issues:

#### Simulator Won't Start:
```bash
# Reset simulator
xcrun simctl erase all

# Restart simulator
killall Simulator
open -a Simulator
```

#### Build Fails:
```bash
# Clean build
npx expo run:ios --clear

# Clear Metro cache
npx expo start --clear
```

#### Permission Issues:
```bash
# Fix Xcode permissions
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## 🌍 Internationalization

The app supports multiple languages through `react-i18next`:
- **English** (en) - Complete
- **Spanish** (es) - Complete
- **Add more** in `/translations/` folder

Language automatically switches based on your preferred language setting.

## 📦 Build & Deploy

### Development Build:
```bash
# iOS
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android

# Web
npx expo start --web
```

### Production Build (EAS):
```bash
# Install EAS CLI
npm install -g @expo/cli

# Login to Expo
npx @expo/cli login

# Build for iOS
npx @expo/cli build --platform ios --profile production

# Download .ipa from Expo dashboard
# Install via TestFlight or direct device install
```

### Web Deployment:
```bash
# Export for web
npx expo export --platform web

# Deploy to Vercel/Netlify/etc
# Copy 'dist' folder to your hosting provider
```

## 🗄️ Database Schema

- **user_profiles**: User language preferences, account info
- **chat_conversations**: Conversation threads
- **chat_messages**: Individual messages (user/assistant)
- **conversation_starters**: Pre-built prompts for learning

## 🔧 Project Structure

```
├── app/                    # Expo Router pages
│   ├── index.tsx          # Main chat interface
│   ├── auth.tsx           # Login/signup with language selection
│   └── _layout.tsx        # Navigation setup
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, etc.)
├── hooks/                 # Custom hooks (useGemini, useConversations)
├── lib/                   # Utilities (Supabase client, i18n)
├── translations/          # i18n language files
└── assets/                # Images, icons, etc.
```

## 🐛 Common Issues

### "Command not found: eas"
```bash
# Use npx instead
npx @expo/cli build --platform ios
```

### "iOS Simulator not available"
- Ensure Xcode is fully installed
- Check macOS version compatibility
- Try: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### "Metro bundler error"
```bash
# Clear all caches
npx expo start --clear
rm -rf node_modules/.cache
```

### Language updates failing
- Run `supabase-setup-fixed.sql` in Supabase SQL Editor
- Check RLS policies are applied correctly

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini AI](https://ai.google.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy language learning! 🌟** Speak naturally, get feedback instantly, and master new languages with AI-powered conversations.
