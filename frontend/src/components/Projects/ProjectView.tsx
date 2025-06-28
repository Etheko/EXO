import { Project } from '../../types/Project';
import { useState, useRef, useEffect } from 'react';
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

                                return isVisible ? (
                                    <div
                                        key={index}
                                        className={`carousel-image-wrapper ${stateClassName}`}
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
    </div>
  );
};

export default ProjectView; 