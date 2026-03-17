// import React, { useState, useCallback } from 'react';
// import { useDispatch } from 'react-redux';
// import Card from '../../../../components/shared/Card/Card';
// import Button from '../../../../components/shared/Button/Button';
// import TextInput from '../../../../components/shared/TextInput/TextInput';
// import styles from '../StepPhoneEmail.module.css';
// import { sendOtp } from '../../../../http/index';
// import { setOtp } from '../../../../store/authSlice';

// const Phone = ({ onNext }) => {
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const dispatch = useDispatch();

//   const isValidPhone = /^[6-9]\d{9}$/.test(phoneNumber); // Adjust pattern as per your region

//   const handleChange = useCallback((e) => {
//     setPhoneNumber(e.target.value);
//   }, []);

//   const handleSubmit = useCallback(async () => {
//     if (!isValidPhone) {
//       alert('Please enter a valid phone number');
//       return;
//     }

//     try {
//       const { data } = await sendOtp({ phone: phoneNumber });
//       dispatch(setOtp({ phone: data.phone, hash: data.hash }));
//       onNext();
//     } catch (error) {
//       console.error('Failed to send OTP:', error);
//       alert('Something went wrong. Please try again.');
//     }
//   }, [dispatch, onNext, phoneNumber, isValidPhone]);

//   return (
//     <Card title="Enter your phone number" icon="phone">
//       <TextInput
//         type="tel"
//         placeholder="Enter 10-digit number"
//         value={phoneNumber}
//         onChange={handleChange}
//       />
//       <div>
//         <div className={styles.actionButtonWrap}>
//           <Button text="Next" onClick={handleSubmit} disabled={!isValidPhone} />
//         </div>
//         <p className={styles.bottomParagraph}>
//           By entering your number, you’re agreeing to our Terms of
//           Service and Privacy Policy. Thanks!
//         </p>
//       </div>
//     </Card>
//   );
// };

// export default Phone;




import React, { useState } from 'react';
import Card from '../../../../components/shared/Card/Card';
import Button from '../../../../components/shared/Button/Button';
import styles from '../StepPhoneEmail.module.css';
import { sendOtp } from '../../../../http/index';
import { useDispatch } from 'react-redux';
import { setOtp } from '../../../../store/authSlice';

const Phone = ({ onNext }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const dispatch = useDispatch();

    const handleChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Numeric only
        if (val.length <= 10) {
            setPhoneNumber(val);
        }
    };

    async function submit() {
        if (phoneNumber.length !== 10) return;
        const fullPhoneNumber = `+91${phoneNumber}`;
        const { data } = await sendOtp({ phone: fullPhoneNumber });
        console.log(data);
        dispatch(setOtp({ phone: data.phone, hash: data.hash }));
        onNext();
    }

    return (
        <Card title="Enter your phone number" icon="phone">
            <p className={styles.inputLabel}>
                Enter your 10-digit mobile number
            </p>
            <div className={styles.inputWrapper}>
                <span className={styles.prefix}>+91</span>
                <div className={styles.divider}></div>
                <input
                    className={styles.phoneInput}
                    value={phoneNumber}
                    onChange={handleChange}
                    type="tel"
                    placeholder="00000 00000"
                    maxLength={10}
                    inputMode="numeric"
                />
            </div>
            <div>
                <div className={styles.actionButtonWrap}>
                    <Button text="Next" onClick={submit} />
                </div>
                <p className={styles.bottomParagraph}>
                    By entering your number, you’re agreeing to our Terms of
                    Service and Privacy Policy.
                </p>
            </div>
        </Card>
    );
};

export default Phone;