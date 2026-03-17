import React, { useState, useEffect } from 'react';
import styles from './RoomTimer.module.css';

const RoomTimer = ({ startedAt }) => {
    const [time, setTime] = useState('0:00');

    useEffect(() => {
        if (!startedAt) return;

        const interval = setInterval(() => {
            const start = new Date(startedAt).getTime();
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);

            if (diff < 0) {
                setTime('0:00');
                return;
            }

            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;

            const hDisplay = h > 0 ? `${h}:` : '';
            const mDisplay = h > 0 ? (m < 10 ? `0${m}` : m) : m;
            const sDisplay = s < 10 ? `0${s}` : s;

            setTime(`${hDisplay}${mDisplay}:${sDisplay}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <div className={styles.timerPill}>
            <span className={styles.liveDot}></span>
            <span className={styles.timeText}>{time}</span>
        </div>
    );
};

export default RoomTimer;
