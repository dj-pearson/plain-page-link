import { r as reactExports, j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription, L as Label, I as Input, T as Textarea, O as DialogFooter, j as Button } from './ui-components-DLW4dShh.js';
import { i as Star, a6 as Upload, X, b as Check, ae as Copy, u as Share2, h as ExternalLink, M as Mail, q as MessageSquare, aw as Plus, Q as Quote, ay as SquarePen, az as Trash2 } from './icons-Bf8A6sFa.js';
import { u as useToast } from './index-Dww_DGvO.js';
import { u as useTestimonials } from './useTestimonials-xCtl59Vo.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useSubscriptionLimits, U as UpgradeModal } from './UpgradeModal-DlDWyXgv.js';
import { L as LimitBanner } from './LimitBanner-CNTHD4pJ.js';
import { u as useProfile } from './useProfile-ruvD7bQn.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './data-zpsFEjqp.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './state-stores-BQHzCYsU.js';
import './forms-DN8gFaqO.js';

function AddTestimonialModal({
  open,
  onOpenChange,
  onSave
}) {
  const [formData, setFormData] = reactExports.useState({
    clientName: "",
    rating: 5,
    review: "",
    propertyType: "",
    featured: false
  });
  const [photoPreview, setPhotoPreview] = reactExports.useState(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, clientPhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, clientPhoto: void 0 }));
    setPhotoPreview(null);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
    setFormData({
      clientName: "",
      rating: 5,
      review: "",
      propertyType: "",
      featured: false
    });
    setPhotoPreview(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add Client Testimonial" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Share feedback from satisfied clients to build credibility" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "clientName", children: "Client Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "clientName",
              name: "clientName",
              value: formData.clientName,
              onChange: handleChange,
              placeholder: "John Smith",
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: 'You can use initials for privacy (e.g., "John S.")' })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "propertyType", children: "Property Type *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "propertyType",
              name: "propertyType",
              value: formData.propertyType,
              onChange: handleChange,
              placeholder: "Single Family Home, Condo, etc.",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Rating *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mt-2", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setFormData((prev) => ({ ...prev, rating: star })),
            className: "focus:outline-none",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Star,
              {
                className: `h-8 w-8 transition-colors ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`
              }
            )
          },
          star
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "review", children: "Testimonial Text *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "review",
            name: "review",
            value: formData.review,
            onChange: handleChange,
            rows: 6,
            maxLength: 500,
            placeholder: "Share what the client said about working with you...",
            required: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          formData.review.length,
          "/500 characters"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Client Photo (Optional)" }),
        !photoPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "file",
              accept: "image/*",
              onChange: handlePhotoUpload,
              className: "hidden",
              id: "photo-upload"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "photo-upload", className: "cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Upload client photo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "PNG, JPG up to 2MB" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: photoPreview,
              alt: "Client preview",
              className: "w-24 h-24 rounded-full object-cover"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: removePhoto,
              className: "absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            id: "featured",
            checked: formData.featured,
            onChange: (e) => setFormData((prev) => ({ ...prev, featured: e.target.checked })),
            className: "rounded border-border"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "featured", className: "cursor-pointer", children: "Feature this testimonial on my profile" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Testimonial" })
      ] })
    ] })
  ] }) });
}

function EditTestimonialModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = reactExports.useState(initialData);
  reactExports.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);
  if (!isOpen) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Edit Testimonial" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onClose,
          className: "p-2 hover:bg-accent rounded-lg transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_name", children: "Client Name *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "client_name",
            value: formData.client_name,
            onChange: (e) => setFormData({ ...formData, client_name: e.target.value }),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "client_title", children: "Client Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "client_title",
            value: formData.client_title || "",
            onChange: (e) => setFormData({ ...formData, client_title: e.target.value }),
            placeholder: "e.g., First-Time Homebuyer"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rating", children: "Rating *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "rating",
            type: "number",
            min: "1",
            max: "5",
            value: formData.rating,
            onChange: (e) => setFormData({ ...formData, rating: parseInt(e.target.value) }),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "review", children: "Review *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "review",
            value: formData.review,
            onChange: (e) => setFormData({ ...formData, review: e.target.value }),
            rows: 6,
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "property_type", children: "Property Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "property_type",
            value: formData.property_type || "",
            onChange: (e) => setFormData({ ...formData, property_type: e.target.value }),
            placeholder: "e.g., Single Family Home"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "transaction_type", children: "Transaction Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            id: "transaction_type",
            value: formData.transaction_type || "",
            onChange: (e) => setFormData({ ...formData, transaction_type: e.target.value }),
            className: "w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "buyer", children: "Buyer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "seller", children: "Seller" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onClose, className: "flex-1", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1", children: "Save Changes" })
      ] })
    ] })
  ] }) });
}

