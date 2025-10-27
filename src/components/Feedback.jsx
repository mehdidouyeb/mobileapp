/**
 * Feedback Component
 * 
 * Allows users to rate and provide feedback on discussions
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { discussionStorage } from '../utils/discussionStorage.js';
import styles from './Feedback.module.css';

export function Feedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            // Add feedback to the latest discussion
            const success = await discussionStorage.addFeedbackToCurrent(rating, notes);

            if (success) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                    setRating(0);
                    setNotes('');
                }, 2000);
            } else {
                alert('No active discussion to add feedback to');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setRating(0);
        setNotes('');
        setSubmitted(false);
    };

    if (!isOpen) {
        return (
            <button
                className={styles.feedbackButton}
                onClick={() => setIsOpen(true)}
                title="Rate this discussion"
            >
                ⭐ Rate Discussion
            </button>
        );
    }

    if (submitted) {
        return createPortal(
            <div className={styles.feedbackModal} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999
            }}>
                <div className={styles.feedbackContent}>
                    <div className={styles.successMessage}>
                        ✅ Thank you for your feedback!
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className={styles.feedbackModal} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999
        }}>
            <div className={styles.feedbackContent}>
                <h3>Rate This Discussion</h3>

                <div className={styles.ratingSection}>
                    <label>How would you rate this conversation?</label>
                    <div className={styles.starRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className={`${styles.star} ${star <= rating ? styles.active : ''}`}
                                onClick={() => setRating(star)}
                                disabled={isSubmitting}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                    <div className={styles.ratingText}>
                        {rating === 0 && 'Select a rating'}
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                    </div>
                </div>

                <div className={styles.notesSection}>
                    <label htmlFor="feedback-notes">Additional Notes (Optional)</label>
                    <textarea
                        id="feedback-notes"
                        className={styles.notesInput}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Share any thoughts about the conversation..."
                        disabled={isSubmitting}
                        rows={3}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    <button
                        className={styles.cancelButton}
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
