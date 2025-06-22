import { useEffect, useRef, useState } from 'react';
import Scene3D from './Scene3D';
import './Home.css';
import Navbar from './Navbar';
import MainFrame from './MainFrame';
import Projects from '../Projects';
import ScrollIndicator from './ScrollIndicator';
import { Project } from '../../types/Project';
import ProjectView from '../Projects/ProjectView';

type AnimationState = 'text' | 'camera-to-grid' | 'mainframe' | 'camera-to-text';
type MainFrameView = 'projects' | 'projectView';

const Home = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('text');
  const [mainFrameView, setMainFrameView] = useState<MainFrameView>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);
  const [isTextReady, setIsTextReady] = useState(true);
  const [isInitialTextAnimationComplete, setIsInitialTextAnimationComplete] = useState(false);
  const [isScrollIndicatorForceHidden, setIsScrollIndicatorForceHidden] = useState(false);
  const mainFrameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: WheelEvent) => {
    // Ignore scroll events until initial text animation is complete
    if (!isInitialTextAnimationComplete) return;
    
    if (isAnimationInProgress) return;

    // Scroll down to show mainframe
    if (e.deltaY > 0 && animationState === 'text') {
      setIsScrollIndicatorForceHidden(true);
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
  }, [isAnimationInProgress, animationState, isInitialTextAnimationComplete]);

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

  const handleInitialTextAnimationComplete = () => {
    setIsInitialTextAnimationComplete(true);
  };

  const handleTextAppearAnimationComplete = () => {
    setIsScrollIndicatorForceHidden(false);
  };

  const handleProjectSelected = (project: Project) => {
    setSelectedProject(project);
    setMainFrameView('projectView');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMainFrameView('projects');
  };

  const isMainFrameVisible = animationState === 'mainframe';
  const focusOnGrid = animationState === 'mainframe' || animationState === 'camera-to-grid';
  const isScrollIndicatorVisible = isInitialTextAnimationComplete && !isMainFrameVisible && !isScrollIndicatorForceHidden;

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
          onInitialTextAnimationComplete={handleInitialTextAnimationComplete}
          onTextAppearAnimationComplete={handleTextAppearAnimationComplete}
        />
      </div>
      <MainFrame
        isVisible={isMainFrameVisible}
        frameRef={mainFrameRef}
        contentRef={contentRef}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      >
        {mainFrameView === 'projects' && <Projects onProjectSelected={handleProjectSelected} />}
        {mainFrameView === 'projectView' && selectedProject && (
          <ProjectView project={selectedProject} onBack={handleBackToProjects} />
        )}
      </MainFrame>
      <ScrollIndicator isVisible={isScrollIndicatorVisible} />
    </div>
  );
};

export default Home; 