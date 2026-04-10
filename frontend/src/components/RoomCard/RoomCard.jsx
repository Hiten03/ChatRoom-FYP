import React, { useState } from 'react';
import styles from './RoomCard.module.css';
import { useNavigate } from 'react-router-dom';
import FollowButton from '../shared/FollowButton/FollowButton';
import { useSelector } from 'react-redux';
import { deleteRoom } from '../../http';
import PasswordModal from '../PasswordModal/PasswordModal';
import ConfirmDeleteModal from '../ConfirmDeleteModal/ConfirmDeleteModal';

const RoomCard = ({ room, onDelete }) => {
    const { user } = useSelector((state) => state.auth);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const navigate = useNavigate();

    const handleCardClick = () => {
        if (room.roomType === 'private' && room.hasPassword) {
            setShowPasswordModal(true);
        } else {
            window.location.href = `/room/${room.id}`;
        }
    };

    const isInside = room.speakers.some((speaker) => speaker.id === user?.id || speaker._id === user?._id);
    const host = room.speakers[0] || {};

    const currentCount = room.speakers.length + (room.totalPeople - room.speakers.length > 0 ? room.totalPeople - room.speakers.length : 0);
    const isFull = room.maxMembers !== null && currentCount >= room.maxMembers;

    return (
        <>
        <div onClick={handleCardClick} className={`${styles.card} ${isFull && !isInside ? styles.cardFull : ''}`}>
                <div className={styles.topRow}>
                    <h3 className={styles.topic}>{room.topic}</h3>
                    {room.roomType === 'private' && (
                        <span className={styles.lockBadge}>🔒</span>
                    )}
                    {room.roomType === 'social' && (
                        <div className={styles.socialBadge}>
                            <img src="/images/social.png" alt="social" className={styles.socialIcon} />
                            <span>SOCIAL</span>
                        </div>
                    )}
                </div>
                <div className={styles.middleSection}>
                    <div className={styles.hostInfo}>
                        <img
                            className={styles.hostAvatar}
                            src={host.avatar ? host.avatar : '/images/monkey-avatar.png'}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/monkey-avatar.png';
                            }}
                            alt="host-avatar"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className={styles.hostName}>{host.name || 'Unknown Host'}</span>
                            <FollowButton targetUserId={host.id || host._id} />
                        </div>
                        <img className={styles.chatIcon} src="/images/chat-bubble.png" alt="chat-bubble" />
                    </div>
                </div>

                <div className={styles.footerSection}>
                    <div className={styles.footerLeft}>
                        {isInside ? (
                            <div className={styles.liveBadge}>
                                <div className={styles.liveDot}></div>
                                <span>LIVE</span>
                            </div>
                        ) : isFull ? (
                            <div className={styles.fullBadge}>
                                <span>Full 🔒</span>
                            </div>
                        ) : (
                            <button className={styles.joinButton}>
                                Join
                            </button>
                        )}
                    </div>

                    <div className={styles.footerRight}>
                        {room.ownerId && (room.ownerId?._id || room.ownerId) === (user?.id || user?._id) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowConfirmDelete(true);
                                }}
                                className={styles.deleteBtn}
                            >
                                <img src="/images/trash.png" alt="trash-icon" />
                            </button>
                        )}
                        <div className={styles.countContainer}>
                            <div className={styles.count}>
                                <span>{room.speakers.length}</span>
                                <img src="/images/user-icon.png" alt="speaker-icon" />
                            </div>
                            <div className={`${styles.count} ${isFull ? styles.countFull : ''}`}>
                                <span>
                                    {currentCount}
                                    {room.maxMembers ? ` / ${room.maxMembers}` : ''}
                                </span>
                                <span className={styles.listenerIcon}>👥</span>
                            </div>
                            <img src="/images/add-user.png" alt="add-user" onError={(e) => e.target.style.display='none'} className={styles.addUserIcon}/>
                        </div>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <PasswordModal
                    room={room}
                    onSuccess={() => { window.location.href = `/room/${room.id}`; }}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}

            {showConfirmDelete && (
                <ConfirmDeleteModal
                    roomTopic={room.topic}
                    onConfirm={async () => {
                        try {
                            await deleteRoom(room.id);
                            onDelete(room.id);
                            setShowConfirmDelete(false);
                        } catch (err) {
                            console.log(err);
                            alert('Could not delete room');
                        }
                    }}
                    onClose={() => setShowConfirmDelete(false)}
                />
            )}
        </>
    )
}

export default RoomCard;