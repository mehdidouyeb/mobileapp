/**
 * Discussion Storage Utility
 * 
 * Handles saving and loading discussion history with feedback using Supabase
 */

import { supabase } from './supabase.js';

/**
 * Discussion data structure
 */
export class Discussion {
    constructor() {
        this.id = Date.now();
        this.startTime = new Date().toISOString();
        this.endTime = null;
        this.messages = [];
        this.feedback = null;
        this.rating = null;
        this.userNotes = null;
    }

    /**
     * Add a message to the discussion
     */
    addMessage(text, isUser, timestamp = new Date().toISOString()) {
        this.messages.push({
            id: Date.now() + Math.random(),
            text,
            isUser,
            timestamp
        });
    }

    /**
     * Mark discussion as ended
     */
    endDiscussion() {
        this.endTime = new Date().toISOString();
    }

    /**
     * Add feedback to the discussion
     */
    addFeedback(rating, notes = '') {
        this.feedback = {
            rating,
            notes,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Discussion Storage Manager
 */
export class DiscussionStorage {
    constructor() {
        this.currentDiscussion = null;
    }

    /**
     * Start a new discussion with conversation name
     */
    async startNewDiscussion(conversationName = 'Unnamed Conversation') {
        try {
            const { data, error } = await supabase
                .from('discussions')
                .insert({
                    user_id: 'anonymous',
                    conversation_name: conversationName,
                    start_time: new Date().toISOString(),
                    messages: []
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error creating discussion:', error);
                return null;
            }
            
            this.currentDiscussion = data;
            return data;
        } catch (error) {
            console.error('Error creating discussion:', error);
            return null;
        }
    }

    /**
     * Add a message to the current discussion
     */
    async addMessage(text, isUser) {
        if (!this.currentDiscussion) return;

        try {
            const newMessage = {
                text,
                isUser,
                timestamp: new Date().toISOString()
            };

            const updatedMessages = [...this.currentDiscussion.messages, newMessage];

            const { error } = await supabase
                .from('discussions')
                .update({ messages: updatedMessages })
                .eq('id', this.currentDiscussion.id);

            if (error) {
                console.error('Error adding message:', error);
            } else {
                this.currentDiscussion.messages = updatedMessages;
            }
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }

    /**
     * End the current discussion
     */
    async endCurrentDiscussion() {
        if (!this.currentDiscussion) return null;

        try {
            const { error } = await supabase
                .from('discussions')
                .update({ end_time: new Date().toISOString() })
                .eq('id', this.currentDiscussion.id);

            if (error) {
                console.error('Error ending discussion:', error);
            }

            const endedDiscussion = this.currentDiscussion;
            this.currentDiscussion = null;
            return endedDiscussion;
        } catch (error) {
            console.error('Error ending discussion:', error);
            return null;
        }
    }

    /**
     * Add feedback to the current discussion
     */
    async addFeedbackToCurrent(rating, notes = '') {
        if (!this.currentDiscussion) return false;

        try {
            const feedback = {
                rating,
                notes,
                timestamp: new Date().toISOString()
            };

            const { error } = await supabase
                .from('discussions')
                .update({
                    feedback,
                    end_time: new Date().toISOString()
                })
                .eq('id', this.currentDiscussion.id);

            if (error) {
                console.error('Error adding feedback:', error);
                return false;
            }

            this.currentDiscussion.feedback = feedback;
            return true;
        } catch (error) {
            console.error('Error adding feedback:', error);
            return false;
        }
    }

    /**
     * Get the latest discussion for feedback
     */
    async getLatestDiscussion() {
        try {
            const { data, error } = await supabase
                .from('discussions')
                .select('*')
                .order('start_time', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching latest discussion:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching latest discussion:', error);
            return null;
        }
    }

    /**
     * Get all discussions
     */
    async getAllDiscussions() {
        try {
            const { data, error } = await supabase
                .from('discussions')
                .select('*')
                .order('start_time', { ascending: false });

            if (error) {
                console.error('Error fetching discussions:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching discussions:', error);
            return [];
        }
    }

    /**
     * Export discussions as downloadable JSON file
     */
    async exportDiscussions() {
        try {
            const discussions = await this.getAllDiscussions();
            const dataStr = JSON.stringify(discussions, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `discussions_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting discussions:', error);
        }
    }

    /**
     * Clear all discussions
     */
    async clearAllDiscussions() {
        try {
            const { error } = await supabase
                .from('discussions')
                .delete()
                .neq('id', 0); // Delete all rows

            if (error) {
                console.error('Error clearing discussions:', error);
                return false;
            }

            this.currentDiscussion = null;
            return true;
        } catch (error) {
            console.error('Error clearing discussions:', error);
            return false;
        }
    }
}

// Create a singleton instance
export const discussionStorage = new DiscussionStorage();
