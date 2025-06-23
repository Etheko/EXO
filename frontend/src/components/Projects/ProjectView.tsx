import { Project } from '../../types/Project';

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

const ProjectView = ({ project, onBack }: ProjectViewProps) => {
  return (
    <div>
      <button onClick={onBack}>Back to Projects</button>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
    </div>
  );
};

export default ProjectView; 