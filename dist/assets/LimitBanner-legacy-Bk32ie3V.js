;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, Link, Alert, AlertDescription, Progress, Button, TriangleAlert, TrendingUp;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        Link = module.L;
      }, module => {
        Alert = module.Q;
        AlertDescription = module.R;
        Progress = module.v;
        Button = module.j;
      }, module => {
        TriangleAlert = module.aB;
        TrendingUp = module.T;
      }],
      execute: function () {
        exports("L", LimitBanner);
        function LimitBanner({
          feature,
          current,
          limit,
          className
        }) {
          const percentage = current / limit * 100;
          const isAtLimit = current >= limit;
          const isNearLimit = percentage >= 80;
          if (!isNearLimit && !isAtLimit) return null;
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Alert, {
            className,
            variant: isAtLimit ? "destructive" : "default",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(TriangleAlert, {
              className: "h-4 w-4"
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(AlertDescription, {
              className: "flex items-center justify-between gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "font-semibold mb-2",
                  children: isAtLimit ? `You've reached your ${feature} limit` : `You're running out of ${feature}`
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between text-sm",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      children: [current, " of ", limit, " used"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      className: "text-muted-foreground",
                      children: [Math.round(percentage), "%"]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Progress, {
                    value: percentage,
                    className: "h-2"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                to: "/pricing",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  size: "sm",
                  variant: isAtLimit ? "secondary" : "outline",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                    className: "w-4 h-4 mr-2"
                  }), "Upgrade"]
                })
              })]
            })]
          });
        }
      }
    };
  });
})();
