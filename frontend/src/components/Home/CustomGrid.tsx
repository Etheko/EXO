import * as React from 'react'
import { forwardRef, useMemo, useRef, useEffect } from 'react'
import { Vector3, Color, ShaderMaterial } from 'three'
import { useFrame } from '@react-three/fiber'

const vertexShader = `
  varying vec3 v_worldPosition;
  varying vec3 v_position;
  void main() {
    v_position = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    v_worldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = `
  varying vec3 v_worldPosition;
  varying vec3 v_position;

  uniform float u_size;
  uniform float u_divisions;
  uniform float u_lineThickness;
  uniform vec3 u_lineColor;
  uniform vec3 u_cameraPosition;
  uniform float u_fadeDistance;
  uniform float u_fadeStrength;
  uniform float u_baseOpacity;
  uniform float u_progress;
  uniform float u_infinite;
  uniform float u_time;

  float getGrid(vec2 p, float thickness) {
    float d = min(min(p.x, 1.0 - p.x), min(p.y, 1.0 - p.y));
    float w = thickness * 0.5;
    float line = smoothstep(w - fwidth(d), w + fwidth(d), d);
    return 1.0 - line;
  }

  void main() {
    float halfSize = u_size / 2.0;

    // Animation
    if (abs(v_position.x) > u_progress * halfSize) {
      discard;
    }

    // Fading
    float dist = length(v_worldPosition.xz - u_cameraPosition.xz);
    float fadeOpacity = 1.0 - smoothstep(u_fadeDistance - u_fadeDistance / u_fadeStrength, u_fadeDistance, dist);

    // Grid lines
    vec2 coord = v_worldPosition.xz;
    coord.y += u_time; // Scrolling animation

    if (u_infinite > 0.5) {
      // Keep grid centered on camera
      coord -= u_cameraPosition.xz;
    }
    
    float cellSize = u_size / u_divisions;
    vec2 cell_coord = coord / cellSize;
    
    float line_thickness_in_cell_units = u_lineThickness / cellSize;

    float grid = getGrid(fract(cell_coord), line_thickness_in_cell_units);

    gl_FragColor = vec4(u_lineColor, grid * fadeOpacity * u_baseOpacity);
  }
`
interface CustomGridProps {
  size?: number
  divisions?: number
  color?: Color | string | number
  fadeDistance?: number
  fadeStrength?: number
  animationDuration?: number
  lineThickness?: number
  startAnimation?: boolean
  infinite?: boolean
  scrollSpeed?: number
  onAnimationComplete?: () => void
}

export const CustomGrid = forwardRef<ShaderMaterial, CustomGridProps>(
  (props, ref) => {
    const {
      size = 100,
      divisions = 50,
      color = '#FFFFFF49',
      fadeDistance = 50,
      fadeStrength = 3,
      animationDuration = 2,
      lineThickness = 0.04,
      startAnimation = true,
      infinite = true,
      onAnimationComplete,
      scrollSpeed = 2,
    } = props

    const materialRef = useRef<ShaderMaterial>(null!)
    
    const uniforms = useMemo(
      () => ({
        u_size: { value: 0 },
        u_divisions: { value: 0 },
        u_lineThickness: { value: 0 },
        u_lineColor: { value: new Color() },
        u_cameraPosition: { value: new Vector3() },
        u_fadeDistance: { value: 0 },
        u_fadeStrength: { value: 0 },
        u_baseOpacity: { value: 0 },
        u_progress: { value: 0 },
        u_infinite: { value: 0 },
        u_time: { value: 0 },
      }),
      []
    )
    
    const animationProgress = useRef(0)
    const onAnimationCompleteRef = useRef(onAnimationComplete)
    const animationCompleted = useRef(false)

    useEffect(() => {
      animationProgress.current = 0
      animationCompleted.current = false
    }, [animationDuration, startAnimation])

    useEffect(() => {
      onAnimationCompleteRef.current = onAnimationComplete
    }, [onAnimationComplete])

    useFrame((state, delta) => {
      // Update uniforms from props on every frame
      materialRef.current.uniforms.u_size.value = size;
      materialRef.current.uniforms.u_divisions.value = divisions;
      materialRef.current.uniforms.u_lineThickness.value = lineThickness;
      materialRef.current.uniforms.u_fadeDistance.value = fadeDistance;
      materialRef.current.uniforms.u_fadeStrength.value = fadeStrength;
      materialRef.current.uniforms.u_infinite.value = infinite ? 1.0 : 0.0;
      
      const [lineColor, baseOpacity] = (() => {
        const col = new Color()
        let opacity = 1.0
        const c = color as string
  
        if (typeof c === 'string' && c.startsWith('#') && c.length === 9) {
          col.set(c.substring(0, 7))
          opacity = parseInt(c.substring(7, 9), 16) / 255
        } else {
          col.set(color as any)
        }
        return [col, opacity]
      })();
      materialRef.current.uniforms.u_lineColor.value = lineColor;
      materialRef.current.uniforms.u_baseOpacity.value = baseOpacity;

      // Update time-based uniforms
      materialRef.current.uniforms.u_cameraPosition.value.copy(state.camera.position)
      materialRef.current.uniforms.u_time.value -= delta * scrollSpeed

      // Animation logic
      if (startAnimation && animationProgress.current < 1) {
        animationProgress.current += delta / animationDuration
        materialRef.current.uniforms.u_progress.value = Math.min(animationProgress.current, 1)
      } else if (startAnimation && animationProgress.current >= 1 && !animationCompleted.current) {
        onAnimationCompleteRef.current?.()
        animationCompleted.current = true
      }
    })

    const REFLECTION_HEIGHT = -1.2
    const GRID_OFFSET = 0.001

    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, REFLECTION_HEIGHT + GRID_OFFSET, 0]}>
        <planeGeometry args={[size, size, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          lights={false}
        />
      </mesh>
    )
  }
) 