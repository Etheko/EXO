import React, { useRef, MouseEvent } from 'react';

interface SentientButtonProps {
    href: string;
    children: React.ReactNode;
    intensity?: number;
    scaleIntensity?: number;
    className?: string;
}

const SentientButton: React.FC<SentientButtonProps> = ({ 
    href, 
    children, 
    intensity = 0.05, 
    scaleIntensity = 1.05,
    className 
}) => {
    const buttonRef = useRef<HTMLAnchorElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const moveFactor = intensity;
        const translateX = x * moveFactor;
        const translateY = y * moveFactor;

        button.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleIntensity})`;
        button.style.transition = 'transform 0.1s ease-out';
    };

    const handleMouseLeave = () => {
        const button = buttonRef.current;
        if (!button) return;
        
        button.style.transform = 'translate(0, 0) scale(1)';
        button.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    };

    return (
        <a
            ref={buttonRef}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${className}`}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </a>
    );
};

export default SentientButton; 