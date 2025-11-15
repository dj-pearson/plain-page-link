import { r as reactExports, j as jsxRuntimeExports, g as useNavigate } from './react-vendor-a6jLNMWt.js';
import { D as Dialog, l as DialogContent, m as DialogHeader, n as DialogTitle, G as DialogDescription, L as Label, I as Input, S as Select, a as SelectTrigger, b as SelectValue, d as SelectContent, e as SelectItem, T as Textarea, O as DialogFooter, j as Button } from './ui-components-DLW4dShh.js';
import { a6 as Upload, X, u as Share2, F as Facebook, ak as Twitter, f as Linkedin, b as Check, ae as Copy, I as Instagram, L as LoaderCircle, J as CircleCheckBig, aw as Plus, S as Search, ax as Filter, ay as SquarePen, az as Trash2 } from './icons-Bf8A6sFa.js';
import { u as useToast } from './index-Dww_DGvO.js';
import { u as useListings } from './useListings-B7uikdzX.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';
import { u as useSubscriptionLimits, U as UpgradeModal } from './UpgradeModal-DlDWyXgv.js';
import { L as LimitBanner } from './LimitBanner-CNTHD4pJ.js';
import { u as useProfile } from './useProfile-ruvD7bQn.js';
import { K as KeyboardShortcutsHelper } from './KeyboardShortcutsHelper-Bzg2EyEM.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './data-zpsFEjqp.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './forms-DN8gFaqO.js';

function AddListingModal({
  open,
  onOpenChange,
  onSave
}) {
  const [formData, setFormData] = reactExports.useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    beds: 3,
    baths: 2,
    sqft: "",
    lotSize: "",
    propertyType: "single-family",
    status: "active",
    description: "",
    mlsNumber: "",
    yearBuilt: "",
    images: []
  });
  const [imagePreviews, setImagePreviews] = reactExports.useState([]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleNumberChange = (name, value) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
    setFormData({
      address: "",
      city: "",
      state: "",
      zipCode: "",
      price: "",
      beds: 3,
      baths: 2,
      sqft: "",
      lotSize: "",
      propertyType: "single-family",
      status: "active",
      description: "",
      mlsNumber: "",
      yearBuilt: "",
      images: []
    });
    setImagePreviews([]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add New Property Listing" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Fill in the details for your property listing" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-sm", children: "Property Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "address", children: "Street Address *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "address",
                name: "address",
                value: formData.address,
                onChange: handleChange,
                placeholder: "123 Main Street",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "city", children: "City *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "city",
                name: "city",
                value: formData.city,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "state", children: "State *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "state",
                  name: "state",
                  value: formData.state,
                  onChange: handleChange,
                  maxLength: 2,
                  placeholder: "CA",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "zipCode", children: "Zip *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "zipCode",
                  name: "zipCode",
                  value: formData.zipCode,
                  onChange: handleChange,
                  placeholder: "94102",
                  required: true
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-sm", children: "Property Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "price", children: "Price *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "price",
                name: "price",
                value: formData.price,
                onChange: handleChange,
                placeholder: "1,250,000",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "propertyType", children: "Property Type *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.propertyType,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, propertyType: value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "single-family", children: "Single Family" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "condo", children: "Condo" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "townhouse", children: "Townhouse" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "multi-family", children: "Multi-Family" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "land", children: "Land" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "commercial", children: "Commercial" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "beds", children: "Bedrooms *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "beds",
                type: "number",
                value: formData.beds,
                onChange: (e) => handleNumberChange("beds", e.target.value),
                min: 0,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "baths", children: "Bathrooms *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "baths",
                type: "number",
                value: formData.baths,
                onChange: (e) => handleNumberChange("baths", e.target.value),
                min: 0,
                step: 0.5,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sqft", children: "Square Feet *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "sqft",
                name: "sqft",
                value: formData.sqft,
                onChange: handleChange,
                placeholder: "2,400",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "lotSize", children: "Lot Size" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "lotSize",
                name: "lotSize",
                value: formData.lotSize,
                onChange: handleChange,
                placeholder: "0.25 acres"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "status", children: "Status *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (value) => setFormData((prev) => ({ ...prev, status: value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active", children: "Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pending", children: "Pending" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sold", children: "Sold" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "off-market", children: "Off Market" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "yearBuilt", children: "Year Built" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "yearBuilt",
                name: "yearBuilt",
                value: formData.yearBuilt,
                onChange: handleChange,
                placeholder: "2015"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "description",
            name: "description",
            value: formData.description,
            onChange: handleChange,
            rows: 4,
            placeholder: "Beautiful property with stunning views..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "mlsNumber", children: "MLS Number" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "mlsNumber",
            name: "mlsNumber",
            value: formData.mlsNumber,
            onChange: handleChange,
            placeholder: "ML81234567"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Property Photos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "file",
              multiple: true,
              accept: "image/*",
              onChange: handleImageUpload,
              className: "hidden",
              id: "image-upload"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "image-upload", className: "cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Click to upload or drag and drop" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "PNG, JPG up to 5MB (max 25 images)" })
          ] })
        ] }),
        imagePreviews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-3", children: imagePreviews.map((preview, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: preview,
              alt: `Preview ${index + 1}`,
              className: "w-full h-24 object-cover rounded-lg"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => removeImage(index),
              className: "absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
            }
          )
        ] }, index)) })
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Add Listing" })
      ] })
    ] })
  ] }) });
}

