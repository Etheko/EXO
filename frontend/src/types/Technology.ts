// Technology type definition
export type Technology = {
    id?: number;
    name: string;
    description?: string;
    link?: string;

    // Icon image path stored in backend
    iconString?: string;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;

    // Category in which this technology is used (e.g., Backend, Frontend, Design)
    category?: string;
};

// Technology creation/update DTO
export type TechnologyCreateRequest = {
    name: string;
    description?: string;
    link?: string;
    iconPath?: string; // Optional path to an existing icon on the server
    category?: string;
};
