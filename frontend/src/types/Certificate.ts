export interface Certificate {
    id?: number;
    title: string;
    issuer: string;
    issueDate?: string; // ISO date string (YYYY-MM-DD)
    expirationDate?: string; // ISO date string (YYYY-MM-DD)
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
    imagePath?: string;
    createdAt?: string; // ISO datetime string
    updatedAt?: string; // ISO datetime string
} 