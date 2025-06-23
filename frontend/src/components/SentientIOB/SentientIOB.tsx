import SentientButton from '../SentientButton';
import './SentientIOB.css';
import React, { MouseEvent } from 'react';
import { useCursor } from '../../contexts/CursorContext';

interface SentientIOBProps {
    href?: string;
    children: React.ReactNode; // expected to be an icon
    className?: string;
    as?: 'a' | 'button' | 'div' | 'span';
    onClick?: (e: MouseEvent<HTMLElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    /**
     * Scale factor applied to the icon on hover (how small it becomes inside the housing).
     * Default is 0.9 (matches chevron behaviour).
     */
    hoverScale?: number;
}

/**
 * SentientIOB – Sentient Icon-Only Button
 *
 * A lightweight wrapper around SentientButton that provides icon-only button styling
 * as defined in the design-system (IOB guidelines). It supports the same flexible
 * element rendering via the `as` prop and inherits the sentient cursor-tracking
 * interaction. Simply pass the icon as children.
 */
const SentientIOB: React.FC<SentientIOBProps> = ({
    href,
    children,
    className = '',
    as = 'button',
    onClick,
    type = 'button',
    disabled = false,
    hoverScale = 0.9,
}) => {
    // Merge custom class with the generic style
    const mergedClass = `sentient-iob ${className}`.trim();

    const style: React.CSSProperties = {
        // Expose the CSS variable for hover scale so CSS can reference it
        // Using a string ensures proper CSS value formatting
        ['--iob-hover-scale' as any]: hoverScale,
    };

    return (
        <SentientButton
            href={href}
            className={mergedClass}
            as={as}
            onClick={onClick}
            type={type}
            disabled={disabled}
            style={style}
        >
            {children}
        </SentientButton>
    );
};

export default SentientIOB; 