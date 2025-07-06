import api from './api';
import type { Technology, TechnologyCreateRequest } from '../types/Technology';

class TechnologyService {
    // Basic CRUD operations
    async getAllTechnologies(page = 0, size = 10, sortBy = 'name', sortDir: 'asc'): Promise<{ content: Technology[], totalElements: number, totalPages: number }> {
        const response = await api.get('/technologies', {
            params: { page, size, sortBy, sortDir }
        });
        return response.data;
    }

    async getTechnologyById(id: number): Promise<Technology> {
        const response = await api.get<Technology>(`/technologies/${id}`);
        return response.data;
    }

    async createTechnology(technology: TechnologyCreateRequest): Promise<Technology> {
        // Map iconPath to iconString expected by backend if provided
        const payload: any = { ...technology };
        if (technology.iconPath) {
            payload.iconString = technology.iconPath;
            delete payload.iconPath;
        }
        const response = await api.post<Technology>('/technologies', payload);
        return response.data;
    }

    async updateTechnology(id: number, technology: TechnologyCreateRequest): Promise<Technology> {
        const payload: any = { ...technology };
        if (technology.iconPath) {
            payload.iconString = technology.iconPath;
            delete payload.iconPath;
        }
        const response = await api.put<Technology>(`/technologies/${id}`, payload);
        return response.data;
    }

    async deleteTechnology(id: number): Promise<void> {
        await api.delete(`/technologies/${id}`);
    }

    // Search
    async searchTechnologies(name: string, page = 0, size = 10): Promise<{ content: Technology[], totalElements: number, totalPages: number }> {
        const response = await api.get('/technologies/search', {
            params: { name, page, size }
        });
        return response.data;
    }

    // Icon management
    getIconUrl(technologyId: number): string {
        return `${api.defaults.baseURL}/technologies/${technologyId}/icon`;
    }

    async uploadIcon(technologyId: number, file: File): Promise<Technology> {
        const formData = new FormData();
        formData.append('icon', file);

        const response = await api.put<Technology>(`/technologies/${technologyId}/icon`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async updateIconPath(technologyId: number, imagePath: string): Promise<Technology> {
        const response = await api.put<Technology>(`/technologies/${technologyId}/icon-path`, null, {
            params: { imagePath }
        });
        return response.data;
    }

    // Validation
    async technologyExists(id: number): Promise<boolean> {
        const response = await api.get<boolean>(`/technologies/exists/${id}`);
        return response.data;
    }

    async technologyNameExists(name: string): Promise<boolean> {
        const response = await api.get<boolean>('/technologies/exists/name', {
            params: { name }
        });
        return response.data;
    }

    async getAllCategories(): Promise<string[]> {
        const response = await api.get<string[]>('/technologies/categories');
        return response.data;
    }
}

export default new TechnologyService();
