;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, Button, cn, Keyboard, X;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        Button = module.j;
        cn = module.c;
      }, module => {
        Keyboard = module.aC;
        X = module.X;
      }],
      execute: function () {
        exports("K", KeyboardShortcutsHelper);
        function KeyboardShortcutsHelper({
          shortcuts,
          className
        }) {
          const [isOpen, setIsOpen] = reactExports.useState(false);
          const [recentlyUsed, setRecentlyUsed] = reactExports.useState("");
          reactExports.useEffect(() => {
            const handleKeyPress = e => {
              if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
              }
              if (e.key === "?" && !e.shiftKey) {
                e.preventDefault();
                setIsOpen(prev => !prev);
                return;
              }
              const shortcut = shortcuts.find(s => s.key.toLowerCase() === e.key.toLowerCase());
              if (shortcut) {
                e.preventDefault();
                shortcut.action();
                setRecentlyUsed(shortcut.key);
                setTimeout(() => setRecentlyUsed(""), 1e3);
              }
            };
            window.addEventListener("keydown", handleKeyPress);
            return () => window.removeEventListener("keydown", handleKeyPress);
          }, [shortcuts]);
          const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
            const category = shortcut.category || "General";
            if (!acc[category]) acc[category] = [];
            acc[category].push(shortcut);
            return acc;
          }, {});
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
              variant: "outline",
              size: "sm",
              onClick: () => setIsOpen(true),
              className: cn("fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30", "shadow-lg gap-2", className),
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Keyboard, {
                className: "w-4 h-4"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "hidden md:inline",
                children: "Shortcuts"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                className: "px-1.5 py-0.5 text-xs bg-gray-100 rounded border",
                children: "?"
              })]
            }), recentlyUsed && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "fixed top-20 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 z-50",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                  className: "px-2 py-1 bg-white/20 rounded text-sm font-mono",
                  children: recentlyUsed
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-sm",
                  children: "Shortcut used!"
                })]
              })
            }), isOpen && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between p-4 border-b",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Keyboard, {
                      className: "w-5 h-5"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                      className: "font-semibold text-lg",
                      children: "Keyboard Shortcuts"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setIsOpen(false),
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(X, {
                      className: "w-4 h-4"
                    })
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "p-6 overflow-y-auto max-h-[calc(80vh-80px)]",
                  children: [Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "mb-6 last:mb-0",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                      className: "font-semibold text-sm text-gray-600 mb-3 uppercase tracking-wide",
                      children: category
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "space-y-2",
                      children: categoryShortcuts.map(shortcut => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-sm",
                          children: shortcut.description
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                          className: "px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm",
                          children: shortcut.key.toUpperCase()
                        })]
                      }, shortcut.key))
                    })]
                  }, category)), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                      className: "text-sm text-blue-900",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                        children: "💡 Pro Tip:"
                      }), " Press", " ", /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                        className: "px-2 py-1 bg-white rounded text-xs",
                        children: "?"
                      }), " ", "anytime to toggle this panel. Shortcuts don't work when typing in text fields."]
                    })
                  })]
                })]
              })
            })]
          });
        }
      }
    };
  });
})();
