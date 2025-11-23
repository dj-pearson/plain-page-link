import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Float,
    Html,
    RoundedBox,
    Cylinder,
    Sphere,
    ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';

/**
 * Modern Mobile Phone Component
 * Sleek glass and metal design
 */
function MobilePhone() {
    const groupRef = useRef<THREE.Group>(null);

    // Gentle floating animation for the phone itself
    useFrame((state) => {
        if (groupRef.current) {
            // Subtle breathing rotation
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Phone Body - Metal Frame */}
            <RoundedBox args={[3, 6, 0.3]} radius={0.4} position={[0, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.2}
                    metalness={0.9}
                    envMapIntensity={1.5}
                />
            </RoundedBox>

            {/* Screen - Glass Surface */}
            <RoundedBox args={[2.8, 5.8, 0.05]} radius={0.3} position={[0, 0, 0.16]}>
                <meshPhysicalMaterial
                    color="#000000"
                    roughness={0.0}
                    metalness={0.2}
                    transmission={0}
                    clearcoat={1}
                    clearcoatRoughness={0}
                />
            </RoundedBox>

            {/* Screen Content - Glowing Interface */}
            <RoundedBox args={[2.7, 5.7, 0.01]} radius={0.28} position={[0, 0, 0.19]}>
                <meshBasicMaterial color="#000000" />
            </RoundedBox>

            {/* UI Elements on Screen (Abstract) */}
            {/* Header */}
            <RoundedBox args={[2.4, 0.6, 0.01]} radius={0.1} position={[0, 2.2, 0.2]}>
                <meshBasicMaterial color="#1a1a1a" />
            </RoundedBox>

            {/* Profile Pic Circle */}
            <Cylinder args={[0.4, 0.4, 0.02, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.4, 0.2]}>
                <meshBasicMaterial color="#333" />
            </Cylinder>

            {/* Link Buttons */}
            {[0, 1, 2, 3].map((i) => (
                <RoundedBox key={i} args={[2.2, 0.5, 0.01]} radius={0.1} position={[0, 0.2 - (i * 0.7), 0.2]}>
                    <meshBasicMaterial color="#1a1a1a" />
                </RoundedBox>
            ))}

            {/* Dynamic Glow behind phone */}
            <pointLight position={[0, 0, -1]} intensity={2} color="#80d0c7" distance={5} />
        </group>
    );
}

/**
 * Floating Element - Sold Sign
 */
function FloatingSoldSign({ position, delay = 0 }: { position: [number, number, number], delay?: number }) {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
            <group position={position}>
                <RoundedBox args={[1.2, 0.8, 0.05]} radius={0.05} castShadow>
                    <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.5} />
                </RoundedBox>
                <Html transform position={[0, 0, 0.03]} style={{ pointerEvents: 'none' }}>
                    <div className="text-white font-bold text-xl tracking-widest">SOLD</div>
                </Html>
            </group>
        </Float>
    );
}

/**
 * Floating Element - House Key
 */
function FloatingKey({ position }: { position: [number, number, number] }) {
    return (
        <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
            <group position={position} rotation={[0, 0, Math.PI / 4]}>
                {/* Key Head */}
                <Cylinder args={[0.3, 0.3, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                </Cylinder>
                {/* Key Shaft */}
                <RoundedBox args={[0.15, 0.8, 0.1]} radius={0.02} position={[0, -0.6, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                </RoundedBox>
                {/* Key Teeth */}
                <RoundedBox args={[0.2, 0.15, 0.1]} radius={0.01} position={[0.15, -0.5, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                </RoundedBox>
                <RoundedBox args={[0.2, 0.15, 0.1]} radius={0.01} position={[0.15, -0.8, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                </RoundedBox>
            </group>
        </Float>
    );
}

/**
 * Floating Element - Lead Card
 */
function FloatingLeadCard({ position }: { position: [number, number, number] }) {
    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <group position={position} rotation={[0, -0.2, 0]}>
                <RoundedBox args={[1.8, 0.7, 0.05]} radius={0.1}>
                    <meshPhysicalMaterial
                        color="#ffffff"
                        roughness={0.1}
                        metalness={0.1}
                        transmission={0.5}
                        thickness={0.5}
                    />
                </RoundedBox>
                <Html transform position={[0, 0, 0.03]} style={{ pointerEvents: 'none' }}>
                    <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg w-48">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                        <div className="flex-1">
                            <div className="text-[10px] text-gray-500 font-medium">New Lead</div>
                            <div className="text-xs font-bold text-gray-800">Sarah Johnson</div>
                        </div>
                    </div>
                </Html>
            </group>
        </Float>
    );
}

/**
 * Particle Field
 */
function ParticleField() {
    const count = 100;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, []);

    const pointsRef = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#a1c4fd"
                transparent
                opacity={0.4}
                sizeAttenuation
            />
        </points>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#80d0c7" />

            <Environment preset="city" />

            <group position={[0, 0, 0]}>
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <MobilePhone />
                </Float>

                {/* Elements floating "out" of the phone */}
                <FloatingSoldSign position={[2.5, 1.5, 1]} />
                <FloatingKey position={[-2.5, 0, 1.5]} />
                <FloatingLeadCard position={[2, -1.5, 0.5]} />
            </group>

            <ParticleField />

            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 2.5}
                maxPolarAngle={Math.PI / 1.5}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    );
}

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="w-12 h-12 border-4 border-t-[#80d0c7] border-r-transparent border-b-[#a1c4fd] border-l-transparent rounded-full animate-spin" />
        </div>
    );
}

interface Hero3DPhoneProps {
    className?: string;
    height?: string;
}

export function Hero3DPhone({ className = '', height = '600px' }: Hero3DPhoneProps) {
    return (
        <div className={`relative w-full ${className}`} style={{ height }}>
            <Suspense fallback={<LoadingFallback />}>
                <Canvas
                    shadows
                    camera={{ position: [0, 0, 8], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 2]}
                >
                    <Scene />
                </Canvas>
            </Suspense>

            {/* Decorative gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>
    );
}
