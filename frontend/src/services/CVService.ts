import api from './api';
import type { CV } from '../types/CV';

class CVService {
    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    // Get all CVs
    async getAllCVs(): Promise<CV[]> {
        const response = await api.get<CV[]>('/cvs');
        return response.data;
    }

    // Get a single CV by ID
    async getCVById(id: number): Promise<CV> {
        const response = await api.get<CV>(`/cvs/${id}`);
        return response.data;
    }

    // Create a new CV
    async createCV(cv: CV): Promise<CV> {
        const response = await api.post<CV>('/cvs', cv);
        return response.data;
    }

    // Update an existing CV
    async updateCV(id: number, cv: CV): Promise<CV> {
        const response = await api.put<CV>(`/cvs/${id}`, cv);
        return response.data;
    }

    // Delete a CV
    async deleteCV(id: number): Promise<void> {
        await api.delete(`/cvs/${id}`);
    }

    /* ==========================
     *      CV MANAGEMENT
     * ==========================
     */

    // Create a CV with details
    async createCVWithDetails(
        title: string,
        filePath?: string,
        fileUrl?: string
    ): Promise<CV> {
        const params = new URLSearchParams();
        params.append('title', title);
        if (filePath) params.append('filePath', filePath);
        if (fileUrl) params.append('fileUrl', fileUrl);

        const response = await api.post<CV>(`/cvs/create?${params.toString()}`);
        return response.data;
    }

    // Update a CV with details
    async updateCVWithDetails(
        id: number,
        title: string,
        filePath?: string,
        fileUrl?: string
    ): Promise<CV> {
        const params = new URLSearchParams();
        params.append('title', title);
        if (filePath) params.append('filePath', filePath);
        if (fileUrl) params.append('fileUrl', fileUrl);

        const response = await api.put<CV>(`/cvs/${id}/update?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      UTILITIES
     * ==========================
     */

    // Get the latest CV
    async getLatestCV(): Promise<CV> {
        const response = await api.get<CV>('/cvs/latest');
        return response.data;
    }

    // Check if there is an active CV
    async hasActiveCV(): Promise<boolean> {
        const response = await api.get<boolean>('/cvs/has-active');
        return response.data;
    }

    // Update just the CV file
    async updateCVFile(id: number, newFilePath: string): Promise<CV> {
        const params = new URLSearchParams();
        params.append('newFilePath', newFilePath);

        const response = await api.put<CV>(`/cvs/${id}/file?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      UTILITY METHODS
     * ==========================
     */

    // Format date for display
    formatDate(dateString?: string): string {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Get file extension from file path
    getFileExtension(filePath?: string): string {
        if (!filePath) return '';
        
        const lastDotIndex = filePath.lastIndexOf('.');
        return lastDotIndex > -1 ? filePath.substring(lastDotIndex + 1).toLowerCase() : '';
    }

    // Check if file is a PDF
    isPDFFile(filePath?: string): boolean {
        return this.getFileExtension(filePath) === 'pdf';
    }

    // Get file name from path
    getFileName(filePath?: string): string {
        if (!filePath) return 'Unknown File';
        
        const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        return lastSlashIndex > -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
    }

    // Get file size in human readable format (if available)
    formatFileSize(bytes?: number): string {
        if (!bytes || bytes === 0) return 'Unknown size';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Generate download URL for CV
    getDownloadUrl(cv: CV): string | null {
        if (cv.fileUrl) {
            return cv.fileUrl;
        }
        
        if (cv.filePath) {
            // Assuming the backend serves static files from /api/cvs/download/{id}
            return `/api/cvs/download/${cv.id}`;
        }
        
        return null;
    }

    // Check if CV has a downloadable file
    hasDownloadableFile(cv: CV): boolean {
        return !!(cv.fileUrl || cv.filePath);
    }

    // Get CV display title
    getDisplayTitle(cv: CV): string {
        if (cv.title) {
            return cv.title;
        }
        
        if (cv.filePath) {
            return this.getFileName(cv.filePath);
        }
        
        return 'Untitled CV';
    }

    // Sort CVs by upload date (newest first)
    sortCVsByDate(cvs: CV[]): CV[] {
        return [...cvs].sort((a, b) => {
            const dateA = a.uploadedDate ? new Date(a.uploadedDate).getTime() : 0;
            const dateB = b.uploadedDate ? new Date(b.uploadedDate).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Filter CVs by file type
    filterCVsByFileType(cvs: CV[], fileType: 'all' | 'pdf' | 'other'): CV[] {
        switch (fileType) {
            case 'pdf':
                return cvs.filter(cv => this.isPDFFile(cv.filePath));
            case 'other':
                return cvs.filter(cv => !this.isPDFFile(cv.filePath));
            default:
                return cvs;
        }
    }
}

export default new CVService();
