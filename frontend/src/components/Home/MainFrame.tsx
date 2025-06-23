import { PropsWithChildren, RefObject, useEffect, useRef, useState } from 'react';
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

// Equal gap above and below the custom scrollbar so it clears container corners
const SCROLLBAR_MARGIN = 20; // px — track inset top & bottom

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

  /* ------------------------------------------------------------------
   * Custom scrollbar state & helpers
   * ------------------------------------------------------------------ */
  const [thumbHeight, setThumbHeight] = useState<number>(0);
  const [thumbTop, setThumbTop] = useState<number>(0); // position within track

  // Keep track of dragging state outside of React state to avoid rerenders
  const isDragging = useRef<boolean>(false);
  const dragStartY = useRef<number>(0);
  const scrollStartTop = useRef<number>(0);

  /**
   * Updates the size and position of the scrollbar thumb according to the
   * current scroll position and container dimensions.
   */
  const updateThumb = () => {
    const content = contentRef.current;
    if (!content) return;

    const { scrollTop, scrollHeight, clientHeight } = content;

    // If the content is not scrollable, hide the thumb
    if (scrollHeight <= clientHeight) {
      setThumbHeight(0);
      return;
    }

    const trackHeight = clientHeight - 2 * SCROLLBAR_MARGIN;
    const calculatedThumbHeight = Math.max(
      (clientHeight / scrollHeight) * trackHeight,
      20,
    );
    const maxThumbTop = trackHeight - calculatedThumbHeight;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxThumbTop;

    setThumbHeight(calculatedThumbHeight);
    setThumbTop(top);
  };

  /* Attach scroll & resize listeners once */
  useEffect(() => {
    updateThumb();

    const content = contentRef.current;
    if (!content) return;

    content.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);

    // Observe element resize (clientHeight changes)
    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(content);

    // Observe DOM mutations inside the content (e.g., when view changes)
    const mutationObserver = new MutationObserver(updateThumb);
    mutationObserver.observe(content, { childList: true, subtree: true });

    return () => {
      content.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
    // We only want to attach listeners once – contentRef itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Re-compute thumb size when the displayed view changes */
  useEffect(() => {
    // Run after next paint to ensure new content is laid out
    const id = requestAnimationFrame(updateThumb);
    return () => cancelAnimationFrame(id);
  }, [viewId]);

  /** Begins dragging the scrollbar thumb */
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    const content = contentRef.current;
    if (!content) return;

    isDragging.current = true;
    dragStartY.current = e.clientY;
    scrollStartTop.current = content.scrollTop;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !contentRef.current) return;

      const { scrollHeight, clientHeight } = contentRef.current;
      const trackHeight = clientHeight - 2 * SCROLLBAR_MARGIN;
      const maxThumbMove = trackHeight - thumbHeight;
      const maxScroll = scrollHeight - clientHeight;

      const deltaY = ev.clientY - dragStartY.current;
      const scrollDelta = (deltaY / maxThumbMove) * maxScroll;
      contentRef.current.scrollTop = scrollStartTop.current + scrollDelta;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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

      {/* ------------------------------------------------------------------
       * Custom Scrollbar Overlay (track + thumb) - fixed relative to frame
       * ------------------------------------------------------------------ */}
      {thumbHeight > 0 && (
        <div className="custom-scrollbar">
          <motion.div
            className="custom-scrollbar-thumb"
            /* Instant position updates via inline style; animated height for content changes */
            style={{ position: 'absolute', right: 0, width: '100%' }}
            animate={{ height: thumbHeight, top: thumbTop }}
            transition={{
              height: { type: 'spring', stiffness: 350, damping: 20, bounce: 0.25 },
              top: { type: 'tween', duration: 0.01 },
            }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      )}
    </div>
  );
};

export default MainFrame;
