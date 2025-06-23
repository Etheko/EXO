import { PropsWithChildren, RefObject, useEffect, useRef, useState, useCallback } from 'react';
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
  // Keep live reference of the current view id for event listeners
  const currentViewIdRef = useRef<number>(viewId);

  const direction = viewId > previousViewId.current ? 1 : -1;
  // Update ref each render
  currentViewIdRef.current = viewId;

  /* ------------------------------------------------------------------
   * Custom scrollbar state & helpers
   * ------------------------------------------------------------------ */
  const [thumbHeight, setThumbHeight] = useState<number>(0);
  const [thumbTop, setThumbTop] = useState<number>(0); // position within track

  /* ------------------------------------------------------------------
   * Per-view scroll position persistence
   * ------------------------------------------------------------------ */
  const scrollPositions = useRef<Record<number, number>>({});

  /* ------------------------------------------------------------------
   * Scrollbar visibility handling
   * ------------------------------------------------------------------ */
  const [scrollbarVisible, setScrollbarVisible] = useState<boolean>(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeout.current = setTimeout(() => setScrollbarVisible(false), 2000);
  };

  const showScrollbar = useCallback(() => {
    setScrollbarVisible(true);
    scheduleHide();
  }, []);

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

  /* Flag true while slide animation between views is running */
  const [isSliding, setIsSliding] = useState(false);

  /* Attach scroll & resize listeners once */
  useEffect(() => {
    updateThumb();

    // Show scrollbar briefly when viewport becomes visible
    if (isVisible) {
      showScrollbar();
    }

    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      const current = content as HTMLDivElement;
      // use ref to grab latest id
      scrollPositions.current[currentViewIdRef.current] = current.scrollTop;

      updateThumb();
      showScrollbar();
    };

    content.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateThumb);

    // Observe element resize (clientHeight changes)
    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(content);

    // Observe DOM mutations inside the content (e.g., when view changes)
    const mutationObserver = new MutationObserver(updateThumb);
    mutationObserver.observe(content, { childList: true, subtree: true });

    return () => {
      content.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateThumb);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
    // We only want to attach listeners once – contentRef itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, showScrollbar]);

  /* Restore scroll position for the incoming view */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Slide is starting -> hide scrollbar
    setIsSliding(true);

    // Persist scroll of the outgoing view (whose id is held in previousViewId)
    if (previousViewId.current !== viewId) {
      scrollPositions.current[previousViewId.current] = content.scrollTop;
    }

    // Determine target position for the new view
    const targetPos = direction > 0 ? 0 : (scrollPositions.current[viewId] ?? 0);

    // Progressive restoration – try until container is tall enough
    let attempts = 0;
    const tryRestore = () => {
      if (!content) return;

      if (content.scrollHeight > content.clientHeight || targetPos === 0 || attempts > 10) {
        content.scrollTop = targetPos;
        updateThumb();
        if (content.scrollHeight > content.clientHeight) showScrollbar();
      } else {
        attempts += 1;
        requestAnimationFrame(tryRestore);
      }
    };

    tryRestore();
  }, [viewId, showScrollbar]);

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

  const visibleNow = scrollbarVisible && !isSliding;
  const opacityTarget = visibleNow ? 1 : 0;
  const opacityTransition = !visibleNow && isSliding
    ? { duration: 0.05, ease: 'linear' }
    : { type: 'tween', duration: 0.3 };

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
            onAnimationComplete={() => {
              // animation finished -> allow scrollbar to appear
              setIsSliding(false);
              // show for 2s if scrollable
              const el = contentRef.current;
              if (el && el.scrollHeight > el.clientHeight) {
                showScrollbar();
              }
            }}
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
      <motion.div
        className="custom-scrollbar"
        style={{ pointerEvents: visibleNow ? 'auto' : 'none' }}
        initial={false}
        animate={{ opacity: opacityTarget }}
        transition={opacityTransition}
        onMouseEnter={() => {
          clearHideTimeout();
          setScrollbarVisible(true);
        }}
        onMouseLeave={() => {
          scheduleHide();
        }}
      >
        {thumbHeight > 0 && (
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
        )}
      </motion.div>
    </div>
  );
};

export default MainFrame;
