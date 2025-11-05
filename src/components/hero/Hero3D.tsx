import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Float,
  Text3D,
  Center,
  MeshReflectorMaterial,
  Html,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';

/**
 * Luxury Modern House Component
 * High-end architectural design perfect for Real Estate professionals
 */
function LuxuryModernHouse() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle rotation for showcase
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Foundation / Base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[5, 0.1, 4]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Main House Structure - Ground Floor */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 3.5]} />
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Second Floor - Modern Offset Design */}
      <mesh position={[-0.3, 1.5, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Accent Panel - Architectural Feature */}
      <mesh position={[1.3, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 2, 3.2]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Flat Modern Roof */}
      <mesh position={[-0.3, 2.05, 0.2]} castShadow>
        <boxGeometry args={[3.1, 0.1, 3.1]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Roof Garden/Terrace Detail */}
      <mesh position={[-0.3, 2.15, 0.2]}>
        <boxGeometry args={[1.5, 0.08, 1.5]} />
        <meshStandardMaterial
          color="#4a7c59"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Floor-to-Ceiling Glass Windows - Front */}
      <mesh position={[0, 0.6, 1.76]} castShadow>
        <boxGeometry args={[2.5, 1.0, 0.05]} />
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.9}
          transmission={0.7}
          thickness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Second Floor Glass */}
      <mesh position={[-0.3, 1.5, 1.63]} castShadow>
        <boxGeometry args={[2.2, 0.8, 0.05]} />
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.9}
          transmission={0.7}
          thickness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Balcony Glass Railing */}
      <mesh position={[-0.3, 1.0, 1.65]}>
        <boxGeometry args={[2.4, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#dddddd"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Modern Entrance Door */}
      <mesh position={[1.2, 0.5, 1.76]}>
        <boxGeometry args={[0.5, 1.1, 0.05]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Door Handle Detail */}
      <mesh position={[1.0, 0.5, 1.8]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#c9b037"
          roughness={0.2}
          metalness={1}
        />
      </mesh>

      {/* Side Glass Panels */}
      <mesh position={[2.02, 1.2, 0]} castShadow>
        <boxGeometry args={[0.05, 2, 2.8]} />
        <meshPhysicalMaterial
          color="#b8e6f5"
          roughness={0.05}
          metalness={0.9}
          transmission={0.6}
          thickness={0.5}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Landscape - Front Lawn */}
      <mesh position={[0, -0.04, 2.8]} receiveShadow>
        <boxGeometry args={[5, 0.05, 2]} />
        <meshStandardMaterial
          color="#3d5a40"
          roughness={0.95}
        />
      </mesh>

      {/* Pathway */}
      <mesh position={[1.2, -0.02, 2.8]} receiveShadow>
        <boxGeometry args={[0.8, 0.03, 2]} />
        <meshStandardMaterial
          color="#8a8a8a"
          roughness={0.7}
        />
      </mesh>

      {/* Decorative Plants/Bushes */}
      <mesh position={[-1.5, 0.2, 2.2]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.15, 2.5]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      <mesh position={[-2, 0.25, 2]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * Floating Property Card Component
 * Interactive listing card showing property info
 */
function PropertyCard({ position, rotation = 0 }: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position} rotation={[0, rotation, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
        {/* Card accent/image area */}
        <mesh position={[0, 0.2, 0.026]}>
          <boxGeometry args={[1.1, 0.4, 0.01]} />
          <meshStandardMaterial color="#80d0c7" />
        </mesh>
        {/* Text lines simulation */}
        <mesh position={[-0.3, -0.1, 0.026]}>
          <boxGeometry args={[0.5, 0.05, 0.01]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[-0.15, -0.2, 0.026]}>
          <boxGeometry args={[0.8, 0.04, 0.01]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * SOLD Sign Component
 * Classic real estate sold sign
 */
function SoldSign() {
  const signRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (signRef.current) {
      signRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={signRef} position={[-3, 0.5, 1]}>
        {/* Sign Post */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Sign Board */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* SOLD text (simulated with geometry) */}
        <mesh position={[0, 0, 0.026]}>
          <boxGeometry args={[0.6, 0.2, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * Animated Stats Badge
 * Floating achievement/stat indicator
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
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Inner circle */}
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * Ambient Lighting Orbs
 * Subtle floating lights for atmosphere
 */
function LightingOrb({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
      />
      <pointLight color={color} intensity={0.5} distance={3} />
    </mesh>
  );
}

/**
 * 3D Scene Component
 * Orchestrates all Real Estate elements
 */
function Scene() {
  return (
    <>
      {/* Professional Lighting Setup */}
      <ambientLight intensity={0.4} />

      {/* Main key light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light */}
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#a1c4fd" />

      {/* Rim light */}
      <spotLight
        position={[0, 10, -5]}
        angle={0.5}
        penumbra={1}
        intensity={0.6}
        color="#80d0c7"
        castShadow
      />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Main Luxury House */}
      <LuxuryModernHouse />

      {/* Real Estate Context Elements */}
      <PropertyCard position={[-3.5, 2, -1]} rotation={0.3} />
      <PropertyCard position={[3.5, 1.5, 0]} rotation={-0.4} />

      <SoldSign />

      <StatsBadge
        position={[3, 2.5, 2]}
        value="$2M+"
        label="Sold"
        color="#80d0c7"
      />

      <StatsBadge
        position={[-2.5, 2.8, -0.5]}
        value="5★"
        label="Rating"
        color="#a1c4fd"
      />

      {/* Ambient lighting orbs */}
      <LightingOrb position={[-4, 1.5, -2]} color="#80d0c7" />
      <LightingOrb position={[4, 2, -1]} color="#a1c4fd" />
      <LightingOrb position={[0, 3, -3]} color="#c2e9fb" />

      {/* Ground plane with reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.3}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#1a1a1a"
          metalness={0.5}
        />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 3}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

/**
 * Loading Fallback Component
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-black/5 to-black/10">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-glass-border rounded-full animate-spin border-t-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero3D Component
 * Main export - Premium Real Estate 3D Showcase
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 backdrop-blur-sm border border-glass-border rounded-2xl" />

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            shadows
            camera={{ position: [6, 3, 8], fov: 60 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2,
            }}
            dpr={[1, 2]}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>

      {/* Bottom fade for UI overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 via-black/10 to-transparent rounded-b-2xl pointer-events-none" />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/10 to-transparent rounded-t-2xl pointer-events-none" />
    </div>
  );
}
