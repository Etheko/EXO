import { PropsWithChildren, RefObject, useState } from 'react';
import './MainFrame.css';

/**
 * A 2D window that slides up from the bottom of the viewport on scroll.
 * It features a semi-transparent background, a backdrop blur, a custom scrollbar,
 * and can host any HTML content. It hides automatically when scrolling up
 * while its content is at the top.
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
