import React, { useState, useEffect, useRef } from 'react';
import Card from '../../../components/shared/Card/Card';
import Button from '../../../components/shared/Button/Button';
import styles from './StepOtp.module.css';
import { verifyOtp, sendOtp } from '../../../http';
import { useSelector, useDispatch } from 'react-redux';
import { setAuth, setOtp as setOtpAction } from '../../../store/authSlice';
import ErrorModal from '../../../components/shared/ErrorModal/ErrorModal';
import toast from 'react-hot-toast';

const StepOtp = () => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const dispatch = useDispatch();
    const { phone, hash } = useSelector((state) => state.auth.otp);

    const [timer, setTimer] = useState(0);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Refs for 4 inputs
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    async function submit(otpArray) {
        const finalOtp = otpArray ? otpArray.join('') : otp.join('');
        if (finalOtp.length < 4) return;
        
        try {
            const { data } = await verifyOtp({ otp: finalOtp, phone, hash });
            dispatch(setAuth(data));
        } catch (err) {
            setIsError(true);
            setErrorMessage(err.response?.data?.message || 'Invalid OTP. Please try again.');
            
            // Clear and refocus first box on error
            setOtp(['', '', '', '']);
            setTimeout(() => {
                inputRefs[0].current?.focus();
            }, 100);
        }
    }

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        setIsError(false);

        const newOtp = [...otp];
        // Only take the last character entered
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Move to next box if filled
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-submit if all filled
        if (newOtp.every(val => val !== '') && newOtp.join('').length === 4) {
            submit(newOtp);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 4);
        if (!/^\d+$/.test(data)) return;

        const newOtp = data.split('');
        const filledOtp = [...otp];
        newOtp.forEach((char, i) => {
            if (i < 4) filledOtp[i] = char;
        });
        setOtp(filledOtp);

        // Focus appropriate box
        const nextIndex = data.length < 4 ? data.length : 3;
        inputRefs[nextIndex].current?.focus();

        if (data.length === 4) {
            submit(filledOtp);
        }
    };

    async function resend() {
        if (timer > 0) return;
        try {
            const { data } = await sendOtp({ phone });
            dispatch(setOtpAction({ phone: data.phone, hash: data.hash }));
            setTimer(60);
            toast.success('A new OTP has been sent!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to resend OTP. Please try again.');
        }
    }

    return (
        <div className={styles.cardWrapper}>
            <Card
                title="Enter the code we just texted you"
                icon="lock-emoji"
            >
                <div className={`${styles.otpGrid} ${isError ? styles.shake : ''}`}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`${styles.otpInput} ${digit ? styles.filled : ''} ${isError ? styles.errorBox : ''}`}
                            maxLength={1}
                        />
                    ))}
                </div>
                <div className={styles.actionButtonWrap}>
                    <Button onClick={submit} text="Next" />
                </div>
                <div className={styles.resendWrapper}>
                    <p className={styles.resendText}>
                        Didn't receive?{' '}
                        <span 
                            className={`${styles.resendLink} ${timer > 0 ? styles.disabled : ''}`}
                            onClick={resend}
                        >
                            {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                        </span>
                    </p>
                </div>
                <p className={styles.bottomParagraph}>
                    By entering your code, you’re agreeing to our Terms of
                    Service and Privacy Policy.
                </p>
            </Card>
            {isError && (
                <ErrorModal 
                    message={errorMessage}
                    onRetry={() => {
                        setIsError(false);
                        setOtp(['', '', '', '']);
                        setTimeout(() => inputRefs[0].current?.focus(), 100);
                    }}
                    onResend={() => {
                        setIsError(false);
                        resend();
                    }}
                    onClose={() => setIsError(false)}
                />
            )}
        </div>
    );
};

export default StepOtp;