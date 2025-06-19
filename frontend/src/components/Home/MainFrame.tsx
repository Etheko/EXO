import { useRef, useEffect, useState, PropsWithChildren } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Edges, MeshTransmissionMaterial } from '@react-three/drei';
import { Mesh } from 'three';

interface MainFrameProps {
  /**
   * Width of the window plane in Three.js units.
   * Default: 3
   */
  width?: number;
  /**
   * Height of the window plane in Three.js units.
   * Default: 2
   */
  height?: number;
  /**
   * Z position (distance from camera). Higher values bring the frame closer.
   * Default: 2
   */
  z?: number;
  /**
   * Optional callback fired the first time the frame becomes active (starts sliding in).
   */
  onShow?: () => void;
}

/**
 * A 3D window (flat rectangle with white outline) that starts below the viewport
 * and slides up to the centre when the user scrolls down for the first time.
 * The component can host regular HTML content via the <Html> helper from drei.
 */
const MainFrame = ({
  width = 3,
  height = 2,
  z = 2,
  onShow,
  children,
}: PropsWithChildren<MainFrameProps>) => {
  const frameRef = useRef<Mesh>(null);

  // Whether the slide-in animation should run.
  const [isActive, setIsActive] = useState(false);
  const initialY = -3; // Off-screen starting Y position
  const targetY = 0;   // Final Y position (centre of viewport)

  // Listen for the first downward wheel event to start the animation.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setIsActive(true);
        window.removeEventListener('wheel', handleWheel);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Notify parent (if needed) when the frame becomes active.
  useEffect(() => {
    if (isActive && onShow) onShow();
  }, [isActive, onShow]);

  // Smoothly interpolate the frame's position each frame.
  useFrame(() => {
    if (!frameRef.current) return;
    const desiredY = isActive ? targetY : initialY;
    frameRef.current.position.y += (desiredY - frameRef.current.position.y) * 0.05;
  });

  const zOffset = z;

  return (
    <mesh ref={frameRef} position={[0, initialY, zOffset]}>
      <planeGeometry args={[width, height]} />
      {/* The glass-like background material */}
      <MeshTransmissionMaterial
        /* Disable fancy effects that introduce extra grain */
        chromaticAberration={0}
        anisotropicBlur={0}
        distortion={0}
        /* Increase samples so the blur converges to a smoother result */
        samples={100}
        /* Base transmission settings */
        backside
        transmission={0.75}
        roughness={1}
        thickness={0.2}
        color={'#555555'}
        /* Remove specular highlight */
        specularIntensity={0}
      />
      {/* White outline */}
      <Edges scale={1} color="#ffffff" />

      {/* Regular HTML content rendered inside the 3D plane */}
      <Html
        transform
        distanceFactor={1}
        occlude={false}
        position={[0, 0, 0.01]} // Slight offset to avoid z-fighting with the plane
      >
        <div
          style={{
            width: `${width * 100}px`,
            height: `${height * 100}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#ffffff',
            background: 'transparent',
            backdropFilter: 'none',
          }}
        >
          {children ?? 'HTML Content'}
        </div>
      </Html>
    </mesh>
  );
};

export default MainFrame;
