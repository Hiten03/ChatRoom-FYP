import React from 'react';
import { createPortal } from 'react-dom';
import styles from './LogoutModal.module.css';

const LogoutModal = ({ onConfirm, onCancel }) => {
    return createPortal(
        <div className={styles.modalMask} onClick={onCancel}>
            <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalIcon}>
                   🚪
                </div>
                <h2 className={styles.modalTitle}>Confirm Logout</h2>
                <p className={styles.modalText}>Are you sure you want to log out of your account?</p>
                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        Keep me in
                    </button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>
                        Logout
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LogoutModal;
