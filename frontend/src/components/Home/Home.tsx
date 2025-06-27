import { useEffect, useRef, useState, useCallback } from 'react';
import Scene3D from './Scene3D';
import './Home.css';
import Navbar from './Navbar';
import MainFrame from './MainFrame';
import Projects from '../Projects';
import PortfolioIndex from '../PortfolioIndex';
import About from '../About';
import ScrollIndicator from './ScrollIndicator';
import Error from '../Error';
import LoginWindow from '../LoginWindow';
import { Project } from '../../types/Project';
import ProjectView from '../Projects/ProjectView';
import { ErrorCode } from '../../utils/errorCodes';
import { ErrorProvider } from '../../hooks/useError';
import LoadingSpinner from '../LoadingSpinner';

type AnimationState = 'text' | 'camera-to-grid' | 'mainframe' | 'camera-to-text';
type MainFrameView = 'portfolioIndex' | 'projects' | 'projectView' | 'about' | 'tech-stack' | 'design' | 'cyber-logs' | 'devops' | 'blog' | 'contact' | 'certificates' | 'error';

const Home = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('text');
  const [mainFrameView, setMainFrameView] = useState<MainFrameView>('portfolioIndex');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);
  const [isTextReady, setIsTextReady] = useState(true);
  const [isInitialTextAnimationComplete, setIsInitialTextAnimationComplete] = useState(false);
  const [isScrollIndicatorForceHidden, setIsScrollIndicatorForceHidden] = useState(false);
  const [errorState, setErrorState] = useState<{ code: ErrorCode; message?: string } | null>(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const mainFrameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
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
  }, [isInitialTextAnimationComplete, isAnimationInProgress, animationState]);
  
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

  const handleTextDisappearAnimationComplete = useCallback(() => {
    // Now that text is hidden, we can proceed to show the mainframe
    setAnimationState('mainframe');
    setIsAnimationInProgress(false);
  }, []);
  
  const handleCameraToTextAnimationComplete = useCallback(() => {
    setAnimationState('text');
    setIsAnimationInProgress(false);
  }, []);

  const handleCameraAlmostAtText = useCallback(() => {
    setIsTextReady(true);
  }, []);

  const handleInitialTextAnimationComplete = useCallback(() => {
    setIsInitialTextAnimationComplete(true);
  }, []);

  const handleTextAppearAnimationComplete = useCallback(() => {
    setIsScrollIndicatorForceHidden(false);
  }, []);

  const handleSectionSelected = useCallback((sectionId: number, componentType?: string) => {
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
    }
  }, []);

  const handleProjectSelected = useCallback((project: Project) => {
    setSelectedProject(project);
    setMainFrameView('projectView');
  }, []);

  const handleBackToProjects = useCallback(() => {
    setSelectedProject(null);
    setMainFrameView('projects');
  }, []);

  const handleBackToIndex = useCallback(() => {
    setSelectedProject(null);
    setMainFrameView('portfolioIndex');
  }, []);

  const handleNavbarBackClick = useCallback(() => {
    if (mainFrameView === 'projectView') {
      handleBackToProjects();
    } else if (mainFrameView === 'projects') {
      handleBackToIndex();
    } else if (mainFrameView === 'about') {
      handleBackToIndex();
    } else if (mainFrameView === 'error') {
      // Go back to the previous view before error
      handleBackToIndex();
    }
  }, [mainFrameView, handleBackToProjects, handleBackToIndex]);

  const handleBrandClick = useCallback(() => {
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
  }, [animationState, isAnimationInProgress]);

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
    error: 11, // Highest ID for error view
  };
  const currentViewId = viewIdMap[mainFrameView];

  // Function to show error
  const showError = useCallback((errorCode: ErrorCode, message?: string) => {
    setErrorState({ code: errorCode, message });
    setMainFrameView('error');
  }, []);

  // Function to clear error and return to previous view
  const clearError = useCallback(() => {
    setErrorState(null);
    setMainFrameView('portfolioIndex');
  }, []);

  const handleLoginTrigger = useCallback(() => {
    setIsLoginVisible(true);
  }, []);

  const handleLoginClose = useCallback(() => {
    setIsLoginVisible(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // Handle successful login - could update UI state, show admin features, etc.
    setIsLoginVisible(false);
  }, []);

  return (
    <div className="home-container">
      <Navbar 
        isVisible={isMainFrameVisible} 
        onBrandClick={handleBrandClick}
        showBackButton={showBackButton}
        onBackClick={handleNavbarBackClick}
        onLoginTrigger={handleLoginTrigger}
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
        <ErrorProvider showError={showError} clearError={clearError}>
          {mainFrameView === 'portfolioIndex' && <PortfolioIndex onSectionSelected={handleSectionSelected} />}
          {mainFrameView === 'projects' && <Projects onProjectSelected={handleProjectSelected} onBackToIndex={handleBackToIndex} />}
          {mainFrameView === 'projectView' && selectedProject && (
            <ProjectView project={selectedProject} onBack={handleBackToProjects} />
          )}
          {mainFrameView === 'about' && <About />}
          {mainFrameView === 'tech-stack' && <div>Tech Stack Component - Coming Soon</div>}
          {mainFrameView === 'design' && <div>Design Component - Coming Soon</div>}
          {mainFrameView === 'cyber-logs' && <div>Cyber Logs Component - Coming Soon</div>}
          {mainFrameView === 'devops' && <div>DevOps Component - Coming Soon</div>}
          {mainFrameView === 'blog' && <LoadingSpinner fullViewport={true} />}
          {mainFrameView === 'contact' && <div>Contact Component - Coming Soon</div>}
          {mainFrameView === 'certificates' && <div>Certificates Component - Coming Soon</div>}
          {mainFrameView === 'error' && errorState && (
            <Error 
              errorCode={errorState.code} 
              errorMessage={errorState.message}
              onBack={clearError}
            />
          )}
        </ErrorProvider>
      </MainFrame>
      <ScrollIndicator isVisible={isScrollIndicatorVisible} />
      <LoginWindow 
        isVisible={isLoginVisible}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Home; 