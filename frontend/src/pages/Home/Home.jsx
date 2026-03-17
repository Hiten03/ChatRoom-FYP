import React from 'react';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    function startRegister() {
        navigate('/authenticate');
    }

    return (
        <div className={styles.heroWrapper}>
            {/* Animated floating orbs */}
            <div className={`${styles.orb} ${styles.orb1}`}></div>
            <div className={`${styles.orb} ${styles.orb2}`}></div>
            <div className={`${styles.orb} ${styles.orb3}`}></div>
            <div className={`${styles.orb} ${styles.orb4}`}></div>

            {/* Star field */}
            <div className={styles.stars}></div>

            {/* Hero content */}
            <div className={styles.heroContent}>
                {/* Badge */}
                <div className={styles.badge}>
                    <span className={styles.badgeDot}></span>
                    <span>Now Live — Join the Community</span>
                </div>

                {/* Logo */}
                <div className={styles.logoWrapper}>
                    <svg
                        className={styles.logo}
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                        {/* Chat Bubble Base */}
                        <path
                            d="M50,10 C27.9086,10 10,27.9086 10,50 C10,58.3751 12.5786,66.149 16.9416,72.5855 C16.5029,77.7262 14.1557,83.9996 11.2325,87.6534 C10.6033,88.4402 11.02,89.6272 12.0163,89.7709 C16.9922,90.4891 23.4005,89.5448 28.5143,86.8115 C34.8097,90.1136 42.1537,92 50,92 C72.0914,92 90,74.0914 90,50 C90,27.9086 72.0914,10 50,10 Z"
                            fill="url(#logoGradient)"
                        />
                        {/* Audio Waveform Inner */}
                        <rect x="36" y="44" width="6" height="12" rx="3" fill="#ffffff" />
                        <rect x="47" y="32" width="6" height="36" rx="3" fill="#ffffff" />
                        <rect x="58" y="40" width="6" height="20" rx="3" fill="#ffffff" />
                    </svg>
                </div>

                {/* Headline */}
                <h1 className={styles.headline}>
                    Welcome to{' '}
                    <span className={styles.gradientText}>ChatRoom</span>
                </h1>

                {/* Subtext */}
                <p className={styles.subtext}>
                    Real-time voice rooms, seamless collaboration, and a community<br />
                    built to connect — wherever you are.
                </p>

                {/* CTA Button */}
                <button className={styles.ctaButton} onClick={startRegister}>
                    <span className={styles.ctaText}>Let's Go</span>
                    <span className={styles.ctaArrow}>→</span>
                    <span className={styles.ctaGlow}></span>
                </button>

                {/* Bottom hint */}
                <p className={styles.hint}>
                    Already have an account?{' '}
                    <span className={styles.hintLink} onClick={startRegister}>
                        Sign in here
                    </span>
                </p>
            </div>

            {/* Floating grid overlay */}
            <div className={styles.gridOverlay}></div>
        </div>
    );
};

export default Home;