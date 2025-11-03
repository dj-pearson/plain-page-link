import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function AnimatedSphere({ color1, color2 }: { color1: string; color2: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={3}>
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial
        color={color1}
        emissive={color2}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  );
}

interface GradientMeshProps {
  color1?: string;
  color2?: string;
}

export function GradientMesh({ color1 = '#6366f1', color2 = '#8b5cf6' }: GradientMeshProps) {
  return (
    <div className="fixed inset-0 -z-10 opacity-20">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color2} />
        <AnimatedSphere color1={color1} color2={color2} />
      </Canvas>
    </div>
  );
}