function RequestTestimonialModal({
  open,
  onOpenChange,
  username,
  agentName
}) {
  const [copied, setCopied] = reactExports.useState(false);
  const [emailCopied, setEmailCopied] = reactExports.useState(false);
  const { toast } = useToast();
  const reviewURL = `${window.location.origin}/${username}/review`;
  const emailTemplate = `Hi there!

I hope you've been enjoying your new home! I wanted to reach out and ask if you'd be willing to share a brief review of your experience working with me.

Your feedback helps me improve my services and helps other clients find the right agent for their needs.

You can leave a review here:
${reviewURL}

It only takes a couple of minutes, and I really appreciate your time!

Best regards,
${agentName}`;
  const smsTemplate = `Hi! Would you mind leaving a quick review of your experience? It helps me serve clients better: ${reviewURL} Thanks! - ${agentName}`;
  const copyToClipboard = async (text, type = "url") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "url") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2e3);
      } else {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2e3);
      }
      toast({
        title: "Copied!",
        description: `${type === "url" ? "Review link" : "Email template"} copied to clipboard`
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Request for Testimonial - ${agentName}`);
    const body = encodeURIComponent(emailTemplate);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  const shareViaSMS = () => {
    const sms = encodeURIComponent(smsTemplate);
    window.open(`sms:?&body=${sms}`);
  };
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Leave a Review",
          text: `I'd appreciate if you could leave a review of your experience!`,
          url: reviewURL
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard(reviewURL);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-2xl", children: "Request Client Testimonial" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Share this link with clients to collect reviews and testimonials" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-base font-semibold", children: "Your Review Link" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Send this link to clients so they can leave a review" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: reviewURL,
              readOnly: true,
              className: "font-mono text-sm"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => copyToClipboard(reviewURL),
              variant: "outline",
              size: "icon",
              children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: shareNative,
              variant: "outline",
              size: "icon",
              title: "Share via...",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "outline",
              size: "icon",
              title: "Preview review page",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: reviewURL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" })
                }
              )
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-base font-semibold mb-3 block", children: "Quick Send Options" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareViaEmail,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4 mr-2" }),
                "Send via Email"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareViaSMS,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4 mr-2" }),
                "Send via SMS"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-base font-semibold", children: "Email Template" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => copyToClipboard(emailTemplate, "email"),
              variant: "ghost",
              size: "sm",
              children: emailCopied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-600" }),
                "Copied"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                "Copy"
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: emailTemplate,
            readOnly: true,
            rows: 12,
            className: "font-mono text-sm resize-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "💡 Tip: Customize this template to match your personal style" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-base font-semibold mb-2 block", children: "SMS Template" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: smsTemplate,
            readOnly: true,
            rows: 3,
            className: "font-mono text-sm resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm mb-2 text-blue-900", children: "📋 Best Practices for Requesting Reviews" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Wait 1-2 weeks after closing for best results" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Send a personalized message, not just the link" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Follow up once if no response after 1 week" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Thank clients regardless of whether they leave a review" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Make it easy - include the direct link" })
        ] })
      ] })
    ] })
  ] }) });
}

