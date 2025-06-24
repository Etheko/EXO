import {
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX,
  TbChevronLeft,
} from 'react-icons/tb';
import { useRef, useState, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Navbar.css';
import AnimatedNavbarChar from './AnimatedNavbarChar';
import SentientIOB from '../SentientIOB';

interface NavbarProps {
  isVisible: boolean;
  onBrandClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onLoginTrigger?: () => void;
}

const Navbar = ({ 
  isVisible, 
  onBrandClick, 
  showBackButton = false, 
  onBackClick,
  onLoginTrigger 
}: NavbarProps) => {
  const brandName = "Etheko.";
  
  // Long-press state management
  const pressTimerRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const isLongPressingRef = useRef<boolean>(false);
  
  // Shaking animation spring
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  const { transform } = useSpring({
    transform: `translateX(${showBackButton ? 44 : 0}px) translateX(${Math.sin(Date.now() * 0.05) * shakeIntensity * 0.5}px) translateY(${Math.cos(Date.now() * 0.03) * shakeIntensity * 0.3}px)`,
    config: { mass: 0.1, tension: 800, friction: 5 },
    immediate: shakeIntensity === 0, // Disable spring when not shaking for performance
  });

  const handleBrandClick = useCallback(() => {
    if (onBrandClick) {
      onBrandClick();
    }
  }, [onBrandClick]);

  const handleBackClick = useCallback(() => {
    if (onBackClick) {
      onBackClick();
    }
  }, [onBackClick]);

  // Long-press handlers
  const handleBrandMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Clear any existing timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    
    pressStartTimeRef.current = Date.now();
    isLongPressingRef.current = false;
    
    // Start the long-press timer
    pressTimerRef.current = window.setTimeout(() => {
      isLongPressingRef.current = true;
      
      // Start shaking animation
      const startShaking = () => {
        if (!isLongPressingRef.current) return;
        
        const elapsed = Date.now() - pressStartTimeRef.current;
        const progress = Math.min(elapsed / 3000, 1); // 3 seconds total
        // Use exponential curve for more dramatic intensity increase
        const intensity = Math.pow(progress, 1.5) * 15; // Max 15px shake with exponential curve
        
        setShakeIntensity(intensity);
        
        if (progress < 1) {
          requestAnimationFrame(startShaking);
        } else {
          // 3 seconds reached - trigger login
          setShakeIntensity(0);
          onLoginTrigger?.();
        }
      };
      
      requestAnimationFrame(startShaking);
    }, 500); // Start long-press detection after 500ms
  }, [onLoginTrigger]);

  const handleBrandMouseUp = useCallback(() => {
    // Clear the timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    // If we were long-pressing, stop shaking
    if (isLongPressingRef.current) {
      isLongPressingRef.current = false;
      setShakeIntensity(0);
    } else {
      // Short press - trigger normal click behavior
      handleBrandClick();
    }
  }, [handleBrandClick]);

  const handleBrandMouseLeave = useCallback(() => {
    // Clear the timer if mouse leaves
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (isLongPressingRef.current) {
      isLongPressingRef.current = false;
      setShakeIntensity(0);
    }
  }, []);

  return (
    <div className={`navbar-container ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-left-section">
        <animated.div 
          className="navbar-brand"
          style={{ transform }}
          onMouseDown={handleBrandMouseDown}
          onMouseUp={handleBrandMouseUp}
          onMouseLeave={handleBrandMouseLeave}
          onTouchStart={handleBrandMouseDown}
          onTouchEnd={handleBrandMouseUp}
        >
          {brandName.split('').map((char, index) => (
            <AnimatedNavbarChar key={index} char={char} />
          ))}
        </animated.div>
        <div className={`navbar-back-button ${showBackButton ? 'visible' : ''}`}>
          <SentientIOB onClick={handleBackClick} as="button">
            <TbChevronLeft size={26} />
          </SentientIOB>
        </div>
      </div>
      <div className="navbar-socials">
        <SentientIOB href="https://instagram.com" as="a" hoverScale={1}>
          <TbBrandInstagram size={18} />
        </SentientIOB>
        <SentientIOB href="https://x.com" as="a" hoverScale={1}>
          <TbBrandX size={18} />
        </SentientIOB>
        <SentientIOB href="https://linkedin.com" as="a" hoverScale={1}>
          <TbBrandLinkedin size={18} />
        </SentientIOB>
        <SentientIOB href="https://github.com/Etheko" as="a" hoverScale={1}>
          <TbBrandGithub size={18} />
        </SentientIOB>
      </div>
    </div>
  );
};

export default Navbar;
