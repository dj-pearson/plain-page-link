import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Float,
    Html,
    RoundedBox,
    Cylinder,
    ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';
import { CheckCircle2, Star, MapPin, ArrowRight, Home } from 'lucide-react';

/**
 * High-Fidelity Phone Model
 * Titanium frame, glass back, dynamic island
 */
function PremiumPhone() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Sophisticated floating animation
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* --- Main Body Frame (Titanium) --- */}
            <RoundedBox args={[3.2, 6.5, 0.35]} radius={0.5} position={[0, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial
                    color="#4a4a4a" // Dark Titanium
                    roughness={0.2}
                    metalness={1.0}
                    envMapIntensity={1.5}
                />
            </RoundedBox>

            {/* --- Side Buttons --- */}
            {/* Power */}
            <RoundedBox args={[0.05, 0.8, 0.1]} radius={0.02} position={[1.62, 1, 0]}>
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
            </RoundedBox>
            {/* Volume Up */}
            <RoundedBox args={[0.05, 0.5, 0.1]} radius={0.02} position={[-1.62, 1.5, 0]}>
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
            </RoundedBox>
            {/* Volume Down */}
            <RoundedBox args={[0.05, 0.5, 0.1]} radius={0.02} position={[-1.62, 0.8, 0]}>
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
            </RoundedBox>

            {/* --- Screen Glass (Black borders) --- */}
            <RoundedBox args={[3.05, 6.35, 0.05]} radius={0.45} position={[0, 0, 0.16]}>
                <meshPhysicalMaterial
                    color="#000000"
                    roughness={0.1}
                    metalness={0.8}
                    clearcoat={1}
                />
            </RoundedBox>

            {/* --- Dynamic Island / Notch --- */}
            <RoundedBox args={[0.8, 0.2, 0.06]} radius={0.1} position={[0, 2.8, 0.17]}>
                <meshBasicMaterial color="#000000" />
            </RoundedBox>

            {/* --- The Actual Screen Content (HTML) --- */}
            {/* 
          Scale Calculation:
          Phone width is ~3 units.
          HTML width is 290px.
          Scale = 3 / 290 ≈ 0.01
      */}
            <Html
                transform
                position={[0, 0, 0.25]} // Moved forward to prevent z-fighting
                scale={0.01}
                style={{
                    width: '290px',
                    height: '615px',
                    backgroundColor: 'white',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    // Removed backfaceVisibility to ensure it renders
                }}
            >
                <div className="w-full h-full flex flex-col font-sans bg-gray-50 select-none">
                    {/* Status Bar */}
                    <div className="h-8 w-full flex justify-between items-center px-6 pt-2">
                        <span className="text-[10px] font-bold text-gray-800">9:41</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 bg-gray-800 rounded-full opacity-20"></div>
                            <div className="w-3 h-3 bg-gray-800 rounded-full opacity-20"></div>
                            <div className="w-4 h-2 bg-gray-800 rounded-[2px]"></div>
                        </div>
                    </div>

                    {/* Profile Header */}
                    <div className="flex flex-col items-center pt-8 pb-6 px-4 bg-white shadow-sm z-10">
                        <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 p-1">
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200"
                                    alt="Agent"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                                <CheckCircle2 size={12} />
                            </div>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Sarah Johnson</h2>
                        <p className="text-xs text-gray-500 font-medium mb-3">Luxury Real Estate Specialist</p>
                        <div className="flex gap-2 text-[10px] text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            <MapPin size={10} />
                            <span>Beverly Hills, CA</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
                        <div className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-teal-200 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                                    <Home size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-gray-800">Featured Listings</div>
                                    <div className="text-[10px] text-gray-500">View my exclusive properties</div>
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-gray-300 group-hover:text-teal-500" />
                        </div>

                        <div className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Star size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-gray-800">Client Reviews</div>
                                    <div className="text-[10px] text-gray-500">See what my clients say</div>
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                        </div>

                        {/* Listing Card Preview */}
                        <div className="mt-4 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                            <div className="h-24 bg-gray-200 relative">
                                <img
                                    src="https://images.unsplash.com/photo-1600596542815-e32870110274?auto=format&fit=crop&w=400&h=200"
                                    alt="House"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                                    $2,450,000
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="text-xs font-bold text-gray-800">Modern Hills Villa</div>
                                <div className="text-[10px] text-gray-500">4 Bed • 3.5 Bath • 3,200 sqft</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Nav Indicator */}
                    <div className="h-4 w-full flex justify-center items-center pb-2">
                        <div className="w-24 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            </Html>
        </group>
    );
}

/**
 * Modern "Sold" Sign
 * Floating rider style
 */
function SoldRider({ position }: { position: [number, number, number] }) {
    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4} floatingRange={[-0.1, 0.1]}>
            <group position={position} rotation={[0, -0.2, 0.05]}>
                {/* Sign Board */}
                <RoundedBox args={[1.8, 0.6, 0.05]} radius={0.05} castShadow>
                    <meshStandardMaterial color="#e11d48" roughness={0.2} metalness={0.1} />
                </RoundedBox>

                {/* Text */}
                <Html transform position={[0, 0, 0.03]} style={{ pointerEvents: 'none' }}>
                    <div className="text-white font-black text-4xl tracking-widest drop-shadow-md font-sans">
                        SOLD
                    </div>
                </Html>

                {/* Hanging Chains (Visual detail) */}
                <Cylinder args={[0.01, 0.01, 0.4]} position={[-0.7, 0.5, 0]}>
                    <meshStandardMaterial color="#999" metalness={0.8} />
                </Cylinder>
                <Cylinder args={[0.01, 0.01, 0.4]} position={[0.7, 0.5, 0]}>
                    <meshStandardMaterial color="#999" metalness={0.8} />
                </Cylinder>
            </group>
        </Float>
    );
}

/**
 * Floating 3D Key
 */
function ModernKey({ position }: { position: [number, number, number] }) {
    return (
        <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position} rotation={[0, 0, -Math.PI / 4]} scale={1.2}>
                <Cylinder args={[0.25, 0.25, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
                </Cylinder>
                <RoundedBox args={[0.1, 0.8, 0.05]} radius={0.02} position={[0, -0.5, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
                </RoundedBox>
                <RoundedBox args={[0.15, 0.1, 0.05]} radius={0.01} position={[0.1, -0.4, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
                </RoundedBox>
                <RoundedBox args={[0.15, 0.1, 0.05]} radius={0.01} position={[0.1, -0.7, 0]}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
                </RoundedBox>
            </group>
        </Float>
    );
}

function Scene() {
    return (
        <>
            <ambientLight intensity={0.7} />
            <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={1.5} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={1} color="#80d0c7" />

            {/* Studio Environment for nice metal reflections */}
            <Environment preset="city" />

            <group position={[0, -0.5, 0]}>
                <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
                    <PremiumPhone />
                </Float>

                {/* Floating Elements - Positioned closer to center to avoid cutoff */}
                <SoldRider position={[2.2, 1.5, 0.5]} />
                <ModernKey position={[-2.2, -1, 1]} />
            </group>

            {/* Floor Shadow */}
            <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 2.5}
                maxPolarAngle={Math.PI / 1.5}
                autoRotate
                autoRotateSpeed={0.3}
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
                    // Adjusted camera FOV and position to ensure everything fits
                    camera={{ position: [0, 0, 7], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 2]}
                >
                    <Scene />
                </Canvas>
            </Suspense>
        </div>
    );
}
