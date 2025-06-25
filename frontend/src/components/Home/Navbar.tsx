import {
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX,
  TbChevronLeft,
} from 'react-icons/tb';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Navbar.css';
import AnimatedNavbarChar from './AnimatedNavbarChar';
import SentientIOB from '../SentientIOB';
import LoginService from '../../services/LoginService';

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
  
  // Tooltip state definitions
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [displayedTooltip, setDisplayedTooltip] = useState<string>('');
  const animationRef = useRef<number | null>(null);
  const currentTextRef = useRef<string>(''); // Track current text without triggering re-renders

  // Login status state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on mount and when component updates
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(LoginService.isAuthenticated());
    };
    
    checkLoginStatus();
    
    // Listen for storage changes to update login status
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    // Listen for custom login status change events
    const handleLoginStatusChange = (event: CustomEvent) => {
      setIsLoggedIn(event.detail.isAuthenticated);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('loginStatusChanged', handleLoginStatusChange as EventListener);
    
    // Also check periodically in case of other login/logout methods
    const interval = setInterval(checkLoginStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStatusChanged', handleLoginStatusChange as EventListener);
      clearInterval(interval);
    };
  }, []);

  // Listen for global tooltipHover events dispatched from other components (e.g., About.tsx)
  useEffect(() => {
    const handleTooltipHover = (event: Event) => {
      const customEvent = event as CustomEvent<{ text: string | null }>;
      setHoveredTooltip(customEvent.detail?.text || null);
    };

    window.addEventListener('tooltipHover', handleTooltipHover as EventListener);
    return () => {
      window.removeEventListener('tooltipHover', handleTooltipHover as EventListener);
    };
  }, []);

  const { transform } = useSpring({
    transform: `translateX(${showBackButton ? 44 : 0}px) translateX(${Math.sin(Date.now() * 0.05) * shakeIntensity * 0.5}px) translateY(${Math.cos(Date.now() * 0.03) * shakeIntensity * 0.3}px)`,
    config: { mass: 0.1, tension: 800, friction: 5 },
    immediate: shakeIntensity === 0, // Disable spring when not shaking for performance
  });

  // Animation utilities
  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const updateDisplayText = useCallback((text: string) => {
    setDisplayedTooltip(text);
    currentTextRef.current = text;
  }, []);

  const animateTyping = useCallback((targetText: string, onComplete?: () => void) => {
    let currentIndex = 0;
    let lastTime = 0;
    const TYPING_SPEED = 50; // ms per character
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= TYPING_SPEED) {
        if (currentIndex < targetText.length) {
          currentIndex++;
          const displayText = `> ${targetText.slice(0, currentIndex)}`;
          updateDisplayText(displayText);
          lastTime = currentTime;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
          onComplete?.();
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [updateDisplayText]);

  const animateDeletion = useCallback((onComplete?: () => void) => {
    let currentLength = currentTextRef.current.replace(/^>\s?/, '').length;
    let lastTime = 0;
    const DELETION_SPEED = 30; // ms per character
    
    if (currentLength === 0) {
      onComplete?.();
      return;
    }
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= DELETION_SPEED) {
        if (currentLength > 0) {
          currentLength--;
          const newText = currentTextRef.current.replace(/^>\s?/, '').slice(0, currentLength);
          const displayText = newText ? `> ${newText}` : '';
          updateDisplayText(displayText);
          lastTime = currentTime;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
          onComplete?.();
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [updateDisplayText]);

  // Effect: animate typing / deleting for tooltip
  useEffect(() => {
    // Only run on desktop view (min-width 768px)
    if (window.innerWidth < 768) return;

    clearAnimation();

    if (hoveredTooltip) {
      // If there's currently displayed text, delete it first before typing new text
      if (currentTextRef.current && currentTextRef.current.replace(/^>\s?/, '').length > 0) {
        animateDeletion(() => animateTyping(hoveredTooltip));
      } else {
        // No current text, start typing immediately
        animateTyping(hoveredTooltip);
      }
    } else {
      // Deleting animation when no tooltip is hovered
      animateDeletion();
    }

    return clearAnimation;
  }, [hoveredTooltip, clearAnimation, animateTyping, animateDeletion]);

  // Helper functions for tooltip hover
  const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => setHoveredTooltip(text),
    onMouseLeave: () => setHoveredTooltip(null),
    onTouchStart: () => setHoveredTooltip(text),
    onTouchEnd: () => setHoveredTooltip(null),
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
      <div className="navbar-center-section">
        {displayedTooltip && <span className="tooltip-texts">{displayedTooltip}</span>}
      </div>
      <div className="navbar-right-section">
        {isLoggedIn && (
          <div className="login-indicator">
            <SentientIOB 
              as="div" 
              hoverScale={1} 
              onClick={() => {
                LoginService.logout();
                setHoveredTooltip(null); // Clear tooltip immediately
              }}
              {...createTooltipHandlers('Logged in (click to logout)')}
            >
              <div className="login-indicator-dot"></div>
            </SentientIOB>
          </div>
        )}
        <div className="navbar-socials">
          <SentientIOB href="https://instagram.com" as="a" hoverScale={1} {...createTooltipHandlers('instagram')}>
            <TbBrandInstagram size={18} />
          </SentientIOB>
          <SentientIOB href="https://x.com" as="a" hoverScale={1} {...createTooltipHandlers('x / twitter')}>
            <TbBrandX size={18} />
          </SentientIOB>
          <SentientIOB href="https://linkedin.com" as="a" hoverScale={1} {...createTooltipHandlers('linkedin')}>
            <TbBrandLinkedin size={18} />
          </SentientIOB>
          <SentientIOB href="https://github.com/Etheko" as="a" hoverScale={1} {...createTooltipHandlers('github')}>
            <TbBrandGithub size={18} />
          </SentientIOB>
        </div>
      </div>
    </div>
  );
};

export default Navbar;