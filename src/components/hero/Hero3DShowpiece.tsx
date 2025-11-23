import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    Environment,
    Float,
    Text,
    RoundedBox,
    useTexture,
    PerspectiveCamera,
    ContactShadows,
    SpotLight
} from '@react-three/drei';
import * as THREE from 'three';

// --- Assets & Constants ---
const PROFILE_IMAGE = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400";
const LISTING_IMAGE = "https://images.unsplash.com/photo-1600596542815-e32870110274?auto=format&fit=crop&w=600&h=400";

// --- Materials ---
// Premium frosted glass material
const GlassMaterial = ({ color = '#ffffff', opacity = 0.4, roughness = 0.2, metalness = 0.1 }) => (
    <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transmission={0.95} // High transmission for glass effect
        thickness={0.5} // Refraction thickness
        clearcoat={1}
        clearcoatRoughness={0.1}
        opacity={opacity}
        transparent
        side={THREE.DoubleSide}
    />
);

// --- Components ---

function GlassCard({ position, rotation, args, children, color = 'white' }: any) {
    return (
        <group position={position} rotation={rotation}>
            <RoundedBox args={args} radius={0.1}>
                <GlassMaterial color={color} />
            </RoundedBox>
            {/* Border/Rim Light */}
            <RoundedBox args={[args[0] + 0.02, args[1] + 0.02, args[2]]} radius={0.1} position={[0, 0, -0.01]}>
                <meshBasicMaterial color="white" transparent opacity={0.2} />
            </RoundedBox>
            <group position={[0, 0, args[2] / 2 + 0.01]}>
                {children}
            </group>
        </group>
    );
}

function ProfileBadge({ position }: { position: [number, number, number] }) {
    const texture = useTexture(PROFILE_IMAGE);

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <GlassCard position={position} args={[2.5, 3.2, 0.1]}>
                {/* Avatar */}
                <mesh position={[0, 0.5, 0.05]}>
                    <circleGeometry args={[0.6, 64]} />
                    <meshBasicMaterial map={texture} toneMapped={false} />
                </mesh>

                {/* Name & Title */}
                <Text
                    position={[0, -0.4, 0.05]}
                    fontSize={0.2}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                >
                    Sarah Johnson
                </Text>
                <Text
                    position={[0, -0.7, 0.05]}
                    fontSize={0.1}
                    color="#666"
                    anchorX="center"
                    anchorY="middle"
                >
                    Luxury Real Estate Specialist
                </Text>

                {/* Verified Badge */}
                <group position={[0.4, 0.9, 0.1]}>
                    <mesh>
                        <circleGeometry args={[0.15, 32]} />
                        <meshBasicMaterial color="#3b82f6" />
                    </mesh>
                    <Text position={[0, 0, 0.01]} fontSize={0.15} color="white">✓</Text>
                </group>
            </GlassCard>
        </Float>
    );
}

function StatsCard({ position, label, value, color }: any) {
    return (
        <Float speed={3} rotationIntensity={0.3} floatIntensity={0.4}>
            <GlassCard position={position} args={[1.8, 1.2, 0.08]}>
                <Text
                    position={[0, 0.1, 0.05]}
                    fontSize={0.35}
                    color={color}
                    fontWeight="bold"
                    anchorX="center"
                    anchorY="middle"
                >
                    {value}
                </Text>
                <Text
                    position={[0, -0.25, 0.05]}
                    fontSize={0.12}
                    color="#555"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
            </GlassCard>
        </Float>
    );
}

function ListingSnippet({ position }: { position: [number, number, number] }) {
    const texture = useTexture(LISTING_IMAGE);

    return (
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
            <GlassCard position={position} args={[2.2, 1.6, 0.08]}>
                <mesh position={[0, 0.2, 0.05]}>
                    <planeGeometry args={[2, 1]} />
                    <meshBasicMaterial map={texture} toneMapped={false} />
                </mesh>
                <group position={[-0.9, -0.5, 0.05]}>
                    <Text
                        position={[0.1, 0.1, 0]}
                        fontSize={0.12}
                        color="#111"
                        anchorX="left"
                        anchorY="middle"
                        fontWeight="bold"
                    >
                        Modern Hills Villa
                    </Text>
                    <Text
                        position={[0.1, -0.1, 0]}
                        fontSize={0.1}
                        color="#666"
                        anchorX="left"
                        anchorY="middle"
                    >
                        $2,450,000 • Sold
                    </Text>
                </group>

                {/* "Sold" Sticker */}
                <group position={[0.7, 0.5, 0.1]} rotation={[0, 0, -0.2]}>
                    <RoundedBox args={[0.8, 0.3, 0.02]} radius={0.05}>
                        <meshBasicMaterial color="#e11d48" />
                    </RoundedBox>
                    <Text position={[0, 0, 0.02]} fontSize={0.15} color="white" fontWeight="bold">
                        SOLD
                    </Text>
                </group>
            </GlassCard>
        </Float>
    );
}

function AbstractShapes() {
    return (
        <group>
            {/* Floating Spheres */}
            <Float speed={4} rotationIntensity={1} floatIntensity={2}>
                <mesh position={[-3, 2, -2]}>
                    <sphereGeometry args={[0.4, 32, 32]} />
                    <meshStandardMaterial color="#80d0c7" roughness={0.1} metalness={0.8} />
                </mesh>
            </Float>
            <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
                <mesh position={[3, -2, -3]}>
                    <icosahedronGeometry args={[0.5, 0]} />
                    <meshStandardMaterial color="#a1c4fd" roughness={0.1} metalness={0.8} />
                </mesh>
            </Float>
        </group>
    );
}

function Scene() {
    const { mouse, viewport } = useThree();
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Parallax effect based on mouse position
            const x = (state.mouse.x * viewport.width) / 10;
            const y = (state.mouse.y * viewport.height) / 10;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.2, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.2, 0.1);
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a1c4fd" />
            <Environment preset="city" />

            {/* Main Content Group */}
            <group ref={groupRef}>
                {/* Center: Profile */}
                <ProfileBadge position={[0, 0, 0]} />

                {/* Left: Stats */}
                <StatsCard
                    position={[-2.5, 1, 0.5]}
                    label="Active Leads"
                    value="142"
                    color="#10b981"
                />
                <StatsCard
                    position={[-2.2, -1.5, -0.5]}
                    label="Deals Closed"
                    value="28"
                    color="#3b82f6"
                />

                {/* Right: Listings */}
                <ListingSnippet position={[2.5, 0.5, 0.2]} />

                {/* Background Accents */}
                <AbstractShapes />
            </group>

            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2.5} far={4} />
        </>
    );
}

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="w-12 h-12 border-4 border-t-blue-400 border-r-transparent border-b-teal-400 border-l-transparent rounded-full animate-spin" />
        </div>
    );
}

interface Hero3DShowpieceProps {
    className?: string;
    height?: string;
}

export function Hero3DShowpiece({ className = '', height = '600px' }: Hero3DShowpieceProps) {
    return (
        <div className={`relative w-full ${className}`} style={{ height }}>
            <Suspense fallback={<LoadingFallback />}>
                <Canvas
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 2]}
                >
                    <Scene />
                </Canvas>
            </Suspense>
        </div>
    );
}
