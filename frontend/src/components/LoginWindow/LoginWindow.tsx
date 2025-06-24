import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbEye, TbEyeOff, TbX, TbLogin } from 'react-icons/tb';
import SentientButton from '../SentientButton';
import LoginService, { LoginRequest } from '../../services/LoginService';
import './LoginWindow.css';

interface LoginWindowProps {
  isVisible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginWindow: React.FC<LoginWindowProps> = ({ 
  isVisible, 
  onClose, 
  onLoginSuccess 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus username input when component becomes visible
  useEffect(() => {
    if (isVisible && usernameInputRef.current) {
      const timer = setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 300); // Wait for animation to start
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Clear form when component becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [isVisible]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: LoginRequest = {
        username: username.trim(),
        password: password
      };

      const success = await LoginService.performLogin(credentials);
      
      if (success) {
        onLoginSuccess?.();
        onClose();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Focus back to password input after toggle
    setTimeout(() => passwordInputRef.current?.focus(), 0);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="login-window-overlay"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ 
            opacity: 1, 
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
          exit={{ 
            opacity: 0, 
            backdropFilter: 'blur(0px)',
            backgroundColor: 'rgba(0, 0, 0, 0)'
          }}
          transition={{
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
          }}
          onClick={handleBackgroundClick}
        >
          <motion.div
            className="login-window"
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              y: 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              y: 20
            }}
            transition={{
              duration: 0.4,
              ease: [0.175, 0.885, 0.32, 1.275],
              delay: 0.1
            }}
            onKeyDown={handleKeyPress}
          >
            <div className="login-window-header">
              <h2 className="login-title">Login</h2>
            </div>

            <div className="login-window-content">
              <div className="input-group">
                <label htmlFor="username" className="input-label">
                  Username
                </label>
                <input
                  ref={usernameInputRef}
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input password-input"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="login-buttons">
                <SentientButton
                  onClick={handleCancel}
                  className="login-button cancel-button"
                  as="button"
                  disabled={isLoading}
                >
                  <TbX size={18} />
                  <span>Cancel</span>
                </SentientButton>

                <SentientButton
                  onClick={handleLogin}
                  className="login-button login-submit-button"
                  as="button"
                  disabled={isLoading}
                >
                  <TbLogin size={18} />
                  <span>{isLoading ? 'Logging in...' : 'Login'}</span>
                </SentientButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginWindow; 