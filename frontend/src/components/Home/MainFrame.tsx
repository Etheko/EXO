import { PropsWithChildren, RefObject } from 'react';
import './MainFrame.css';

/**
 * MainFrame: The Dynamic Viewport
 * 
 * This component acts as a dynamic container, or "viewport," for different views within the application.
 * Its content is managed by its parent component (e.g., Home.tsx), which passes in the view
 * to be rendered (e.g., a list of projects or a detailed project view).
 */

interface MainFrameProps extends PropsWithChildren {
  isVisible: boolean;
  frameRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MainFrame = ({
  children,
  isVisible,
  frameRef,
  contentRef,
  onMouseEnter,
  onMouseLeave,
}: MainFrameProps) => {
  return (
    <div
      ref={frameRef}
      className={`main-frame-container ${isVisible ? 'visible' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="main-frame-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default MainFrame;
