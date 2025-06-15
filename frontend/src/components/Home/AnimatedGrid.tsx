import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3, AdditiveBlending, Group } from 'three';

interface AnimatedGridProps {
  size?: number;
  divisions?: number;
  color?: Color | string | number;
  fadeDistance?: number;
  fadeStrength?: number;
  animationDuration?: number;
  lineThickness?: number;
  startAnimation?: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedGrid({
  size = 100,
  divisions = 50,
  color = '#FFFFFF49',
  fadeDistance,
  fadeStrength,
  animationDuration = 2, // in seconds
  lineThickness = 1,
  startAnimation = true,
  onAnimationComplete,
}: AnimatedGridProps) {
  const gridRef = useRef<Group>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const animationProgress = useRef(0);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const animationCompleted = useRef(false);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = [];
    
    const step = size / divisions;
    const halfSize = size / 2;

    for (let i = 0; i <= divisions; i++) {
      const p = -halfSize + i * step;

      // Horizontal lines (as quads) - Animate from center
      const startX = 0;
      const endX = halfSize;
      // Right side
      positions.push(
        startX, 0, p - lineThickness / 2,
        endX, 0, p - lineThickness / 2,
        endX, 0, p + lineThickness / 2,
        startX, 0, p - lineThickness / 2,
        endX, 0, p + lineThickness / 2,
        startX, 0, p + lineThickness / 2,
      );
      // Left side
      positions.push(
        -startX, 0, p - lineThickness / 2,
        -endX, 0, p - lineThickness / 2,
        -endX, 0, p + lineThickness / 2,
        -startX, 0, p - lineThickness / 2,
        -endX, 0, p + lineThickness / 2,
        -startX, 0, p + lineThickness / 2,
      );


      // Vertical lines (as quads)
      positions.push(
        p - lineThickness / 2, 0, -halfSize,
        p - lineThickness / 2, 0, halfSize,
        p + lineThickness / 2, 0, halfSize,
        p - lineThickness / 2, 0, -halfSize,
        p + lineThickness / 2, 0, halfSize,
        p + lineThickness / 2, 0, -halfSize,
      );
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geo;
  }, [size, divisions, lineThickness]);
  
  const uniforms = useMemo(() => ({
    u_color: { value: new Color() },
    u_baseOpacity: { value: 1.0 },
    u_fadeDistance: { value: 0 },
    u_fadeStrength: { value: 0 },
    u_progress: { value: 0 },
    u_cameraPosition: { value: new Vector3() },
  }), []);

  useEffect(() => {
    if (!materialRef.current) return;

    const col = new Color();
    let opacity = 1.0;
    const c = color as string;

    if (typeof c === 'string' && c.startsWith('#') && c.length === 9) {
      col.set(c.substring(0, 7));
      opacity = parseInt(c.substring(7, 9), 16) / 255;
    } else {
      col.set(color as any);
    }
    
    materialRef.current.uniforms.u_color.value = col;
    materialRef.current.uniforms.u_baseOpacity.value = opacity;
    
  }, [color]);

  useEffect(() => {
    // Reset animation when props change
    animationProgress.current = 0;
    animationCompleted.current = false;
  }, [animationDuration, startAnimation]);

  useEffect(() => {
    // Update ref if callback changes
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useFrame((state, delta) => {
    // Drawing animation
    if (startAnimation && animationProgress.current < 1) {
      animationProgress.current += delta / animationDuration;
      if (materialRef.current) {
        materialRef.current.uniforms.u_progress.value = Math.min(animationProgress.current, 1);
      }
    } else if (startAnimation && animationProgress.current >= 1 && !animationCompleted.current) {
      onAnimationCompleteRef.current?.();
      animationCompleted.current = true;
    }

    // Infinite scroll and fade effect
    if (gridRef.current && materialRef.current) {
        // Update fade uniforms on every frame
        materialRef.current.uniforms.u_fadeDistance.value = fadeDistance ?? 50;
        materialRef.current.uniforms.u_fadeStrength.value = fadeStrength ?? 3;

        // Infinite scroll
        const newZ = gridRef.current.position.z + delta * 2;
        const sectionSize = size / divisions;
        if (newZ > sectionSize) {
            gridRef.current.position.z -= sectionSize;
        } else {
            gridRef.current.position.z = newZ;
        }

        // Update camera position for fading
        materialRef.current.uniforms.u_cameraPosition.value.copy(state.camera.position);
    }
  });

  const REFLECTION_HEIGHT = -1.2;
  const GRID_OFFSET = 0.001;

  return (
    <group ref={gridRef} position={[0, REFLECTION_HEIGHT + GRID_OFFSET, 0]}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={`
            varying float v_lineProgress;
            varying vec3 v_worldPosition;

            void main() {
              v_lineProgress = position.x / (50.0);
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              v_worldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 u_color;
            uniform float u_fadeDistance;
            uniform float u_fadeStrength;
            uniform float u_progress;
            uniform vec3 u_cameraPosition;
            uniform float u_baseOpacity;

            varying float v_lineProgress;
            varying vec3 v_worldPosition;

            void main() {
              if (abs(v_lineProgress) > u_progress) {
                discard;
              }

              float dist = length(v_worldPosition.xz - u_cameraPosition.xz);
              float fadeOpacity = 1.0 - smoothstep(u_fadeDistance - u_fadeDistance / u_fadeStrength, u_fadeDistance, dist);
              
              gl_FragColor = vec4(u_color, fadeOpacity * u_baseOpacity);
            }
          `}
          transparent={true}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
} 