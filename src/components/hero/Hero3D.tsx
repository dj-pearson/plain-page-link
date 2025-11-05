import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Float,
  MeshReflectorMaterial,
  Html,
  RoundedBox,
  Cylinder,
  Sphere
} from '@react-three/drei';
import * as THREE from 'three';

/**
 * Luxury Modern House Component
 * High-end architectural design with improved geometry
 */
function LuxuryModernHouse() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, -1.8, 0]}>
      {/* Foundation / Base */}
      <RoundedBox args={[5, 0.1, 4]} radius={0.02} position={[0, -0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#2c2c2c" roughness={0.8} metalness={0.2} />
      </RoundedBox>

      {/* Main House Structure - Ground Floor */}
      <RoundedBox args={[4, 1.2, 3.5]} radius={0.05} position={[0, 0.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.2}
          metalness={0.8}
        />
      </RoundedBox>

      {/* Second Floor - Modern Offset Design */}
      <RoundedBox args={[3, 1, 3]} radius={0.05} position={[-0.3, 1.5, 0.2]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.1}
          metalness={0.3}
        />
      </RoundedBox>

      {/* Accent Panel - Architectural Feature */}
      <RoundedBox args={[1, 2, 3.2]} radius={0.03} position={[1.3, 1.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#e8f4f8"
          roughness={0.15}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Flat Modern Roof */}
      <RoundedBox args={[3.1, 0.1, 3.1]} radius={0.02} position={[-0.3, 2.05, 0.2]} castShadow>
        <meshStandardMaterial
          color="#a1c4fd"
          roughness={0.2}
          metalness={0.8}
        />
      </RoundedBox>

      {/* Roof Garden/Terrace Detail */}
      <RoundedBox args={[1.5, 0.08, 1.5]} radius={0.02} position={[-0.3, 2.15, 0.2]}>
        <meshStandardMaterial
          color="#80d0c7"
          roughness={0.3}
          metalness={0.7}
        />
      </RoundedBox>

      {/* Floor-to-Ceiling Glass Windows - Front */}
      <RoundedBox args={[2.5, 1.0, 0.05]} radius={0.01} position={[0, 0.6, 1.76]} castShadow>
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* Second Floor Glass */}
      <RoundedBox args={[2.2, 0.8, 0.05]} radius={0.01} position={[-0.3, 1.5, 1.63]} castShadow>
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* Balcony Glass Railing */}
      <RoundedBox args={[2.4, 0.05, 0.05]} radius={0.01} position={[-0.3, 1.0, 1.65]}>
        <meshStandardMaterial
          color="#c2e9fb"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* Modern Entrance Door */}
      <RoundedBox args={[0.5, 1.1, 0.05]} radius={0.02} position={[1.2, 0.5, 1.76]}>
        <meshStandardMaterial
          color="#5a9fb8"
          roughness={0.3}
          metalness={0.6}
        />
      </RoundedBox>

      {/* Door Handle Detail */}
      <Cylinder args={[0.03, 0.03, 0.15, 8]} rotation={[0, 0, Math.PI / 2]} position={[1.0, 0.5, 1.8]}>
        <meshStandardMaterial
          color="#c9b037"
          roughness={0.2}
          metalness={1}
        />
      </Cylinder>

      {/* Side Glass Panels */}
      <RoundedBox args={[0.05, 2, 2.8]} radius={0.01} position={[2.02, 1.2, 0]} castShadow>
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.95}
          emissive="#a1c4fd"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </RoundedBox>

      {/* Landscape - Front Lawn */}
      <RoundedBox args={[5, 0.05, 2]} radius={0.01} position={[0, -0.04, 2.8]} receiveShadow>
        <meshStandardMaterial
          color="#80d0c7"
          roughness={0.2}
          metalness={0.7}
        />
      </RoundedBox>

      {/* Pathway */}
      <RoundedBox args={[0.8, 0.03, 2]} radius={0.01} position={[1.2, -0.02, 2.8]} receiveShadow>
        <meshStandardMaterial
          color="#7ab8c7"
          roughness={0.4}
          metalness={0.5}
        />
      </RoundedBox>

      {/* Decorative Plants/Bushes */}
      <Sphere args={[0.3, 16, 16]} position={[-1.5, 0.2, 2.2]}>
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </Sphere>
      <Sphere args={[0.25, 16, 16]} position={[0.5, 0.15, 2.5]}>
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </Sphere>
      <Sphere args={[0.35, 16, 16]} position={[-2, 0.25, 2]}>
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </Sphere>

      {/* Decorative Tree */}
      <group position={[-2.5, 0, 2.5]}>
        <Cylinder args={[0.1, 0.12, 1, 8]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#4a3c28" roughness={0.9} />
        </Cylinder>
        <Sphere args={[0.5, 16, 16]} position={[0, 1.3, 0]}>
          <meshStandardMaterial color="#2d5016" roughness={0.9} />
        </Sphere>
      </group>
    </group>
  );
}

