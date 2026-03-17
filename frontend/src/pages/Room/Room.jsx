import React, { useState, useEffect, useRef } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from './Room.module.css';
import { getRoom } from "../../http";
import toast, { Toaster } from 'react-hot-toast';
import ProfileModal from '../../components/ProfileModal/ProfileModal';
import RoomTimer from "../../components/RoomTimer/RoomTimer";

const Room = () => {
    const { id: roomId } = useParams();
    const user = useSelector((state) => state.auth.user);

    const { 
        clients, 
        provideRef, 
        handleMute, 
        roles, 
        isModerator,
        startedAt,
        ownerId, 
        setRole, 
        reactions, 
        sendReaction,
        messages,
        sendMessage,
        raisedHands,
        toggleHandRaise,
        accessError
    } = useWebRTC(roomId, user);
    
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [isMute, setMute] = useState(true);

    // Chat UI state
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);
    const previousMessagesLength = useRef(0);
    
    // Profile Modal state
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const hasInitializedMute = useRef(false);

    const currentUserId = user?.id || user?._id;
    const isOwner = currentUserId === ownerId;
    const myRole = roles[currentUserId] || 'listener';
    const hasHandRaised = raisedHands.includes(currentUserId);

    const EMOJIS = ['👏', '❤️', '😂', '😮', '🔥', '👍'];

    // Auto-scroll on new message
    useEffect(() => {
        if (messages.length > previousMessagesLength.current) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
            previousMessagesLength.current = messages.length;
        }
    }, [messages]);

    // Handle Hand Raise Toasts
    const previousHandsLength = useRef(0);
    useEffect(() => {
        // Find the newly raised hand by comparing with previous state
        if (raisedHands.length > previousHandsLength.current) {
            // Find who just raised by finding the diff
            const newlyRaisedId = raisedHands[raisedHands.length - 1]; // Approximation, but reliable given socket sequentiality
            
            // Only alert speaker or owner, and don't alert myself about myself
            if ((myRole === 'speaker' || isOwner) && newlyRaisedId !== currentUserId) {
                // Look up user name
                const raiser = clients.find(c => c.id === newlyRaisedId);
                if (raiser) {
                    toast(`${raiser.name} raised their hand`, {
                        icon: '✋',
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }
            }
        }
        previousHandsLength.current = raisedHands.length;
    }, [raisedHands, myRole, isOwner, clients, currentUserId]);

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (chatInput.trim().length > 0 && chatInput.length <= 300) {
            sendMessage(chatInput.trim());
            setChatInput("");
        }
    };


    // Force mute when role is listener, sync audio when promoted to speaker
    useEffect(() => {
        if (myRole === 'listener') {
            setMute(true);
            handleMute(true, currentUserId);
        } else if (myRole === 'speaker') {
            // When promoted to speaker, sync mute state with audio track
            handleMute(isMute, currentUserId);
        }
    }, [myRole, currentUserId, handleMute, isMute]);

    // Auto-unmute for moderator on join
    useEffect(() => {
        if (!hasInitializedMute.current && isModerator) {
            setMute(false);
            hasInitializedMute.current = true;
        }
    }, [isModerator]);

    useEffect(() => {
        if (myRole === 'speaker' || isModerator) {
            handleMute(isMute, currentUserId);
        }
    }, [isMute, currentUserId, handleMute, myRole, isModerator]);

    const handleManualLeave = () => {
        navigate('/rooms');
    }

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const { data } = await getRoom(roomId);
                setRoom((prev) => data);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    setApiError(err.response.data.error || "Access Denied");
                }
            }
        };
        fetchRoom();
    }, [roomId]);

    const handleMuteClick = (clientId) => {
        if (clientId !== currentUserId) return;
        if (myRole === 'listener') return; // Listeners can't unmute
        setMute((isMute) => !isMute);
    }

    const handlePromote = (targetId) => {
        setRole(targetId, 'speaker');
    };

    const handleDemote = (targetId) => {
        setRole(targetId, 'listener');
    };

    // Split clients into speakers and listeners
    const speakers = clients.filter(c => roles[c.id] === 'speaker');
    const listeners = clients.filter(c => roles[c.id] !== 'speaker');

    const renderClient = (client, isSpeakerSection, index) => {
        const isClientOwner = client.id === ownerId;
        const isSelf = client.id === currentUserId;

        // --- SPEAKER CARD ---
        if (isSpeakerSection) {
            // First speaker (owner/host) or active speakers get a glow. For simplicity, we give owner the ring.
            const hasGlow = isClientOwner;

            return (
                <div className={`${styles.speakerCard} ${hasGlow ? styles.speakerCardGlowing : ''}`} key={client.id}>
                    
                    {/* Top Row: Moderator pill and Context menu */}
                    <div className={styles.speakerCardTop}>
                        {isClientOwner ? (
                            <div className={styles.moderatorPill}>Moderator</div>
                        ) : (
                            <div></div> // Empty spacer for flex-between
                        )}
                        
                        {isSelf && (
                            <button className={styles.threeDotMenu}>⋮</button>
                        )}
                    </div>

                    <div className={styles.speakerAvatarWrapper} onClick={() => setSelectedProfileId(client.id)} style={{cursor: 'pointer'}}>
                        <audio
                            ref={(instance) => provideRef(instance, client.id)}
                            autoPlay
                        ></audio>
                        <img
                            className={`${styles.speakerAvatar} ${raisedHands.includes(client.id) ? styles.avatarHandRaised : ''}`}
                            src={client.avatar ? client.avatar : '/images/monkey-avatar.png'}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/monkey-avatar.png';
                            }}
                            alt="avatar"
                        />
                        {/* Mic state badge directly at the bottom of the avatar */}
                        <div className={styles.micBadge}>
                            {client.muted ? (
                                <img src="/images/mic-mute.png" alt="muted" />
                            ) : (
                                <img src="/images/mic.png" alt="mic" style={{filter: 'brightness(3) invert(1)'}}/> 
                            )}
                        </div>

                        {raisedHands.includes(client.id) && (
                            <div className={styles.speakerHandBadge}>✋</div>
                        )}
                    </div>
                    
                    <h4 className={styles.speakerName}>{client.name}</h4>

                    {isOwner && !isClientOwner && (
                        <button
                            className={styles.roleBtn}
                            onClick={() => handleDemote(client.id)}
                        >
                            Demote
                        </button>
                    )}
                </div>
            );
        }

        // --- LISTENER CARD ---
        return (
            <div className={styles.listenerCard} key={client.id}>
                <div className={styles.listenerAvatarWrapper} onClick={() => setSelectedProfileId(client.id)} style={{cursor: 'pointer'}}>
                    <img
                        className={`${styles.listenerAvatar} ${raisedHands.includes(client.id) ? styles.avatarHandRaised : ''}`}
                        src={client.avatar ? client.avatar : '/images/monkey-avatar.png'}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/monkey-avatar.png';
                        }}
                        alt="avatar"
                    />
                    {raisedHands.includes(client.id) && (
                        <div className={styles.speakerHandBadge} style={{transform: 'scale(0.8)'}}>✋</div>
                    )}
                </div>
                <h4 className={styles.listenerName}>{client.name}</h4>

                {isOwner && !isClientOwner && (
                    <button
                        className={styles.roleBtn}
                        onClick={() => handlePromote(client.id)}
                        style={{marginTop: '4px'}}
                    >
                        Promote
                    </button>
                )}
            </div>
        );
    };

    if (apiError || accessError) {
        return (
            <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                <span style={{ fontSize: '80px' }}>🔒</span>
                <h2 style={{ color: '#fff', fontSize: '24px' }}>Access Denied</h2>
                <p style={{ color: '#c4c5d5', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
                    {apiError || accessError}
                </p>
                <button 
                    onClick={() => navigate('/rooms')} 
                    style={{ 
                        marginTop: '10px',
                        background: 'linear-gradient(to right, #00c9a7, #6c63ff)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '10px 30px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Go Back to Rooms
                </button>
            </div>
        );
    }

    if (!room || !user) {
        return (
            <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#fff', fontSize: '20px' }}>Loading room...</div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            {selectedProfileId && (
                <ProfileModal 
                    isOwnProfile={selectedProfileId === currentUserId}
                    userId={selectedProfileId}
                    onClose={() => setSelectedProfileId(null)}
                />
            )}
            <div className={styles.mainPanel}>
                {/* --- Top Bar --- */}
                <div className={styles.topBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 className={styles.roomTitle}>{room?.topic || "Room"}</h1>
                        <RoomTimer startedAt={startedAt} />
                    </div>
                    <div className={styles.topBarActions}>
                        <button className={styles.inviteBtn} onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Room link copied!");
                        }}>
                            Invite
                        </button>
                        <button onClick={handleManualLeave} className={styles.leaveBtn}>
                            Leave
                        </button>
                    </div>
                </div>

                <div className={styles.mainContentScroll}>
                    {/* Speakers Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>🎙️ Speakers ({speakers.length})</h3>
                    <div className={styles.clientListSpeakers}>
                        {speakers.map((client, index) => renderClient(client, true, index))}
                    </div>
                </div>

                {/* Divider */}
                <div className={styles.separator}></div>

                {/* Listeners Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>🎧 Listeners ({listeners.length})</h3>
                    <div className={styles.clientListListeners}>
                        {listeners.length > 0 ? (
                            listeners.map((client, index) => renderClient(client, false, index))
                        ) : (
                            <p className={styles.emptySection}>No listeners yet</p>
                        )}
                    </div>
                </div>
                </div> {/* End mainContentScroll */}
                
                {/* Floating Dock -> To be built in next step, currently placeholder */}
                <div className={styles.dockContainer}>
                    {myRole === 'speaker' && (
                        <button 
                            className={`${styles.dockMicBtn} ${isMute ? styles.dockMicMuted : ''}`}
                            onClick={() => handleMuteClick(currentUserId)}
                        >
                            {isMute ? (
                                <img src="/images/mic-mute.png" alt="mic mute" />
                            ) : (
                                <img src="/images/mic.png" alt="mic on" />
                            )}
                        </button>
                    )}

                    <div className={styles.dockDivider}></div>

                    <div className={styles.dockEmojis}>
                        {EMOJIS.map((emoji, idx) => (
                            <button 
                                key={idx} 
                                className={styles.dockEmojiBtn} 
                                onClick={() => sendReaction(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <div className={styles.dockDivider}></div>

                    <button 
                        className={`${styles.dockHandBtn} ${hasHandRaised ? styles.dockHandActive : ''}`}
                        onClick={() => toggleHandRaise(!hasHandRaised)}
                    >
                        ✋
                        {raisedHands.length > 0 && (
                            <span className={styles.handCountBadge}>{raisedHands.length}</span>
                        )}
                    </button>
                </div>

            </div> {/* End mainPanel */}

            {/* --- Right Panel (Chat) --- */}
            <div className={styles.rightPanel}>
                <div className={styles.chatHeader}>
                    <h3>Chat</h3>
                    {/* Settings/filter icon placeholder */}
                    <span className={styles.chatFilterIcon}>⋮</span>
                </div>
                
                <div className={styles.chatBody}>
                    {messages.length === 0 ? (
                        <p className={styles.emptyChat}>No messages yet. Say hi!</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={styles.messageRow}>
                                <div className={styles.msgMeta}>
                                    <span className={styles.msgAuthor}>{msg.user.name}</span>
                                    <span className={styles.msgTime}>{msg.time}</span>
                                </div>
                                <p className={styles.msgText}>{msg.text}</p>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form className={styles.chatInputArea} onSubmit={handleChatSubmit}>
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        maxLength={300}
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!chatInput.trim()}>
                        ➤
                    </button>
                </form>
            </div>

            {/* Reactions Overlay */}
            <div className={styles.reactionOverlay}>
                {reactions.map((r) => {
                    const randomLeft = (r.id % 1) * 80 + 10;
                    return (
                        <div 
                            key={r.id} 
                            className={styles.flyingReaction} 
                            style={{ left: `${randomLeft}%` }}
                        >
                            <span className={styles.flyingEmoji}>{r.emoji}</span>
                            <span className={styles.reactionUserName}>{r.userName}</span>
                        </div>
                    );
                })}
            </div>

            <Toaster position="top-right" />
        </div>
    );
};

export default Room;