function EditListingModal({ isOpen, onClose, onSubmit, initialData }) {
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Edit Property Listing" }),
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "address", children: "Street Address *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "address",
              value: formData.address,
              onChange: (e) => setFormData({ ...formData, address: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "city", children: "City *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "city",
              value: formData.city,
              onChange: (e) => setFormData({ ...formData, city: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "price", children: "Price *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "price",
              value: formData.price,
              onChange: (e) => setFormData({ ...formData, price: e.target.value }),
              placeholder: "$450,000",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "beds", children: "Bedrooms *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "beds",
              type: "number",
              value: formData.beds,
              onChange: (e) => setFormData({ ...formData, beds: parseInt(e.target.value) }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "baths", children: "Bathrooms *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "baths",
              type: "number",
              value: formData.baths,
              onChange: (e) => setFormData({ ...formData, baths: parseInt(e.target.value) }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sqft", children: "Square Feet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "sqft",
              type: "number",
              value: formData.sqft || "",
              onChange: (e) => setFormData({ ...formData, sqft: parseInt(e.target.value) || void 0 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "status", children: "Status *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: formData.status,
              onValueChange: (value) => setFormData({ ...formData, status: value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active", children: "Active" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pending", children: "Pending" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "under_contract", children: "Under Contract" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sold", children: "Sold" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "property_type", children: "Property Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: formData.property_type || "",
              onValueChange: (value) => setFormData({ ...formData, property_type: value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select type" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "single_family", children: "Single Family" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "condo", children: "Condo" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "townhouse", children: "Townhouse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "multi_family", children: "Multi-Family" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "land", children: "Land" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "mls_number", children: "MLS Number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "mls_number",
              value: formData.mls_number || "",
              onChange: (e) => setFormData({ ...formData, mls_number: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "description",
              value: formData.description || "",
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              rows: 4,
              placeholder: "Describe the property features..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "image", children: "Image URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "image",
              type: "url",
              value: formData.image || "",
              onChange: (e) => setFormData({ ...formData, image: e.target.value }),
              placeholder: "https://example.com/image.jpg"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onClose, className: "flex-1", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1", children: "Save Changes" })
      ] })
    ] })
  ] }) });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 25;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
function useListingImageUpload() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [uploading, setUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState({ current: 0, total: 0, percentage: 0 });
  const validateFile = (file) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.name}. Please upload JPG, PNG, or WEBP images`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${file.name}. Maximum size is 5MB`;
    }
    return null;
  };
  const uploadListingImages = async (files, listingId) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive"
      });
      return [];
    }
    if (files.length === 0) {
      return [];
    }
    if (files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images per listing`,
        variant: "destructive"
      });
      return [];
    }
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Invalid file",
          description: validationError,
          variant: "destructive"
        });
        return [];
      }
    }
    setUploading(true);
    setProgress({ current: 0, total: files.length, percentage: 0 });
    const uploadedUrls = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${listingId || timestamp}/${randomId}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("listings").upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        });
        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
        const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
        const newProgress = {
          current: i + 1,
          total: files.length,
          percentage: Math.round((i + 1) / files.length * 100)
        };
        setProgress(newProgress);
      }
      if (uploadedUrls.length > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""}`
        });
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading listing images:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images. Please try again.",
        variant: "destructive"
      });
      if (uploadedUrls.length > 0) {
        await deleteListingImages(uploadedUrls);
      }
      return [];
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };
  const deleteListingImages = async (imageUrls) => {
    if (!user?.id || imageUrls.length === 0) {
      return false;
    }
    try {
      const filePaths = imageUrls.map((url) => {
        const match = url.match(/listings\/(.+)$/);
        return match ? match[1] : null;
      }).filter(Boolean);
      if (filePaths.length === 0) {
        return false;
      }
      const { error } = await supabase.storage.from("listings").remove(filePaths);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting listing images:", error);
      return false;
    }
  };
  return {
    uploadListingImages,
    deleteListingImages,
    uploading,
    progress,
    acceptedTypes: ACCEPTED_FILE_TYPES.join(", "),
    maxSize: MAX_FILE_SIZE,
    maxImages: MAX_IMAGES
  };
}

