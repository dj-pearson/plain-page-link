import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + position[0]) * 0.5;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

interface FloatingGeometryProps {
  color?: string;
}

export function FloatingGeometry({ color = '#f59e0b' }: FloatingGeometryProps) {
  const cubes = [
    [-2, 0, -2],
    [2, 0, -2],
    [-2, 0, 2],
    [2, 0, 2],
    [0, 1, 0],
  ] as [number, number, number][];

  return (
    <div className="fixed inset-0 -z-10 opacity-25">
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {cubes.map((pos, i) => (
          <FloatingCube key={i} position={pos} color={color} />
        ))}
      </Canvas>
    </div>
  );
}