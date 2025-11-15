import { j as jsxRuntimeExports, L as Link } from './react-vendor-a6jLNMWt.js';
import { x as Helmet } from './ui-components-DLW4dShh.js';
import { V as ChevronRight, H as Home } from './icons-Bf8A6sFa.js';

function Breadcrumbs({ items, className = "" }) {
  const allItems = [
    { name: "Home", href: "/" },
    ...items
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${window.location.origin}${item.href}`
    }))
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Helmet, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("script", { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "nav",
      {
        "aria-label": "Breadcrumb",
        className: `flex items-center space-x-2 text-sm ${className}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "flex items-center space-x-2", children: allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center", children: [
            index > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChevronRight,
              {
                className: "h-4 w-4 mx-2 text-muted-foreground",
                "aria-hidden": "true"
              }
            ),
            isLast ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "text-foreground font-medium",
                "aria-current": "page",
                children: [
                  isFirst && /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "inline h-4 w-4 mr-1", "aria-hidden": "true" }),
                  item.name
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: item.href,
                className: "text-muted-foreground hover:text-foreground transition-colors",
                children: [
                  isFirst && /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "inline h-4 w-4 mr-1", "aria-hidden": "true" }),
                  item.name
                ]
              }
            )
          ] }, item.href);
        }) })
      }
    )
  ] });
}

export { Breadcrumbs as B };
