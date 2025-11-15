import { r as reactExports, g as useNavigate, j as jsxRuntimeExports } from "./react-vendor-MTOt5FFF.js";
import { j as Button, v as Progress, C as Card } from "./ui-components-CbrOUI4e.js";
import { g as Sparkles, a6 as Upload, H as Home, E as Eye, a7 as Link, b as Check, a2 as ArrowLeft, A as ArrowRight, L as LoaderCircle } from "./icons-CFSiufIk.js";
import { u as useAuthStore } from "./state-stores-BzsyoW3J.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useToast } from "./index-CAwD2FR9.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./data-kszmrHwg.js";
import "./three-addons-w2uoJ2aN.js";
import "./three-D20jh1h6.js";
import "./forms-xSDtUvSX.js";
function OnboardingWizard({ onComplete, userProfile }) {
  const [currentStep, setCurrentStep] = reactExports.useState(1);
  const [wizardData, setWizardData] = reactExports.useState({
    templateChoice: null,
    profileBasics: {
      photo: null,
      photoPreview: null,
      fullName: (userProfile == null ? void 0 : userProfile.full_name) || "",
      title: "",
      bio: "",
      phone: "",
      location: ""
    },
    firstListing: {
      photo: null,
      photoPreview: null,
      address: "",
      price: "",
      beds: "",
      baths: "",
      status: "active"
    },
    importOption: null
  });
  useNavigate();
  const totalSteps = 5;
  const progress = currentStep / totalSteps * 100;
  const steps = [
    { number: 1, title: "Choose Template", icon: Sparkles },
    { number: 2, title: "Profile Basics", icon: Upload },
    { number: 3, title: "First Listing", icon: Home },
    { number: 4, title: "Preview", icon: Eye },
    { number: 5, title: "Share", icon: Link }
  ];
  const templates = [
    { id: "luxury", name: "Luxury", description: "High-end properties", colors: ["#1e3a8a", "#d4af37"] },
    { id: "modern", name: "Modern Clean", description: "Minimalist & professional", colors: ["#2563eb", "#10b981"] },
    { id: "coastal", name: "Coastal", description: "Beach & waterfront", colors: ["#0891b2", "#06b6d4"] },
    { id: "classic", name: "Classic", description: "Traditional & timeless", colors: ["#7c3aed", "#a855f7"] }
  ];
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(wizardData);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSkipToEnd = () => {
    onComplete(wizardData);
  };
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.templateChoice !== null;
      case 2:
        return wizardData.profileBasics.fullName && wizardData.profileBasics.title;
      case 3:
        return true;
      // Optional step
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Setup Your AgentBio Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleSkipToEnd, children: "Skip Setup" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress, className: "h-2 mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: steps.map((step) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center gap-2 ".concat(step.number === currentStep ? "text-blue-600 font-semibold" : step.number < currentStep ? "text-green-600" : "text-gray-400"),
          children: [
            step.number < currentStep ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-green-500 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-5 w-5 text-white" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full flex items-center justify-center ".concat(step.number === currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"), children: step.number }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden md:inline text-sm", children: step.title })
          ]
        },
        step.number
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-8 bg-white shadow-xl", children: [
      currentStep === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        StepChooseTemplate,
        {
          templates,
          selected: wizardData.templateChoice,
          onSelect: (id) => setWizardData({ ...wizardData, templateChoice: id })
        }
      ),
      currentStep === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        StepProfileBasics,
        {
          data: wizardData.profileBasics,
          onChange: (data) => setWizardData({ ...wizardData, profileBasics: data })
        }
      ),
      currentStep === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        StepFirstListing,
        {
          data: wizardData.firstListing,
          onChange: (data) => setWizardData({ ...wizardData, firstListing: data })
        }
      ),
      currentStep === 4 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepPreview, { wizardData }),
      currentStep === 5 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepShare, { username: (userProfile == null ? void 0 : userProfile.username) || "yourname" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          onClick: handleBack,
          disabled: currentStep === 1,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-600", children: [
        "Step ",
        currentStep,
        " of ",
        totalSteps,
        " • ~",
        10 - currentStep * 2,
        " min remaining"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleNext,
          disabled: !canProceed(),
          children: [
            currentStep === totalSteps ? "Go to Dashboard" : "Next",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 ml-2" })
          ]
        }
      )
    ] })
  ] }) });
}
function StepChooseTemplate({ templates, selected, onSelect }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Choose Your Style" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: "Select a template to match your brand. You can customize it later." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: templates.map((template) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => onSelect(template.id),
        className: "p-4 rounded-xl border-2 transition-all ".concat(selected === template.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-full h-24 rounded-lg mb-3",
              style: {
                background: "linear-gradient(135deg, ".concat(template.colors[0], ", ").concat(template.colors[1], ")")
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm", children: template.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: template.description })
        ]
      },
      template.id
    )) })
  ] });
}
function StepProfileBasics({ data, onChange }) {
  const handlePhotoUpload = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: file, photoPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Your Profile Basics" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: "Add your photo and basic info. Takes ~2 minutes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Profile Photo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 rounded-full bg-gray-200 overflow-hidden", children: data.photoPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: data.photoPreview, alt: "Preview", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-8 w-8" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "file",
                id: "photo-upload",
                accept: "image/*",
                onChange: handlePhotoUpload,
                className: "hidden"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "photo-upload", className: "cursor-pointer", children: "Upload Photo" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Full Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: data.fullName,
              onChange: (e) => onChange({ ...data, fullName: e.target.value }),
              placeholder: "Sarah Johnson",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Title *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: data.title,
              onChange: (e) => onChange({ ...data, title: e.target.value }),
              placeholder: "Luxury Home Specialist",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Bio (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: data.bio,
            onChange: (e) => onChange({ ...data, bio: e.target.value }),
            placeholder: "Helping families find their dream homes...",
            className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Phone (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              value: data.phone,
              onChange: (e) => onChange({ ...data, phone: e.target.value }),
              placeholder: "(555) 123-4567",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Location (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: data.location,
              onChange: (e) => onChange({ ...data, location: e.target.value }),
              placeholder: "Austin, TX",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function StepFirstListing({ data, onChange }) {
  const handlePhotoUpload = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: file, photoPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Add Your First Listing" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: "Showcase a property to make your profile pop. You can skip and add later." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Property Photo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-32 h-24 rounded-lg bg-gray-200 overflow-hidden", children: data.photoPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: data.photoPreview, alt: "Property", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "h-8 w-8" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "file",
                id: "listing-photo",
                accept: "image/*",
                onChange: handlePhotoUpload,
                className: "hidden"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "listing-photo", className: "cursor-pointer", children: "Upload Photo" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: data.address,
            onChange: (e) => onChange({ ...data, address: e.target.value }),
            placeholder: "123 Main St, Austin, TX 78701",
            className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Price" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: data.price,
              onChange: (e) => onChange({ ...data, price: e.target.value }),
              placeholder: "$750,000",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Beds" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              value: data.beds,
              onChange: (e) => onChange({ ...data, beds: e.target.value }),
              placeholder: "3",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Baths" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              value: data.baths,
              onChange: (e) => onChange({ ...data, baths: e.target.value }),
              placeholder: "2",
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-2", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "radio",
                checked: data.status === "active",
                onChange: () => onChange({ ...data, status: "active" }),
                className: "text-blue-600"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Active Listing" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "radio",
                checked: data.status === "sold",
                onChange: () => onChange({ ...data, status: "sold" }),
                className: "text-blue-600"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sold Property" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StepPreview({ wizardData }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "Preview Your Profile" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: "Here's how your profile will look. You can edit everything later." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center mb-6", children: [
        wizardData.profileBasics.photoPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: wizardData.profileBasics.photoPreview,
            alt: "Profile",
            className: "w-24 h-24 rounded-full object-cover mb-4"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 rounded-full bg-gray-300 mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold", children: wizardData.profileBasics.fullName || "Your Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: wizardData.profileBasics.title || "Your Title" }),
        wizardData.profileBasics.location && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: wizardData.profileBasics.location })
      ] }),
      wizardData.profileBasics.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 text-center mb-4", children: wizardData.profileBasics.bio }),
      wizardData.firstListing.photoPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: wizardData.firstListing.photoPreview,
            alt: "Listing",
            className: "w-full h-48 object-cover"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-lg text-blue-600 mb-1", children: wizardData.firstListing.price || "$XXX,XXX" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-700 mb-2", children: wizardData.firstListing.address || "Property Address" }),
          (wizardData.firstListing.beds || wizardData.firstListing.baths) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-600", children: [
            wizardData.firstListing.beds,
            " bd • ",
            wizardData.firstListing.baths,
            " ba"
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
function StepShare({ username }) {
  const profileUrl = "agentbio.net/".concat(username);
  const [copied, setCopied] = reactExports.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText("https://".concat(profileUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-8 w-8 text-green-600" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: "🎉 Your Profile is Live!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-8", children: "Share your link on Instagram, Facebook, business cards, and everywhere you connect with clients." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 mb-2", children: "Your AgentBio Link" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-blue-600 mb-4", children: profileUrl }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCopy, size: "lg", className: "mb-4", children: copied ? "Copied!" : "Copy Link" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-left max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-center mb-4", children: "Next Steps:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0", children: "1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Add it to Instagram bio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600", children: "Replace your current link with your AgentBio URL" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0", children: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Add more listings" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600", children: "Showcase your sold properties and active listings" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0", children: "3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Customize your theme" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600", children: "Match your personal brand with colors and fonts" })
        ] })
      ] })
    ] })
  ] });
}
function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const handleComplete = async (wizardData) => {
    var _a, _b, _c;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive"
      });
      navigate("/auth/login");
      return;
    }
    setIsSaving(true);
    try {
      const profileUpdates = {};
      if (wizardData.profileBasics.fullName) {
        profileUpdates.full_name = wizardData.profileBasics.fullName;
      }
      if (wizardData.profileBasics.title) {
        profileUpdates.title = wizardData.profileBasics.title;
      }
      if (wizardData.profileBasics.bio) {
        profileUpdates.bio = wizardData.profileBasics.bio;
      }
      if (wizardData.profileBasics.phone) {
        profileUpdates.phone = wizardData.profileBasics.phone;
      }
      if (wizardData.profileBasics.location) {
        const parts = wizardData.profileBasics.location.split(",").map((s) => s.trim());
        if (parts.length >= 2) {
          profileUpdates.city = parts[0];
          profileUpdates.license_state = parts[1];
        }
      }
      if (wizardData.profileBasics.photo) {
        try {
          const fileExt = wizardData.profileBasics.photo.name.split(".").pop();
          const fileName = "".concat(user.id, "-").concat(Date.now(), ".").concat(fileExt);
          const filePath = "avatars/".concat(fileName);
          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, wizardData.profileBasics.photo);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
          profileUpdates.avatar_url = publicUrl;
        } catch (error) {
          console.error("Error uploading avatar:", error);
        }
      }
      if (wizardData.templateChoice) {
        profileUpdates.theme = wizardData.templateChoice;
      }
      const { error: profileError } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
      if (profileError) throw profileError;
      if (wizardData.firstListing.address || wizardData.firstListing.price) {
        try {
          let photoUrl = null;
          if (wizardData.firstListing.photo) {
            const fileExt = wizardData.firstListing.photo.name.split(".").pop();
            const fileName = "".concat(user.id, "-listing-").concat(Date.now(), ".").concat(fileExt);
            const filePath = "listings/".concat(fileName);
            const { error: uploadError } = await supabase.storage.from("listing-images").upload(filePath, wizardData.firstListing.photo);
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(filePath);
              photoUrl = publicUrl;
            }
          }
          const addressParts = ((_a = wizardData.firstListing.address) == null ? void 0 : _a.split(",").map((s) => s.trim())) || [];
          const address = addressParts[0] || "";
          const city = addressParts[1] || "";
          const stateZip = addressParts[2] || "";
          const stateParts = stateZip.split(" ");
          const state = stateParts[0] || "";
          const zip = stateParts[1] || "";
          const listingData = {
            user_id: user.id,
            address,
            city,
            state,
            zip_code: zip,
            price: wizardData.firstListing.price || "0",
            bedrooms: wizardData.firstListing.beds ? parseInt(wizardData.firstListing.beds) : null,
            bathrooms: wizardData.firstListing.baths ? parseInt(wizardData.firstListing.baths) : null,
            status: wizardData.firstListing.status || "active",
            featured: true,
            // Make first listing featured
            photos: photoUrl ? [photoUrl] : []
          };
          const { error: listingError } = await supabase.from("listings").insert(listingData);
          if (listingError) {
            console.error("Error creating listing:", listingError);
          }
        } catch (error) {
          console.error("Error with first listing:", error);
        }
      }
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            user_id: user.id,
            email: user.email,
            full_name: wizardData.profileBasics.fullName || ((_b = user.user_metadata) == null ? void 0 : _b.full_name),
            username: ((_c = user.user_metadata) == null ? void 0 : _c.username) || "agent"
          }
        });
      } catch (emailError) {
        console.error("Welcome email failed (non-critical):", emailError);
      }
      toast({
        title: "🎉 Welcome to AgentBio!",
        description: "Your profile is ready to share. Check your email for next steps!"
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isSaving) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Setting up your profile..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "This will only take a moment" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingWizard,
    {
      onComplete: handleComplete,
      userProfile: profile || user
    }
  );
}
export {
  OnboardingWizardPage as default
};
