export interface CV {
    id?: number;
    title?: string;
    filePath?: string;
    uploadedDate?: string; // ISO date string (YYYY-MM-DD)
    fileUrl?: string;
    createdAt?: string; // ISO datetime string
    updatedAt?: string; // ISO datetime string
} 