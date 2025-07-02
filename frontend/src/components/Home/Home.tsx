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
import ProjectService from '../../services/ProjectsService';
import Technologies from '../Technologies';
import { TERMINAL_TOP_SCROLL_COOLDOWN_MS } from '../../config';

type AnimationState = 'text' | 'camera-to-grid' | 'mainframe' | 'camera-to-text';
type MainFrameView = 'portfolioIndex' | 'projects' | 'projectView' | 'about' | 'tech-stack' | 'design' | 'cyber-logs' | 'devops' | 'blog' | 'contact' | 'certificates' | 'error';

const PLACEHOLDER_TITLE = 'New Project';
const PLACEHOLDER_DESCRIPTION = 'This is a new project. You can edit this description.';

const isPlaceholderProject = (p: Project): boolean => {
  const isTitlePlaceholder = p.title === PLACEHOLDER_TITLE;
  const isDescriptionPlaceholder = p.description === PLACEHOLDER_DESCRIPTION;
  const hasNoGallery = !p.galleryImagePaths || p.galleryImagePaths.length === 0;
  const hasNoTech = !p.technologies || p.technologies.length === 0;
  const socials = [p.github, p.instagram, p.facebook, p.xUsername, p.mastodon, p.bluesky, p.tiktok, p.liveDemoUrl, p.projectWebsiteUrl];
  const hasNoSocials = socials.every(v => !v || v.trim() === '');
  return isTitlePlaceholder && isDescriptionPlaceholder && hasNoGallery && hasNoTech && hasNoSocials;
};

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
  const [isProjectNew, setIsProjectNew] = useState(false);
  const [isProjectModified, setIsProjectModified] = useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);

  // Cooldown for hiding mainframe on scroll up
  const topReachedTimeRef = useRef<number | null>(null);
  const wasAtTopRef = useRef<boolean>(false);

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
    else if (e.deltaY < 0 && animationState === 'mainframe') {
      const isAtTop = contentRef.current?.scrollTop === 0;

      // Mark the first moment we reach the absolute top (scrollTop === 0).
      if (isAtTop && !wasAtTopRef.current) {
        topReachedTimeRef.current = Date.now();
        wasAtTopRef.current = true;
      } else if (!isAtTop && wasAtTopRef.current) {
        // We moved away from top – reset flag so next reach records a new time.
        wasAtTopRef.current = false;
      }

      const cooldownActive =
        isAtTop &&
        topReachedTimeRef.current !== null &&
        Date.now() - topReachedTimeRef.current < TERMINAL_TOP_SCROLL_COOLDOWN_MS;

      const shouldHide = isAtTop && !cooldownActive;

      if (shouldHide) {
        setIsAnimationInProgress(true);
        // isMainFrameVisible will become false
        setAnimationState('camera-to-text');
      }
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

  const handleProjectViewStateChange = useCallback(({ isNew, isModified, snapshot }: { isNew: boolean; isModified: boolean; snapshot: Project }) => {
    setIsProjectNew(isNew);
    setIsProjectModified(isModified);
    setSelectedProject(snapshot); // keep latest snapshot
  }, []);

  const handleNavbarBackClick = useCallback(async () => {
    if (mainFrameView === 'projectView') {
      const shouldDiscard = isProjectNew && selectedProject && isPlaceholderProject(selectedProject);
      if (shouldDiscard && selectedProject?.id) {
          await ProjectService.deleteProject(selectedProject.id);
          setProjectsRefreshKey(prev => prev + 1);
      }
      handleBackToProjects();
    } else if (mainFrameView === 'projects') {
      handleBackToIndex();
    } else if (mainFrameView === 'about') {
      handleBackToIndex();
    } else if (mainFrameView === 'tech-stack') {
      handleBackToIndex();
    } else if (mainFrameView === 'error') {
      handleBackToIndex();
    }
  }, [mainFrameView, handleBackToProjects, handleBackToIndex, isProjectNew, selectedProject]);

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
          {mainFrameView === 'projects' && <Projects key={projectsRefreshKey} onProjectSelected={handleProjectSelected} onBackToIndex={handleBackToIndex} />}
          {mainFrameView === 'projectView' && selectedProject && (
            <ProjectView 
              project={selectedProject} 
              onBack={handleBackToProjects} 
              onStateChange={handleProjectViewStateChange}
            />
          )}
          {mainFrameView === 'about' && <About />}
          {mainFrameView === 'tech-stack' && <Technologies />}
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