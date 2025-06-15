import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { useSpring, a, config, to, SpringValue } from '@react-spring/three';
import { useEnvironment } from '@react-three/drei';

// --- Constants ---
const BUTTON_TEXT = 'Projects';
const TEXT_PROPS = {
  size: 0.12,
  height: 0,
  curveSegments: 12,
  bevelEnabled: false,
};
const PADDING = { x: 0.6, y: 0.22 };
const Z_OFFSETS = {
  FROSTED_LAYER: 0.001,
  TEXT: 0.01,
};

// --- Helper Functions & Hooks ---

function createPillShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  
  return shape;
}

function useButtonGeometry(text: string, font: Font) {
  return useMemo(() => {
    const geom = new TextGeometry(text, {
      font,
      ...TEXT_PROPS,
    });
    geom.computeBoundingBox();
    const textWidth = geom.boundingBox!.max.x - geom.boundingBox!.min.x;
    const textHeight = geom.boundingBox!.max.y - geom.boundingBox!.min.y;
    geom.translate(-textWidth / 2, -textHeight / 2, 0);

    const buttonWidth = textWidth + PADDING.x;
    const buttonHeight = textHeight + PADDING.y;
    const buttonRadius = buttonHeight / 2;
    const shape = createPillShape(buttonWidth, buttonHeight, buttonRadius);

    return { textGeometry: geom, buttonShape: shape };
  }, [text, font]);
}

// --- Sub-components ---

interface ButtonPartProps {
  opacity: SpringValue<number>;
}

interface ButtonBackgroundProps extends ButtonPartProps {
  buttonShape: THREE.Shape;
  envMap: THREE.Texture;
}

const ButtonBackground = ({ buttonShape, opacity, envMap }: ButtonBackgroundProps) => (
  <>
    {/* Glass background layer */}
    <mesh>
      <shapeGeometry args={[buttonShape]} />
      <a.meshPhysicalMaterial
        transparent
        opacity={opacity}
        roughness={0.2}
        metalness={0.1}
        transmission={0.9}
        thickness={0.05}
        clearcoat={1}
        clearcoatRoughness={0.1}
        ior={1.5}
        envMap={envMap}
        envMapIntensity={1}
      />
    </mesh>

    {/* Frosted layer */}
    <mesh position-z={Z_OFFSETS.FROSTED_LAYER}>
      <shapeGeometry args={[buttonShape]} />
      <a.meshPhysicalMaterial
        transparent
        opacity={opacity.to(o => o * 0.3)}
        roughness={0.8}
        metalness={0.1}
        transmission={0.5}
        thickness={0.01}
        clearcoat={0.5}
        clearcoatRoughness={0.4}
        envMap={envMap}
      />
    </mesh>
  </>
);

interface ButtonOutlineProps extends ButtonPartProps {
    buttonShape: THREE.Shape;
}

const ButtonOutline = ({ buttonShape, opacity }: ButtonOutlineProps) => (
  <lineSegments>
    <edgesGeometry args={[new THREE.ShapeGeometry(buttonShape)]} />
    <a.lineBasicMaterial
      color="#FFFFFF"
      transparent
      opacity={opacity.to(o => o * 0.5)}
    />
  </lineSegments>
);

interface ButtonTextProps extends ButtonPartProps {
    textGeometry: THREE.BufferGeometry;
}

const ButtonText = ({ textGeometry, opacity }: ButtonTextProps) => (
  <a.mesh
    geometry={textGeometry}
    position-z={Z_OFFSETS.TEXT}
  >
    <a.meshBasicMaterial color="#FFFFFF" transparent opacity={opacity} />
  </a.mesh>
);


// --- Main Component ---
interface ProjectsButtonProps {
  fonts: {
    spaceGrotesk: Font;
  };
  position: [number, number, number];
  show: boolean;
  preload: boolean;
}

export function ProjectsButton({ fonts, position, show, preload }: ProjectsButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const envMap = useEnvironment({ preset: 'city' });

  const showAnimation = useSpring({
    opacity: show ? 1 : 0,
    scale: show ? 1 : 0.9,
    config: { ...config.gentle, clamp: true },
    delay: show ? 500 : 0,
  });

  const hoverAnimation = useSpring({
    scale: isHovered ? 1.1 : 1,
    config: config.stiff,
  });

  const { textGeometry, buttonShape } = useButtonGeometry(BUTTON_TEXT, fonts.spaceGrotesk);

  if (!preload) {
    return null;
  }

  return (
    <a.group
      position={position}
      scale={to([showAnimation.scale, hoverAnimation.scale], (s, h) => s * h)}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <ButtonBackground buttonShape={buttonShape} opacity={showAnimation.opacity} envMap={envMap} />
      <ButtonOutline buttonShape={buttonShape} opacity={showAnimation.opacity} />
      <ButtonText textGeometry={textGeometry} opacity={showAnimation.opacity} />
    </a.group>
  );
}
