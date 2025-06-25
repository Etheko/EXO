// Project type definition
export type Project = {
    id?: number;
    title: string;
    description: string;
    
    // Header picture
    headerPictureString?: string;
    
    // Gallery (paths to images)
    gallery?: string[];
    
    // Technologies
    technologies: string[];
    
    // Project links
    liveDemoUrl?: string;
    projectWebsiteUrl?: string;
    
    // Social media links
    github?: string;
    instagram?: string;
    facebook?: string;
    xUsername?: string; // Formerly Twitter
    mastodon?: string;
    bluesky?: string;
    tiktok?: string;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
};

// Project creation/update DTO
export type ProjectCreateRequest = {
    title: string;
    description: string;
    headerPicturePath?: string;
    technologies: string[];
    liveDemoUrl?: string;
    projectWebsiteUrl?: string;
    github?: string;
    instagram?: string;
    facebook?: string;
    xUsername?: string;
    mastodon?: string;
    bluesky?: string;
    tiktok?: string;
};

// Project search/filter options
export type ProjectSearchOptions = {
    query?: string;
    technologies?: string[];
    hasLiveDemo?: boolean;
    hasGithub?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
};

// Technology statistics
export type TechnologyStats = {
    technology: string;
    count: number;
}; 