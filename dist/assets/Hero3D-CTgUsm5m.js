import { j as jsxRuntimeExports, r as reactExports } from './react-vendor-a6jLNMWt.js';
import { C as Canvas, E as Environment, O as OrbitControls, R as RoundedBox, b as Cylinder, S as Sphere, F as Float, H as Html, u as useFrame } from './three-addons-aBd78e9L.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './three-D7pws1Rl.js';

function LuxuryModernHouse() {
  const groupRef = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, position: [0, -0.8, -0.5], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [5, 0.1, 4], radius: 0.02, position: [0, -0.05, 0], receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2c2c2c", roughness: 0.8, metalness: 0.2 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [4, 1.2, 3.5], radius: 0.05, position: [0, 0.6, 0], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#f5f5f5",
        roughness: 0.2,
        metalness: 0.8
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [3, 1, 3], radius: 0.05, position: [-0.3, 1.5, 0.2], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#ffffff",
        roughness: 0.1,
        metalness: 0.3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [1, 2, 3.2], radius: 0.03, position: [1.3, 1.2, 0], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#e8f4f8",
        roughness: 0.15,
        metalness: 0.4
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [3.1, 0.1, 3.1], radius: 0.02, position: [-0.3, 2.05, 0.2], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#a1c4fd",
        roughness: 0.2,
        metalness: 0.8
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [1.5, 0.08, 1.5], radius: 0.02, position: [-0.3, 2.15, 0.2], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#80d0c7",
        roughness: 0.3,
        metalness: 0.7
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [2.5, 1, 0.05], radius: 0.01, position: [0, 0.6, 1.76], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshPhysicalMaterial",
      {
        color: "#b8e6f5",
        roughness: 0.05,
        metalness: 0.95,
        emissive: "#a1c4fd",
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [2.2, 0.8, 0.05], radius: 0.01, position: [-0.3, 1.5, 1.63], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshPhysicalMaterial",
      {
        color: "#b8e6f5",
        roughness: 0.05,
        metalness: 0.95,
        emissive: "#a1c4fd",
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [2.4, 0.05, 0.05], radius: 0.01, position: [-0.3, 1, 1.65], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#c2e9fb",
        roughness: 0.05,
        metalness: 0.95,
        emissive: "#a1c4fd",
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [0.5, 1.1, 0.05], radius: 0.02, position: [1.2, 0.5, 1.76], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#5a9fb8",
        roughness: 0.3,
        metalness: 0.6
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.03, 0.03, 0.15, 8], rotation: [0, 0, Math.PI / 2], position: [1, 0.5, 1.8], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#c9b037",
        roughness: 0.2,
        metalness: 1
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [0.05, 2, 2.8], radius: 0.01, position: [2.02, 1.2, 0], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshPhysicalMaterial",
      {
        color: "#b8e6f5",
        roughness: 0.05,
        metalness: 0.95,
        emissive: "#a1c4fd",
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.85
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [5, 0.05, 2], radius: 0.01, position: [0, -0.04, 2.8], receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#80d0c7",
        roughness: 0.2,
        metalness: 0.7
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [0.8, 0.03, 2], radius: 0.01, position: [1.2, -0.02, 2.8], receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#7ab8c7",
        roughness: 0.4,
        metalness: 0.5
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.3, 16, 16], position: [-1.5, 0.2, 2.2], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5016", roughness: 0.9 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.25, 16, 16], position: [0.5, 0.15, 2.5], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5016", roughness: 0.9 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.35, 16, 16], position: [-2, 0.25, 2], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5016", roughness: 0.9 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-2.5, 0, 2.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.1, 0.12, 1, 8], position: [0, 0.5, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a3c28", roughness: 0.9 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.5, 16, 16], position: [0, 1.3, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5016", roughness: 0.9 }) })
    ] })
  ] });
}
function AnimatedShape({ position, scale, color, speed }) {
  const meshRef = reactExports.useRef(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.3;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * speed) * 0.2;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Float, { speed, rotationIntensity: 0.5, floatIntensity: 0.5, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, position, scale, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1, 1, 1] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color,
        roughness: 0.2,
        metalness: 0.8
      }
    )
  ] }) });
}
function PropertyCard({ position, rotation = 0 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Float, { speed: 2, rotationIntensity: 0.3, floatIntensity: 0.5, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, rotation: [0, rotation, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [1.2, 0.8, 0.05], radius: 0.02, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#ffffff",
        roughness: 0.1,
        metalness: 0.2
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [1.1, 0.4, 0.01], radius: 0.01, position: [0, 0.2, 0.026], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#80d0c7" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Html,
      {
        position: [0, -0.15, 0.03],
        transform: true,
        occlude: true,
        style: {
          width: "110px",
          fontSize: "8px",
          color: "#333",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "bold", marginBottom: "2px" }, children: "$850,000" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "7px", color: "#666" }, children: "4 bd • 3 ba • 2,400 sqft" })
        ]
      }
    )
  ] }) });
}
function SoldSign() {
  const signRef = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Float, { speed: 1.5, rotationIntensity: 0.2, floatIntensity: 0.3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: signRef, position: [-3, 0.5, 1], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.05, 0.05, 1.5, 16], position: [0, -0.3, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a4a4a", metalness: 0.6, roughness: 0.4 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoundedBox, { args: [0.8, 0.5, 0.05], radius: 0.02, castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#dc2626", roughness: 0.3, metalness: 0.2 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Html,
      {
        position: [0, 0, 0.03],
        transform: true,
        occlude: true,
        style: {
          width: "80px",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          letterSpacing: "2px"
        }, children: "SOLD" })
      }
    )
  ] }) });
}
function AmbientParticles() {
  const particlesRef = reactExports.useRef(null);
  const particlesPosition = reactExports.useMemo(() => {
    const positions = new Float32Array(2e3 * 3);
    for (let i = 0; i < 2e3; i++) {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("points", { ref: particlesRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("bufferGeometry", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "bufferAttribute",
      {
        attach: "attributes-position",
        count: particlesPosition.length / 3,
        array: particlesPosition,
        itemSize: 3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointsMaterial",
      {
        size: 0.02,
        color: "#80d0c7",
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
      }
    )
  ] });
}
function StatsBadge({ position, value, label, color }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Float, { speed: 2.5, rotationIntensity: 0.4, floatIntensity: 0.6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.4, 0.4, 0.1, 32], rotation: [Math.PI / 2, 0, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.32, 0.32, 0.02, 32], rotation: [Math.PI / 2, 0, 0], position: [0, 0, 0.06], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: "#ffffff",
        roughness: 0.1,
        metalness: 0.3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Html,
      {
        position: [0, 0, 0.08],
        transform: true,
        occlude: true,
        style: {
          width: "70px",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            fontSize: "16px",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "2px"
          }, children: value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            fontSize: "10px",
            color: "#666"
          }, children: label })
        ]
      }
    )
  ] }) });
}
function Scene() {
  const colors = {
    teal: "#80d0c7",
    blue: "#a1c4fd",
    lightBlue: "#c2e9fb"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.5 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [10, 10, 10], intensity: 1, color: "#ffffff" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [-10, -10, -10], intensity: 0.5, color: "#80d0c7" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "spotLight",
      {
        position: [0, 5, 0],
        intensity: 0.5,
        angle: 0.6,
        penumbra: 1,
        color: "#a1c4fd"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Environment, { preset: "city" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LuxuryModernHouse, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PropertyCard, { position: [-3.5, 2, -1], rotation: 0.3 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PropertyCard, { position: [3.5, 1.5, 0], rotation: -0.4 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SoldSign, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatsBadge,
      {
        position: [3, 2.5, 2],
        value: "$2M+",
        label: "Sold",
        color: "#80d0c7"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedShape, { position: [-3, 0.5, -1], scale: 0.4, color: colors.teal, speed: 0.8 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedShape, { position: [3, -0.5, -2], scale: 0.35, color: colors.blue, speed: 1.2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedShape, { position: [-2.5, -1.5, 1], scale: 0.3, color: colors.lightBlue, speed: 1.5 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedShape, { position: [2.8, 1.5, 0.5], scale: 0.45, color: colors.teal, speed: 0.6 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedShape, { position: [0, -2, -1.5], scale: 0.35, color: colors.blue, speed: 1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AmbientParticles, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      OrbitControls,
      {
        enableZoom: false,
        enablePan: false,
        autoRotate: true,
        autoRotateSpeed: 0.5,
        maxPolarAngle: Math.PI / 2,
        minPolarAngle: Math.PI / 2
      }
    )
  ] });
}
function LoadingFallback() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center w-full h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 border-4 border-glass-border rounded-full animate-pulse" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] rounded-full animate-ping" }) })
  ] }) });
}
function Hero3D({ className = "", height = "600px" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative overflow-hidden rounded-2xl ${className}`,
      style: { height },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-glass-background backdrop-blur-sm border border-glass-border rounded-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Canvas,
          {
            camera: { position: [0, 0, 5], fov: 75 },
            gl: {
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            },
            dpr: [1, 2],
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scene, {})
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 rounded-2xl pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl pointer-events-none" })
      ]
    }
  );
}

export { Hero3D };
