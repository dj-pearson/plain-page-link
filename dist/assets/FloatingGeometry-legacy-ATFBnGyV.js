;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './three-addons-legacy-COT_Kqtz.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './three-legacy-VFAp7wzH.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, Canvas, useFrame;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
      }, module => {
        Canvas = module.C;
        useFrame = module.u;
      }, null, null, null],
      execute: function () {
        exports("FloatingGeometry", FloatingGeometry);
        function FloatingCube({
          position,
          color
        }) {
          const meshRef = reactExports.useRef(null);
          useFrame(state => {
            if (meshRef.current) {
              meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + position[0]) * 0.5;
              meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
              meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
            }
          });
          return /* @__PURE__ */jsxRuntimeExports.jsxs("mesh", {
            ref: meshRef,
            position,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("boxGeometry", {
              args: [0.5, 0.5, 0.5]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meshStandardMaterial", {
              color,
              transparent: true,
              opacity: 0.6
            })]
          });
        }
        function FloatingGeometry({
          color = "#f59e0b"
        }) {
          const cubes = [[-2, 0, -2], [2, 0, -2], [-2, 0, 2], [2, 0, 2], [0, 1, 0]];
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "fixed inset-0 -z-10 opacity-25",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(Canvas, {
              camera: {
                position: [0, 0, 8],
                fov: 75
              },
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("ambientLight", {
                intensity: 0.5
              }), /* @__PURE__ */jsxRuntimeExports.jsx("pointLight", {
                position: [10, 10, 10],
                intensity: 1
              }), cubes.map((pos, i) => /* @__PURE__ */jsxRuntimeExports.jsx(FloatingCube, {
                position: pos,
                color
              }, i))]
            })
          });
        }
      }
    };
  });
})();
