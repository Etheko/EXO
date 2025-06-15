import api from './api';
import type { Project } from '../types/Project';

class ProjectService {
    // Get all projects
    async getAllProjects(): Promise<Project[]> {
        const response = await api.get<Project[]>('/projects');
        return response.data;
    }

    // Get a single project by ID
    async getProjectById(id: number): Promise<Project> {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    }

    // Create a new project
    async createProject(project: Project): Promise<Project> {
        const response = await api.post<Project>('/projects', project);
        return response.data;
    }

    // Update an existing project
    async updateProject(id: number, project: Project): Promise<Project> {
        const response = await api.put<Project>(`/projects/${id}`, project);
        return response.data;
    }

    // Delete a project
    async deleteProject(id: number): Promise<void> {
        await api.delete(`/projects/${id}`);
    }
}

export default new ProjectService(); 