/**
 * Animated Shape Component
 * Floating geometric shapes
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
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

/**
 * Floating Property Card Component with Real Text
 */
function PropertyCard({ position, rotation = 0 }: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position} rotation={[0, rotation, 0]}>
        <RoundedBox args={[1.2, 0.8, 0.05]} radius={0.02}>
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.2}
          />
        </RoundedBox>
        {/* Card accent/image area */}
        <RoundedBox args={[1.1, 0.4, 0.01]} radius={0.01} position={[0, 0.2, 0.026]}>
          <meshStandardMaterial color="#80d0c7" />
        </RoundedBox>

        {/* HTML Text Overlay */}
        <Html
          position={[0, -0.15, 0.03]}
          transform
          occlude
          style={{
            width: '110px',
            fontSize: '8px',
            color: '#333',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>$850,000</div>
          <div style={{ fontSize: '7px', color: '#666' }}>4 bd • 3 ba • 2,400 sqft</div>
        </Html>
      </group>
    </Float>
  );
}

/**
 * SOLD Sign Component with Real Text
 */
function SoldSign() {
  const signRef = useRef<THREE.Group>(null);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={signRef} position={[-3, 0.5, 1]}>
        {/* Sign Post */}
        <Cylinder args={[0.05, 0.05, 1.5, 16]} position={[0, -0.3, 0]}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </Cylinder>

        {/* Sign Board */}
        <RoundedBox args={[0.8, 0.5, 0.05]} radius={0.02} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </RoundedBox>

        {/* HTML Text for "SOLD" */}
        <Html
          position={[0, 0, 0.03]}
          transform
          occlude
          style={{
            width: '80px',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '2px'
          }}>
            SOLD
          </div>
        </Html>
      </group>
    </Float>
  );
}

/**
 * Ambient Particles Component
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
        color="#80d0c7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Animated Stats Badge with Real Text
 */
function StatsBadge({ position, value, label, color }: {
  position: [number, number, number];
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group position={position}>
        {/* Badge background */}
        <Cylinder args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </Cylinder>

        {/* Inner circle */}
        <Cylinder args={[0.32, 0.32, 0.02, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.3}
          />
        </Cylinder>

        {/* HTML Text */}
        <Html
          position={[0, 0, 0.08]}
          transform
          occlude
          style={{
            width: '70px',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '2px'
          }}>
            {value}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#666'
          }}>
            {label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

/**
 * Ambient Lighting Orbs
 */
function LightingOrb({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/**
 * 3D Scene Component
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

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Main Luxury House */}
      <LuxuryModernHouse />

      {/* Real Estate Context Elements with Real Text */}
      <PropertyCard position={[-3.5, 2, -1]} rotation={0.3} />
      <PropertyCard position={[3.5, 1.5, 0]} rotation={-0.4} />

      <SoldSign />

      <StatsBadge
        position={[3, 2.5, 2]}
        value="$2M+"
        label="Sold"
        color="#80d0c7"
      />

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
