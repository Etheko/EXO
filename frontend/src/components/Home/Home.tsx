import { useState, useEffect, useRef } from 'react';
import MainFrame from './MainFrame';
import Scene3D from './Scene3D';
import './Home.css';
import Navbar from './Navbar';
import Projects from '../Projects/Projects';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const mainFrameRef = useRef<HTMLDivElement>(null);
  const mainFrameContentRef = useRef<HTMLDivElement>(null);
  const isHoveringMainFrame = useRef(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isHoveringMainFrame.current) {
        const content = mainFrameContentRef.current;
        if (content) {
          const isScrollingUp = e.deltaY < 0;
          if (isScrollingUp && content.scrollTop === 0) {
            setIsVisible(false);
          }
        }
        return;
      }

      const isScrollingDown = e.deltaY > 0;
      if (isScrollingDown && !isVisible) {
        setIsVisible(true);
      }
    };

    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isVisible]);

  return (
    <div className="home-container">
      <Scene3D />
      <Navbar isVisible={isVisible} />
      <MainFrame
        isVisible={isVisible}
        frameRef={mainFrameRef}
        contentRef={mainFrameContentRef}
        onMouseEnter={() => {
          isHoveringMainFrame.current = true;
        }}
        onMouseLeave={() => {
          isHoveringMainFrame.current = false;
        }}
      >
        <Projects />
      </MainFrame>
    </div>
  );
};

export default Home; 