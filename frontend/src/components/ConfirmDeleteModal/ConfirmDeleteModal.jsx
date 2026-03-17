import React, { useState, useEffect } from 'react';
import styles from './ConfirmDeleteModal.module.css';

const ConfirmDeleteModal = ({ roomTopic, onConfirm, onClose }) => {
    const [loading, setLoading] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (err) {
            console.error('Delete failed:', err);
            setLoading(false); 
        }
    };

    return (
        <div className={styles.modalMask} onClick={onClose}>
            <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                <div className={styles.iconWrapper}>
                    <svg 
                        width="32" 
                        height="32" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>
                
                <h3 className={styles.title}>Delete Room</h3>
                <p className={styles.subtitle}>
                    Are you sure you want to delete <strong>"{roomTopic}"</strong>? This action cannot be undone.
                </p>

                <div className={styles.actions}>
                    <button 
                        type="button" 
                        className={styles.cancelBtn} 
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className={styles.deleteBtn} 
                        onClick={handleConfirm} 
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Room'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
