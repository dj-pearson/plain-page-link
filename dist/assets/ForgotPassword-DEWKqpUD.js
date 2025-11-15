import { r as reactExports, j as jsxRuntimeExports, L as Link } from './react-vendor-a6jLNMWt.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { H as Home, b as Check, a2 as ArrowLeft, M as Mail, L as LoaderCircle } from './icons-Bf8A6sFa.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';

function ForgotPassword() {
  const [email, setEmail] = reactExports.useState("");
  const [sent, setSent] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: error2 } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error2) {
      setError(error2.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };
  if (sent) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white/80 backdrop-blur-sm border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "h-6 w-6 text-blue-600" }),
        "AgentBio.net"
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-8 w-8 text-green-600" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Check Your Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600 mb-6", children: [
          "We've sent password reset instructions to ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: email })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Click the link in the email to reset your password. The link will expire in 1 hour." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/auth/login",
            className: "inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to Login"
            ]
          }
        )
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white/80 backdrop-blur-sm border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "h-6 w-6 text-blue-600" }),
      "AgentBio.net"
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Reset Your Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Enter your email and we'll send you instructions to reset your password" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg shadow-lg p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "email",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  required: true,
                  className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  placeholder: "you@example.com"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              disabled: loading,
              className: "w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
              children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }),
                "Sending..."
              ] }) : "Send Reset Instructions"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/auth/login",
            className: "inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to Login"
            ]
          }
        ) })
      ] })
    ] }) })
  ] });
}

export { ForgotPassword as default };
