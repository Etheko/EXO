import { useState, useEffect, useRef, PropsWithChildren } from 'react';
import './MainFrame.css';

  /**
 * A 2D window that slides up from the bottom of the viewport on scroll.
 * It features a semi-transparent background, a backdrop blur, a custom scrollbar,
 * and can host any HTML content. It hides automatically when scrolling up
 * while its content is at the top.
 */
const MainFrame = ({ children }: PropsWithChildren) => {
  const [isVisible, setIsVisible] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If mouse is over the frame, let its content scroll normally
      if (isHovering.current) {
        const content = contentRef.current;
        if (content) {
          const isScrollingUp = e.deltaY < 0;
          // If we are scrolling up and the content is at the top, hide the frame
          if (isScrollingUp && content.scrollTop === 0) {
            setIsVisible(false);
          }
        }
        // Do not interfere with content scrolling
        return;
      }

      // If mouse is not over the frame, control visibility
      const isScrollingDown = e.deltaY > 0;
      if (isScrollingDown && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleMouseEnter = () => { isHovering.current = true; };
    const handleMouseLeave = () => { isHovering.current = false; };

    const frameElement = frameRef.current;
    if (frameElement) {
      frameElement.addEventListener('mouseenter', handleMouseEnter);
      frameElement.addEventListener('mouseleave', handleMouseLeave);
    }
    
    window.addEventListener('wheel', handleWheel);

    return () => {
      if (frameElement) {
        frameElement.removeEventListener('mouseenter', handleMouseEnter);
        frameElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isVisible]);

  return (
    <div
      ref={frameRef}
      className={`main-frame-container ${isVisible ? 'visible' : ''}`}
    >
      <div className="main-frame-content" ref={contentRef}>
        {children}
      </div>
        </div>
  );
};

export default MainFrame;
