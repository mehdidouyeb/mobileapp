/**
 * Discussion Storage Utility
 * 
 * Handles saving and loading discussion history with feedback
 */

const DISCUSSIONS_FILE = 'discussions.json';

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
        this.discussions = this.loadDiscussions();
    }

    /**
     * Start a new discussion
     */
    startNewDiscussion() {
        this.currentDiscussion = new Discussion();
        return this.currentDiscussion;
    }

    /**
     * Add a message to the current discussion
     */
    addMessage(text, isUser) {
        if (this.currentDiscussion) {
            this.currentDiscussion.addMessage(text, isUser);
        }
    }

    /**
     * End the current discussion
     */
    endCurrentDiscussion() {
        if (this.currentDiscussion) {
            this.currentDiscussion.endDiscussion();
            this.discussions.push(this.currentDiscussion);
            this.saveDiscussions();
            const endedDiscussion = this.currentDiscussion;
            this.currentDiscussion = null;
            return endedDiscussion;
        }
        return null;
    }

    /**
     * Add feedback to the current discussion
     */
    addFeedbackToCurrent(rating, notes = '') {
        if (this.currentDiscussion) {
            this.currentDiscussion.addFeedback(rating, notes);
            this.saveDiscussions();
            return true;
        }
        return false;
    }

    /**
     * Get the latest discussion for feedback
     */
    getLatestDiscussion() {
        return this.discussions.length > 0 ? this.discussions[this.discussions.length - 1] : null;
    }

    /**
     * Get all discussions
     */
    getAllDiscussions() {
        return this.discussions;
    }

    /**
     * Load discussions from localStorage
     */
    loadDiscussions() {
        try {
            const stored = localStorage.getItem(DISCUSSIONS_FILE);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map(disc => Object.assign(new Discussion(), disc));
            }
        } catch (error) {
            console.error('Error loading discussions:', error);
        }
        return [];
    }

    /**
     * Save discussions to localStorage
     */
    saveDiscussions() {
        try {
            localStorage.setItem(DISCUSSIONS_FILE, JSON.stringify(this.discussions, null, 2));
        } catch (error) {
            console.error('Error saving discussions:', error);
        }
    }

    /**
     * Export discussions as downloadable JSON file
     */
    exportDiscussions() {
        const dataStr = JSON.stringify(this.discussions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `discussions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all discussions
     */
    clearAllDiscussions() {
        this.discussions = [];
        this.currentDiscussion = null;
        localStorage.removeItem(DISCUSSIONS_FILE);
    }
}

// Create a singleton instance
export const discussionStorage = new DiscussionStorage();
