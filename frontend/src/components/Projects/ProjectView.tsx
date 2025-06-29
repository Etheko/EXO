import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../../types/Project';
import './ProjectView.css';
import { backendUrl } from '../../services/api';
import SentientButton from '../SentientButton';
import SentientIOB from '../SentientIOB';
import TechnologyIcon from './TechnologyIcon';
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbBrandGithub, TbBrandInstagram, TbBrandFacebook, TbBrandX, TbBrandMastodon, TbBrandBluesky, TbBrandTiktok, TbExternalLink, TbHome, TbUpload, TbX, TbCheck, TbEdit, TbPlus, TbPhoto, TbIcons, TbTrash } from 'react-icons/tb';
import LoginService from '../../services/LoginService';
import ProjectService from '../../services/ProjectsService';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';
import ImageOverlay from '../ImageOverlay';
import SocialEditWindow from '../SocialEditWindow';

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
    const [newIconPic, setNewIconPic] = useState<{ file: File; previewUrl: string } | null>(null);
    const headerFileInputRef = useRef<HTMLInputElement>(null);
    const iconFileInputRef = useRef<HTMLInputElement>(null);
    const { showError } = useError();
    const [currentProject, setCurrentProject] = useState<Project>(project);

    const headerImageUrl = newHeaderPic ? newHeaderPic.previewUrl : getImageUrl(currentProject.headerPictureString);
    const iconUrl = newIconPic ? newIconPic.previewUrl : getImageUrl(currentProject.iconString);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [draftTitle, setDraftTitle] = useState('');

    /* ==========================
     *     EDIT STATE LOGIC
     * ==========================
     */
    type SectionKey = 'description' | 'technologies' | 'links' | 'gallery';
    const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
    const [hoverSection, setHoverSection] = useState<SectionKey | null>(null);

    // Description state
    const [descriptionInput, setDescriptionInput] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Technologies state
    const [draftTechnologies, setDraftTechnologies] = useState<string[]>([]);
    const [newTechnologyInput, setNewTechnologyInput] = useState('');

    // Links draft state
    const [draftLinks, setDraftLinks] = useState<Partial<Project>>({});
    const [linkModal, setLinkModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });

    // Gallery draft state
    const [draftGallery, setDraftGallery] = useState<string[]>([]);
    const [imagesToAdd, setImagesToAdd] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const galleryFileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic opacity for edit controls
    const [editControlsOpacity, setEditControlsOpacity] = useState<Record<SectionKey, number>>({
        description: 0,
        technologies: 0,
        links: 0,
        gallery: 0,
    });
    const editControlsRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({});
    const MAX_DISTANCE = 200;

    const updateOpacityForSection = (section: SectionKey, mouseX: number, mouseY: number) => {
        const ref = editControlsRefs.current[section];
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(mouseX - cx, 2) + Math.pow(mouseY - cy, 2));
        const opacity = Math.max(0, Math.min(1, 1 - distance / MAX_DISTANCE));
        setEditControlsOpacity(prev => (prev[section] === opacity ? prev : { ...prev, [section]: opacity }));
    };

    const handleMouseMove = (event: React.MouseEvent, section: SectionKey) => {
        if (!isAdmin || editingSection === section) return;
        updateOpacityForSection(section, event.clientX, event.clientY);
    };

    const handleMouseLeaveSection = (section: SectionKey) => {
        if (!isAdmin) return;
        setEditControlsOpacity(prev => ({ ...prev, [section]: 0 }));
        setHoverSection(null);
    };

    useEffect(() => {
        if (editingSection) {
            setEditControlsOpacity(prev => ({ ...prev, [editingSection]: 1 }));
        }
    }, [editingSection]);

    // Auto-resize textarea
    const autoResizeTextarea = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    };

    useEffect(() => {
        if (editingSection === 'description' && textareaRef.current) {
            autoResizeTextarea(textareaRef.current);
        }
    }, [editingSection, descriptionInput]);

    useEffect(() => {
        if (editingSection !== 'description') {
            setDescriptionInput(currentProject.description);
        }
    }, [currentProject.description, editingSection]);
    
    // Save handler
    const handleSave = async (section: SectionKey) => {
        if (!currentProject.id) return;

        let payload: Partial<Project> = {};
        if (section === 'description') {
            payload = { description: descriptionInput };
        } else if (section === 'technologies') {
            payload = { technologies: draftTechnologies };
        } else if (section === 'links') {
            payload = { ...draftLinks };
        }

        if (section === 'gallery') {
            try {
                // First, handle deletions (remove by index starting from highest)
                const deletionIndexes = imagesToDelete
                    .map((path) => galleryImages.indexOf(path))
                    .filter((i) => i >= 0)
                    .sort((a, b) => b - a);

                for (const idx of deletionIndexes) {
                    await ProjectService.removeGalleryImage(currentProject.id, idx);
                }

                // Handle additions, if any
                if (imagesToAdd.length > 0) {
                    await ProjectService.updateGallery(currentProject.id, [], imagesToAdd);
                }

                // Refresh gallery from backend
                const newPaths = await ProjectService.getGalleryPaths(currentProject.id);
                const updatedImages = newPaths.map(getImageUrl);
                setGalleryImages(updatedImages);

                // Adjust currentImage index if the previously viewed image was deleted
                const deletionsBeforeCurrent = deletionIndexes.filter(i => i <= currentImage).length;
                let newIndex = currentImage - deletionsBeforeCurrent;
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= updatedImages.length) newIndex = updatedImages.length - 1;
                setCurrentImage(newIndex >=0 ? newIndex : 0);
            } catch (error) {
                console.error(`Failed to save ${section}`, error);
                showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, `Failed to update project ${section}.`);
            }
        } else {
            try {
                const updated = await ProjectService.updateProject(currentProject.id, {
                    ...currentProject,
                    ...payload,
                });
                setCurrentProject(updated);
            } catch (error) {
                console.error(`Failed to save ${section}`, error);
                showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, `Failed to update project ${section}.`);
            }
        }
        setEditingSection(null);
    };

    // Cancel handler
    const handleCancel = () => {
        // Reset draft states from master state
        setDescriptionInput(currentProject.description);
        setDraftTechnologies(currentProject.technologies);
        setNewTechnologyInput('');
        setDraftLinks({});
        // Reset gallery state
        imagesToAdd.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file)));
        setImagesToAdd([]);
        setImagesToDelete([]);
        // Determine if current image is a newly added preview (blob url)
        const wasViewingTempImage = editingSection === 'gallery' && draftGallery[currentImage]?.startsWith('blob:');
        setDraftGallery([...galleryImages]);
        if (wasViewingTempImage && galleryImages.length > 0) {
            setCurrentImage(galleryImages.length - 1);
        }
        setEditingSection(null);
    };
    
    const handleStartEditing = (section: SectionKey) => {
        if (section === 'description') {
            setDescriptionInput(currentProject.description);
        } else if (section === 'technologies') {
            setDraftTechnologies([...currentProject.technologies]);
        } else if (section === 'links') {
            setDraftLinks({ ...currentProject });
        } else if (section === 'gallery') {
            setDraftGallery([...galleryImages]);
            setImagesToAdd([]);
            setImagesToDelete([]);
        }
        setEditingSection(section);
    };

    // Technology handlers
    const addTechnology = () => {
        if (newTechnologyInput.trim()) {
            setDraftTechnologies(prev => [...prev, newTechnologyInput.trim()]);
            setNewTechnologyInput('');
        }
    };

    const removeTechnology = (techToRemove: string) => {
        setDraftTechnologies(prev => prev.filter(tech => tech !== techToRemove));
    };

    const handleTechInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTechnology();
        }
    };
    
    const renderEditControls = (section: SectionKey) => {
        if (!isAdmin) return null;
    
        const commonProps = { as: 'button', hoverScale: 1 } as const;
        const isEditing = editingSection === section;
        const opacity = editControlsOpacity[section] ?? 0;
        const scale = 0.8 + 0.2 * opacity;
    
        return (
            <div
                className="edit-controls description-edit-controls"
                ref={el => { if (el) editControlsRefs.current[section] = el; }}
                style={{ opacity: isEditing ? 1 : opacity, transform: `scale(${isEditing ? 1 : scale})` }}
            >
                {isEditing ? (
                    <>
                        {section === 'gallery' && (
                            <SentientIOB {...commonProps} onClick={() => galleryFileInputRef.current?.click()} {...createTooltipHandlers('add image')}>
                                <TbPlus size={18} />
                            </SentientIOB>
                        )}
                        <SentientIOB {...commonProps} onClick={handleCancel} {...createTooltipHandlers('cancel')}>
                            <TbX size={18} />
                        </SentientIOB>
                        <SentientIOB {...commonProps} onClick={() => handleSave(section)} {...createTooltipHandlers('save')}>
                            <TbCheck size={18} />
                        </SentientIOB>
                    </>
                ) : (
                    hoverSection === section && (
                        <SentientIOB {...commonProps} onClick={() => handleStartEditing(section)} {...createTooltipHandlers('edit')}>
                            <TbEdit size={18} />
                        </SentientIOB>
                    )
                )}
            </div>
        );
    };

    const getActiveGalleryLength = () => editingSection === 'gallery' ? draftGallery.length : galleryImages.length;

    const nextImage = () => {
        const len = getActiveGalleryLength();
        if (len === 0) return;
        setCurrentImage((prev) => (prev + 1) % len);
    };

    const prevImage = () => {
        const len = getActiveGalleryLength();
        if (len === 0) return;
        setCurrentImage((prev) => (prev - 1 + len) % len);
    };
    
    const handleHeaderFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleIconFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (newIconPic) {
                URL.revokeObjectURL(newIconPic.previewUrl);
            }
            setNewIconPic({
                file,
                previewUrl: URL.createObjectURL(file),
            });
            event.target.value = '';
        }
    };

    const handleSaveImageChanges = async () => {
        if (!currentProject.id) return;
        
        try {
            let projectAfterUpdate = currentProject;
    
            if (newHeaderPic) {
                projectAfterUpdate = await ProjectService.uploadHeaderPicture(projectAfterUpdate.id!, newHeaderPic.file);
            }
            if (newIconPic) {
                projectAfterUpdate = await ProjectService.uploadIcon(projectAfterUpdate.id!, newIconPic.file);
            }
    
            setCurrentProject(projectAfterUpdate);
    
            if (newHeaderPic) URL.revokeObjectURL(newHeaderPic.previewUrl);
            if (newIconPic) URL.revokeObjectURL(newIconPic.previewUrl);
            
            setNewHeaderPic(null);
            setNewIconPic(null);
        } catch (error) {
            console.error("Failed to upload image(s)", error);
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to upload new image(s).');
        }
    };

    const handleCancelImageChanges = () => {
        if (newHeaderPic) URL.revokeObjectURL(newHeaderPic.previewUrl);
        if (newIconPic) URL.revokeObjectURL(newIconPic.previewUrl);
        setNewHeaderPic(null);
        setNewIconPic(null);
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

    const showUploadOverlay = isAdmin && isHoveringHeader && !newHeaderPic && !newIconPic;

    // Overlay visibility helpers
    const openOverlay = () => setIsOverlayVisible(true);
    const closeOverlay = () => setIsOverlayVisible(false);

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
     *        LINKS EDITING
     * ==========================
     */
    const mapLinkKeyToProp = (k: string): keyof Project => {
        switch (k) {
            case 'liveDemo':
                return 'liveDemoUrl';
            case 'website':
                return 'projectWebsiteUrl';
            case 'github':
            case 'instagram':
            case 'facebook':
            case 'mastodon':
            case 'bluesky':
            case 'tiktok':
                return k as keyof Project;
            case 'x':
                return 'xUsername';
            default:
                return k as keyof Project;
        }
    };

    // Gallery handlers
    const handleAddGalleryImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            setImagesToAdd(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setDraftGallery(prev => [...prev, ...newPreviews]);
        }
        event.target.value = '';
    };

    const handleDeleteImage = (imagePath: string) => {
        // If it's a newly added preview, remove it directly
        if (imagePath.startsWith('blob:')) {
            const indexToRemove = draftGallery.indexOf(imagePath);
            const fileIndexToRemove = indexToRemove - (draftGallery.length - imagesToAdd.length);
            
            setImagesToAdd(prev => prev.filter((_, i) => i !== fileIndexToRemove));
            setDraftGallery(prev => prev.filter(p => p !== imagePath));
            URL.revokeObjectURL(imagePath);
        } else {
            // If it's an existing image, mark it for deletion
            if (imagesToDelete.includes(imagePath)) {
                setImagesToDelete(prev => prev.filter(p => p !== imagePath));
            } else {
                setImagesToDelete(prev => [...prev, imagePath]);
            }
        }
    };

    const handleStartEditTitle = () => {
        setDraftTitle(currentProject.title);
        setIsEditingTitle(true);
    };

    const handleCancelEditTitle = () => {
        setIsEditingTitle(false);
        setDraftTitle('');
    };

    const handleSaveTitle = async () => {
        if (!currentProject.id || draftTitle.trim() === '' || draftTitle === currentProject.title) {
            handleCancelEditTitle();
            return;
        }
    
        try {
            const updated = await ProjectService.updateProject(currentProject.id, {
                ...currentProject,
                title: draftTitle,
            });
            setCurrentProject(updated);
            handleCancelEditTitle();
        } catch (error) {
            console.error("Failed to update project title", error);
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to update project title.');
        }
    };

  return (
    <div className="project-view">
        <header 
            className="project-view-header" 
            onMouseEnter={() => isAdmin && setIsHoveringHeader(true)}
            onMouseLeave={() => isAdmin && setIsHoveringHeader(false)}
        >
            <div 
                className="project-view-header-background"
                style={{ backgroundImage: `url(${headerImageUrl})` }}
            ></div>
            <div className="project-view-header-content">
                <div className="project-view-icon-wrapper">
                {iconUrl && <img src={iconUrl} alt={`${currentProject.title} icon`} className="project-view-icon" />}
                </div>
                {isEditingTitle ? (
                    <input
                        title="Project title"
                        placeholder="Project title"
                        type="text"
                        className="project-view-title-input"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') handleCancelEditTitle();
                        }}
                        autoFocus
                    />
                ) : (
                    <h1 className="project-view-title">{currentProject.title}</h1>
                )}
            </div>
            
            <div 
                className="edit-controls header-hover-controls"
                style={{ opacity: isAdmin && (isHoveringHeader || newHeaderPic || newIconPic || isEditingTitle) ? 1 : 0 }}
            >
                {isEditingTitle ? (
                    <>
                        <SentientIOB as="button" hoverScale={1} onClick={handleCancelEditTitle} {...createTooltipHandlers('cancel')}>
                            <TbX size={18} />
                        </SentientIOB>
                        <SentientIOB as="button" hoverScale={1} onClick={handleSaveTitle} {...createTooltipHandlers('save')}>
                            <TbCheck size={18} />
                        </SentientIOB>
                    </>
                ) : newHeaderPic || newIconPic ? (
                    <>
                        <SentientIOB as="button" hoverScale={1} onClick={handleCancelImageChanges} {...createTooltipHandlers('cancel')}>
                            <TbX size={18} />
                        </SentientIOB>
                        <SentientIOB as="button" hoverScale={1} onClick={handleSaveImageChanges} {...createTooltipHandlers('save')}>
                            <TbCheck size={18} />
                        </SentientIOB>
                    </>
                ) : (
                    <>
                        <SentientIOB as="button" hoverScale={1} onClick={handleStartEditTitle} {...createTooltipHandlers('edit title')}>
                            <TbEdit size={18} />
                        </SentientIOB>
                        <SentientIOB as="button" hoverScale={1} onClick={() => iconFileInputRef.current?.click()} {...createTooltipHandlers('change icon')}>
                            <TbIcons size={18} />
                        </SentientIOB>
                        <SentientIOB as="button" hoverScale={1} onClick={() => headerFileInputRef.current?.click()} {...createTooltipHandlers('change banner')}>
                            <TbPhoto size={18} />
                        </SentientIOB>
                    </>
                )}
                </div>
        </header>

        <main className="project-view-content">
            <section className="project-view-section">
                <div className="section-subtitle-container">
                    <h2 className="section-subtitle">What is this?</h2>
                </div>
                <div
                    className={`description-card ${isAdmin ? 'editable-section' : ''} ${editingSection === 'description' ? 'editing' : ''}`}
                    onMouseEnter={() => isAdmin && setHoverSection('description')}
                    onMouseLeave={() => handleMouseLeaveSection('description')}
                    onMouseMove={(e) => handleMouseMove(e, 'description')}
                >
                    {renderEditControls('description')}

                    {/* Description Content */}
                    {editingSection === 'description' ? (
                        <textarea
                            ref={textareaRef}
                            value={descriptionInput}
                            placeholder="Enter project description..."
                            onChange={e => setDescriptionInput(e.target.value)}
                            onInput={e => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                        />
                    ) : (
                        (currentProject.description || '').split('\n').map((line, index) => (
                        <p key={index} className="description-text">
                            {line || '\u00A0'} 
                        </p>
                        ))
                    )}
                </div>
            </section>

            {currentProject.technologies && currentProject.technologies.length > 0 && (
                <section 
                    className={`project-view-section ${isAdmin ? 'editable-section' : ''} ${editingSection === 'technologies' ? 'editing' : ''}`}
                    onMouseEnter={() => isAdmin && setHoverSection('technologies')}
                    onMouseLeave={() => handleMouseLeaveSection('technologies')}
                    onMouseMove={(e) => handleMouseMove(e, 'technologies')}
                >
                    {renderEditControls('technologies')}
                    <div className="section-subtitle-container">
                        <h2 className="section-subtitle">Built With</h2>
                    </div>
                    <div className="project-technologies-view">
                        {(editingSection === 'technologies' ? draftTechnologies : currentProject.technologies).map((tech, index) => (
                            <span key={index} className="technology-tag">
                                <TechnologyIcon technology={tech} />
                                <span>{tech}</span>
                                {editingSection === 'technologies' && (
                                    <button
                                        className="technology-tag-remove"
                                        onClick={() => removeTechnology(tech)}
                                        {...createTooltipHandlers('remove')}
                                    >
                                        <TbX size={12} />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                    {editingSection === 'technologies' && (
                        <div className="technology-input-container">
                            <input
                                className="login-input"
                                value={newTechnologyInput}
                                onChange={(e) => setNewTechnologyInput(e.target.value)}
                                onKeyPress={handleTechInputKeyPress}
                                placeholder="Add a technology..."
                            />
                            <SentientIOB
                                as="button"
                                onClick={addTechnology}
                                disabled={!newTechnologyInput.trim()}
                                {...createTooltipHandlers('add')}
                            >
                                <TbPlus size={16} />
                            </SentientIOB>
                        </div>
                    )}
                </section>
            )}

            {(galleryImages.length > 0 || isAdmin) && (
                <section
                    className={`project-view-section ${isAdmin ? 'editable-section' : ''} ${editingSection === 'gallery' ? 'editing' : ''}`}
                    onMouseEnter={() => isAdmin && setHoverSection('gallery')}
                    onMouseLeave={() => handleMouseLeaveSection('gallery')}
                    onMouseMove={(e) => handleMouseMove(e, 'gallery')}
                >
                    {renderEditControls('gallery')}
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
                            {(editingSection === 'gallery' ? draftGallery : galleryImages).map((image, index) => {
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
                                
                                const isMarkedForDeletion = editingSection === 'gallery' && imagesToDelete.includes(image);

                                return isVisible ? (
                                    <div
                                        key={index}
                                        className={`carousel-image-wrapper ${stateClassName} ${isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                                        onClick={getClickHandler(offset)}
                                    >
                                        <img
                                            src={image}
                                            alt={`Project gallery image ${index + 1}`}
                                            className="carousel-image"
                                        />
                                        {editingSection === 'gallery' && offset === 0 && (
                                            <div className="edit-controls image-delete-controls">
                                                <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); handleDeleteImage(image); }} {...createTooltipHandlers(isMarkedForDeletion ? 'unmark for deletion' : 'delete image')}>
                                                    <TbTrash size={18} />
                                                </SentientIOB>
                                            </div>
                                        )}
                                    </div>
                                ) : null;
                            })}
                            {(editingSection === 'gallery' ? draftGallery : galleryImages).length === 0 && (
                                <div className="carousel-image-wrapper current placeholder-wrapper" onClick={() => editingSection==='gallery' && galleryFileInputRef.current?.click()}>
                                    <div className="placeholder-content">Upload images</div>
                                </div>
                            )}
                        </div>
                        <div className={`carousel-arrow-wrapper right ${currentImage >= ((editingSection === 'gallery') ? draftGallery.length : galleryImages.length) - 1 ? 'hidden' : ''}`}>
                            <SentientIOB as="button" className="carousel-arrow" onClick={nextImage} {...createTooltipHandlers('next image')}>
                                <TbChevronRight size={24} />
                            </SentientIOB>
                        </div>

                        {/* Seeker */}
                        <div className="carousel-seeker">
                            {(editingSection === 'gallery' ? draftGallery : galleryImages).map((_, index) => (
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

            {/* Links Section */}
            <section 
                className={`project-view-section ${isAdmin ? 'editable-section' : ''} ${editingSection === 'links' ? 'editing' : ''}`}
                onMouseEnter={() => isAdmin && setHoverSection('links')}
                onMouseLeave={() => handleMouseLeaveSection('links')}
                onMouseMove={(e) => handleMouseMove(e, 'links')}
            >
                {renderEditControls('links')}
                <div className="section-subtitle-container">
                    <h2 className="section-subtitle">Links</h2>
                </div>
                <div className="project-social-icons">
                    {[...projectLinks, ...projectSocials].map(({ key, url, icon: IconCmp, label }) => {
                        const prop = mapLinkKeyToProp(key);
                        const effectiveUrl = editingSection === 'links' ? (draftLinks[prop] as string | undefined) : url;

                        if (editingSection === 'links') {
                            const isActive = Boolean(effectiveUrl);
                            return (
                                <SentientIOB
                                    key={key}
                                    as="button"
                                    className={isActive ? 'social-icon-active' : ''}
                                    onClick={() => setLinkModal({ key, visible: true })}
                                    {...createTooltipHandlers(label)}
                                >
                                <IconCmp size={24} />
                            </SentientIOB>
                            );
                        }

                        if (effectiveUrl) {
                            return (
                                <SentientIOB key={key} href={effectiveUrl} as="a" {...createTooltipHandlers(label)}>
                                <IconCmp size={24} />
                            </SentientIOB>
                            );
                        }

                        // Show disabled icon only for admins; hide completely for regular users
                        if (isAdmin) {
                            return (
                                <span key={key} className="disabled-social-icon" title={label}>
                                    <IconCmp size={24} />
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>
            </section>

        </main>
        <input
            type="file"
            ref={headerFileInputRef}
            onChange={handleHeaderFileSelect}
            style={{ display: 'none' }}
            accept=".jpg, .jpeg, .png, .gif"
            aria-label="Header picture upload"
        />
        <input
            type="file"
            ref={iconFileInputRef}
            onChange={handleIconFileSelect}
            style={{ display: 'none' }}
            accept=".jpg, .jpeg, .png, .gif"
            aria-label="Icon picture upload"
        />

        {/* Image Overlay */}
        <ImageOverlay
            images={editingSection === 'gallery' ? draftGallery : galleryImages}
            isOpen={isOverlayVisible}
            currentIndex={currentImage}
            onClose={closeOverlay}
            onPrev={prevImage}
            onNext={nextImage}
            onSelect={setCurrentImage}
        />

        {/* Link Edit Window */}
        <SocialEditWindow
            isVisible={linkModal.visible}
            label={linkModal.key}
            currentValue={(draftLinks[mapLinkKeyToProp(linkModal.key)] as string | undefined) ?? ''}
            onSave={(value) => {
                if (editingSection === 'links') {
                    setDraftLinks(prev => ({ ...prev, [mapLinkKeyToProp(linkModal.key)]: value }));
                }
            }}
            onClose={() => setLinkModal({ key: '', visible: false })}
        />

        <input
            type="file"
            multiple
            ref={galleryFileInputRef}
            onChange={handleAddGalleryImages}
            style={{ display: 'none' }}
            accept=".jpg, .jpeg, .png, .gif"
            aria-label="Gallery picture upload"
        />
    </div>
  );
};

export default ProjectView;