function SocialShareDialog({
  open,
  onOpenChange,
  listing,
  agentName = "Your Real Estate Agent"
}) {
  const { toast } = useToast();
  const [copied, setCopied] = reactExports.useState(false);
  const generatePostText = () => {
    const parts = [];
    parts.push(`🏡 NEW LISTING ALERT! 🏡`);
    parts.push("");
    parts.push(`📍 ${listing.address}, ${listing.city}`);
    parts.push(`💰 ${formatPrice(listing.price)}`);
    if (listing.beds || listing.baths) {
      const details = [];
      if (listing.beds) details.push(`${listing.beds} beds`);
      if (listing.baths) details.push(`${listing.baths} baths`);
      parts.push(`🛏️ ${details.join(" | ")}`);
    }
    if (listing.sqft) {
      parts.push(`📐 ${listing.sqft.toLocaleString()} sq ft`);
    }
    parts.push("");
    parts.push(`Don't miss out on this ${listing.property_type || "amazing property"}!`);
    parts.push("");
    parts.push("📞 Contact me for details or to schedule a showing!");
    parts.push("");
    parts.push("#RealEstate #NewListing #HomesForSale #DreamHome #Property");
    if (listing.city) {
      parts.push(`#${listing.city.replace(/\s+/g, "")}RealEstate`);
    }
    return parts.join("\n");
  };
  const [postText, setPostText] = reactExports.useState(generatePostText());
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(price);
  };
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Post text copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };
  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent(postText);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
  };
  const shareToTwitter = () => {
    const text = encodeURIComponent(postText.substring(0, 280));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };
  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `New Listing: ${listing.address}`,
          text: postText
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-2xl flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-6 w-6 text-blue-600" }),
        "Share Your New Listing"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Post automatically generated - customize and share on social media" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      listing.image && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg overflow-hidden border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: listing.image,
            alt: listing.address,
            className: "w-full h-48 object-cover"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold", children: "NEW" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold mb-2", children: "Post Caption" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: postText,
            onChange: (e) => setPostText(e.target.value),
            rows: 12,
            className: "font-sans text-sm resize-none",
            placeholder: "Customize your post..."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "💡 Tip: Add your phone number or website for easy contact" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            postText.length,
            " characters"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareToFacebook,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Facebook, { className: "h-4 w-4 mr-2 text-blue-600" }),
                "Facebook"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareToTwitter,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Twitter, { className: "h-4 w-4 mr-2 text-sky-500" }),
                "Twitter/X"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareToLinkedIn,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Linkedin, { className: "h-4 w-4 mr-2 text-blue-700" }),
                "LinkedIn"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: shareNative,
              variant: "outline",
              className: "justify-start",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4 mr-2" }),
                "More..."
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: copyToClipboard,
              variant: "secondary",
              className: "flex-1",
              children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-2 text-green-600" }),
                "Copied!"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                "Copy Text"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => onOpenChange(false),
              variant: "outline",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 mr-2" }),
                "Close"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-purple-50 border border-purple-200 rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-purple-900 mb-1", children: "For Instagram:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-800", children: "Copy the text above and paste it when creating your Instagram post. Don't forget to upload your listing photo!" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm mb-2 text-blue-900", children: "📱 Social Media Best Practices" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Post during peak hours (7-9 AM or 5-7 PM)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use high-quality photos (first photo is most important)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Include local hashtags for better reach" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Respond quickly to comments and DMs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Share to Instagram Stories for 24-hour visibility" })
        ] })
      ] })
    ] })
  ] }) });
}

