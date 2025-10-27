/**
 * React Context for Voice Chat State Management
 * 
 * Provides global state management for the voice chat application.
 * Manages session state, messages, and UI status.
 */

import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
    // Session state
    isActive: false,
    status: 'idle', // 'idle' | 'connecting' | 'listening' | 'error'

    // Messages
    messages: [],
    currentUserText: '',
    currentAIText: '',

    // Language settings
    languages: {
        native: null,
        target: null,
        level: null
    },

    // Text input mode
    textInputMode: false,

    // Error handling
    error: null,
};

// Action types
const ActionTypes = {
    SET_STATUS: 'SET_STATUS',
    SET_ACTIVE: 'SET_ACTIVE',
    ADD_MESSAGE: 'ADD_MESSAGE',
    UPDATE_USER_TEXT: 'UPDATE_USER_TEXT',
    UPDATE_AI_TEXT: 'UPDATE_AI_TEXT',
    FINALIZE_USER_MESSAGE: 'FINALIZE_USER_MESSAGE',
    FINALIZE_AI_MESSAGE: 'FINALIZE_AI_MESSAGE',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    RESET_SESSION: 'RESET_SESSION',
    CLEAR_MESSAGES: 'CLEAR_MESSAGES',
    SET_LANGUAGES: 'SET_LANGUAGES',
    SEND_TEXT_MESSAGE: 'SEND_TEXT_MESSAGE',
    SET_TEXT_INPUT_MODE: 'SET_TEXT_INPUT_MODE'
};

// Reducer function
function voiceChatReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_STATUS:
            return { ...state, status: action.payload };

        case ActionTypes.SET_ACTIVE:
            return { ...state, isActive: action.payload };

        case ActionTypes.ADD_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };

        case ActionTypes.UPDATE_USER_TEXT:
            return { ...state, currentUserText: action.payload };

        case ActionTypes.UPDATE_AI_TEXT:
            return { ...state, currentAIText: action.payload };

        case ActionTypes.FINALIZE_USER_MESSAGE:
            // Only add message if there's actual content
            if (!state.currentUserText.trim()) {
                return { ...state, currentUserText: '' };
            }
            return {
                ...state,
                messages: [...state.messages, {
                    id: Date.now(),
                    text: state.currentUserText,
                    isUser: true
                }],
                currentUserText: ''
            };

        case ActionTypes.FINALIZE_AI_MESSAGE:
            // Only add message if there's actual content
            if (!state.currentAIText.trim()) {
                return { ...state, currentAIText: '' };
            }
            return {
                ...state,
                messages: [...state.messages, {
                    id: Date.now(),
                    text: state.currentAIText,
                    isUser: false
                }],
                currentAIText: ''
            };

        case ActionTypes.SET_ERROR:
            return { ...state, error: action.payload, status: 'error' };

        case ActionTypes.CLEAR_ERROR:
            return { ...state, error: null };

        case ActionTypes.RESET_SESSION:
            return {
                ...initialState,
                messages: state.messages, // Keep message history
            };

        case ActionTypes.CLEAR_MESSAGES:
            return {
                ...state,
                messages: []
            };

        case ActionTypes.SET_LANGUAGES:
            return {
                ...state,
                languages: action.payload
            };

        case ActionTypes.SEND_TEXT_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };

        case ActionTypes.SET_TEXT_INPUT_MODE:
            return {
                ...state,
                textInputMode: action.payload
            };

        default:
            return state;
    }
}

// Context creation
const VoiceChatContext = createContext();

// Provider component
export function VoiceChatProvider({ children, user, onLogout }) {
    const [state, dispatch] = useReducer(voiceChatReducer, initialState);

    // Action creators
    const actions = {
        setStatus: (status) => dispatch({ type: ActionTypes.SET_STATUS, payload: status }),
        setActive: (isActive) => dispatch({ type: ActionTypes.SET_ACTIVE, payload: isActive }),
        addMessage: (message) => dispatch({ type: ActionTypes.ADD_MESSAGE, payload: message }),
        updateUserText: (text) => dispatch({ type: ActionTypes.UPDATE_USER_TEXT, payload: text }),
        updateAIText: (text) => dispatch({ type: ActionTypes.UPDATE_AI_TEXT, payload: text }),
        finalizeUserMessage: () => dispatch({ type: ActionTypes.FINALIZE_USER_MESSAGE }),
        finalizeAIMessage: () => dispatch({ type: ActionTypes.FINALIZE_AI_MESSAGE }),
        setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
        clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
        resetSession: () => dispatch({ type: ActionTypes.RESET_SESSION }),
        clearMessages: () => dispatch({ type: ActionTypes.CLEAR_MESSAGES }),
        setLanguages: (languages) => dispatch({ type: ActionTypes.SET_LANGUAGES, payload: languages }),
        sendTextMessage: (message) => dispatch({ type: ActionTypes.SEND_TEXT_MESSAGE, payload: message }),
        setTextInputMode: (mode) => dispatch({ type: ActionTypes.SET_TEXT_INPUT_MODE, payload: mode }),
    };

    const value = {
        ...state,
        ...actions,
        user,
        onLogout,
    };

    return (
        <VoiceChatContext.Provider value={value}>
            {children}
        </VoiceChatContext.Provider>
    );
}

// Custom hook to use the context
export function useVoiceChat() {
    const context = useContext(VoiceChatContext);
    if (!context) {
        throw new Error('useVoiceChat must be used within a VoiceChatProvider');
    }
    return context;
}
