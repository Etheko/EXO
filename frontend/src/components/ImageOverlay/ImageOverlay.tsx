import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SentientIOB from '../SentientIOB';
import { TbChevronLeft, TbChevronRight, TbX } from 'react-icons/tb';
import './ImageOverlay.css';

// Utility: create tooltip handlers that broadcast tooltip text to Navbar
const createTooltipHandlers = (text: string) => ({
    onMouseEnter: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
    onTouchStart: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text } })),
    onTouchEnd: () => window.dispatchEvent(new CustomEvent('tooltipHover', { detail: { text: null } })),
});

interface ImageOverlayProps {
    images: string[];
    isOpen: boolean;
    currentIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onSelect: (index: number) => void;
}

const overlayVariants = {
    hidden: {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        backgroundColor: 'rgba(0, 0, 0, 0)'
    },
    visible: {
        opacity: 1,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
        }
    }
} as const;

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.175, 0.885, 0.32, 1.275],
            delay: 0.1,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
    },
};

const controlsVariants = {
    hidden: { y: 20, opacity: 0, x: '-50%' },
    visible: {
        y: 0,
        opacity: 1,
        x: '-50%',
        transition: { delay: 0.2, duration: 0.4, ease: 'easeOut' },
    },
    exit: { y: 20, opacity: 0, x: '-50%', transition: { duration: 0.3, ease: 'easeIn' } },
};

const ImageOverlay = ({
    images,
    isOpen,
    currentIndex,
    onClose,
    onPrev,
    onNext,
    onSelect,
}: ImageOverlayProps) => {
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Close overlay on global Escape press (in case modal isn't focused)
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="image-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleBackgroundClick}
                    onKeyDown={handleOverlayKeyDown}
                    tabIndex={-1}
                >
                    {/* Container to handle animation layering */}
                    <motion.div className="modal-container" variants={modalVariants}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                className="image-modal"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={images[currentIndex]}
                                    alt="Enlarged project"
                                    className="overlay-image"
                                />
                                <div className="edit-controls overlay-close-controls">
                                    <SentientIOB
                                        as="button"
                                        hoverScale={1}
                                        onClick={onClose}
                                        {...createTooltipHandlers('close')}
                                    >
                                        <TbX size={18} />
                                    </SentientIOB>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Bottom Controls */}
                    <motion.div
                        className="overlay-controls-wrapper"
                        variants={controlsVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Arrow */}
                        <div className={`carousel-arrow-wrapper overlay-arrow ${currentIndex === 0 ? 'hidden' : ''}`}>
                            <SentientIOB
                                as="button"
                                className="carousel-arrow"
                                onClick={onPrev}
                                {...createTooltipHandlers('previous image')}
                            >
                                <TbChevronLeft size={24} />
                            </SentientIOB>
                        </div>

                        {/* Seeker */}
                        <div className="overlay-seeker">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`seeker-dot ${index === currentIndex ? 'active' : ''}`}
                                    onClick={() => onSelect(index)}
                                    {...createTooltipHandlers(`image ${index + 1}`)}
                                />
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <div className={`carousel-arrow-wrapper overlay-arrow ${currentIndex >= images.length - 1 ? 'hidden' : ''}`}>
                            <SentientIOB
                                as="button"
                                className="carousel-arrow"
                                onClick={onNext}
                                {...createTooltipHandlers('next image')}
                            >
                                <TbChevronRight size={24} />
                            </SentientIOB>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ImageOverlay; 