function QuickStatusUpdate({
  listingId,
  currentStatus,
  onStatusChange
}) {
  const [status, setStatus] = reactExports.useState(currentStatus);
  const [isUpdating, setIsUpdating] = reactExports.useState(false);
  const [showSuccess, setShowSuccess] = reactExports.useState(false);
  const { toast } = useToast();
  const statusOptions = [
    { value: "active", label: "Active", color: "text-green-600" },
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "sold", label: "Sold", color: "text-blue-600" },
    { value: "under_contract", label: "Under Contract", color: "text-purple-600" },
    { value: "off_market", label: "Off Market", color: "text-gray-600" }
  ];
  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    setStatus(newStatus);
    try {
      const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", listingId);
      if (error) throw error;
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2e3);
      const statusLabel = statusOptions.find((s) => s.value === newStatus)?.label || newStatus;
      toast({
        title: "Status Updated",
        description: `Listing marked as ${statusLabel}`
      });
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      setStatus(currentStatus);
      toast({
        title: "Update Failed",
        description: "Failed to update listing status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const currentOption = statusOptions.find((s) => s.value === status);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative inline-block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: status, onValueChange: handleStatusChange, disabled: isUpdating, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SelectTrigger,
      {
        className: `w-[140px] h-8 text-xs ${currentOption?.color || ""} ${isUpdating ? "opacity-50" : ""}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          isUpdating && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
          showSuccess && !isUpdating && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3 text-green-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: statusOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SelectItem,
      {
        value: option.value,
        className: option.color,
        children: option.label
      },
      option.value
    )) })
  ] }) });
}

function Listings() {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [isAddModalOpen, setIsAddModalOpen] = reactExports.useState(false);
  const [editingListing, setEditingListing] = reactExports.useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
  const [showSocialShareDialog, setShowSocialShareDialog] = reactExports.useState(false);
  const [newlyCreatedListing, setNewlyCreatedListing] = reactExports.useState(null);
  const { toast } = useToast();
  const { listings, addListing, deleteListing } = useListings();
  const { uploadListingImages} = useListingImageUpload();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const shortcuts = [
    {
      key: "n",
      description: "Add new listing",
      action: () => handleAddClick(),
      category: "Actions"
    },
    {
      key: "d",
      description: "Go to Dashboard",
      action: () => navigate("/dashboard"),
      category: "Navigation"
    },
    {
      key: "l",
      description: "Go to Leads",
      action: () => navigate("/dashboard/leads"),
      category: "Navigation"
    },
    {
      key: "a",
      description: "Go to Analytics",
      action: () => navigate("/dashboard/analytics"),
      category: "Navigation"
    }
  ];
  const handleAddClick = () => {
    console.log("🔥 handleAddClick fired!");
    const allowed = canAdd("listings");
    console.log("Add Property clicked - canAdd?", allowed);
    console.log("Current listings count:", listings.length);
    console.log("Subscription:", subscription);
    if (!allowed) {
      console.log("❌ Not allowed - showing upgrade modal");
      setShowUpgradeModal(true);
      toast({ title: "Upgrade required", description: "Your plan limit has been reached for listings." });
      return;
    }
    console.log("✅ Opening AddListingModal");
    setIsAddModalOpen(true);
    console.log("AddListingModal open state set to true, isAddModalOpen:", isAddModalOpen);
  };
  const handleAddListing = async (data) => {
    try {
      let imageUrls = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadListingImages(data.images);
        if (imageUrls.length === 0) {
          return;
        }
      }
      const listingData = {
        address: data.address,
        city: data.city,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: parseInt(data.sqft) || null,
        status: data.status,
        image: imageUrls[0] || null,
        // First image as primary
        photos: imageUrls.length > 0 ? imageUrls : null,
        // All images
        description: data.description || null,
        mls_number: data.mlsNumber || null,
        property_type: data.propertyType || null
      };
      await addListing.mutateAsync(listingData);
      setNewlyCreatedListing({
        address: data.address,
        city: data.city,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: parseInt(data.sqft) || void 0,
        property_type: data.propertyType,
        image: imageUrls[0] || void 0
      });
      toast({
        title: "Listing added!",
        description: "Your property listing has been created successfully."
      });
      setIsAddModalOpen(false);
      setShowSocialShareDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add listing. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteListing = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteListing.mutateAsync(id);
      toast({
        title: "Listing deleted",
        description: "Property listing has been removed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive"
      });
    }
  };
  const handleEditListing = async (data) => {
    if (!editingListing) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("listings").update({
        address: data.address,
        city: data.city,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        status: data.status,
        image: data.image,
        description: data.description,
        mls_number: data.mls_number,
        property_type: data.property_type,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingListing.id).eq("user_id", user.id);
      if (error) throw error;
      toast({
        title: "Listing updated!",
        description: "Your property listing has been updated successfully."
      });
      setEditingListing(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive"
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 sm:space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-foreground", children: "Property Listings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1", children: "Manage your active and sold properties" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          id: "add-property-button",
          onClick: (e) => {
            console.log("🎯 Button clicked! Event:", e);
            e.preventDefault();
            e.stopPropagation();
            handleAddClick();
          },
          className: "inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] w-full sm:w-auto justify-center shadow-sm",
          style: { position: "relative", zIndex: 10 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 sm:h-5 sm:w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-base", children: "Add Property" })
          ]
        }
      )
    ] }),
    subscription && getLimit("listings") !== Infinity && /* @__PURE__ */ jsxRuntimeExports.jsx(
      LimitBanner,
      {
        feature: "listings",
        current: getUsage("listings"),
        limit: getLimit("listings")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search properties...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "w-full pl-10 pr-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[44px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg hover:bg-accent active:scale-95 transition-all min-h-[44px] w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-base", children: "Filters" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl sm:text-2xl font-bold text-foreground", children: listings.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm text-muted-foreground mt-0.5", children: "Total" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl sm:text-2xl font-bold text-green-600", children: listings.filter((l) => l.status === "active").length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm text-muted-foreground mt-0.5", children: "Active" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl sm:text-2xl font-bold text-yellow-600", children: listings.filter((l) => l.status === "pending").length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm text-muted-foreground mt-0.5", children: "Pending" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6", children: listings.map((listing) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg active:shadow-xl transition-all group",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-44 sm:h-48 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: listing.image,
                alt: listing.address,
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                loading: "lazy"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 sm:top-3 left-2 sm:left-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              QuickStatusUpdate,
              {
                listingId: listing.id,
                currentStatus: listing.status,
                onStatusChange: (newStatus) => {
                  listing.status = newStatus;
                }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setEditingListing(listing),
                  className: "p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white active:scale-90 transition-all shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center",
                  title: "Edit listing",
                  "aria-label": "Edit listing",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleDeleteListing(listing.id),
                  className: "p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white active:scale-90 transition-all text-red-600 shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center",
                  title: "Delete listing",
                  "aria-label": "Delete listing",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 sm:p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 sm:mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl sm:text-2xl font-bold text-primary mb-1", children: listing.price }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm sm:text-base text-foreground", children: listing.address }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs sm:text-sm text-muted-foreground", children: listing.city })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                listing.beds,
                " beds"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                listing.baths,
                " baths"
              ] }),
              listing.sqft && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "whitespace-nowrap", children: [
                  listing.sqft.toLocaleString(),
                  " sqft"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between pt-2 sm:pt-3 border-t border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground", children: [
              "Listed ",
              new Date(listing.created_at).toLocaleDateString()
            ] }) })
          ] })
        ]
      },
      listing.id
    )) }),
    listings.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 sm:py-12 px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-full mb-3 sm:mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2", children: "No properties yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto", children: "Start by adding your first property listing" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setIsAddModalOpen(true),
          className: "inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] shadow-md",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-base", children: "Add Your First Property" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddListingModal,
      {
        open: isAddModalOpen,
        onOpenChange: setIsAddModalOpen,
        onSave: handleAddListing
      }
    ),
    editingListing && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditListingModal,
      {
        isOpen: !!editingListing,
        onClose: () => setEditingListing(null),
        onSubmit: handleEditListing,
        initialData: {
          address: editingListing.address,
          city: editingListing.city,
          price: editingListing.price,
          beds: editingListing.beds,
          baths: editingListing.baths,
          sqft: editingListing.sqft,
          status: editingListing.status,
          image: editingListing.image,
          description: editingListing.description,
          mls_number: editingListing.mls_number,
          property_type: editingListing.property_type
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UpgradeModal,
      {
        open: showUpgradeModal,
        onOpenChange: setShowUpgradeModal,
        feature: "listings",
        currentPlan: subscription?.plan_name || "Free",
        requiredPlan: "Starter"
      }
    ),
    newlyCreatedListing && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SocialShareDialog,
      {
        open: showSocialShareDialog,
        onOpenChange: setShowSocialShareDialog,
        listing: newlyCreatedListing,
        agentName: profile?.full_name
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(KeyboardShortcutsHelper, { shortcuts })
  ] });
}

export { Listings as default };
