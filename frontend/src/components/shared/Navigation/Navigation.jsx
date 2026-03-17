import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { logout } from '../../../http';
import styles from './Navigation.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from '../../../store/authSlice';
import ProfileModal from '../../ProfileModal/ProfileModal';
import LogoutModal from '../LogoutModal/LogoutModal';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';
import { socketInit } from '../../../socket';
import { ACTIONS } from '../../../actions';

const Navigation = () => {
    const brandStyle = {
        color: 'var(--text-primary)',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '22px',
        display: 'flex',
        alignItems: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
        transition: 'color 0.3s ease',
    };

    const logoIconStyle = {
        width: '36px',
        height: '36px',
        backgroundColor: '#6366f1', // purple circle
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
    };

    const logoText = {
        marginLeft: '10px',
        letterSpacing: '0.5px',
    };
    
    const dispatch = useDispatch();
    const { isAuth, user } = useSelector((state) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('search') || '';
    const { theme, toggleTheme } = useTheme();

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Mobile Search State
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Listen to real-time events
    React.useEffect(() => {
        if (!isAuth || !user) return;
        const socket = socketInit();

        // Register for global notifications
        socket.emit(ACTIONS.REGISTER_GLOBAL, { userId: user.id });

        const handleRoomStarted = (payload) => {
            const { room, host } = payload;
            
            // Fire Toast
            toast(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span><b>{host.name}</b> just started a room: <i>{room.topic}</i></span>
                        <button 
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate(`/room/${room.id}`);
                            }}
                            style={{ background: '#a855f7', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Join Room
                        </button>
                    </div>
                ),
                { duration: 8000, style: { background: '#1e2235', color: '#fff', border: '1px solid #a855f7' } }
            );

            // Add to dropdown list
            setNotifications(prev => [{
                id: Date.now(),
                text: `${host.name} went live: ${room.topic}`,
                roomId: room.id,
                read: false,
                time: new Date()
            }, ...prev]);
        };

        const handleFollowed = (payload) => {
            const { follower } = payload;
            
            // Fire Toast
            toast.success(
                `${follower.name} started following you!`,
                { duration: 5000, style: { background: '#1e2235', color: '#fff', border: '1px solid #10b981' } }
            );

            // Add to dropdown list
            setNotifications(prev => [{
                id: Date.now(),
                text: `${follower.name} started following you`,
                roomId: null,
                read: false,
                time: new Date()
            }, ...prev]);

            // Dispatch global event for ProfileModal to aggressively update counts if open
            window.dispatchEvent(new CustomEvent('user-followed-me'));
        };

        socket.on(ACTIONS.ROOM_CREATED, handleRoomStarted); // Re-map to ROOM_CREATED or keep room-started if mapped, but standard is ACTIONS.ROOM_CREATED in backend if we updated rooms-controller. wait, it's 'room-started' in rooms-controller.js
        socket.on('room-started', handleRoomStarted);
        socket.on(ACTIONS.FOLLOWED, handleFollowed);

        return () => {
            socket.off('room-started', handleRoomStarted);
            socket.off(ACTIONS.FOLLOWED, handleFollowed);
        };
    }, [isAuth, user, navigate]);

    const toggleNotifications = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMenuOpen) {
            // Mark all as read when opening
            setNotifications(prev => prev.map(n => ({...n, read: true})));
        }
    };

    // Profile Modal state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        if (value) {
            navigate(`/rooms?search=${encodeURIComponent(value)}`);
        } else {
            navigate(`/rooms`);
        }
    };

    async function logoutUser() {
        try {
            const { data } = await logout();
            dispatch(setAuth(data));
            setShowLogoutModal(false);
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            
            {showProfileModal && (
                <ProfileModal 
                    isOwnProfile={true}
                    userId={user.id}
                    onClose={() => setShowProfileModal(false)}
                />
            )}

            {showLogoutModal && (
                <LogoutModal 
                    onConfirm={logoutUser}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <nav className={`${styles.navbar} container`}>
                <Link style={brandStyle} to="/">
                    <div style={logoIconStyle}>
                        <img src="/images/logo.png" alt="logo" style={{ mixBlendMode: 'screen', width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={logoText}>ChatRoom</span>
                </Link>

                {isAuth && location.pathname === '/rooms' && (
                    <div className={`${styles.searchContainer} ${isSearchExpanded ? styles.expanded : ''}`}>
                        <img 
                            src="/images/search-icon.png" 
                            alt="search" 
                            className={styles.searchIcon} 
                            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                        />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={query}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
                    </div>
                )}
                
                {isAuth ? (
                    <div className={styles.navRight}>
                        {/* Universal Theme Toggle in Right Section */}
                        <button 
                            onClick={toggleTheme} 
                            className={`${styles.themeToggle} ${theme === 'light' ? styles.themeToggleLight : ''}`}
                            title="Toggle Theme"
                        >
                            <span className={styles.themeToggleThumb}>
                                {theme === 'light' ? '☀️' : '🌙'}
                            </span>
                        </button>

                        <h3 className={styles.userName}>{user?.name}</h3>
                        
                        <div className={styles.bellContainer}>
                            <button className={styles.bellBtn} onClick={toggleNotifications}>
                                🔔
                                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                            </button>
                            
                            {isMenuOpen && (
                                <div className={styles.dropdownMenu}>
                                    <div className={styles.dropdownHeader}>Notifications</div>
                                    <div className={styles.dropdownList}>
                                        {notifications.length === 0 ? (
                                            <div className={styles.emptyNotif}>No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    className={styles.dropdownItem}
                                                    onClick={() => navigate(`/room/${n.roomId}`)}
                                                >
                                                    <span className={styles.notifDot}></span>
                                                    <span>{n.text}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.avatarContainer} onClick={() => setShowProfileModal(true)} style={{cursor: 'pointer'}}>
                            <img
                                className={styles.avatar}
                                src={user.avatar ? user.avatar : '/images/monkey-avatar.png'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/monkey-avatar.png';
                                }}
                                width="40"
                                height="40"
                                alt="avatar"
                            />
                        </div>

                        <button
                            className={styles.logoutButton}
                            onClick={() => setShowLogoutModal(true)}
                            title="Logout"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                ) : (
                    /* Guest Mode: Only Theme Toggle */
                    <div className={styles.navRight}>
                        <button 
                            onClick={toggleTheme} 
                            className={`${styles.themeToggle} ${theme === 'light' ? styles.themeToggleLight : ''}`}
                            title="Toggle Theme"
                        >
                            <span className={styles.themeToggleThumb}>
                                {theme === 'light' ? '☀️' : '🌙'}
                            </span>
                        </button>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navigation;