import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProfileModal.module.css';
import { getProfile, updateProfile, getFollowers, getFollowing, updateAvatar } from '../../http';
import FollowButton from '../shared/FollowButton/FollowButton';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/authSlice';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';

const ProfileModal = ({ isOwnProfile, userId, onClose }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        bio: '',
        socials: { twitter: '', instagram: '', linkedin: '' },
    });
    const [isSaving, setIsSaving] = useState(false);

    // Avatar Crop State
    const [image, setImage] = useState('');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Sub-view State ('main', 'followers', 'following')
    const [view, setView] = useState('main');
    const [listData, setListData] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await getProfile(userId);
                setProfile(data.user);
                setEditForm({
                    name: data.user.name || '',
                    phone: data.user.phone || '',
                    bio: data.user.bio || '',
                    socials: data.user.socials || { twitter: '', instagram: '', linkedin: '' }
                });
            } catch (err) {
                console.error('Failed to fetch profile', err);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    // Listen for optimistic UI follow changes
    useEffect(() => {
        const handleFollowChange = (e) => {
            const { targetUserId, action } = e.detail;
            setProfile(prev => {
                if (!prev) return prev;
                let newProfile = { ...prev };
                
                // If viewing our own profile, our "Following" count changes
                if (isOwnProfile) {
                    newProfile.followingCount = action === 'follow' 
                        ? (newProfile.followingCount || 0) + 1 
                        : Math.max(0, (newProfile.followingCount || 0) - 1);
                } 
                // If viewing the target user's profile, their "Followers" count changes
                else if (prev.id === targetUserId || prev._id === targetUserId) {
                    newProfile.followersCount = action === 'follow'
                        ? (newProfile.followersCount || 0) + 1
                        : Math.max(0, (newProfile.followersCount || 0) - 1);
                }
                
                return newProfile;
            });
        };

        const handleFollowedMe = () => {
            // Someone just followed us. If we are viewing our own profile, update followers count.
            if (isOwnProfile) {
                setProfile(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        followersCount: (prev.followersCount || 0) + 1
                    };
                });
            }
        };

        window.addEventListener('follow-change', handleFollowChange);
        window.addEventListener('user-followed-me', handleFollowedMe);

        return () => {
            window.removeEventListener('follow-change', handleFollowChange);
            window.removeEventListener('user-followed-me', handleFollowedMe);
        };
    }, [isOwnProfile]);
    // ---- Avatar Crop Functions ----
    function captureImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            setImage(reader.result);
        };
    }

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleAvatarSave = async () => {
        if (!image) return;
        try {
            const canvas = document.createElement('canvas');
            const imageObj = new Image();
            imageObj.src = image;

            await new Promise((resolve) => {
                imageObj.onload = resolve;
            });

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                imageObj,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            const base64Image = canvas.toDataURL('image/jpeg');

            const { data } = await updateAvatar({ avatar: base64Image });
            dispatch(setAuth(data));
            setProfile(data.user);
            setImage('');
            toast.success('Avatar updated successfully!');
            
        } catch (err) {
            console.error(err);
            toast.error('Failed to update avatar');
        }
    };
    // --------------------------------

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data } = await updateProfile(editForm);
            setProfile(data.user);
            dispatch(setAuth({ user: data.user, auth: true })); // Update global context immediately
            setIsEditing(false);
            toast.success('Profile updated');
        } catch (err) {
            console.error('Failed to update profile', err);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleListClick = async (type) => {
        setView(type);
        setListLoading(true);
        try {
            if (type === 'followers') {
                const { data } = await getFollowers(userId);
                setListData(data.followers);
            } else if (type === 'following') {
                const { data } = await getFollowing(userId);
                setListData(data.following);
            }
        } catch (err) {
            console.error(`Failed to fetch ${type}`, err);
            toast.error(`Failed to load ${type}`);
        } finally {
            setListLoading(false);
        }
    };

    // Navigation removed as requested by user

    if (loading) {
        return createPortal(
            <div className={styles.modalMask} onClick={onClose}>
                <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (!profile) return null;

    // ----- LIST VIEW (Followers/Following) -----
    if (view !== 'main') {
        return createPortal(
            <div className={styles.modalMask} onClick={onClose}>
                <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                    <div className={styles.listHeader}>
                        <button className={styles.backBtn} onClick={() => setView('main')}>←</button>
                        <h3 className={styles.listTitle}>{view === 'followers' ? 'Followers' : 'Following'}</h3>
                    </div>
                    
                    {listLoading ? (
                        <div className={styles.loadingContainer} style={{height: '200px'}}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : (
                        <div className={styles.userList}>
                            {listData.length === 0 ? (
                                <p className={styles.emptyState}>No {view} yet.</p>
                            ) : (
                                listData.map(u => (
                                    <div key={u.id || u._id} className={styles.userListItem}>
                                        <div className={styles.userInfo}>
                                            <img 
                                                src={u.avatar || '/images/monkey-avatar.png'} 
                                                alt="avatar" 
                                                className={styles.listAvatar} 
                                                onError={(e) => { e.target.src = '/images/monkey-avatar.png'; }}
                                            />
                                            <span className={styles.listName}>{u.name || 'Unknown User'}</span>
                                        </div>
                                        {!isOwnProfile || (isOwnProfile && u.id !== profile.id) ? (
                                             <FollowButton targetUserId={u.id || u._id} small={true} />
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    // ----- MAIN VIEW -----
    // If we are currently cropping an image, render the Cropper instead of the main profile view
    if (image) {
        return createPortal(
            <div className={styles.modalMask}>
                <div className={styles.modalBody} style={{ padding: 0, height: '500px', display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.cropperHeader}>
                        <button onClick={() => setImage('')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '16px' }}>← Cancel</button>
                        <button onClick={handleAvatarSave} style={{ background: '#6366f1', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', marginRight: '16px', fontWeight: 'bold' }}>Save</button>
                    </div>
                    <div style={{ position: 'relative', flex: 1, background: '#333' }}>
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className={styles.modalMask} onClick={onClose}>
            <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <img src="/images/close.png" alt="close" />
                </button>

                <div className={styles.headerSection}>
                    <div className={styles.avatarContainer}>
                        <img 
                            src={profile.avatar || '/images/monkey-avatar.png'} 
                            alt="avatar" 
                            className={styles.avatar} 
                            onError={(e) => { e.target.src = '/images/monkey-avatar.png'; }}
                        />
                        {isEditing && (
                            <label className={styles.avatarOverlay}>
                                <span className={styles.cameraIcon}>📷</span>
                                <input
                                    type="file"
                                    className={styles.hiddenInput}
                                    accept="image/*"
                                    onChange={captureImage}
                                />
                            </label>
                        )}
                    </div>

                    {!isEditing ? (
                        <>
                            <h2 className={styles.displayName}>{profile.name || 'Unknown User'}</h2>
                            {isOwnProfile && <p className={styles.phoneInfo}>{profile.phone}</p>}
                            <p className={styles.bioText}>{profile.bio || (isOwnProfile ? 'No bio added yet. Add one!' : '')}</p>
                        </>
                    ) : (
                        <div className={styles.editFields}>
                            <div className={styles.inputGroup}>
                                <label>Display Name</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    className={styles.textInput} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Bio</label>
                                <textarea 
                                    className={`${styles.textInput} ${styles.textArea}`} 
                                    value={editForm.bio}
                                    maxLength={160}
                                    onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                                />
                                <span className={styles.charCount}>{editForm.bio.length}/160</span>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Twitter URL</label>
                                <input 
                                    type="text" 
                                    className={styles.textInput} 
                                    value={editForm.socials.twitter}
                                    onChange={e => setEditForm({...editForm, socials: {...editForm.socials, twitter: e.target.value}})} 
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Instagram URL</label>
                                <input 
                                    type="text" 
                                    className={styles.textInput} 
                                    value={editForm.socials.instagram}
                                    onChange={e => setEditForm({...editForm, socials: {...editForm.socials, instagram: e.target.value}})} 
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>LinkedIn URL</label>
                                <input 
                                    type="text" 
                                    className={styles.textInput} 
                                    value={editForm.socials.linkedin}
                                    onChange={e => setEditForm({...editForm, socials: {...editForm.socials, linkedin: e.target.value}})} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {!isEditing && !isOwnProfile && (
                    <div className={styles.followContainer}>
                        <FollowButton targetUserId={userId} />
                    </div>
                )}

                {!isEditing && (
                    <>
                        <div className={styles.statsRow}>
                            <div className={styles.statChip}>
                                <span className={styles.statValue}>{profile.roomsHosted || 0}</span>
                                <span className={styles.statLabel}>Rooms</span>
                            </div>
                            <div className={styles.statChip}>
                                <span className={styles.statValue}>{new Date(profile.createdAt).toLocaleDateString()}</span>
                                <span className={styles.statLabel}>Joined</span>
                            </div>
                            <div className={`${styles.statChip} ${styles.clickableStat}`} onClick={() => handleListClick('followers')}>
                                <span className={styles.statValue}>{profile.followersCount || 0}</span>
                                <span className={styles.statLabel}>Followers</span>
                            </div>
                            <div className={`${styles.statChip} ${styles.clickableStat}`} onClick={() => handleListClick('following')}>
                                <span className={styles.statValue}>{profile.followingCount || 0}</span>
                                <span className={styles.statLabel}>Following</span>
                            </div>
                        </div>

                        {(profile.socials?.twitter || profile.socials?.instagram || profile.socials?.linkedin) && (
                            <div className={styles.socialRow}>
                                {profile.socials?.twitter && <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className={styles.socialIcon}>𝕏</a>}
                                {profile.socials?.instagram && <a href={profile.socials.instagram} target="_blank" rel="noreferrer" className={styles.socialIcon}>📷</a>}
                                {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className={styles.socialIcon}>in</a>}
                            </div>
                        )}

                        {isOwnProfile && (
                            <button className={styles.primaryBtn} style={{width: '100%'}} onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                        )}
                        
                        {/* Full Profile Link Removed */}
                    </>
                )}

                {isEditing && (
                    <div className={styles.footerActions}>
                        <button className={styles.secondaryBtn} onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</button>
                        <button className={styles.primaryBtn} onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                )}

            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
