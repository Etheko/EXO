import { PropsWithChildren, RefObject, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  /**
   * Numeric identifier of the view currently being rendered. Must increase when navigating
   * forward and decrease when navigating backward so that the component can work out the
   * direction of the slide animation.
   */
  viewId: number;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const MainFrame = ({
  children,
  isVisible,
  frameRef,
  contentRef,
  onMouseEnter,
  onMouseLeave,
  viewId,
}: MainFrameProps) => {
  // Keep track of the previously rendered view so we can determine navigation direction
  const previousViewId = useRef<number>(viewId);

  const direction = viewId > previousViewId.current ? 1 : -1;

  // Update the previous view id after render completes
  useEffect(() => {
    previousViewId.current = viewId;
  }, [viewId]);

  return (
    <div
      ref={frameRef}
      className={`main-frame-container ${isVisible ? 'visible' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* The scrollable area */}
      <div className="main-frame-content" ref={contentRef}>
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={viewId}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 260, damping: 25, bounce: 0.05 },
              opacity: { duration: 0.2 },
            }}
            style={{ position: 'absolute', inset: 0, padding: '2.5rem' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainFrame;
