import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface StarterPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  created_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new conversation
  const createConversation = useCallback(async (title: string, firstMessage?: string) => {
    if (!user) {
      console.log('❌ CREATE CONVERSATION: No user');
      return null;
    }

    console.log('📝 CREATING CONVERSATION:', title, 'with message:', firstMessage);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: title || 'New Conversation'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ CREATE CONVERSATION ERROR:', error);
        throw error;
      }

      console.log('✅ CONVERSATION CREATED:', data);
      setConversations(prev => [data, ...prev]);
      setCurrentConversation(data);

      // Add first message if provided
      if (firstMessage) {
        console.log('💬 ADDING FIRST MESSAGE:', firstMessage);
        await addMessage(data.id, 'user', firstMessage);
      }

      return data;
    } catch (error) {
      console.error('❌ ERROR CREATING CONVERSATION:', error);
      return null;
    }
  }, [user]);

  // Load conversation messages
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Add message to conversation
  const addMessage = useCallback(async (conversationId: string, role: 'user' | 'assistant' | 'system', content: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [currentConversation]);

  // Load starter prompts
  const [starterPrompts, setStarterPrompts] = useState<StarterPrompt[]>([]);
  const loadStarterPrompts = useCallback(async () => {
    console.log('🎯 LOADING STARTER PROMPTS...');
    try {
      const { data, error } = await supabase
        .from('conversation_starters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ STARTER PROMPTS ERROR:', error);
        throw error;
      }
      console.log('🎯 STARTER PROMPTS RAW DATA:', data);
      console.log('🎯 Loaded starter prompts:', data?.length || 0);

      // If no data from database, use fallback
      if (!data || data.length === 0) {
        console.log('🎯 Using fallback starter prompts');
        const fallbackPrompts = [
          {
            id: 'fallback-1',
            title: 'Daily Routine',
            prompt: 'Tell me about your daily routine. What time do you wake up, what do you do during the day, and how do you spend your evenings?',
            category: 'lifestyle',
            difficulty: 'beginner' as const,
            language: 'en',
            created_at: new Date().toISOString()
          },
          {
            id: 'fallback-2',
            title: 'Travel Stories',
            prompt: 'Describe your favorite travel destination. What did you like most about it and why would you recommend it to others?',
            category: 'travel',
            difficulty: 'intermediate' as const,
            language: 'en',
            created_at: new Date().toISOString()
          }
        ];
        setStarterPrompts(fallbackPrompts);
      } else {
        setStarterPrompts(data || []);
      }
    } catch (error) {
      console.error('❌ ERROR LOADING STARTER PROMPTS:', error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadStarterPrompts();
    }
  }, [user, loadConversations, loadStarterPrompts]);

  return {
    conversations,
    currentConversation,
    messages,
    starterPrompts,
    loading,
    loadConversations,
    createConversation,
    loadMessages,
    addMessage,
    deleteConversation,
    setCurrentConversation,
    setMessages
  };
}
