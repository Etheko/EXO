import { useEffect, useState, useMemo, useCallback } from 'react';
import ProjectService from '../../services/ProjectsService';
import SectionService from '../../services/SectionService';
import './Projects.css';
import { TbCircleArrowUpRight, TbCircleArrowUpRightFilled, TbEdit, TbCheck, TbX, TbTrash, TbPlus, TbProgress, TbProgressCheck } from 'react-icons/tb';
import LoadingSpinner from '../LoadingSpinner';
import { Project } from '../../types/Project';
import { Section } from '../../types/Section';
import LoginService from '../../services/LoginService';
import SentientIOB from '../SentientIOB';
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';
import SmoothToggler from '../SmoothToggler';

const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
});

interface ProjectsProps {
    onProjectSelected: (project: Project) => void;
    onBackToIndex: () => void;
}

const Projects = ({ onProjectSelected, onBackToIndex }: ProjectsProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [section, setSection] = useState<Section | null>(null);
    const [loading, setLoading] = useState(true);
    const [sectionLoading, setSectionLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingSection, setEditingSection] = useState<'ongoing' | 'finished' | null>(null);
    const [projectsToDelete, setProjectsToDelete] = useState<number[]>([]);
    const [hoverSection, setHoverSection] = useState<'ongoing' | 'finished' | null>(null);
    const { showError } = useError();
    const [selectionMode, setSelectionMode] = useState<'moving-to-finished' | 'moving-to-ongoing' | null>(null);
    const [projectsToMove, setProjectsToMove] = useState<number[]>([]);
    const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
            try {
                const data = await ProjectService.getAllProjects();
                setProjects(data.content);
                setError(null);
            } catch (err) {
                setError('Failed to fetch projects');
                console.error('Error fetching projects:', err);
            } finally {
                setLoading(false);
            }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            await fetchProjects();
            
            try {
                const sectionData = await SectionService.getSectionBySlug('projects');
                setSection(sectionData);
            } catch (err) {
                setError(prev => prev || 'Failed to load section data');
                console.error('Error fetching section:', err);
            } finally {
                setSectionLoading(false);
            }
        };

        setIsAdmin(LoginService.isCurrentUserAdmin());
        fetchInitialData();
    }, [fetchProjects]);

    const { ongoingProjects, finishedProjects } = useMemo(() => {
        const ongoing = projects.filter(p => !p.finished);
        const finished = projects.filter(p => p.finished);
        return { ongoingProjects: ongoing, finishedProjects: finished };
    }, [projects]);

    if (loading || sectionLoading) {
        return <LoadingSpinner fullViewport={false} />;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    const handleStartEditing = (section: 'ongoing' | 'finished') => {
        setEditingSection(section);
        setProjectsToDelete([]);
    };

    const handleCancelEdit = () => {
        setEditingSection(null);
        setProjectsToDelete([]);
        setSelectionMode(null);
        setProjectsToMove([]);
    };

    const handleConfirmDeletions = async () => {
        if (projectsToDelete.length === 0) {
            handleCancelEdit();
            return;
        }

        try {
            await Promise.all(
                projectsToDelete.map(id => ProjectService.deleteProject(id))
            );

            // Update local state
            setProjects(prev => prev.filter(p => p.id && !projectsToDelete.includes(p.id)));
            
            handleCancelEdit();

        } catch (err) {
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to delete one or more projects.');
            console.error('Error deleting projects:', err);
        }
    };

    const handleCreateProject = async (finished: boolean) => {
        try {
            const newProject = await ProjectService.createDefaultProject(finished);
            onProjectSelected(newProject);
        } catch (err) {
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to create a new project.');
            console.error('Error creating project:', err);
        }
    };

    const toggleMarkForDeletion = (projectId: number) => {
        setProjectsToDelete(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const toggleProjectToMove = (projectId: number) => {
        setProjectsToMove(prev => 
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleStartSelectionMode = (mode: 'moving-to-finished' | 'moving-to-ongoing') => {
        setSelectionMode(mode);
        setProjectsToMove([]);
    };

    const handleConfirmMove = async () => {
        if (projectsToMove.length === 0) {
            handleCancelEdit();
            return;
        }

        const newFinishedStatus = selectionMode === 'moving-to-finished';

        try {
            await ProjectService.batchUpdateProjectsStatus(projectsToMove, newFinishedStatus);
            await fetchProjects(); // Refetch data
            handleCancelEdit(); // Reset state
        } catch (err) {
            showError(ERROR_CODES.INTERNAL.DATA_UPDATE_FAILED, 'Failed to move projects.');
            console.error('Error moving projects:', err);
        }
    };

    const renderEditControls = (section: 'ongoing' | 'finished') => {
        if (!isAdmin) return null;

        const commonProps = { as: 'button', hoverScale: 1 } as const;
        const isEditing = editingSection === section;
        const isSelecting = selectionMode !== null;

        if (isEditing && isSelecting) {
             return (
                <div className="edit-controls section-edit-controls">
                    <SentientIOB {...commonProps} onClick={handleCancelEdit} {...createTooltipHandlers('cancel move')}>
                        <TbX size={18} />
                    </SentientIOB>
                    <SentientIOB {...commonProps} onClick={handleConfirmMove} {...createTooltipHandlers('confirm move')}>
                        <TbCheck size={18} />
                    </SentientIOB>
                </div>
            )
        }

        return (
            <div
                className="edit-controls section-edit-controls"
                style={{ opacity: isEditing || hoverSection === section ? 1 : 0 }}
            >
                {isEditing ? (
                    <>
                        <SentientIOB {...commonProps} onClick={() => section === 'ongoing' ? handleStartSelectionMode('moving-to-finished') : handleStartSelectionMode('moving-to-ongoing')} {...createTooltipHandlers(section === 'ongoing' ? 'move to finished' : 'move to on-going')}>
                           {section === 'ongoing' ? <TbProgressCheck size={18} /> : <TbProgress size={18}/>}
                        </SentientIOB>
                        <SentientIOB {...commonProps} onClick={() => handleCreateProject(section === 'finished')} {...createTooltipHandlers('new project')}>
                            <TbPlus size={18} />
                        </SentientIOB>
                        <SentientIOB {...commonProps} onClick={handleCancelEdit} {...createTooltipHandlers('cancel')}>
                            <TbX size={18} />
                        </SentientIOB>
                        <SentientIOB {...commonProps} onClick={handleConfirmDeletions} {...createTooltipHandlers('confirm delete')}>
                            <TbCheck size={18} />
                        </SentientIOB>
                    </>
                ) : (
                    <SentientIOB {...commonProps} onClick={() => handleStartEditing(section)} {...createTooltipHandlers('edit section')}>
                        <TbEdit size={18} />
                    </SentientIOB>
                )}
            </div>
        );
    };

    const renderProjectCard = (project: Project, index: number, sectionKey: 'ongoing' | 'finished') => {
        const isEditingThisSection = editingSection === sectionKey;
        const isMarkedForDeletion = project.id ? projectsToDelete.includes(project.id) : false;
        
        const isSelectionModeActive = (sectionKey === 'ongoing' && selectionMode === 'moving-to-finished') || 
                                      (sectionKey === 'finished' && selectionMode === 'moving-to-ongoing');
        const isMarkedForMove = project.id ? projectsToMove.includes(project.id) : false;
        const isHovered = hoveredProjectId === project.id;

        const handleCardClick = () => {
            if (isSelectionModeActive && project.id) {
                toggleProjectToMove(project.id);
            } else if (!isEditingThisSection) {
                onProjectSelected(project);
            }
        };

        return (
            <div 
                key={project.id} 
                className={`project-card ${isMarkedForDeletion ? 'marked-for-deletion' : ''} ${isMarkedForMove ? 'marked-for-move' : ''}`}
                onClick={handleCardClick}
                onMouseEnter={() => project.id && setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
            >
                {isEditingThisSection && !isSelectionModeActive && project.id && (
                    <div className="edit-controls card-edit-controls">
                        <SentientIOB as="button" hoverScale={1} onClick={(e) => { e.stopPropagation(); toggleMarkForDeletion(project.id!)}} {...createTooltipHandlers('delete')}>
                            <TbTrash size={18} />
                        </SentientIOB>
                    </div>
                )}
            <div className="project-enum-icon-container">
                {project.iconString ? (
                    <img
                        src={
                            project.iconString.startsWith('/assets')
                                ? `${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080'}${project.iconString}`
                                : project.iconString
                        }
                        alt={`${project.title} icon`}
                        className="project-icon"
                    />
                ) : (
                    <div className="project-enumeration">{(index + 1).toString().padStart(2, '0')}</div>
                )}
            </div>
            <h3 className="project-title-card">{project.title}</h3>
            <p className="project-description">{project.description}</p>
            <div className="card-arrow-wrapper">
                <SmoothToggler
                    containerClassName="arrow-toggler"
                    isToggled={isHovered}
                    toggledContent={<TbCircleArrowUpRightFilled size={24} />}
                    untoggledContent={<TbCircleArrowUpRight size={24} className="icon-unfilled" />}
                />
            </div>
        </div>
    );
    };

    return (
        <div className="projects-component">
            <header className="projects-header">
                <div className="projects-header-content">
                    <h1 className="projects-title">{section?.title || 'My Projects'}</h1>
                </div>
            </header>
            <main className="projects-content">
                {ongoingProjects.length > 0 && (
                    <section 
                        className={`projects-section ${isAdmin ? 'editable-section' : ''} ${editingSection === 'ongoing' ? 'editing' : ''}`}
                        onMouseEnter={() => isAdmin && setHoverSection('ongoing')}
                        onMouseLeave={() => isAdmin && setHoverSection(null)}
                    >
                        {renderEditControls('ongoing')}
                        <div className="section-subtitle-container">
                            <h2 className="section-subtitle">On-going</h2>
                        </div>
                        <div className="projects-grid">
                            {ongoingProjects.map((p, i) => renderProjectCard(p, i, 'ongoing'))}
                        </div>
                    </section>
                )}

                {finishedProjects.length > 0 && (
                    <section 
                        className={`projects-section ${isAdmin ? 'editable-section' : ''} ${editingSection === 'finished' ? 'editing' : ''}`}
                        onMouseEnter={() => isAdmin && setHoverSection('finished')}
                        onMouseLeave={() => isAdmin && setHoverSection(null)}
                    >
                        {renderEditControls('finished')}
                        <div className="section-subtitle-container">
                            <h2 className="section-subtitle">Finished</h2>
                        </div>
                        <div className="projects-grid">
                            {finishedProjects.map((p, i) => renderProjectCard(p, i, 'finished'))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Projects; 