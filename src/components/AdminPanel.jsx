/**
 * Admin Panel Component
 * 
 * Allows viewing and managing saved discussions
 */

import React, { useState, useEffect } from 'react';
import { discussionStorage } from '../utils/discussionStorage.js';
import styles from './AdminPanel.module.css';

export function AdminPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [discussions, setDiscussions] = useState([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadDiscussions();
        }
    }, [isOpen]);

    const loadDiscussions = () => {
        const allDiscussions = discussionStorage.getAllDiscussions();
        setDiscussions(allDiscussions);
    };

    const handleExport = () => {
        discussionStorage.exportDiscussions();
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all discussions? This cannot be undone.')) {
            discussionStorage.clearAllDiscussions();
            loadDiscussions();
            setSelectedDiscussion(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getRatingStars = (rating) => {
        if (!rating) return 'No rating';
        return '⭐'.repeat(rating) + ` (${rating}/5)`;
    };

    if (!isOpen) {
        return (
            <button
                className={styles.adminButton}
                onClick={() => setIsOpen(true)}
                title="View saved discussions"
            >
                📊 Discussions
            </button>
        );
    }

    return (
        <div className={styles.adminModal}>
            <div className={styles.adminContent}>
                <div className={styles.adminHeader}>
                    <h2>Discussion History</h2>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.adminActions}>
                    <button
                        className={styles.exportButton}
                        onClick={handleExport}
                        disabled={discussions.length === 0}
                    >
                        📥 Export JSON
                    </button>
                    <button
                        className={styles.clearButton}
                        onClick={handleClearAll}
                        disabled={discussions.length === 0}
                    >
                        🗑️ Clear All
                    </button>
                </div>

                <div className={styles.adminBody}>
                    <div className={styles.discussionsList}>
                        <h3>Saved Discussions ({discussions.length})</h3>
                        {discussions.length === 0 ? (
                            <p className={styles.noDiscussions}>No discussions saved yet.</p>
                        ) : (
                            <div className={styles.discussionsContainer}>
                                {discussions.map((discussion) => (
                                    <div
                                        key={discussion.id}
                                        className={`${styles.discussionItem} ${selectedDiscussion?.id === discussion.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedDiscussion(discussion)}
                                    >
                                        <div className={styles.discussionHeader}>
                                            <span className={styles.discussionDate}>
                                                {formatDate(discussion.startTime)}
                                            </span>
                                            <span className={styles.discussionRating}>
                                                {getRatingStars(discussion.feedback?.rating)}
                                            </span>
                                        </div>
                                        <div className={styles.discussionPreview}>
                                            {discussion.messages.length} messages
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedDiscussion && (
                        <div className={styles.discussionDetails}>
                            <h3>Discussion Details</h3>
                            <div className={styles.discussionInfo}>
                                <p><strong>Started:</strong> {formatDate(selectedDiscussion.startTime)}</p>
                                <p><strong>Ended:</strong> {selectedDiscussion.endTime ? formatDate(selectedDiscussion.endTime) : 'Ongoing'}</p>
                                <p><strong>Messages:</strong> {selectedDiscussion.messages.length}</p>
                                {selectedDiscussion.feedback && (
                                    <div className={styles.feedbackInfo}>
                                        <p><strong>Rating:</strong> {getRatingStars(selectedDiscussion.feedback.rating)}</p>
                                        {selectedDiscussion.feedback.notes && (
                                            <p><strong>Notes:</strong> {selectedDiscussion.feedback.notes}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.messagesContainer}>
                                <h4>Messages</h4>
                                <div className={styles.messagesList}>
                                    {selectedDiscussion.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`${styles.messageItem} ${message.isUser ? styles.userMessage : styles.aiMessage}`}
                                        >
                                            <div className={styles.messageHeader}>
                                                <span className={styles.messageSender}>
                                                    {message.isUser ? 'You' : 'AI'}
                                                </span>
                                                <span className={styles.messageTime}>
                                                    {formatDate(message.timestamp)}
                                                </span>
                                            </div>
                                            <div className={styles.messageText}>
                                                {message.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
