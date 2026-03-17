import React, { forwardRef } from 'react';
import styles from './TextInput.module.css';

const TextInput = forwardRef((props, ref) => {
    return (
        <div style={{width: props.fullwidth === 'true' ? '100%': 'inherit'}}>
            <input 
                ref={ref}
                className={styles.input} 
                style={{width: '100%'}} 
                type="text" 
                {...props} 
            />
        </div>
    );
});

export default TextInput;