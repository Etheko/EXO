// Section type definition
export type Section = {
    id?: number;
    slug: string;
    title: string;
    description?: string;
    content?: string;
    displayOrder?: number;
    published?: boolean;
    componentType?: string; // "projects", "blog", "about", "tech-stack", etc.
    createdAt?: Date;
    updatedAt?: Date;
};
