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
import TextInput from '../../../../components/shared/TextInput/TextInput';
import styles from '../StepPhoneEmail.module.css';
import { sendOtp } from '../../../../http/index';
import { useDispatch } from 'react-redux';
import { setOtp } from '../../../../store/authSlice';

const Phone = ({ onNext }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const dispatch = useDispatch();

    async function submit() {
        if (!phoneNumber) return;
        const { data } = await sendOtp({ phone: phoneNumber });
        console.log(data);
        dispatch(setOtp({ phone: data.phone, hash: data.hash }));
        onNext();
    }

    return (
        <Card title="Enter your phone number" icon="phone">
            <p style={{ color: '#c4c5c5', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                Please add <strong>+91</strong> before entering your phone number.
            </p>
            <TextInput
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                fullwidth="true"
                placeholder="+91..."
            />
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