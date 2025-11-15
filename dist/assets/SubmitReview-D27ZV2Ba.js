import { f as useParams, g as useNavigate, r as reactExports, j as jsxRuntimeExports } from "./react-vendor-MTOt5FFF.js";
import { s as supabase } from "./supabase-eNUZs_JT.js";
import { u as useToast } from "./index-CAwD2FR9.js";
import { u as LoadingSpinner, C as Card, f as CardHeader, g as CardTitle, h as CardDescription, o as CardContent, j as Button, L as Label, I as Input, T as Textarea } from "./ui-components-CbrOUI4e.js";
import { H as Home, J as CircleCheckBig, i as Star, a5 as Send } from "./icons-CFSiufIk.js";
import "./charts-BvRX79AF.js";
import "./utils-DRaK7sdV.js";
import "./data-kszmrHwg.js";
import "./three-addons-w2uoJ2aN.js";
import "./three-D20jh1h6.js";
import "./state-stores-BzsyoW3J.js";
import "./forms-xSDtUvSX.js";
function SubmitReview() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [submitted, setSubmitted] = reactExports.useState(false);
  const [rating, setRating] = reactExports.useState(0);
  const [hoveredRating, setHoveredRating] = reactExports.useState(0);
  const [formData, setFormData] = reactExports.useState({
    client_name: "",
    client_email: "",
    client_title: "",
    review: "",
    property_type: "",
    transaction_type: "buyer"
  });
  reactExports.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, bio").eq("username", username).single();
        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Agent not found",
          description: "The agent profile could not be found.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      fetchProfile();
    }
  }, [username, toast]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("testimonials").insert({
        user_id: profile.id,
        client_name: formData.client_name,
        client_title: formData.client_title || "",
        rating,
        review: formData.review,
        property_type: formData.property_type || "",
        transaction_type: formData.transaction_type,
        date: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your experience with ".concat(profile.full_name, "!")
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "lg" }) });
  }
  if (!profile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl", children: "Agent Not Found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "The agent profile you're looking for doesn't exist." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => navigate("/"),
          className: "w-full",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Home, { className: "mr-2 h-4 w-4" }),
            "Go to Homepage"
          ]
        }
      ) })
    ] }) });
  }
  if (submitted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-10 h-10 text-green-600" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl", children: "Thank You!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-base mt-2", children: [
          "Your review has been submitted successfully. ",
          profile.full_name,
          " will be notified and may feature your testimonial on their profile."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => navigate("/".concat(username)),
          className: "w-full",
          variant: "outline",
          children: [
            "View ",
            profile.full_name,
            "'s Profile"
          ]
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        profile.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: profile.avatar_url,
            alt: profile.full_name,
            className: "w-16 h-16 rounded-full object-cover"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl", children: "Share Your Experience" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-base", children: [
            "Leave a review for ",
            profile.full_name
          ] })
        ] })
      ] }),
      profile.bio && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground italic", children: [
        '"',
        profile.bio,
        '"'
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-base font-semibold mb-3 block", children: "How would you rate your experience? *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setRating(star),
            onMouseEnter: () => setHoveredRating(star),
            onMouseLeave: () => setHoveredRating(0),
            className: "transition-transform hover:scale-110",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Star,
              {
                className: "w-10 h-10 ".concat(star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")
              }
            )
          },
          star
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: rating > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 font-medium", children: rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_name", children: "Your Name *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "client_name",
            value: formData.client_name,
            onChange: (e) => setFormData({ ...formData, client_name: e.target.value }),
            placeholder: "John Doe",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_email", children: "Your Email *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "client_email",
            type: "email",
            value: formData.client_email,
            onChange: (e) => setFormData({ ...formData, client_email: e.target.value }),
            placeholder: "john@example.com",
            required: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Your email won't be published, it's for verification only." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_title", children: "Title/Occupation (Optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "client_title",
            value: formData.client_title,
            onChange: (e) => setFormData({ ...formData, client_title: e.target.value }),
            placeholder: "e.g., First-time Homebuyer, Real Estate Investor"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "transaction_type", children: "Transaction Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            id: "transaction_type",
            value: formData.transaction_type,
            onChange: (e) => setFormData({ ...formData, transaction_type: e.target.value }),
            className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "buyer", children: "Buyer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "seller", children: "Seller" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "both", children: "Both (Buyer & Seller)" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "property_type", children: "Property Type (Optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "property_type",
            value: formData.property_type,
            onChange: (e) => setFormData({ ...formData, property_type: e.target.value }),
            placeholder: "e.g., Single Family Home, Condo, Townhouse"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "review", children: "Your Review *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "review",
            value: formData.review,
            onChange: (e) => setFormData({ ...formData, review: e.target.value }),
            placeholder: "Share your experience working with this agent...",
            rows: 6,
            required: true,
            className: "resize-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Please be specific about what made your experience positive." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "submit",
          disabled: submitting || rating === 0,
          className: "w-full",
          size: "lg",
          children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "sm", className: "mr-2" }),
            "Submitting..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-2 h-4 w-4" }),
            "Submit Review"
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-center text-muted-foreground", children: [
        "By submitting this review, you agree that it may be displayed publicly on ",
        profile.full_name,
        "'s profile page."
      ] })
    ] }) })
  ] }) }) });
}
export {
  SubmitReview as default
};
