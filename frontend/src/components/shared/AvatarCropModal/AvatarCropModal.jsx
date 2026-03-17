import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import styles from './AvatarCropModal.module.css';

const AvatarCropModal = ({ image, onClose, onSave, isLoading }) => {
    const editorRef = useRef(null);
    const [zoom, setZoom] = useState(1);

    const handleSave = () => {
        if (editorRef.current) {
            // Returns a canvas element
            const canvasScaled = editorRef.current.getImageScaledToCanvas();
            // Convert to base64 string
            const base64Image = canvasScaled.toDataURL('image/png');
            onSave(base64Image);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <h3>Crop Avatar</h3>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isLoading}>
                        &times;
                    </button>
                </div>
                
                <div className={styles.editorContainer}>
                    <AvatarEditor
                        ref={editorRef}
                        image={image}
                        width={200}
                        height={200}
                        border={30}
                        borderRadius={100} // Circular crop visual
                        color={[0, 0, 0, 0.6]} // RGBA
                        scale={zoom}
                        rotate={0}
                        className={styles.editor}
                    />
                </div>

                <div className={styles.controls}>
                    <label htmlFor="zoom">Zoom</label>
                    <input
                        id="zoom"
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        disabled={isLoading}
                    />
                </div>

                <div className={styles.actions}>
                    <button 
                        className={styles.cancelBtn} 
                        onClick={onClose} 
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        className={styles.saveBtn} 
                        onClick={handleSave} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;
