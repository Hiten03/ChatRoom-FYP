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
    
    // Member Limit State
    const [limitType, setLimitType] = useState('none'); // 'none', 5, 10, 25, 50, 'custom'
    const [customLimit, setCustomLimit] = useState('');
    const [limitError, setLimitError] = useState('');

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

            // Set Member Limit
            if (limitType === 'none') {
                payload.maxMembers = null;
            } else if (limitType === 'custom') {
                const limit = parseInt(customLimit);
                if (isNaN(limit) || limit < 2 || limit > 100) {
                    setLimitError('Please enter a number between 2 and 100');
                    return;
                }
                payload.maxMembers = limit;
            } else {
                payload.maxMembers = parseInt(limitType);
            }

            const { data } = await create(payload);

            // Redirect to room page & refresh browser
            window.location.href = `/room/${data.id}`;

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

                    <h2 className={styles.subHeading} style={{marginTop: '25px'}}>Member Limit</h2>
                    <div className={styles.limitSelector}>
                        {['none', '5', '10', '25', '50', 'custom'].map((type) => (
                            <button
                                key={type}
                                className={`${styles.limitPill} ${limitType === type ? styles.activeLimit : ''}`}
                                onClick={() => {
                                    setLimitType(type);
                                    setLimitError('');
                                }}
                            >
                                {type === 'none' ? 'No limit' : type === 'custom' ? 'Custom' : type}
                            </button>
                        ))}
                    </div>

                    {limitType === 'custom' && (
                        <div className={styles.customLimitSection}>
                            <input 
                                type="number" 
                                className={styles.customLimitInput}
                                placeholder="Enter limit (2-100)"
                                value={customLimit}
                                onChange={(e) => {
                                    setCustomLimit(e.target.value);
                                    setLimitError('');
                                }}
                                min="2"
                                max="100"
                            />
                            {limitError && <p className={styles.errorText}>{limitError}</p>}
                        </div>
                    )}

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