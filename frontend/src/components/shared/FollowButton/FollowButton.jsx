import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { followUser, unfollowUser, getFollowStatus } from '../../../http';
import styles from './FollowButton.module.css';

const FollowButton = ({ targetUserId, small }) => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!targetUserId || !currentUser) return;

        // Fetch initial status
        const fetchStatus = async () => {
            try {
                const { data } = await getFollowStatus(targetUserId);
                setIsFollowing(data.isFollowing);
            } catch (err) {
                console.error('Failed to get follow status', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [targetUserId, currentUser]);

    // Self-follow check
    if (!currentUser || currentUser.id === targetUserId) {
        return null; // Don't show button for self
    }

    const handleFollowToggle = async (e) => {
        e.stopPropagation(); // Prevent card click
        if (isLoading) return;

        const previousState = isFollowing;
        setIsFollowing(!isFollowing); // Optimistic UI update

        try {
            if (previousState) {
                await unfollowUser(targetUserId);
                window.dispatchEvent(new CustomEvent('follow-change', { detail: { targetUserId, action: 'unfollow' } }));
            } else {
                await followUser(targetUserId);
                window.dispatchEvent(new CustomEvent('follow-change', { detail: { targetUserId, action: 'follow' } }));
            }
        } catch (err) {
            console.error('Follow action failed:', err);
            // Revert on failure
            setIsFollowing(previousState);
        }
    };

    if (isLoading) {
        return (
            <div className={`${styles.btnWrapper} ${styles.loading}`}>
                <span className={styles.spinner}></span>
            </div>
        );
    }

    return (
        <button 
            className={`${styles.followBtn} ${isFollowing ? styles.following : ''} ${small ? styles.small : ''}`}
            onClick={handleFollowToggle}
        >
            {isFollowing ? '✓ Following' : '+ Follow'}
        </button>
    );
};

export default FollowButton;