function Testimonials() {
  const [isAddModalOpen, setIsAddModalOpen] = reactExports.useState(false);
  const [editingTestimonial, setEditingTestimonial] = reactExports.useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
  const [showRequestModal, setShowRequestModal] = reactExports.useState(false);
  const { toast } = useToast();
  const { testimonials, addTestimonial, deleteTestimonial } = useTestimonials();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();
  const { profile } = useProfile();
  const handleAddClick = () => {
    if (!canAdd("testimonials")) {
      setShowUpgradeModal(true);
      return;
    }
    setIsAddModalOpen(true);
  };
  const handleAddTestimonial = async (data) => {
    try {
      await addTestimonial.mutateAsync(data);
      toast({
        title: "Testimonial added!",
        description: "Client review has been added successfully."
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add testimonial. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteTestimonial = async (id) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await deleteTestimonial.mutateAsync(id);
      toast({
        title: "Testimonial deleted",
        description: "Client review has been removed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial.",
        variant: "destructive"
      });
    }
  };
  const handleEditTestimonial = async (data) => {
    if (!editingTestimonial) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("testimonials").update({
        client_name: data.client_name,
        client_title: data.client_title,
        rating: data.rating,
        review: data.review,
        property_type: data.property_type,
        transaction_type: data.transaction_type,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingTestimonial.id).eq("user_id", user.id);
      if (error) throw error;
      toast({
        title: "Testimonial updated!",
        description: "Client review has been updated successfully."
      });
      setEditingTestimonial(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update testimonial. Please try again.",
        variant: "destructive"
      });
    }
  };
  const averageRating = testimonials.length > 0 ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1) : "0.0";
  const renderStars = (rating) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Star,
      {
        className: `h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`
      },
      i
    )) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Testimonials" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Showcase client reviews and success stories" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowRequestModal(true),
            className: "inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }),
              "Request Testimonial"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddClick,
            className: "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              "Add Testimonial"
            ]
          }
        )
      ] })
    ] }),
    subscription && getLimit("testimonials") !== Infinity && /* @__PURE__ */ jsxRuntimeExports.jsx(
      LimitBanner,
      {
        feature: "testimonials",
        current: getUsage("testimonials"),
        limit: getLimit("testimonials")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-foreground", children: testimonials.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Total Reviews" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-foreground", children: averageRating }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex", children: renderStars(Math.round(parseFloat(averageRating))) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Average Rating" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-primary", children: testimonials.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Total Reviews" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: testimonials.map((testimonial) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow relative",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Quote, { className: "h-8 w-8 text-primary opacity-20" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-foreground mb-6 leading-relaxed", children: [
            '"',
            testimonial.review,
            '"'
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: renderStars(testimonial.rating) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold", children: testimonial.client_name.split(" ").map((n) => n[0]).join("") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: testimonial.client_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: testimonial.property_type || "Client" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setEditingTestimonial(testimonial),
                  className: "p-2 hover:bg-accent rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4 text-muted-foreground" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleDeleteTestimonial(testimonial.id),
                  className: "p-2 hover:bg-red-50 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-red-500" })
                }
              )
            ] })
          ] })
        ]
      },
      testimonial.id
    )) }),
    testimonials.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-8 w-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: "No testimonials yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Start building social proof by adding client reviews" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
        "Add Your First Testimonial"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: [
      "💡 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Tip:" }),
      " Featured testimonials will be prominently displayed on your public profile. Ask satisfied clients for reviews after successful transactions!"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddTestimonialModal,
      {
        open: isAddModalOpen,
        onOpenChange: setIsAddModalOpen,
        onSave: handleAddTestimonial
      }
    ),
    editingTestimonial && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditTestimonialModal,
      {
        isOpen: !!editingTestimonial,
        onClose: () => setEditingTestimonial(null),
        onSubmit: handleEditTestimonial,
        initialData: {
          client_name: editingTestimonial.client_name,
          review: editingTestimonial.review,
          rating: editingTestimonial.rating,
          client_title: editingTestimonial.client_title,
          property_type: editingTestimonial.property_type,
          transaction_type: editingTestimonial.transaction_type
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UpgradeModal,
      {
        open: showUpgradeModal,
        onOpenChange: setShowUpgradeModal,
        feature: "testimonials",
        currentPlan: subscription?.plan_name || "Free",
        requiredPlan: "Starter"
      }
    ),
    profile && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RequestTestimonialModal,
      {
        open: showRequestModal,
        onOpenChange: setShowRequestModal,
        username: profile.username || "",
        agentName: profile.full_name || ""
      }
    )
  ] });
}

export { Testimonials as default };
