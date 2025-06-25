export interface Course {
    id?: number;
    title: string;
    provider: string;
    platform?: string;
    startDate?: string; // ISO date string (YYYY-MM-DD)
    completionDate?: string; // ISO date string (YYYY-MM-DD)
    durationHours?: number;
    description?: string;
    topics?: string[];
    courseUrl?: string;
    imagePath?: string;
    certificate?: any; // Reference to Certificate entity
    createdAt?: string; // ISO datetime string
    updatedAt?: string; // ISO datetime string
} 