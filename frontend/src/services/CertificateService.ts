import api from './api';
import type { Certificate } from '../types/Certificate';

class CertificateService {
    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    // Get all certificates
    async getAllCertificates(): Promise<Certificate[]> {
        const response = await api.get<Certificate[]>('/certificates');
        return response.data;
    }

    // Get a single certificate by ID
    async getCertificateById(id: number): Promise<Certificate> {
        const response = await api.get<Certificate>(`/certificates/${id}`);
        return response.data;
    }

    // Create a new certificate
    async createCertificate(certificate: Certificate): Promise<Certificate> {
        const response = await api.post<Certificate>('/certificates', certificate);
        return response.data;
    }

    // Update an existing certificate
    async updateCertificate(id: number, certificate: Certificate): Promise<Certificate> {
        const response = await api.put<Certificate>(`/certificates/${id}`, certificate);
        return response.data;
    }

    // Delete a certificate
    async deleteCertificate(id: number): Promise<void> {
        await api.delete(`/certificates/${id}`);
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    // Get certificates by issuer
    async getCertificatesByIssuer(issuer: string): Promise<Certificate[]> {
        const response = await api.get<Certificate[]>(`/certificates/issuer/${encodeURIComponent(issuer)}`);
        return response.data;
    }

    // Search certificates by title keyword
    async searchCertificatesByTitle(keyword: string): Promise<Certificate[]> {
        const response = await api.get<Certificate[]>(`/certificates/search?keyword=${encodeURIComponent(keyword)}`);
        return response.data;
    }

    /* ==========================
     *      CERTIFICATE MANAGEMENT
     * ==========================
     */

    // Create a certificate with details
    async createCertificateWithDetails(
        title: string,
        issuer: string,
        issueDate?: string,
        expirationDate?: string,
        credentialId?: string,
        credentialUrl?: string,
        description?: string,
        imagePath?: string
    ): Promise<Certificate> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('issuer', issuer);
        if (issueDate) params.append('issueDate', issueDate);
        if (expirationDate) params.append('expirationDate', expirationDate);
        if (credentialId) params.append('credentialId', credentialId);
        if (credentialUrl) params.append('credentialUrl', credentialUrl);
        if (description) params.append('description', description);
        if (imagePath) params.append('imagePath', imagePath);

        const response = await api.post<Certificate>(`/certificates/create?${params.toString()}`);
        return response.data;
    }

    // Update a certificate with details
    async updateCertificateWithDetails(
        id: number,
        title: string,
        issuer: string,
        issueDate?: string,
        expirationDate?: string,
        credentialId?: string,
        credentialUrl?: string,
        description?: string,
        imagePath?: string
    ): Promise<Certificate> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('issuer', issuer);
        if (issueDate) params.append('issueDate', issueDate);
        if (expirationDate) params.append('expirationDate', expirationDate);
        if (credentialId) params.append('credentialId', credentialId);
        if (credentialUrl) params.append('credentialUrl', credentialUrl);
        if (description) params.append('description', description);
        if (imagePath) params.append('imagePath', imagePath);

        const response = await api.put<Certificate>(`/certificates/${id}/update?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      VALIDATION & UTILITIES
     * ==========================
     */

    // Check if a certificate is expired
    async isCertificateExpired(id: number): Promise<boolean> {
        const response = await api.get<boolean>(`/certificates/${id}/expired`);
        return response.data;
    }

    // Get all expired certificates
    async getExpiredCertificates(): Promise<Certificate[]> {
        const response = await api.get<Certificate[]>('/certificates/expired');
        return response.data;
    }

    // Get all valid (non-expired) certificates
    async getValidCertificates(): Promise<Certificate[]> {
        const response = await api.get<Certificate[]>('/certificates/valid');
        return response.data;
    }

    /* ==========================
     *      UTILITY METHODS
     * ==========================
     */

    // Check if a certificate is valid (not expired) based on current date
    isCertificateValid(certificate: Certificate): boolean {
        if (!certificate.expirationDate) {
            return true; // No expiration date means it's always valid
        }
        
        const expirationDate = new Date(certificate.expirationDate);
        const currentDate = new Date();
        
        return expirationDate > currentDate;
    }

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

    // Get certificate status (Valid, Expired, or No Expiration)
    getCertificateStatus(certificate: Certificate): string {
        if (!certificate.expirationDate) {
            return 'No Expiration';
        }
        
        return this.isCertificateValid(certificate) ? 'Valid' : 'Expired';
    }

    // Filter certificates by status
    filterCertificatesByStatus(certificates: Certificate[], status: 'all' | 'valid' | 'expired' | 'no-expiration'): Certificate[] {
        switch (status) {
            case 'valid':
                return certificates.filter(cert => this.isCertificateValid(cert) && cert.expirationDate);
            case 'expired':
                return certificates.filter(cert => !this.isCertificateValid(cert) && cert.expirationDate);
            case 'no-expiration':
                return certificates.filter(cert => !cert.expirationDate);
            default:
                return certificates;
        }
    }
}

export default new CertificateService();
