import { j as jsxRuntimeExports, r as reactExports } from "./react-vendor-MTOt5FFF.js";
import { C as Canvas, u as useFrame, P as Points, a as PointMaterial } from "./three-addons-w2uoJ2aN.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./three-D20jh1h6.js";
function Particles({ count, color }) {
  const points = reactExports.useRef(null);
  const particlesPosition = reactExports.useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, [count]);
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      points.current.rotation.y = state.clock.getElapsedTime() * 0.075;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Points, { ref: points, positions: particlesPosition, stride: 3, frustumCulled: false, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    PointMaterial,
    {
      transparent: true,
      color,
      size: 0.02,
      sizeAttenuation: true,
      depthWrite: false
    }
  ) });
}
function ThreeDBackground({ variant, color = "#2563eb" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 -z-10 opacity-30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Canvas, { camera: { position: [0, 0, 5], fov: 75 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.5 }),
    variant === "particles" && /* @__PURE__ */ jsxRuntimeExports.jsx(Particles, { count: 3e3, color })
  ] }) });
}
export {
  ThreeDBackground
};
