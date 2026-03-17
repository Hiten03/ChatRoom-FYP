import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateThemePreference } from '../http';
import { setAuth } from '../store/authSlice';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initial State: Read from localStorage or fallback to 'dark'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('chatroom-theme');
        return savedTheme || 'dark';
    });

    const { user, isAuth } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    // 2. Sync with user preference on login/auth change
    useEffect(() => {
        if (isAuth && user && user.themePreference) {
            if (user.themePreference !== theme) {
                setTheme(user.themePreference);
                localStorage.setItem('chatroom-theme', user.themePreference);
            }
        }
        // Exclude theme from dependency array so it only syncs on user changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuth, user?.id, user?.themePreference]);

    // 3. Apply theme to HTML tag
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // 4. Debounced API call for saving preference
    const debounceTimer = useRef(null);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('chatroom-theme', newTheme);
        
        if (isAuth && user) {
            // Update Redux state optimistically
            dispatch(setAuth({ user: { ...user, themePreference: newTheme } }));
            
            // Debounced API call
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(async () => {
                try {
                    await updateThemePreference({ theme: newTheme });
                } catch (err) {
                    console.error('Failed to save theme preference', err);
                }
            }, 500);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
