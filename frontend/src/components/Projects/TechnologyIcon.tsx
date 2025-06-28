import React from 'react';
import {
    TbBrandAngular,
    TbBrandCss3,
    TbBrandDocker,
    TbBrandFramerMotion,
    TbBrandGit,
    TbBrandHtml5,
    TbBrandJavascript,
    TbBrandNextjs,
    TbBrandNodejs,
    TbBrandPython,
    TbBrandReact,
    TbBrandTailwind,
    TbBrandThreejs,
    TbBrandTypescript,
    TbBrandVite,
    TbCoffee,
    TbDatabase,
    TbLeaf,
    TbSql,
} from 'react-icons/tb';

const iconMap: { [key: string]: React.ElementType } = {
    react: TbBrandReact,
    angular: TbBrandAngular,
    typescript: TbBrandTypescript,
    javascript: TbBrandJavascript,
    java: TbCoffee,
    springboot: TbLeaf,
    postgresql: TbDatabase,
    python: TbBrandPython,
    nextjs: TbBrandNextjs,
    nodejs: TbBrandNodejs,
    html: TbBrandHtml5,
    css: TbBrandCss3,
    tailwindcss: TbBrandTailwind,
    vite: TbBrandVite,
    threejs: TbBrandThreejs,
    framermotion: TbBrandFramerMotion,
    docker: TbBrandDocker,
    sql: TbSql,
    git: TbBrandGit,
};

const TechnologyIcon = ({ technology }: { technology: string }) => {
    const normalizedTech = technology.toLowerCase().replace(/ /g, '').replace('.', '');
    const IconComponent = iconMap[normalizedTech];

    if (!IconComponent) {
        return null;
    }

    return <IconComponent size={18} />;
};

export default TechnologyIcon; 