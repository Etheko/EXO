import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, Environment } from '@react-three/drei';
import { Group, Mesh, Vector2, MeshStandardMaterial, Color } from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { useSpring, a, to } from '@react-spring/three';
import { Character } from './Character';
import { CustomGrid } from './CustomGrid';
import MainFrame from './MainFrame';
import Projects from '../Projects';

interface CameraAnimatorProps {
  focusOnGrid: boolean;
  onAnimationComplete: () => void;
  onCameraAlmostAtText: () => void;
}

function CameraAnimator({ focusOnGrid, onAnimationComplete, onCameraAlmostAtText }: CameraAnimatorProps) {
  const { camera } = useThree();
  const almostAtTextFired = useRef(false);
  const [springs, api] = useSpring(() => ({
    position: [0, 0, 5],
    rotation: [0, 0, 0],
    config: { mass: 2, tension: 100, friction: 50 },
  }));

  useEffect(() => {
    if (focusOnGrid) {
      almostAtTextFired.current = false; // Reset when moving to grid
    }

    api.start({
      position: focusOnGrid ? [0, 4, 0.01] : [0, 0, 5],
      rotation: focusOnGrid ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
      onChange: ({ value }) => {
        const z = value.position[2];
        // Check if moving towards text and close enough
        if (!focusOnGrid && z > 4.5 && !almostAtTextFired.current) {
          onCameraAlmostAtText();
          almostAtTextFired.current = true;
        }
      },
      onRest: (result) => {
        if (result.finished && !focusOnGrid) {
          onAnimationComplete();
        }
      },
    });
  }, [focusOnGrid, api, onAnimationComplete, onCameraAlmostAtText]);

  useFrame(() => {
    const pos = springs.position.get();
    const rot = springs.rotation.get();
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(rot[0], rot[1], rot[2]);
  });

  return null;
}

interface FloatingTextProps {
  onAnimationComplete: () => void;
  fonts: {
    spaceGrotesk: Font;
    jua: Font;
  };
  isTextVisible: boolean;
  onDisappearAnimationComplete?: () => void;
}

function FloatingText({ onAnimationComplete, fonts, isTextVisible, onDisappearAnimationComplete }: FloatingTextProps) {
  const textRef = useRef<Group>(null);
  const [mouse, setMouse] = useState(new Vector2());

  // Animation state
  const [animationStep, setAnimationStep] = useState('blinkingCursor'); // blinkingCursor, typing, rising, idle
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'Etheko.';
  
  const [hoverStates, setHoverStates] = useState(() => Array(fullText.length).fill(false));
  const timersRef = useRef<Array<number | null>>(Array(fullText.length).fill(null));

  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
        timersRef.current.forEach(timerId => {
            if (timerId) {
                clearTimeout(timerId);
            }
        });
    };
  }, []);

  // Animation flow controller
  useEffect(() => {
    if (animationStep === 'blinkingCursor') {
        const timer = setTimeout(() => {
          setAnimationStep('typing');
        }, 3000);
        return () => clearTimeout(timer);
    } else if (animationStep === 'typing' && displayedText.length < fullText.length) {
        const typingSpeed = 150;
        const timer = setTimeout(() => {
            setDisplayedText(fullText.substring(0, displayedText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timer);
    } else if (animationStep === 'typing' && displayedText.length === fullText.length) {
        const timer = setTimeout(() => setAnimationStep('rising'), 1200); // Wait a bit after typing
        return () => clearTimeout(timer);
    }
  }, [animationStep, displayedText, fullText]);

  // Cursor blinking controller
  useEffect(() => {
    const isActivelyTyping = animationStep === 'typing' && displayedText.length < fullText.length;

    if (isActivelyTyping) {
        setShowCursor(true); // Solid cursor while typing
        return; // No interval needed
    }

    const shouldBlink = animationStep === 'blinkingCursor' || (animationStep === 'typing' && displayedText.length === fullText.length);

    if (shouldBlink) {
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);
        return () => clearInterval(cursorInterval);
    }

    // For all other cases ('rising', 'idle')
    setShowCursor(false);

  }, [animationStep, displayedText.length, fullText.length]);

  useEffect(() => {
    if (animationStep === 'idle') {
      onAnimationComplete();
    }
  }, [animationStep, onAnimationComplete]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      setMouse(new Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      ));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const initialY = -0.6;
  const finalY = -0.2;

  useFrame(() => {
    if (!textRef.current) return;

    if (animationStep === 'rising') {
        // Smoothly move up to initial resting position
        textRef.current.position.y += (finalY - textRef.current.position.y) * 0.05;
        if (Math.abs(textRef.current.position.y - finalY) < 0.001) {
            textRef.current.position.y = finalY;
            setAnimationStep('idle');
        }
    } else if (animationStep === 'idle') {
        // When button appears, smoothly move up to new resting position
        const targetY = finalY;
        textRef.current.position.y += (targetY - textRef.current.position.y) * 0.05;

        // Smoothed mouse move effect
        const targetRotationX = -mouse.y * 0.2;
        const targetRotationY = mouse.x * 0.2;
        textRef.current.rotation.x += (targetRotationX - textRef.current.rotation.x) * 0.05;
        textRef.current.rotation.y += (targetRotationY - textRef.current.rotation.y) * 0.05;
    }
  });

  const handlePointerOver = (index: number) => {
    if (animationStep !== 'idle') return;
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index]!);
      timersRef.current[index] = null;
    }
    setHoverStates(currentStates => {
        const newStates = [...currentStates];
        newStates[index] = true;
        return newStates;
    });
  };

  const handlePointerOut = (index: number) => {
    if (animationStep !== 'idle') return;
    timersRef.current[index] = window.setTimeout(() => {
        setHoverStates(currentStates => {
            const newStates = [...currentStates];
            newStates[index] = false;
            return newStates;
        });
        timersRef.current[index] = null;
    }, 2000);
  };

  const charWidthsCache = useMemo(() => {
    if (!fonts.spaceGrotesk || !fonts.jua) return null;

    const cache: { [key: string]: { normal: number; hovered: number } } = {};
    const uniqueChars = [...new Set(fullText.split(''))];

    uniqueChars.forEach(char => {
      // Normal width
      const normalGeom = new TextGeometry(char, { font: fonts.spaceGrotesk!, size: 0.6, depth: 0, curveSegments: 12, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0, bevelSegments: 5 });
      normalGeom.computeBoundingBox();
      const normalWidth = normalGeom.boundingBox!.max.x - normalGeom.boundingBox!.min.x;

      // Hovered width
      const hoveredGeom = new TextGeometry(char, { font: fonts.jua!, size: 0.6, depth: 0, curveSegments: 12, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0, bevelSegments: 5 });
      hoveredGeom.computeBoundingBox();
      const hoveredWidth = hoveredGeom.boundingBox!.max.x - hoveredGeom.boundingBox!.min.x;

      cache[char] = { normal: normalWidth, hovered: hoveredWidth };
    });

    return cache;
  }, [fonts]);

  const characters = useMemo(() => {
    if (!charWidthsCache) return [];
    
    let textToRender = '';
    if (animationStep === 'blinkingCursor') {
        textToRender = showCursor ? '_' : '';
    } else if (animationStep === 'typing') {
        textToRender = displayedText + (showCursor ? '_' : '');
    } else {
        textToRender = fullText;
    }

    const characterSpacing = 0.05;

    const characterWidths = textToRender.split('').map((char, index) => {
      const isHoverable = animationStep === 'idle';
      const isHovered = isHoverable && hoverStates[index];
      
      let width = charWidthsCache[char]?.normal ?? 0;
      if (isHovered) {
        width = charWidthsCache[char]?.hovered ?? 0;
      }
      
      // Apply scale factor for hovered character
      return isHovered ? width * 1.2 : width;
    });

    const totalWidth = characterWidths.reduce((a, b) => a + b, 0) + characterSpacing * (textToRender.length - 1);
    let currentX = -totalWidth / 2;

    return textToRender.split('').map((char, index) => {
      const charWidth = characterWidths[index];
      const position: [number, number, number] = [currentX + charWidth / 2, 0, 0];
      currentX += charWidth + characterSpacing;
      return { char, position, index };
    });
  }, [charWidthsCache, hoverStates, animationStep, displayedText, showCursor]);

  if (!fonts.spaceGrotesk || !fonts.jua) return null;

  return (
    <group ref={textRef} position={[0, initialY, 0]}>
      {characters.map(({ char, position, index }) => (
        <Character
          key={index}
          char={char}
          isHovered={animationStep === 'idle' && hoverStates[index]}
          position={position}
          fonts={fonts as { spaceGrotesk: Font; jua: Font }}
          onPointerOver={() => handlePointerOver(index)}
          onPointerOut={() => handlePointerOut(index)}
          isAnimationEnabled={animationStep === 'rising' || animationStep === 'idle'}
          isVisible={isTextVisible}
          index={index}
          onDisappearAnimationComplete={index === fullText.length - 1 ? onDisappearAnimationComplete : undefined}
        />
      ))}
    </group>
  );
}

