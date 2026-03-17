import React, { useState } from 'react';
import styles from './ConfirmDeleteModal.module.css';

const ConfirmDeleteModal = ({ roomTopic, onConfirm, onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            // Keep loading true while unmounting if parent handles it,
            // or reset if there was an error handled in onConfirm Promise
            setLoading(false); 
        }
    };

    return (
        <div className={styles.modalMask} onClick={onClose}>
            <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                <div className={styles.iconContainer}>
                    <img src="/images/trash.png" alt="delete" className={styles.trashIcon} />
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
