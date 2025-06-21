import { useEffect, useRef, useState } from 'react';
import Scene3D from './Scene3D';
import './Home.css';
import Navbar from './Navbar';
import MainFrame from './MainFrame';
import Projects from '../Projects';

type AnimationState = 'text' | 'camera-to-grid' | 'mainframe' | 'camera-to-text';

const Home = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('text');
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);
  const [isTextReady, setIsTextReady] = useState(true);
  const mainFrameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: WheelEvent) => {
    if (isAnimationInProgress) return;

    // Scroll down to show mainframe
    if (e.deltaY > 0 && animationState === 'text') {
      setIsAnimationInProgress(true);
      setIsTextReady(false); // Text starts disappearing
      setAnimationState('camera-to-grid'); 
    }
    // Scroll up to hide mainframe
    else if (e.deltaY < 0 && animationState === 'mainframe' && contentRef.current?.scrollTop === 0) {
      setIsAnimationInProgress(true);
      // isMainFrameVisible will become false
      setAnimationState('camera-to-text');
    }
  };
  
  useEffect(() => {
    const mainFrameElement = mainFrameRef.current;
    if (animationState === 'mainframe') {
      mainFrameElement?.addEventListener('wheel', handleWheel);
    } else {
      window.addEventListener('wheel', handleWheel);
    }

    return () => {
      mainFrameElement?.removeEventListener('wheel', handleWheel);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isAnimationInProgress, animationState]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleTextDisappearAnimationComplete = () => {
    // Now that text is hidden, we can proceed to show the mainframe
    setAnimationState('mainframe');
    setIsAnimationInProgress(false);
  };
  
  const handleCameraToTextAnimationComplete = () => {
    setAnimationState('text');
    setIsAnimationInProgress(false);
  };

  const handleCameraAlmostAtText = () => {
    setIsTextReady(true);
  };

  const isMainFrameVisible = animationState === 'mainframe';
  const focusOnGrid = animationState === 'mainframe' || animationState === 'camera-to-grid';

  return (
    <div className="home-container">
      <Navbar isVisible={isMainFrameVisible} />
      <div className="scene-container">
        <Scene3D 
          isTextVisible={isTextReady}
          focusOnGrid={focusOnGrid}
          onTextDisappearAnimationComplete={handleTextDisappearAnimationComplete}
          onCameraToTextAnimationComplete={handleCameraToTextAnimationComplete}
          onCameraAlmostAtText={handleCameraAlmostAtText}
        />
      </div>
      <MainFrame
        isVisible={isMainFrameVisible}
        frameRef={mainFrameRef}
        contentRef={contentRef}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      >
        <Projects />
      </MainFrame>
    </div>
  );
};

export default Home; 