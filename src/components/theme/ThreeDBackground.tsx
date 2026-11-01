import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { BACKGROUND_CANVAS_DPR, useBackgroundFrameloop } from '@/hooks/useDeferred3D';

interface ParticlesProps {
  count: number;
  color: string;
}

function Particles({ count, color }: ParticlesProps) {
  const points = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      positions.set([x, y, z], i * 3);
    }

    return positions;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      points.current.rotation.y = state.clock.getElapsedTime() * 0.075;
    }
  });

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

interface ThreeDBackgroundProps {
  variant: 'particles' | 'waves' | 'spiral';
  color?: string;
}

export function ThreeDBackground({ variant, color = '#2563eb' }: ThreeDBackgroundProps) {
  const frameloop = useBackgroundFrameloop();
  return (
    <div className="fixed inset-0 -z-10 opacity-30">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={BACKGROUND_CANVAS_DPR}
        frameloop={frameloop}
      >
        <ambientLight intensity={0.5} />
        {variant === 'particles' && <Particles count={3000} color={color} />}
      </Canvas>
    </div>
  );
}
