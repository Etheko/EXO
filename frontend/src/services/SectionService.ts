import api from './api';
import type { Section } from '../types/Section';

class SectionService {
    // Get all sections
    async getAllSections(): Promise<Section[]> {
        const response = await api.get<Section[]>('/sections');
        return response.data;
    }

    // Get all published sections
    async getPublishedSections(): Promise<Section[]> {
        const response = await api.get<Section[]>('/sections/published');
        return response.data;
    }

    // Get all sections ordered by display order
    async getAllSectionsOrdered(): Promise<Section[]> {
        const response = await api.get<Section[]>('/sections/ordered');
        return response.data;
    }

    // Get a single section by ID
    async getSectionById(id: number): Promise<Section> {
        const response = await api.get<Section>(`/sections/${id}`);
        return response.data;
    }

    // Get a section by slug
    async getSectionBySlug(slug: string): Promise<Section> {
        const response = await api.get<Section>(`/sections/slug/${slug}`);
        return response.data;
    }

    // Create a new section
    async createSection(section: Section): Promise<Section> {
        const response = await api.post<Section>('/sections', section);
        return response.data;
    }

    // Create a section with details
    async createSectionWithDetails(
        slug: string,
        title: string,
        content: string,
        description?: string,
        displayOrder?: number,
        published: boolean = true,
        componentType?: string
    ): Promise<Section> {
        const params = new URLSearchParams();
        params.append('slug', slug);
        params.append('title', title);
        params.append('content', content);
        if (description) params.append('description', description);
        if (displayOrder !== undefined) params.append('displayOrder', displayOrder.toString());
        params.append('published', published.toString());
        if (componentType) params.append('componentType', componentType);

        const response = await api.post<Section>(`/sections/create?${params.toString()}`);
        return response.data;
    }

    // Update an existing section
    async updateSection(id: number, section: Section): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}`, section);
        return response.data;
    }

    // Update section with details
    async updateSectionWithDetails(
        id: number,
        slug?: string,
        title?: string,
        description?: string,
        content?: string,
        displayOrder?: number,
        published?: boolean,
        componentType?: string
    ): Promise<Section> {
        const params = new URLSearchParams();
        if (slug) params.append('slug', slug);
        if (title) params.append('title', title);
        if (description) params.append('description', description);
        if (content) params.append('content', content);
        if (displayOrder !== undefined) params.append('displayOrder', displayOrder.toString());
        if (published !== undefined) params.append('published', published.toString());
        if (componentType) params.append('componentType', componentType);

        const response = await api.put<Section>(`/sections/${id}/update?${params.toString()}`);
        return response.data;
    }

    // Delete a section
    async deleteSection(id: number): Promise<void> {
        await api.delete(`/sections/${id}`);
    }

    // Publish a section
    async publishSection(id: number): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/publish`);
        return response.data;
    }

    // Unpublish a section
    async unpublishSection(id: number): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/unpublish`);
        return response.data;
    }

    // Update display order
    async updateDisplayOrder(id: number, newOrder: number): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/order?newOrder=${newOrder}`);
        return response.data;
    }

    // Reorder multiple sections
    async reorderSections(sectionIds: number[]): Promise<Section[]> {
        const response = await api.put<Section[]>('/sections/reorder', sectionIds);
        return response.data;
    }

    // Update section content
    async updateContent(id: number, content: string): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/content?content=${encodeURIComponent(content)}`);
        return response.data;
    }

    // Update section title
    async updateTitle(id: number, title: string): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/title?title=${encodeURIComponent(title)}`);
        return response.data;
    }

    // Update section description
    async updateDescription(id: number, description: string): Promise<Section> {
        const response = await api.put<Section>(`/sections/${id}/description?description=${encodeURIComponent(description)}`);
        return response.data;
    }
}

export default new SectionService();
