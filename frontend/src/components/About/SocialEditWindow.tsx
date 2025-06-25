import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SentientButton from '../SentientButton';
import { TbX, TbCheck, TbTrash } from 'react-icons/tb';
import '../LoginWindow/LoginWindow.css';
import { createPortal } from 'react-dom';

interface SocialEditWindowProps {
  isVisible: boolean;
  socialKey: string; // e.g. 'instagram'
  currentValue: string | null | undefined;
  onSave: (value: string | null) => void;
  onClose: () => void;
}

const SocialEditWindow: React.FC<SocialEditWindowProps> = ({
  isVisible,
  socialKey,
  currentValue,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState<string>(currentValue ?? '');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      setValue(currentValue ?? '');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, currentValue]);

  const handleSave = () => {
    onSave(value.trim() === '' ? null : value.trim());
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' },
    visible: {
      opacity: 1,
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(0,0,0,0.6)',
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
    exit: { opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)', transition: { duration: 0.4, ease: [0.23,1,0.32,1] } },
  };

  const windowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275], delay: 0.1 } },
    exit: { opacity: 0, scale: 0, transition: { duration: 0.4, ease: [0.23,1,0.32,1] } },
  };

  const label = socialKey.charAt(0).toUpperCase() + socialKey.slice(1);

  const modalContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="login-window-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="login-window"
            variants={windowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="login-window-header">
              <h2 className="login-title">{label}</h2>
            </div>
            <div className="login-window-content">
              <div className="input-group">
                <label htmlFor="social-username" className="input-label">
                  Username
                </label>
                <input
                  id="social-username"
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="login-input"
                  placeholder={`Enter ${label} username`}
                />
              </div>
              <div className="login-buttons">
                <SentientButton className="login-button cancel-button" as="button" onClick={onClose}>
                  <TbX size={18} />
                  <span>Cancel</span>
                </SentientButton>
                <SentientButton className="login-button cancel-button" as="button" onClick={handleClear}>
                  <TbTrash size={18} />
                  <span>Clear</span>
                </SentientButton>
                <SentientButton className="login-button login-submit-button" as="button" onClick={handleSave}>
                  <TbCheck size={18} />
                  <span>Save</span>
                </SentientButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default SocialEditWindow; 