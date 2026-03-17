import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { followUser, unfollowUser, getFollowStatus } from '../../../http';
import styles from './FollowButton.module.css';
import toast from 'react-hot-toast';

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
    // user.id comes from DTO (mapped from _id), user._id comes from original JWT/DB
    const currentUserIdStr = currentUser?.id?.toString() || currentUser?._id?.toString();
    const targetUserIdStr = targetUserId?.toString();

    if (currentUserIdStr === targetUserIdStr) {
        return null; // Don't show button for self
    }

    const handleFollowToggle = async (e) => {
        e.stopPropagation(); // Prevent card click
        if (isLoading) return;

        const previousState = isFollowing;
        setIsFollowing(!isFollowing); // Optimistic UI update

        try {
            console.log(`[FollowButton] Action for target: ${targetUserIdStr} by ${currentUserIdStr}`);
            if (previousState) {
                const { data } = await unfollowUser(targetUserId);
                window.dispatchEvent(new CustomEvent('follow-change', { 
                    detail: { 
                        targetUserId: targetUserIdStr, 
                        action: 'unfollow',
                        followersCount: data.followersCount 
                    } 
                }));
            } else {
                const { data } = await followUser(targetUserId);
                window.dispatchEvent(new CustomEvent('follow-change', { 
                    detail: { 
                        targetUserId: targetUserIdStr, 
                        action: 'follow',
                        followersCount: data.followersCount 
                    } 
                }));
            }
        } catch (err) {
            console.error('Follow action failed:', err);
            const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
            toast.error(msg);
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
