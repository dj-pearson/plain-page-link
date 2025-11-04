<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# can you give me a source and potential code for the recommendation

Perfect! Now I have comprehensive sources. Let me compile the answer with sources and code examples:

## React Three Fiber 3D Hero Elements for AgentBio – Sources \& Code Examples

### Primary Sources

Here are the best sources for implementing these 3D elements:

**Official Documentation \& GitHub Repositories:**

1. **React Three Fiber Official Boilerplate** - The official R3F documentation with working examples on GitHub[^1]
2. **Sean Bradley's R3F Course \& Boilerplate** - Comprehensive React Three Fiber tutorials including a complete house branch example[^2][^3]
3. **Dustin Pfister's Three.js House Example** - Detailed Three.js house model creation with geometries[^4]
4. **Wisp Blog – Floating 3D Objects in React** - Complete guide with production-ready patterns[^5]

***

### Recommended Code Implementation

#### **Option 1: Rotating House Model (Recommended for AgentBio)**

Here's the complete, production-ready code based on the official examples:[^6][^1][^5]

```typescript
// src/components/HeroHouse.tsx
"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function RotatingHouse() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* House Base */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#8B6F47" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 1, 4]} />
        <meshStandardMaterial color="#D4514F" metalness={0} roughness={0.7} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.3, 1.01]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#3E2723" metalness={0.2} />
      </mesh>

      {/* Window */}
      <mesh position={[0.6, 0.6, 1.01]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#87CEEB" metalness={0.3} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Canvas shadows camera={{ position: [3, 2, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <RotatingHouse />
        <OrbitControls autoRotate autoRotateSpeed={4} />
      </Canvas>
    </div>
  );
}
```

**Installation:**

```bash
npm install @react-three/fiber @react-three/drei three
```

**Usage in your page:**

```typescript
// pages/index.tsx or app/page.tsx
import { HeroScene } from "@/components/HeroHouse";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <HeroScene />
        <h1>Find Your Perfect Property</h1>
      </section>
    </main>
  );
}
```


***

#### **Option 2: Floating Geometric Shapes (Modern Aesthetic)**

For a sleeker, more contemporary look using Drei utilities:[^7][^5]

```typescript
// src/components/FloatingGeometry.tsx
"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function FloatingShape() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial
        color="#1E40AF"
        metalness={0.7}
        roughness={0.2}
        wireframe={false}
      />
    </mesh>
  );
}

export function FloatingGeometryScene() {
  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [3, 3, 3], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <FloatingShape />
        <OrbitControls autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
```


***

### Getting Started Resources

**Clone Sean Bradley's Boilerplate with House Branch:**[^3][^2]

```bash
git clone https://github.com/Sean-Bradley/React-Three-Fiber-Boilerplate.git
cd React-Three-Fiber-Boilerplate
git checkout house
npm install
npm run start
```

This gives you a working house example that you can directly adapt for AgentBio.

**Full Wisp.blog Guide** includes:[^5]

- Optimization techniques for production
- Mobile performance considerations
- Error boundary implementations
- Accessibility patterns

**Three.js House Geometry Deep Dive** covers building house models with:[^4]

- BoxGeometry for the base
- ConeGeometry for roofs
- Custom BufferGeometry for roof gaps
- Canvas textures

***

### Performance Optimization for Production

Key patterns from the sources:[^5]

```typescript
// Add proper loading states
import { Suspense } from "react";

export function HeroWithLoader() {
  return (
    <Suspense fallback={<div>Loading 3D scene...</div>}>
      <HeroScene />
    </Suspense>
  );
}

// Responsive sizing for mobile
const style = {
  width: "100%",
  height: "min(500px, 70vh)",
  position: "relative" as const,
};
```


***

### Next Steps

1. Start with **Option 1 (Rotating House)** – most on-brand for real estate
2. Install dependencies: `npm install @react-three/fiber @react-three/drei three`
3. Copy the HeroHouse component above into your project
4. Reference the Sean Bradley boilerplate for more complex patterns
5. Customize colors to match AgentBio branding

The code provided above follows the production patterns from official React Three Fiber examples and is optimized for performance per Wisp's recommendations.[^1][^5]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://github.com/pmndrs/react-three-fiber

[^2]: https://sbcode.net/react-three-fiber/house/

[^3]: https://github.com/Sean-Bradley/React-Three-Fiber-Boilerplate

[^4]: https://dustinpfister.github.io/2021/04/23/threejs-examples-house/

[^5]: https://www.wisp.blog/blog/how-to-add-a-floating-3d-object-in-react

[^6]: https://onion2k.github.io/r3f-by-example/examples/hooks/rotating-cube/

[^7]: https://github.com/bigmistqke/solid-drei

[^8]: https://github.com/pmndrs/react-three-fiber/discussions/552

[^9]: https://www.reddit.com/r/threejs/comments/1c5gw0l/react_three_fiber/

[^10]: https://www.codecademy.com/article/build-a-3d-environment-with-three-js

[^11]: https://discourse.threejs.org/t/using-r3f-to-update-camera-rotation-lookat-value/67734

[^12]: https://www.youtube.com/watch?v=qsA3zRvihs8

[^13]: https://blog.teamtreehouse.com/the-beginners-guide-to-three-js

[^14]: https://github.com/Sean-Bradley/Threejs-Boilerplate

[^15]: https://github.com/Sean-Bradley/R3F-Pack

[^16]: https://www.youtube.com/watch?v=p_8rW0c4ASk

[^17]: https://www.youtube.com/watch?v=8aEF1H5nlYA

[^18]: https://github.com/pmndrs/drei-vanilla

[^19]: https://sbcode.net/react-three-fiber/material-picker/

