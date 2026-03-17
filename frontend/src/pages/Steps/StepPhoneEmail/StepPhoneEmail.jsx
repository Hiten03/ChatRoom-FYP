import React from 'react';
import Phone from './Phone/Phone';
import styles from './StepPhoneEmail.module.css';

const StepPhoneEmail = ({ onNext }) => {
    return (
        <div className={styles.cardWrapper}>
            <div>
                <Phone onNext={onNext} />
            </div>
        </div>
    );
};

export default StepPhoneEmail;