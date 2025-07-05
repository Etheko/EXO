import { motion, AnimatePresence, Transition } from 'framer-motion';
import React from 'react';

interface SmoothTogglerProps {
    isToggled: boolean;
    untoggledContent: React.ReactNode;
    toggledContent: React.ReactNode;
    containerClassName?: string;
    animationMode?: 'wait' | 'popLayout';
    scaleAmount?: number;
    blurAmount?: number;
    enterTransition?: Transition;
    exitTransition?: Transition;
}

const defaultEnterTransition: Transition = {
    scale: { type: 'spring', stiffness: 220, damping: 20 },
    filter: { duration: 0.35, ease: 'easeOut' },
    opacity: { duration: 0.35, ease: 'easeOut' },
};

const defaultExitTransition: Transition = {
    scale: { duration: 0.2, ease: 'easeIn' },
    filter: { duration: 0.2, ease: 'easeIn' },
    opacity: { duration: 0.2, ease: 'easeIn' },
};

const SmoothToggler: React.FC<SmoothTogglerProps> = ({
    isToggled,
    untoggledContent,
    toggledContent,
    containerClassName,
    animationMode = 'popLayout',
    scaleAmount = 0.5,
    blurAmount = 4,
    enterTransition = defaultEnterTransition,
    exitTransition = defaultExitTransition,
}) => {
    const animationVariants = {
        initial: {
            scale: scaleAmount,
            filter: `blur(${blurAmount}px)`,
            opacity: 0,
        },
        animate: {
            scale: 1,
            filter: 'blur(0px)',
            opacity: 1,
            transition: enterTransition,
        },
        exit: {
            scale: scaleAmount,
            filter: `blur(${blurAmount}px)`,
            opacity: 0,
            transition: exitTransition,
        },
    };

    return (
        <div className={containerClassName} style={{ position: 'relative' }}>
            <AnimatePresence mode={animationMode}>
                <motion.div
                    key={isToggled ? 'toggled' : 'untoggled'}
                    variants={animationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                >
                    {isToggled ? toggledContent : untoggledContent}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SmoothToggler; 