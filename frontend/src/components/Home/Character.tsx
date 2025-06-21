import { useMemo, useEffect, useRef } from 'react';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { useSpring, a, to } from '@react-spring/three';
import React from 'react';

interface CharacterProps {
  char: string;
  isHovered: boolean;
  position: [number, number, number];
  fonts: {
    spaceGrotesk: Font;
    jua: Font;
  };
  onPointerOver: () => void;
  onPointerOut: () => void;
  isAnimationEnabled: boolean;
  isVisible: boolean;
  index: number;
}

export function Character({ char, isHovered, position, fonts, onPointerOver, onPointerOut, isAnimationEnabled, isVisible, index }: CharacterProps) {
  const [isFirstRender, setIsFirstRender] = React.useState(true);

  React.useEffect(() => {
    setIsFirstRender(false);
  }, []);
  
  const { scale: visibilityScale } = useSpring({
    scale: isVisible ? 1 : 0,
    delay: index * 60,
    config: { mass: 0.6, tension: 250, friction: 18 },
    immediate: isFirstRender || !isAnimationEnabled,
  });

  const { scale: hoverScale, p } = useSpring({
    scale: isHovered ? 1.2 : 1,
    p: position,
    config: { mass: 0.5, tension: 400, friction: 15 },
    immediate: !isAnimationEnabled,
  });

  // Memoize geometries for both normal and hovered states to avoid re-computation
  const geometries = useMemo(() => {
    const createGeom = (font: Font) => {
      const geom = new TextGeometry(char, {
        font: font,
        size: 0.6,
        height: 0,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0,
        bevelSegments: 5,
      });
      geom.computeBoundingBox();
      const width = geom.boundingBox!.max.x - geom.boundingBox!.min.x;
      geom.translate(-width / 2, 0, 0);
      return geom;
    };

    return {
      normal: createGeom(fonts.spaceGrotesk),
      hovered: createGeom(fonts.jua),
    };
  }, [char, fonts]);

  const visibleGeometry = isHovered ? geometries.hovered : geometries.normal;

  return (
    <a.mesh
      position={p as any}
      scale={to([visibilityScale, hoverScale], (v, h) => v * h)}
      geometry={visibleGeometry}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <meshStandardMaterial color="white" />
    </a.mesh>
  );
} 