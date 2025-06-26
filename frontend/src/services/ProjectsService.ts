import api from './api';
import type { Project, ProjectCreateRequest, ProjectSearchOptions, TechnologyStats } from '../types/Project';

class ProjectService {
    // Basic CRUD operations
    async getAllProjects(page = 0, size = 10, sortBy = 'createdAt', sortDir: 'asc' | 'desc' = 'desc'): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects', {
            params: { page, size, sortBy, sortDir }
        });
        return response.data;
    }

    async getProjectById(id: number): Promise<Project> {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    }

    async createProject(project: ProjectCreateRequest): Promise<Project> {
        const response = await api.post<Project>('/projects', project);
        return response.data;
    }

    async updateProject(id: number, project: ProjectCreateRequest): Promise<Project> {
        const response = await api.put<Project>(`/projects/${id}`, project);
        return response.data;
    }

    async deleteProject(id: number): Promise<void> {
        await api.delete(`/projects/${id}`);
    }

    // Search and filtering operations
    async searchProjects(query: string, page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/search', {
            params: { query, page, size }
        });
        return response.data;
    }

    async findByTitle(title: string, page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/by-title', {
            params: { title, page, size }
        });
        return response.data;
    }

    async findByTechnology(technology: string, page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/by-technology', {
            params: { technology, page, size }
        });
        return response.data;
    }

    async findByTechnologies(technologies: string[], page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/by-technologies', {
            params: { technologies, page, size }
        });
        return response.data;
    }

    // Date-based filtering
    async getRecentProjects(limit = 5): Promise<Project[]> {
        const response = await api.get<Project[]>('/projects/recent', {
            params: { limit }
        });
        return response.data;
    }

    async findByDateRange(startDate: string, endDate: string, page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/by-date-range', {
            params: { startDate, endDate, page, size }
        });
        return response.data;
    }

    // Link-based filtering
    async getProjectsWithLiveDemo(page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/with-live-demo', {
            params: { page, size }
        });
        return response.data;
    }

    async getProjectsWithGithub(page = 0, size = 10): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const response = await api.get('/projects/with-github', {
            params: { page, size }
        });
        return response.data;
    }

    // Gallery management
    async addGalleryImage(projectId: number, imagePath: string): Promise<void> {
        await api.post(`/projects/${projectId}/gallery`, null, {
            params: { imagePath }
        });
    }

    async removeGalleryImage(projectId: number, index: number): Promise<void> {
        await api.delete(`/projects/${projectId}/gallery/${index}`);
    }

    // Technology management
    async addTechnology(projectId: number, technology: string): Promise<void> {
        await api.post(`/projects/${projectId}/technologies`, null, {
            params: { technology }
        });
    }

    async removeTechnology(projectId: number, technology: string): Promise<void> {
        await api.delete(`/projects/${projectId}/technologies`, {
            params: { technology }
        });
    }

    // Header picture management
    async updateHeaderPicture(projectId: number, imagePath: string): Promise<void> {
        await api.put(`/projects/${projectId}/header-picture`, null, {
            params: { imagePath }
        });
    }

    // Statistics and analytics
    async getTechnologyStatistics(): Promise<TechnologyStats[]> {
        const response = await api.get<[string, number][]>('/projects/statistics/technologies');
        return response.data.map(([technology, count]) => ({ technology, count }));
    }

    async getProjectsWithMostTechnologies(limit = 5): Promise<Project[]> {
        const response = await api.get<Project[]>('/projects/most-technologies', {
            params: { limit }
        });
        return response.data;
    }

    // Validation
    async projectExists(id: number): Promise<boolean> {
        const response = await api.get<boolean>(`/projects/exists/${id}`);
        return response.data;
    }

    async projectTitleExists(title: string): Promise<boolean> {
        const response = await api.get<boolean>('/projects/exists/title', {
            params: { title }
        });
        return response.data;
    }

    // Advanced search with multiple filters
    async advancedSearch(options: ProjectSearchOptions): Promise<{ content: Project[], totalElements: number, totalPages: number }> {
        const params: any = {
            page: options.page || 0,
            size: options.size || 10,
            sortBy: options.sortBy || 'createdAt',
            sortDir: options.sortDir || 'desc'
        };

        if (options.query) {
            return this.searchProjects(options.query, params.page, params.size);
        }

        if (options.technologies && options.technologies.length > 0) {
            return this.findByTechnologies(options.technologies, params.page, params.size);
        }

        if (options.hasLiveDemo) {
            return this.getProjectsWithLiveDemo(params.page, params.size);
        }

        if (options.hasGithub) {
            return this.getProjectsWithGithub(params.page, params.size);
        }

        if (options.startDate && options.endDate) {
            return this.findByDateRange(options.startDate, options.endDate, params.page, params.size);
        }

        // Default to getting all projects
        return this.getAllProjects(params.page, params.size, params.sortBy, params.sortDir);
    }

    // Utility methods
    async getAllProjectsList(): Promise<Project[]> {
        const response = await api.get<Project[]>('/projects');
        return response.data;
    }

    async getProjectsByTechnology(technology: string): Promise<Project[]> {
        const response = await api.get<{ content: Project[] } | Project[]>('/projects/by-technology', {
            params: { technology, size: 1000 } // Get all projects with this technology
        });
        return Array.isArray(response.data) ? response.data : response.data.content;
    }
}

export default new ProjectService();