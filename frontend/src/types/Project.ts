// Project type definition
export type Project = {
    id?: number;
    title: string;
    description: string;
    imageUrl?: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}; 