function ReflectivePlane() {
  const REFLECTION_HEIGHT = -1.2;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, REFLECTION_HEIGHT, 0]}>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        mirror={1}
        resolution={2048}
        mixBlur={0.5}
        mixStrength={0.5}
        color="#000000FF"
        metalness={0}
        roughness={0}
      />
    </mesh>
  );
}

interface Scene3DProps {
  isTextVisible: boolean;
  focusOnGrid: boolean;
  onTextDisappearAnimationComplete: () => void;
  onCameraToTextAnimationComplete: () => void;
  onCameraAlmostAtText: () => void;
}

const Scene3D = ({ 
  isTextVisible, 
  focusOnGrid,
  onTextDisappearAnimationComplete,
  onCameraToTextAnimationComplete,
  onCameraAlmostAtText,
}: Scene3DProps) => {
  const [startGridAnimation, setStartGridAnimation] = useState(false);
  const [fonts, setFonts] = useState<{ spaceGrotesk: Font | null; jua: Font | null }>({ spaceGrotesk: null, jua: null });

  useEffect(() => {
    const fontLoader = new FontLoader();
    Promise.all([
      new Promise<Font>(resolve => fontLoader.load('/fonts/SpaceGrotesk_Bold.json', resolve)),
      new Promise<Font>(resolve => fontLoader.load('/fonts/Jua_Regular.json', resolve))
    ]).then(([spaceGrotesk, jua]) => {
      setFonts({ spaceGrotesk, jua });
    });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <ReflectivePlane />
        <CameraAnimator 
          focusOnGrid={focusOnGrid}
          onAnimationComplete={onCameraToTextAnimationComplete}
          onCameraAlmostAtText={onCameraAlmostAtText}
        />
        <CustomGrid
          fadeDistance={20}
          fadeStrength={2}
          lineThickness={0.04}
          startAnimation={startGridAnimation}
        />
        {fonts.spaceGrotesk && fonts.jua ? (
          <>
            <FloatingText
              onAnimationComplete={() => setStartGridAnimation(true)}
              fonts={fonts as { spaceGrotesk: Font; jua: Font }}
              isTextVisible={isTextVisible}
              onDisappearAnimationComplete={onTextDisappearAnimationComplete}
            />
          </>
        ) : null}
      </Canvas>
    </div>
  );
};

export default Scene3D;