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
        accessError,
        memberCount,
        maxMembers,
        roomFullError,
        updateRoomLimit
    } = useWebRTC(roomId, user);
    
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [isMute, setMute] = useState(true);

    // Toggle States
    const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null); // ID of client whose menu is open
    const emojiPanelRef = useRef(null);
    const menuRef = useRef(null);

    // Chat UI state
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);
    const previousMessagesLength = useRef(0);
    
    // Profile Modal state
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const hasInitializedMute = useRef(false);

    // Responsive State
    const [isChatOpen, setIsChatOpen] = useState(false);

    const currentUserId = user?.id || user?._id;
    const isOwner = currentUserId === ownerId;
    const myRole = roles[currentUserId] || 'listener';
    const hasHandRaised = raisedHands.includes(currentUserId);

    const EMOJIS = ['👏', '❤️', '😂', '😮', '🔥', '👍'];

    // Outside Click Handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target)) {
                if (!event.target.closest(`.${styles.reactionsToggle}`)) {
                    setIsEmojiPanelOpen(false);
                }
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                if (!event.target.closest(`.${styles.threeDotMenu}`)) {
                    setOpenMenuId(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        if (raisedHands.length > previousHandsLength.current) {
            const newlyRaisedId = raisedHands[raisedHands.length - 1]; 
            if ((myRole === 'speaker' || isOwner) && newlyRaisedId !== currentUserId) {
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

    // Member Limit Logic
    const [showFullModal, setShowFullModal] = useState(false);
    useEffect(() => {
        if (roomFullError) {
            setShowFullModal(true);
        }
    }, [roomFullError]);

    const handleRoomFullClose = () => {
        setShowFullModal(false);
        navigate('/rooms');
    };

    const handleLimitUpdate = (newLimit) => {
        updateRoomLimit(newLimit);
    };

    const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
    const [tempLimit, setTempLimit] = useState('');

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
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
        if (myRole === 'listener') return;
        setMute((isMute) => !isMute);
    }

    const handlePromote = (targetId) => {
        setRole(targetId, 'speaker');
    };

    const handleDemote = (targetId) => {
        setRole(targetId, 'listener');
    };

    const handleReactionClick = (emoji) => {
        sendReaction(emoji);
        setTimeout(() => setIsEmojiPanelOpen(false), 300);
    };

    // Split clients into speakers and listeners
    const speakers = clients.filter(c => roles[c.id] === 'speaker');
    const listeners = clients.filter(c => roles[c.id] !== 'speaker');

    const renderClient = (client, isSpeakerSection, index) => {
        const isClientOwner = client.id === ownerId;
        const isSelf = client.id === currentUserId;

        if (isSpeakerSection) {
            const hasGlow = isClientOwner;
            const isMenuOpen = openMenuId === client.id;

            return (
                <div className={`${styles.speakerCard} ${hasGlow ? styles.speakerCardGlowing : ''}`} key={client.id}>
                    <div className={styles.speakerCardTop}>
                        {isClientOwner ? (
                            <div className={styles.moderatorPill}>Moderator</div>
                        ) : (
                            <div></div>
                        )}
                        
                        {(isSelf || (isOwner && !isClientOwner)) && (
                            <div className={styles.menuWrapper}>
                                <button 
                                    className={`${styles.threeDotMenu} ${isMenuOpen ? styles.menuActive : ''}`}
                                    onClick={() => setOpenMenuId(isMenuOpen ? null : client.id)}
                                >
                                    ⋮
                                </button>
                                {isMenuOpen && (
                                    <div className={styles.dropdownMenu} ref={menuRef}>
                                        {isModerator && isSelf && (
                                            <button 
                                                className={styles.menuItem}
                                                onClick={() => {
                                                    setIsUpdatingLimit(true);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                <span>⚙️</span> Set Limit
                                            </button>
                                        )}
                                        {isOwner && !isClientOwner && (
                                            <button 
                                                className={styles.menuItem}
                                                onClick={() => {
                                                    handleDemote(client.id);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                <span>⬇️</span> Demote
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
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
                </div>
            );
        }

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
                    className={styles.leaveBtn}
                    style={{ background: 'linear-gradient(to right, #00c9a7, #6c63ff)' }}
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
                <div className={styles.topBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 className={styles.roomTitle}>{room?.topic || "Room"}</h1>
                        <RoomTimer startedAt={startedAt} />
                    </div>
                    <div className={styles.topBarActions}>
                        <div className={`${styles.memberCount} ${maxMembers && memberCount >= maxMembers ? styles.countFull : maxMembers && memberCount === maxMembers - 1 ? styles.countWarning : ''}`}>
                            <span className={styles.countText}>
                                {memberCount}
                                {maxMembers ? ` / ${maxMembers}` : ''}
                            </span>
                            <span className={styles.countIcon}>👥</span>
                        </div>
                        <button className={styles.inviteBtn} onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Room link copied!");
                        }}>
                            <span className={styles.btnIcon}>👥</span>
                            <span>Invite</span>
                        </button>
                        <button onClick={handleManualLeave} className={styles.leaveBtn}>
                            <span className={styles.btnIcon}>🚪</span>
                            <span>Leave</span>
                        </button>
                        
                        <button className={styles.mobileChatBtn} onClick={toggleChat}>
                            💬
                        </button>
                    </div>
                </div>

                <div className={styles.mainContentScroll}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🎙️ Speakers ({speakers.length})</h3>
                        <div className={styles.clientListSpeakers}>
                            {speakers.map((client, index) => renderClient(client, true, index))}
                        </div>
                    </div>

                    <div className={styles.separator}></div>

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
                </div> 

                <div className={styles.dockContainer}>
                    {/* Floating Emoji Panel */}
                    {isEmojiPanelOpen && (
                        <div className={styles.emojiPanel} ref={emojiPanelRef}>
                            {EMOJIS.map((emoji, idx) => (
                                <button 
                                    key={idx} 
                                    className={styles.dockEmojiBtn} 
                                    onClick={() => handleReactionClick(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Reactions Toggle */}
                    <button 
                        className={`${styles.reactionsToggle} ${isEmojiPanelOpen ? styles.reactionsToggleActive : ''}`}
                        onClick={() => setIsEmojiPanelOpen(!isEmojiPanelOpen)}
                    >
                        <span className={styles.toggleIcon}>😊</span>
                        <span className={styles.toggleLabel}>React</span>
                    </button>

                    {/* Primary Mic Button */}
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

                    {/* Hand Raise Button */}
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
            </div>

            <div className={`${styles.rightPanel} ${isChatOpen ? styles.rightPanelOpen : ''}`}>
                <div className={styles.chatHeader}>
                    <h3>Chat</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className={styles.closeChatBtn} onClick={toggleChat}>
                            ✕
                        </button>
                        <span className={styles.chatFilterIcon}>⋮</span>
                    </div>
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

            {showFullModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.fullModal}>
                        <div className={styles.modalHeader}>
                            <span style={{fontSize: '40px'}}>🔒</span>
                            <h2>Room is Full</h2>
                        </div>
                        <p>{roomFullError?.message || 'This room has reached its maximum capacity.'}</p>
                        <button onClick={handleRoomFullClose} className={styles.leaveBtn} style={{width: '100%', justifyContent: 'center'}}>
                            Back to Rooms
                        </button>
                    </div>
                </div>
            )}

            {isUpdatingLimit && (
                <div className={styles.modalOverlay}>
                    <div className={styles.limitModal}>
                        <h2>Update Member Limit</h2>
                        <div className={styles.limitOptions}>
                            {['none', '5', '10', '25', '50', 'custom'].map(type => (
                                <button 
                                    key={type}
                                    className={`${styles.limitPill} ${tempLimit === type ? styles.activePill : ''}`}
                                    onClick={() => setTempLimit(type)}
                                >
                                    {type === 'none' ? 'Unlimited' : type}
                                </button>
                            ))}
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsUpdatingLimit(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={() => {
                                let finalLimit = null;
                                if (tempLimit === 'custom') {
                                    finalLimit = prompt('Enter custom limit (2-100):');
                                    if (!finalLimit) return;
                                    finalLimit = parseInt(finalLimit);
                                } else if (tempLimit !== 'none') {
                                    finalLimit = parseInt(tempLimit);
                                }
                                handleLimitUpdate(finalLimit);
                                setIsUpdatingLimit(false);
                            }} className={styles.saveBtn}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Room;