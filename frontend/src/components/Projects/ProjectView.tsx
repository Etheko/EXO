import { Project } from '../../types/Project';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './ProjectView.css';
import { backendUrl } from '../../services/api';
import SentientButton from '../SentientButton';
import SentientIOB from '../SentientIOB';
import TechnologyIcon from './TechnologyIcon';
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbBrandGithub, TbBrandInstagram, TbBrandFacebook, TbBrandX, TbBrandMastodon, TbBrandBluesky, TbBrandTiktok, TbExternalLink, TbHome, TbUpload, TbX, TbCheck } from 'react-icons/tb';
import LoginService from '../../services/LoginService';
import ProjectService from '../../services/ProjectsService';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';

// Utility: create tooltip handlers that broadcast tooltip text to Navbar
const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
    onTouchStart: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onTouchEnd: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
});

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

const ProjectView = ({ project, onBack }: ProjectViewProps) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const getImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('/api') || path.startsWith('/assets')) {
            return `${backendUrl}${path}`;
        }
        return path;
    };

    const [galleryImages, setGalleryImages] = useState<string[]>(() => {
        if (project.gallery && project.gallery.length > 0) {
            return project.gallery.map(getImageUrl);
        }
        if (project.galleryImagePaths && project.galleryImagePaths.length > 0) {
            return project.galleryImagePaths.map(getImageUrl);
        }
        return [];
    });

    const [isAdmin, setIsAdmin] = useState<boolean>(LoginService.isCurrentUserAdmin());
    const [isHoveringHeader, setIsHoveringHeader] = useState(false);
    const [newHeaderPic, setNewHeaderPic] = useState<{ file: File; previewUrl: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showError } = useError();
    const [currentProject, setCurrentProject] = useState<Project>(project);

    const headerImageUrl = newHeaderPic ? newHeaderPic.previewUrl : getImageUrl(currentProject.headerPictureString);
    const iconUrl = getImageUrl(currentProject.iconString);

    const nextImage = () => {
        setCurrentImage((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };
    
    const handleHeaderClick = () => {
        if (isAdmin) {
            fileInputRef.current?.click();
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (newHeaderPic) {
                URL.revokeObjectURL(newHeaderPic.previewUrl);
            }
            setNewHeaderPic({
                file,
                previewUrl: URL.createObjectURL(file),
            });
            event.target.value = '';
        }
    };

    const handleSaveHeaderPic = async () => {
        if (!newHeaderPic || !currentProject.id) return;
        try {
            const updatedProject = await ProjectService.uploadHeaderPicture(currentProject.id, newHeaderPic.file);
            setCurrentProject(updatedProject);
            if (newHeaderPic) {
                URL.revokeObjectURL(newHeaderPic.previewUrl);
            }
            setNewHeaderPic(null);
        } catch (error) {
            console.error("Failed to upload header picture", error);
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to upload header picture.');
        }
    };

    const handleCancelHeaderPic = () => {
        if (newHeaderPic) {
            URL.revokeObjectURL(newHeaderPic.previewUrl);
        }
        setNewHeaderPic(null);
    };
    
    const projectSocials = [
        { key: 'github', url: currentProject.github, icon: TbBrandGithub, label: 'github' },
        { key: 'instagram', url: currentProject.instagram, icon: TbBrandInstagram, label: 'instagram' },
        { key: 'facebook', url: currentProject.facebook, icon: TbBrandFacebook, label: 'facebook' },
        { key: 'x', url: currentProject.xUsername, icon: TbBrandX, label: 'x' },
        { key: 'mastodon', url: currentProject.mastodon, icon: TbBrandMastodon, label: 'mastodon' },
        { key: 'bluesky', url: currentProject.bluesky, icon: TbBrandBluesky, label: 'bluesky' },
        { key: 'tiktok', url: currentProject.tiktok, icon: TbBrandTiktok, label: 'tiktok' },
    ];

    const projectLinks = [
        { key: 'liveDemo', url: currentProject.liveDemoUrl, icon: TbExternalLink, label: 'live demo' },
        { key: 'website', url: currentProject.projectWebsiteUrl, icon: TbHome, label: 'project website' },
    ]

    const showUploadOverlay = isAdmin && isHoveringHeader && !newHeaderPic;

    // Fetch gallery paths from backend when component mounts if not already present
    useEffect(() => {
        const fetchGallery = async () => {
            if (galleryImages.length === 0 && currentProject.id) {
                try {
                    const paths = await ProjectService.getGalleryPaths(currentProject.id);
                    setGalleryImages(paths.map(getImageUrl));
                } catch (error) {
                    console.error("Failed to fetch gallery images", error);
                }
            }
        };
        fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject.id]);

    /* ==========================
     *  OVERLAY ANIMATIONS (mirrors LoginWindow)
     * ==========================
     */
    const overlayVariants = {
        hidden: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            backgroundColor: 'rgba(0, 0, 0, 0)'
        },
        visible: {
            opacity: 1,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            transition: {
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
            }
        },
        exit: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            transition: {
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
            }
        }
    } as const;

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.175, 0.885, 0.32, 1.275],
                delay: 0.1,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
        },
    };

    const controlsVariants = {
        hidden: { y: 20, opacity: 0, x: '-50%' },
        visible: {
            y: 0,
            opacity: 1,
            x: '-50%',
            transition: { delay: 0.2, duration: 0.4, ease: 'easeOut' },
        },
        exit: { y: 20, opacity: 0, x: '-50%', transition: { duration: 0.3, ease: 'easeIn' } },
    };

    const openOverlay = () => setIsOverlayVisible(true);
    const closeOverlay = () => setIsOverlayVisible(false);
    const handleOverlayBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeOverlay();
        }
    };
    const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeOverlay();
        }
    };

    // Close overlay on global Escape press (in case modal isn't focused)
    useEffect(() => {
        if (!isOverlayVisible) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeOverlay();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOverlayVisible]);

  return (
    <div className="project-view">
        <header 
            className="project-view-header" 
            onClick={handleHeaderClick}
            onMouseEnter={() => isAdmin && setIsHoveringHeader(true)}
            onMouseLeave={() => isAdmin && setIsHoveringHeader(false)}
        >
            <div 
                className="project-view-header-background"
                style={{ backgroundImage: `url(${headerImageUrl})` }}
            ></div>
            <div className="project-view-header-content">
                {iconUrl && <img src={iconUrl} alt={`${currentProject.title} icon`} className="project-view-icon" />}
                <h1 className="project-view-title">{currentProject.title}</h1>
            </div>
            {showUploadOverlay && (
                <div className="pfp-upload-overlay">
                    <TbUpload size={48} />
                    <span>Change header</span>
                </div>
            )}
            {newHeaderPic && (
                <div className="edit-controls header-edit-controls">
                    <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); handleCancelHeaderPic(); }} {...createTooltipHandlers('cancel')}>
                        <TbX size={18} />
                    </SentientIOB>
                    <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); handleSaveHeaderPic(); }} {...createTooltipHandlers('save')}>
                        <TbCheck size={18} />
                    </SentientIOB>
                </div>
            )}
        </header>

        <main className="project-view-content">
            <section className="project-view-section">
                <div className="section-subtitle-container">
                    <h2 className="section-subtitle">What is this?</h2>
                </div>
                <div className="description-card">
                    {currentProject.description.split('\n').map((line, index) => (
                        <p key={index} className="description-text">
                            {line || '\u00A0'} 
                        </p>
                    ))}
                </div>
            </section>

            {currentProject.technologies && currentProject.technologies.length > 0 && (
                <section className="project-view-section">
                    <div className="section-subtitle-container">
                        <h2 className="section-subtitle">Built With</h2>
                    </div>
                    <div className="project-technologies-view">
                        {currentProject.technologies.map((tech, index) => (
                            <span key={index} className="technology-tag">
                                <TechnologyIcon technology={tech} />
                                <span>{tech}</span>
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {galleryImages.length > 0 && (
                <section className="project-view-section">
                    <div className="section-subtitle-container">
                        <h2 className="section-subtitle">Pics</h2>
                    </div>
                    <div className="gallery-carousel">
                        <div className={`carousel-arrow-wrapper left ${currentImage === 0 ? 'hidden' : ''}`}>
                            <SentientIOB as="button" className="carousel-arrow" onClick={prevImage} {...createTooltipHandlers('previous image')}>
                                <TbChevronLeft size={24} />
                            </SentientIOB>
                        </div>
                        <div className="carousel-images-container">
                            {galleryImages.map((image, index) => {
                                const offset = index - currentImage;
                                // We now need to render 5 items to allow for fade-out animations
                                const isVisible = Math.abs(offset) <= 2;

                                let stateClassName = '';
                                switch (offset) {
                                    case -2:
                                        stateClassName = 'prev-hiding';
                                        break;
                                    case -1:
                                        stateClassName = 'prev';
                                        break;
                                    case 0:
                                        stateClassName = 'current';
                                        break;
                                    case 1:
                                        stateClassName = 'next';
                                        break;
                                    case 2:
                                        stateClassName = 'next-hiding';
                                        break;
                                }

                                const getClickHandler = (offset: number): (() => void) | undefined => {
                                    if (offset === -1) return prevImage;
                                    if (offset === 1) return nextImage;
                                    if (offset === 0) return openOverlay;
                                    return undefined;
                                };

                                return isVisible ? (
                                    <div
                                        key={index}
                                        className={`carousel-image-wrapper ${stateClassName}`}
                                        onClick={getClickHandler(offset)}
                                    >
                                        <img
                                            src={image}
                                            alt={`Project gallery image ${index + 1}`}
                                            className="carousel-image"
                                        />
                                    </div>
                                ) : null;
                            })}
                        </div>
                        <div className={`carousel-arrow-wrapper right ${currentImage >= galleryImages.length - 1 ? 'hidden' : ''}`}>
                            <SentientIOB as="button" className="carousel-arrow" onClick={nextImage} {...createTooltipHandlers('next image')}>
                                <TbChevronRight size={24} />
                            </SentientIOB>
                        </div>

                        {/* Seeker */}
                        <div className="carousel-seeker">
                            {galleryImages.map((_, index) => (
                                <span
                                    key={index}
                                    className={`seeker-dot ${index === currentImage ? 'active' : ''}`}
                                    onClick={() => setCurrentImage(index)}
                                    {...createTooltipHandlers(`image ${index + 1}`)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="project-view-section">
                <div className="section-subtitle-container">
                    <h2 className="section-subtitle">Links</h2>
                </div>
                <div className="project-social-icons">
                    {projectLinks.map(({ key, url, icon: IconCmp, label }) => 
                        url && (
                            <SentientIOB key={key} href={url} as="a" {...createTooltipHandlers(label)}>
                                <IconCmp size={24} />
                            </SentientIOB>
                        )
                    )}
                    {projectSocials.map(({ key, url, icon: IconCmp, label }) => 
                        url && (
                            <SentientIOB key={key} href={url} as="a" {...createTooltipHandlers(label)}>
                                <IconCmp size={24} />
                            </SentientIOB>
                        )
                    )}
                </div>
            </section>

        </main>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*"
            aria-label="Header picture upload"
        />

        {/* ==========================
         *  IMAGE OVERLAY MODAL
         * ========================== */}
        {createPortal(
            <AnimatePresence>
                {isOverlayVisible && (
                    <motion.div
                        className="image-overlay"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={handleOverlayBackgroundClick}
                    >
                        {/* A new container to handle the animation layering */}
                        <motion.div className="modal-container" variants={modalVariants}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentImage}
                                    className="image-modal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <img
                                        src={galleryImages[currentImage]}
                                        alt="Enlarged project"
                                        className="overlay-image"
                                    />
                                    <div className="edit-controls overlay-close-controls">
                                        <SentientIOB
                                            as="button"
                                            hoverScale={1}
                                            onClick={closeOverlay}
                                            {...createTooltipHandlers('close')}
                                        >
                                            <TbX size={18} />
                                        </SentientIOB>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>

                        {/* Bottom Controls - Positioned absolutely by CSS */}
                        <motion.div
                            className="overlay-controls-wrapper"
                            variants={controlsVariants}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Left Arrow */}
                            <div className={`carousel-arrow-wrapper overlay-arrow ${currentImage === 0 ? 'hidden' : ''}`}>
                                <SentientIOB as="button" className="carousel-arrow" onClick={prevImage} {...createTooltipHandlers('previous image')}>
                                    <TbChevronLeft size={24} />
                                </SentientIOB>
                            </div>

                            {/* Seeker */}
                            <div className="overlay-seeker">
                                {galleryImages.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`seeker-dot ${index === currentImage ? 'active' : ''}`}
                                        onClick={() => setCurrentImage(index)}
                                        {...createTooltipHandlers(`image ${index + 1}`)}
                                    />
                                ))}
                            </div>

                            {/* Right Arrow */}
                            <div className={`carousel-arrow-wrapper overlay-arrow ${currentImage >= galleryImages.length - 1 ? 'hidden' : ''}`}>
                                <SentientIOB as="button" className="carousel-arrow" onClick={nextImage} {...createTooltipHandlers('next image')}>
                                    <TbChevronRight size={24} />
                                </SentientIOB>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}
    </div>
  );
};

export default ProjectView; 