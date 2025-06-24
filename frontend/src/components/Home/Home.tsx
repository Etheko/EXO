import { useEffect, useRef, useState } from 'react';
import Scene3D from './Scene3D';
import './Home.css';
import Navbar from './Navbar';
import MainFrame from './MainFrame';
import Projects from '../Projects';
import PortfolioIndex from '../PortfolioIndex';
import ScrollIndicator from './ScrollIndicator';
import { Project } from '../../types/Project';
import ProjectView from '../Projects/ProjectView';

type AnimationState = 'text' | 'camera-to-grid' | 'mainframe' | 'camera-to-text';
type MainFrameView = 'portfolioIndex' | 'projects' | 'projectView' | 'about' | 'tech-stack' | 'design' | 'cyber-logs' | 'devops' | 'blog' | 'contact' | 'certificates';

const Home = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('text');
  const [mainFrameView, setMainFrameView] = useState<MainFrameView>('portfolioIndex');
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

  const handleSectionSelected = (sectionId: number, componentType?: string) => {
    switch (componentType) {
      case 'projects':
        setMainFrameView('projects');
        break;
      case 'about':
        setMainFrameView('about');
        break;
      case 'tech-stack':
        setMainFrameView('tech-stack');
        break;
      case 'design':
        setMainFrameView('design');
        break;
      case 'cyber-logs':
        setMainFrameView('cyber-logs');
        break;
      case 'devops':
        setMainFrameView('devops');
        break;
      case 'blog':
        setMainFrameView('blog');
        break;
      case 'contact':
        setMainFrameView('contact');
        break;
      case 'certificates':
        setMainFrameView('certificates');
        break;
      default:
        console.warn(`No component handler for type: ${componentType}`);
        // Fallback to projects for backward compatibility
        if (sectionId === 1 || sectionId === 2) {
          setMainFrameView('projects');
        }
    }
  };

  const handleProjectSelected = (project: Project) => {
    setSelectedProject(project);
    setMainFrameView('projectView');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMainFrameView('projects');
  };

  const handleBackToIndex = () => {
    setSelectedProject(null);
    setMainFrameView('portfolioIndex');
  };

  const handleNavbarBackClick = () => {
    if (mainFrameView === 'projectView') {
      handleBackToProjects();
    } else if (mainFrameView === 'projects') {
      handleBackToIndex();
    }
  };

  const handleBrandClick = () => {
    // Only trigger if we're in mainframe state and no animation is in progress
    if (animationState === 'mainframe' && !isAnimationInProgress) {
      // First, scroll the Dynamic Viewport to the top
      if (contentRef.current) {
        contentRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // Then, after a short delay to allow the scroll to complete, hide the components
      setTimeout(() => {
        setIsAnimationInProgress(true);
        setAnimationState('camera-to-text');
      }, 300); // Wait for scroll animation to complete
    }
  };

  const isMainFrameVisible = animationState === 'mainframe';
  const focusOnGrid = animationState === 'mainframe' || animationState === 'camera-to-grid';
  const isScrollIndicatorVisible = isInitialTextAnimationComplete && !isMainFrameVisible && !isScrollIndicatorForceHidden;
  const showBackButton = mainFrameView !== 'portfolioIndex';

  // Map the textual view to a numeric id so that MainFrame can work out the navigation
  // direction and play the right animation. Increasing numbers represent moving forward
  // (e.g. Index -> Projects -> Project View) while decreasing numbers represent moving back.
  const viewIdMap: Record<MainFrameView, number> = {
    portfolioIndex: 0,
    projects: 1,
    projectView: 2,
    about: 3,
    'tech-stack': 4,
    design: 5,
    'cyber-logs': 6,
    devops: 7,
    blog: 8,
    contact: 9,
    certificates: 10,
  };
  const currentViewId = viewIdMap[mainFrameView];

  return (
    <div className="home-container">
      <Navbar 
        isVisible={isMainFrameVisible} 
        onBrandClick={handleBrandClick}
        showBackButton={showBackButton}
        onBackClick={handleNavbarBackClick}
      />
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
        viewId={currentViewId}
      >
        {mainFrameView === 'portfolioIndex' && <PortfolioIndex onSectionSelected={handleSectionSelected} />}
        {mainFrameView === 'projects' && <Projects onProjectSelected={handleProjectSelected} onBackToIndex={handleBackToIndex} />}
        {mainFrameView === 'projectView' && selectedProject && (
          <ProjectView project={selectedProject} onBack={handleBackToProjects} />
        )}
        {mainFrameView === 'about' && <div>About Component - Coming Soon</div>}
        {mainFrameView === 'tech-stack' && <div>Tech Stack Component - Coming Soon</div>}
        {mainFrameView === 'design' && <div>Design Component - Coming Soon</div>}
        {mainFrameView === 'cyber-logs' && <div>Cyber Logs Component - Coming Soon</div>}
        {mainFrameView === 'devops' && <div>DevOps Component - Coming Soon</div>}
        {mainFrameView === 'blog' && <div>Blog Component - Coming Soon</div>}
        {mainFrameView === 'contact' && <div>Contact Component - Coming Soon</div>}
        {mainFrameView === 'certificates' && <div>Certificates Component - Coming Soon</div>}
      </MainFrame>
      <ScrollIndicator isVisible={isScrollIndicatorVisible} />
    </div>
  );
};

export default Home; 