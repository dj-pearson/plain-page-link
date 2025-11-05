import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Sphere, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Animated 3D Shape Component
 * Creates interactive geometric shapes with liquid glass colors
 */
function AnimatedShape({ position, scale, color, speed }: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.3;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * speed) * 0.2;
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.7}
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

/**
 * Floating Ring Component
 * Creates rotating rings with prismatic colors
 */
function FloatingRing({ position, radius, color }: {
  position: [number, number, number];
  radius: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[radius, 0.05, 16, 100]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

/**
 * Modern House Component
 * Sleek contemporary architecture with clean lines
 */
function ModernHouse() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main structure - lower level */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2.4, 1.2, 1.6]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Upper level - offset modern design */}
      <mesh position={[0.4, 0.6, 0.2]}>
        <boxGeometry args={[1.8, 1.0, 1.4]} />
        <meshStandardMaterial
          color="#e8f4f8"
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Flat modern roof */}
      <mesh position={[0.4, 1.15, 0.2]}>
        <boxGeometry args={[1.85, 0.08, 1.45]} />
        <meshStandardMaterial
          color="#a1c4fd"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Roof overhang */}
      <mesh position={[0.4, 1.1, 0.2]}>
        <boxGeometry args={[2.0, 0.04, 1.6]} />
        <meshStandardMaterial
          color="#80d0c7"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Large modern windows - front */}
      <mesh position={[0.4, 0.6, 0.91]}>
        <boxGeometry args={[1.2, 0.7, 0.05]} />
        <meshStandardMaterial
          color="#c2e9fb"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Lower windows */}
      <mesh position={[-0.6, -0.3, 0.81]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial
          color="#c2e9fb"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.4, -0.3, 0.81]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial
          color="#c2e9fb"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Modern entrance door */}
      <mesh position={[0.9, -0.5, 0.81]}>
        <boxGeometry args={[0.35, 0.9, 0.05]} />
        <meshStandardMaterial
          color="#5a9fb8"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Side glass panels */}
      <mesh position={[1.3, 0.6, 0]}>
        <boxGeometry args={[0.05, 0.7, 1.0]} />
        <meshStandardMaterial
          color="#c2e9fb"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Accent architectural element */}
      <mesh position={[-0.8, 0.3, 0]}>
        <boxGeometry args={[0.5, 1.8, 1.4]} />
        <meshStandardMaterial
          color="#80d0c7"
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Ground level base */}
      <mesh position={[0, -0.95, 0]}>
        <boxGeometry args={[2.6, 0.1, 1.8]} />
        <meshStandardMaterial
          color="#7ab8c7"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

/**
 * Ambient Particles Component
 * Background particle system for depth
 */
function AmbientParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 15;
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#a1c4fd"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * 3D Scene Component
 * Orchestrates all 3D elements
 */
function Scene() {
  // Liquid Glass brand colors
  const colors = {
    teal: '#80d0c7',
    blue: '#a1c4fd',
    lightBlue: '#c2e9fb',
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#80d0c7" />
      <spotLight
        position={[0, 5, 0]}
        intensity={0.5}
        angle={0.6}
        penumbra={1}
        color="#a1c4fd"
      />

      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Main modern house */}
      <ModernHouse />

      {/* Floating geometric shapes around house */}
      <AnimatedShape position={[-3, 0.5, -1]} scale={0.4} color={colors.teal} speed={0.8} />
      <AnimatedShape position={[3, -0.5, -2]} scale={0.35} color={colors.blue} speed={1.2} />
      <AnimatedShape position={[-2.5, -1.5, 1]} scale={0.3} color={colors.lightBlue} speed={1.5} />
      <AnimatedShape position={[2.8, 1.5, 0.5]} scale={0.45} color={colors.teal} speed={0.6} />
      <AnimatedShape position={[0, -2, -1.5]} scale={0.35} color={colors.blue} speed={1.0} />

      {/* Ambient particles */}
      <AmbientParticles />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </>
  );
}

/**
 * Loading Fallback Component
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-glass-border rounded-full animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] rounded-full animate-ping" />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero3D Component
 * Main export - 3D Hero Section with Liquid Glass integration
 */
interface Hero3DProps {
  className?: string;
  height?: string;
}

export function Hero3D({ className = '', height = '600px' }: Hero3DProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height }}
    >
      {/* Liquid Glass overlay container */}
      <div className="absolute inset-0 bg-glass-background backdrop-blur-sm border border-glass-border rounded-2xl" />

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance'
            }}
            dpr={[1, 2]}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>

      {/* Prismatic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 rounded-2xl pointer-events-none" />

      {/* Bottom fade for text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl pointer-events-none" />
    </div>
  );
}
