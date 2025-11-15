import { j as jsxRuntimeExports, r as reactExports } from './react-vendor-a6jLNMWt.js';
import { C as Canvas, u as useFrame } from './three-addons-aBd78e9L.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './three-D7pws1Rl.js';

function AnimatedSphere({ color1, color2 }) {
  const meshRef = reactExports.useRef(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, scale: 3, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("icosahedronGeometry", { args: [1, 4] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: color1,
        emissive: color2,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.8
      }
    )
  ] });
}
function GradientMesh({ color1 = "#6366f1", color2 = "#8b5cf6" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 -z-10 opacity-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Canvas, { camera: { position: [0, 0, 5], fov: 75 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.5 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [10, 10, 10], intensity: 1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [-10, -10, -10], intensity: 0.5, color: color2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedSphere, { color1, color2 })
  ] }) });
}

export { GradientMesh };
