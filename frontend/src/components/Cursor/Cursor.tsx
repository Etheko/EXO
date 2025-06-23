import React, { useEffect, useRef } from 'react';
import './Cursor.css';
import { useCursor } from '../../contexts/CursorContext';

const Cursor: React.FC = () => {
    const cursorWrapperRef = useRef<HTMLDivElement>(null);
    const position = useRef({ x: 0, y: 0 });
    const { cursorState } = useCursor();

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            position.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', onMouseMove);

        let animationFrameId: number;
        const animate = () => {
            if (cursorWrapperRef.current) {
                cursorWrapperRef.current.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={cursorWrapperRef} className="custom-cursor-wrapper">
            <div className={`custom-cursor ${cursorState}`} />
        </div>
    );
};

export default Cursor; 