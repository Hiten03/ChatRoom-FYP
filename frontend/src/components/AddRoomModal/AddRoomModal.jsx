import React, { useState } from "react";
import styles from './AddRoomModal.module.css';
import TextInput from '../shared/TextInput/TextInput';
import { createRoom as create, getMutualFollowers } from "../../http";
import { useNavigate } from 'react-router-dom';

const AddRoomModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [roomType, setRoomType] = useState('open');
    const [topic, setTopic] = useState('');
    const [password, setPassword] = useState('');
    const [mutuals, setMutuals] = useState([]);
    const [loadingMutuals, setLoadingMutuals] = useState(false);

    React.useEffect(() => {
        if (roomType === 'social') {
            setLoadingMutuals(true);
            getMutualFollowers()
                .then(res => setMutuals(res.data.mutuals || []))
                .catch(err => console.error(err))
                .finally(() => setLoadingMutuals(false));
        }
    }, [roomType]);

    async function createRoom() {
        try {
            if (!topic) return;

            if (roomType === 'private' && !password) {
                alert('Please set a password for the private room.');
                return;
            }

            const payload = { topic, roomType };
            if (roomType === 'private') {
                payload.password = password;
            }

            const { data } = await create(payload);

            // Redirect to room page
            navigate(`/room/${data.id}`);

        } catch (err) {
            console.log(err.message);
        }
    }

    const footerText = roomType === 'private'
        ? 'Start a private, password-protected room'
        : roomType === 'social'
            ? 'Start a room for your social circle'
            : 'Start a room, open to everyone';

    return (
        <div className={styles.modalMask}>
            <div className={styles.modalBody}>
                <button onClick={onClose} className={styles.closeButton}>
                    <img src="/images/close.png" alt="close" />
                </button>

                <div className={styles.modalHeader}>
                    <h3 className={styles.heading}>
                        Enter the topic to be discussed
                    </h3>

                    <TextInput
                        fullwidth="true"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />

                    <h2 className={styles.subHeading}>Room types</h2>

                    <div className={styles.roomTypes}>
                        <div
                            onClick={() => { setRoomType('open'); setPassword(''); }}
                            className={`${styles.typeBox} ${roomType === 'open' ? styles.active : ''}`}
                        >
                            <img src="/images/globe.png" alt="globe" />
                            <span>Open</span>
                        </div>

                        <div
                            onClick={() => { setRoomType('social'); setPassword(''); }}
                            className={`${styles.typeBox} ${roomType === 'social' ? styles.active : ''}`}
                        >
                            <img src="/images/social.png" alt="social" />
                            <span>Social</span>
                        </div>

                        <div
                            onClick={() => setRoomType('private')}
                            className={`${styles.typeBox} ${roomType === 'private' ? styles.active : ''}`}
                        >
                            <img src="/images/lock.png" alt="lock" />
                            <span>Private</span>
                        </div>
                    </div>

                    {roomType === 'private' && (
                        <div className={styles.passwordSection}>
                            <h2 className={styles.subHeading}>Set a password</h2>
                            <TextInput
                                fullwidth="true"
                                type="password"
                                placeholder="Enter room password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {roomType === 'social' && (
                        <div className={`${styles.passwordSection} ${styles.socialSection}`}>
                            <p style={{ color: '#c4c5d5', fontSize: '14px', marginBottom: '15px', lineHeight: '1.4' }}>
                                Only your mutual followers can see and join this room.
                            </p>
                            
                            {loadingMutuals ? (
                                <p style={{ color: '#888' }}>Loading mutuals...</p>
                            ) : mutuals.length === 0 ? (
                                <p style={{ color: '#ff4d4f', fontSize: '13px', background: 'rgba(255,77,79,0.1)', padding: '10px', borderRadius: '8px' }}>
                                    You have no mutual followers yet. Follow each other with someone first!
                                </p>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {mutuals.slice(0, 5).map(m => (
                                        <img 
                                            key={m.id || m._id} 
                                            src={m.avatar || '/images/monkey-avatar.png'} 
                                            alt={m.name}
                                            title={m.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #5453e0' }}
                                        />
                                    ))}
                                    {mutuals.length > 5 && (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#323645', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                                            +{mutuals.length - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <h2>{footerText}</h2>

                    <button
                        onClick={createRoom}
                        className={styles.footerButton}
                        disabled={roomType === 'social' && mutuals.length === 0 && !loadingMutuals}
                        style={{ opacity: (roomType === 'social' && mutuals.length === 0 && !loadingMutuals) ? 0.5 : 1, cursor: (roomType === 'social' && mutuals.length === 0 && !loadingMutuals) ? 'not-allowed' : 'pointer' }}
                    >
                        <img src="/images/celebration.png" alt="celebration" />
                        <span>Let's Go</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddRoomModal;