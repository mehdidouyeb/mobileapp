import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useConversations, Conversation } from '../hooks/useConversations';

interface ConversationListProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ visible, onClose, onSelectConversation }: ConversationListProps) {
  const { conversations, createConversation, deleteConversation, loading } = useConversations();
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const handleNewChat = async () => {
    if (!newChatTitle.trim()) {
      Alert.alert('Error', 'Please enter a conversation title');
      return;
    }

    const conversation = await createConversation(newChatTitle.trim());
    if (conversation) {
      onSelectConversation(conversation);
      setShowNewChat(false);
      setNewChatTitle('');
      onClose();
    }
  };

  const handleClose = () => {
    console.log('🔴 X BUTTON PRESSED - calling onClose');
    onClose();
  };

  const handleDelete = (conversationId: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversationId)
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conversations</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.list}>
          <Pressable
            style={styles.newChatButton}
            onPress={() => setShowNewChat(true)}
          >
            <Text style={styles.newChatText}>+ New Conversation</Text>
          </Pressable>

          {conversations.map((conversation) => (
            <View key={conversation.id} style={styles.conversationItem}>
              <Pressable
                style={styles.conversationButton}
                onPress={() => {
                  onSelectConversation(conversation);
                  onClose();
                }}
              >
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text style={styles.conversationDate}>
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(conversation.id, conversation.title)}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {showNewChat && (
          <Modal visible={showNewChat} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Conversation</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Conversation title..."
                  placeholderTextColor="#9CA3AF"
                  value={newChatTitle}
                  onChangeText={setNewChatTitle}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowNewChat(false);
                      setNewChatTitle('');
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleNewChat}
                  >
                    <Text style={styles.buttonText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f4a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  newChatButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  newChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationButton: {
    flex: 1,
    backgroundColor: '#1a1f3a',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  conversationDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1f3a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#0b1020',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
