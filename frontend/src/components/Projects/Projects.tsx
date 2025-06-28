import { useEffect, useState, useMemo } from 'react';
import ProjectService from '../../services/ProjectsService';
import SectionService from '../../services/SectionService';
import './Projects.css';
import TechnologyIcon from './TechnologyIcon';
import { TbBrandGithub, TbExternalLink } from 'react-icons/tb';
import SentientButton from '../SentientButton';
import LoadingSpinner from '../LoadingSpinner';
import { Project } from '../../types/Project';
import { Section } from '../../types/Section';

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

    useEffect(() => {
        const fetchProjects = async () => {
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
        };

        const fetchSection = async () => {
            try {
                const sectionData = await SectionService.getSectionBySlug('projects');
                setSection(sectionData);
            } catch (err) {
                setError('Failed to load section data');
                console.error('Error fetching section:', err);
            } finally {
                setSectionLoading(false);
            }
        };

        fetchProjects();
        fetchSection();
    }, []);

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

    const renderProjectCard = (project: Project, index: number) => (
        <div key={project.id} className="project-card" onClick={() => onProjectSelected(project)}>
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
            <div className="project-technologies">
                {project.technologies.map((tech, index) => (
                    <span
                        key={index}
                        className="technology-tag"
                    >
                        <TechnologyIcon technology={tech} />
                        <span>{tech}</span>
                    </span>
                ))}
            </div>
            <div className="project-links">
                {project.github && (
                    <SentientButton href={project.github} className="project-button" as="a">
                        <TbBrandGithub size={20} />
                        <span>GitHub</span>
                    </SentientButton>
                )}
                {project.liveDemoUrl && (
                    <SentientButton href={project.liveDemoUrl} className="project-button" as="a">
                        <TbExternalLink size={20} />
                        <span>Live Demo</span>
                    </SentientButton>
                )}
            </div>
        </div>
    );

    return (
        <div className="projects-component">
            <header className="projects-header">
                <div className="projects-header-content">
                    <h1 className="projects-title">{section?.title || 'My Projects'}</h1>
                </div>
            </header>
            <main className="projects-content">
                {ongoingProjects.length > 0 && (
                    <section className="projects-section">
                        <div className="section-subtitle-container">
                            <h2 className="section-subtitle">On-going</h2>
                        </div>
                        <div className="projects-grid">
                            {ongoingProjects.map(renderProjectCard)}
                        </div>
                    </section>
                )}

                {finishedProjects.length > 0 && (
                    <section className="projects-section">
                        <div className="section-subtitle-container">
                            <h2 className="section-subtitle">Finished</h2>
                        </div>
                        <div className="projects-grid">
                            {finishedProjects.map(renderProjectCard)}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Projects; 