import React, { useState } from 'react';
import styles from './PasswordModal.module.css';
import { verifyRoomPassword } from '../../http';

const PasswordModal = ({ room, onSuccess, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await verifyRoomPassword(room.id, password);
            onSuccess();
        } catch (err) {
            setError('Incorrect password. Try again.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalMask} onClick={onClose}>
            <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                <span className={styles.lockIcon}>🔒</span>
                <h3 className={styles.title}>Private Room</h3>
                <p className={styles.subtitle}>Enter the password to join "{room.topic}"</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            className={styles.passwordInput}
                            placeholder="Enter room password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            autoFocus
                        />
                    </div>

                    <p className={styles.error}>{error}</p>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.joinBtn} disabled={loading}>
                            {loading ? 'Verifying...' : 'Join Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
