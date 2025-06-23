import React, { useRef, MouseEvent, useCallback } from 'react';
import { useCursor } from '../../contexts/CursorContext';

interface SentientButtonProps {
    href?: string;
    children: React.ReactNode;
    intensity?: number;
    scaleIntensity?: number;
    className?: string;
    as?: 'a' | 'button' | 'div' | 'span';
    onClick?: (e: MouseEvent<HTMLElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

const SentientButton: React.FC<SentientButtonProps> = ({ 
    href, 
    children, 
    intensity = 0.09, 
    scaleIntensity = 1.06,
    className,
    as = 'a',
    onClick,
    type = 'button',
    disabled = false
}) => {
    const buttonRef = useRef<HTMLElement>(null);
    const animationFrameRef = useRef<number>();
    const { setCursorState } = useCursor();

    const handleMouseMove = useCallback((e: MouseEvent<HTMLElement>) => {
        const button = buttonRef.current;
        if (!button) return;

        // Cancel previous animation frame to avoid stacking
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const moveFactor = intensity;
            const translateX = x * moveFactor;
            const translateY = y * moveFactor;

            // Use CSS custom properties and transform3d for hardware acceleration
            button.style.setProperty('--translate-x', `${translateX}px`);
            button.style.setProperty('--translate-y', `${translateY}px`);
            button.style.setProperty('--scale', scaleIntensity.toString());
            button.style.transform = `translate3d(var(--translate-x, 0), var(--translate-y, 0), 0) scale(var(--scale, 1))`;
        });
    }, [intensity, scaleIntensity]);

    const handleMouseLeave = useCallback(() => {
        const button = buttonRef.current;
        if (!button) return;
        
        // Cancel any pending animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
        
        // Apply smoother transition for mouse leave
        button.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Reset to default state with smooth transition
        button.style.setProperty('--translate-x', '0px');
        button.style.setProperty('--translate-y', '0px');
        button.style.setProperty('--scale', '1');
        button.style.transform = `translate3d(var(--translate-x, 0), var(--translate-y, 0), 0) scale(var(--scale, 1))`;
        
        // Reset transition back to fast for mouse moves
        setTimeout(() => {
            if (button) {
                button.style.transition = 'transform 0.1s ease-out';
            }
        }, 300);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setCursorState('hovering');
    }, [setCursorState]);

    const handleMouseLeaveComplete = useCallback(() => {
        handleMouseLeave();
        setCursorState('default');
    }, [handleMouseLeave, setCursorState]);

    const handleClick = useCallback((e: MouseEvent<HTMLElement>) => {
        if (onClick) {
            onClick(e);
        }
        e.stopPropagation();
    }, [onClick]);

    const commonProps = {
        ref: buttonRef as any,
        className: `${className}`,
        style: {
            // Set up CSS transitions once
            transition: 'transform 0.1s ease-out',
            willChange: 'transform', // Hint to browser for optimization
        },
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeaveComplete,
        onClick: handleClick,
    };

    // Render different element types based on the 'as' prop
    switch (as) {
        case 'button':
            return (
                <button
                    {...commonProps}
                    type={type}
                    disabled={disabled}
                >
                    {children}
                </button>
            );
        
        case 'div':
            return (
                <div
                    {...commonProps}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    {...(disabled && { 'aria-disabled': 'true' })}
                >
                    {children}
                </div>
            );
        
        case 'span':
            return (
                <span
                    {...commonProps}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    {...(disabled && { 'aria-disabled': 'true' })}
                >
                    {children}
                </span>
            );
        
        case 'a':
        default:
            return (
                <a
                    {...commonProps}
                    href={href}
                    target={href?.startsWith('http') ? "_blank" : undefined}
                    rel={href?.startsWith('http') ? "noopener noreferrer" : undefined}
                    tabIndex={disabled ? -1 : 0}
                    {...(disabled && { 'aria-disabled': 'true' })}
                >
                    {children}
                </a>
            );
    }
};

export default SentientButton; 