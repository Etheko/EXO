import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  /**
   * When true, the component takes the full viewport space (like Error component).
   * When false, it adapts to its container's dimensions.
   */
  fullViewport?: boolean;
  /**
   * Optional custom size for the spinner icon (in pixels).
   * Defaults to 48px for full viewport, 24px for dynamic.
   */
  size?: number;
  /**
   * Optional custom color for the spinner.
   * Defaults to rgba(255, 255, 255, 0.7).
   */
  color?: string;
  /**
   * Optional custom className for additional styling.
   */
  className?: string;
}

// Cute loading phrases similar to Error component
const LOADING_PHRASES = [
  'loading...',
  'please wait...',
  'almost there...',
  'just a moment...',
  'preparing...',
  'setting up...',
  'getting ready...',
  'almost done...',
  'one sec...',
  'loading stuff...',
  'be patient...',
  'working on it...',
  'loading things...',
  'hold on...',
  'preparing stuff...',
  'loading magic...',
  'almost ready...',
  'setting things up...',
  'loading goodies...',
  'preparing awesomeness...',
  'loading cool stuff...',
  'getting things ready...',
  'loading the good stuff...',
  'preparing greatness...',
  'loading amazing things...'
];

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullViewport = false,
  size,
  color = 'rgba(255, 255, 255, 0.7)',
  className = '',
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Memoize the current phrase
  const currentPhrase = useMemo(() => LOADING_PHRASES[currentPhraseIndex], [currentPhraseIndex]);

  // Get random phrase that's different from current
  const getRandomPhrase = useCallback(() => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
    } while (newIndex === currentPhraseIndex && LOADING_PHRASES.length > 1);
    return newIndex;
  }, [currentPhraseIndex]);

  // Change phrase handler
  const changePhrase = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPhraseIndex(getRandomPhrase());
      setIsTransitioning(false);
    }, 300); // Half of transition duration
  }, [getRandomPhrase]);

  useEffect(() => {
    const interval = setInterval(changePhrase, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [changePhrase]);

  // Memoize container class
  const containerClass = useMemo(() => 
    `loading-spinner-container ${fullViewport ? 'full-viewport' : 'dynamic'} ${className}`.trim(),
    [fullViewport, className]
  );

  return (
    <div className={containerClass}>
      <div className="loading-spinner-content">
        <AnimatePresence mode="sync">
          <motion.div
            key={currentPhraseIndex}
            className="loading-text"
            initial={{ 
              scale: 0.8, 
              opacity: 0,
              x: '-50%',
              y: '-50%'
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: '-50%',
              y: '-50%'
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              x: '-50%',
              y: '-50%'
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0.0, 0.2, 1], // Material 3 easing
            }}
            style={{ color }}
          >
            {currentPhrase}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(LoadingSpinner); 