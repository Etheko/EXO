import { useEffect, useState } from 'react';
import projectService from '../../services/projectService';
import { Project } from '../../types/Project';
import './Projects.css';
import TechnologyIcon from './TechnologyIcon';
import { TbBrandGithub, TbExternalLink } from 'react-icons/tb';
import SentientButton from './SentientButton';

interface ProjectsProps {
    onProjectSelected: (project: Project) => void;
}

const Projects = ({ onProjectSelected }: ProjectsProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getAllProjects();
                setProjects(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch projects');
                console.error('Error fetching projects:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return <div className="text-center py-8">Loading projects...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    return (
        <div className="projects-component">
            <header className="projects-header">
                <h1 className="projects-title">My Projects</h1>
            </header>
            <main className="projects-content">
                <div className="projects-grid">
                    {projects.map((project, index) => (
                        <div key={project.id} className="project-card" onClick={() => onProjectSelected(project)}>
                            <div className="project-enumeration">{(index + 1).toString().padStart(2, '0')}</div>
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
                                {project.githubUrl && (
                                    <SentientButton href={project.githubUrl} className="project-button">
                                        <TbBrandGithub size={20} />
                                        <span>GitHub</span>
                                    </SentientButton>
                                )}
                                {project.liveUrl && (
                                    <SentientButton href={project.liveUrl} className="project-button">
                                        <TbExternalLink size={20} />
                                        <span>Live Demo</span>
                                    </SentientButton>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Projects; 