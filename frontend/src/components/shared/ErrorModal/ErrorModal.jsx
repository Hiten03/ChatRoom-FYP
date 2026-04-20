import React from 'react';
import styles from './ErrorModal.module.css';

const ErrorModal = ({ title, message, onRetry, onResend, onClose }) => {
    return (
        <div className={styles.modalMask} onClick={onClose}>
            <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                <div className={styles.errorIcon}>
                    <span>⚠️</span>
                </div>
                <h3 className={styles.title}>{title || 'Invalid OTP'}</h3>
                <p className={styles.message}>{message}</p>
                
                <div className={styles.actions}>
                    <button className={styles.retryBtn} onClick={onRetry}>
                        Try Again
                    </button>
                    {onResend && (
                        <button className={styles.resendBtn} onClick={onResend}>
                            Resend OTP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
