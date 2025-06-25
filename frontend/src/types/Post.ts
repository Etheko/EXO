export interface Post {
    id?: number;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    coverImagePath?: string;
    tags?: string[];
    likes?: number;
    views?: number;
    readingMinutes?: number;
    createdAt?: string; // ISO datetime string
    updatedAt?: string; // ISO datetime string
    publishedAt?: string; // ISO datetime string
    published?: boolean;
    author?: any; // Reference to User entity
} 