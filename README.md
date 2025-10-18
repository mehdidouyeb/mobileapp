# 🎤 React Voice Chat

A modern, modular React application for real-time voice chat with Google's Gemini AI. Built with React hooks, context API, and modern web technologies.

## 🌟 Features

- **Real-time voice chat** with Gemini AI
- **Automatic transcription** of both user and AI speech
- **Audio playback** of AI responses
- **Modern React architecture** with hooks and context
- **Responsive design** with CSS modules
- **TypeScript-ready** structure
- **Hot reload** development experience

## 🏗️ Architecture

### **React-Specific Design Patterns**

#### **1. Custom Hooks**

- `useAudio` - Audio processing and playback
- `useGemini` - Gemini API client management
- `useSession` - Session orchestration and lifecycle

#### **2. Context API**

- `VoiceChatContext` - Global state management
- Reducer pattern for complex state updates
- Type-safe action creators

#### **3. Component Architecture**

```
App
└── VoiceChatProvider (Context)
    └── VoiceChat
        ├── ChatArea
        │   └── Message (multiple)
        ├── ControlButton
        └── StatusDisplay
```

#### **4. CSS Modules**

- Scoped styling for each component
- No style conflicts
- Better maintainability

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- npm or yarn

### **Installation**

1. **Navigate to the React project:**

   ```bash
   cd react-voice-chat
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   # Create .env.local file
   echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**

   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### **Environment Variables**

Create a `.env.local` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### **Customization**

Edit `src/utils/config.js` to modify:

- AI system instructions
- Audio settings
- UI messages
- Model configuration

## 📁 Project Structure

```
react-voice-chat/
├── public/                    # Static assets
├── src/
│   ├── components/           # React components
│   │   ├── ChatArea.jsx
│   │   ├── ControlButton.jsx
│   │   ├── Message.jsx
│   │   ├── StatusDisplay.jsx
│   │   └── VoiceChat.jsx
│   ├── context/              # React context
│   │   └── VoiceChatContext.js
│   ├── hooks/                # Custom hooks
│   │   ├── useAudio.js
│   │   ├── useGemini.js
│   │   └── useSession.js
│   ├── styles/               # Global styles
│   │   └── index.css
│   ├── utils/                # Utilities
│   │   ├── audioUtils.js
│   │   └── config.js
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── index.html                # HTML template
├── package.json              # Dependencies
└── vite.config.js            # Vite configuration
```

## 🎯 Key Components

### **VoiceChatContext**

```javascript
// Global state management with reducer pattern
const { 
  isActive, 
  status, 
  messages, 
  startSession, 
  stopSession 
} = useVoiceChat();
```

### **useAudio Hook**

```javascript
// Audio processing and playback
const { 
  startMicrophoneCapture, 
  playAudioResponse, 
  cleanup 
} = useAudio(onAudioData);
```

### **useGemini Hook**

```javascript
// Gemini API client
const { 
  connect, 
  sendAudioInput, 
  close, 
  isConnected 
} = useGemini(onMessage, onError, onClose, onOpen);
```

### **useSession Hook**

```javascript
// Session orchestration
const { 
  startSession, 
  stopSession, 
  reset, 
  isActive 
} = useSession();
```

## 🎨 Styling

### **CSS Modules**

Each component has its own CSS module:

- `VoiceChat.module.css`
- `ChatArea.module.css`
- `Message.module.css`
- `ControlButton.module.css`
- `StatusDisplay.module.css`

### **Global Styles**

- `src/styles/index.css` - Global styles and resets
- Responsive design with mobile-first approach
- Custom scrollbars and focus states

## 🔄 State Management

### **Context + Reducer Pattern**

```javascript
// Actions
const actions = {
  setStatus: (status) => dispatch({ type: 'SET_STATUS', payload: status }),
  addMessage: (message) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
  // ... more actions
};

// Usage in components
const { setStatus, addMessage } = useVoiceChat();
```

### **State Structure**

```javascript
const state = {
  isActive: false,
  status: 'idle',
  messages: [],
  currentUserText: '',
  currentAIText: '',
  error: null
};
```

## 🚀 Development

### **Available Scripts**

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### **Hot Reload**

- Automatic browser refresh on file changes
- Preserves component state during development
- Fast rebuild times with Vite

## 🎯 Usage

1. **Start the app** and grant microphone permissions
2. **Click "Start Chat"** to begin voice conversation
3. **Speak naturally** - the AI will respond with audio
4. **View transcriptions** in real-time
5. **Click "Stop Chat"** to end the session
6. **Click "Reset"** to clear conversation history

## 🔧 Customization

### **Adding New Features**

1. Create new components in `src/components/`
2. Add custom hooks in `src/hooks/`
3. Extend context in `src/context/VoiceChatContext.js`
4. Update configuration in `src/utils/config.js`

### **Styling Changes**

- Modify CSS modules for component-specific styles
- Update global styles in `src/styles/index.css`
- Use CSS custom properties for theming

## 🐛 Troubleshooting

### **Common Issues**

1. **Microphone not working:**
   - Check browser permissions
   - Ensure HTTPS or localhost
   - Verify microphone is not in use

2. **API connection fails:**
   - Verify API key in `.env.local`
   - Check internet connection
   - Ensure model is available

3. **Build errors:**
   - Clear node_modules and reinstall
   - Check Node.js version (18+)
   - Verify all dependencies are installed

## 📚 Dependencies

### **Core Dependencies**

- **React 18** - UI framework
- **@google/genai** - Gemini API client
- **Vite** - Build tool and dev server

### **Development Dependencies**

- **ESLint** - Code linting
- **@vitejs/plugin-react** - React support for Vite

## 🔐 Security

- Store API keys in environment variables
- Never commit `.env.local` to version control
- Use HTTPS in production
- Validate user input before processing

## 📝 License

This project is for educational purposes. Ensure you comply with Google's Gemini API terms of service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Built with ❤️ using React and Google Gemini AI**
