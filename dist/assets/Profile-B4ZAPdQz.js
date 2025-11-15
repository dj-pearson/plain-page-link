import { r as reactExports, j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { u as useProfile } from './useProfile-ruvD7bQn.js';
import { s as supabase } from './supabase-D4RJa1Op.js';
import { u as useAuthStore } from './state-stores-BQHzCYsU.js';
import { u as useToast } from './index-Dww_DGvO.js';
import { J as Tabs, K as TabsList, M as TabsTrigger, N as TabsContent } from './ui-components-DLW4dShh.js';
import { aE as Save, aF as Camera, aw as Plus, X } from './icons-Bf8A6sFa.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './data-zpsFEjqp.js';
import './three-addons-aBd78e9L.js';
import './three-D7pws1Rl.js';
import './forms-DN8gFaqO.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
function useAvatarUpload() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [uploading, setUploading] = reactExports.useState(false);
  const validateFile = (file) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Please upload a JPG, PNG, or WEBP image";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };
  const uploadAvatar = async (file) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload an avatar",
        variant: "destructive"
      });
      return null;
    }
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive"
      });
      return null;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from("avatars").remove(existingFiles.map((f) => `${user.id}/${f.name}`));
      }
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true
      });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      });
      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };
  return {
    uploadAvatar,
    uploading,
    acceptedTypes: ACCEPTED_FILE_TYPES.join(", "),
    maxSize: MAX_FILE_SIZE
  };
}

function Profile() {
  const { profile, isLoading, updateProfile } = useProfile();
  const { uploadAvatar, uploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = reactExports.useRef(null);
  const [formData, setFormData] = reactExports.useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    // Professional Information
    title: "",
    license_number: "",
    license_state: "",
    brokerage_name: "",
    brokerage_logo: "",
    years_experience: 0,
    specialties: [],
    certifications: [],
    // Contact Information
    phone: "",
    email_display: "",
    website_url: "",
    calendly_url: "",
    // Service Areas
    service_cities: [],
    service_zip_codes: [],
    // Social Media
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    tiktok_url: "",
    youtube_url: "",
    zillow_url: "",
    realtor_com_url: "",
    // SEO
    seo_title: "",
    seo_description: ""
  });
  const [specialtyInput, setSpecialtyInput] = reactExports.useState("");
  const [certificationInput, setCertificationInput] = reactExports.useState("");
  const [cityInput, setCityInput] = reactExports.useState("");
  const [zipInput, setZipInput] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        // Professional Information
        title: profile.title || "",
        license_number: profile.license_number || "",
        license_state: profile.license_state || "",
        brokerage_name: profile.brokerage_name || "",
        brokerage_logo: profile.brokerage_logo || "",
        years_experience: profile.years_experience || 0,
        specialties: profile.specialties || [],
        certifications: profile.certifications || [],
        // Contact Information
        phone: profile.phone || "",
        email_display: profile.email_display || "",
        website_url: profile.website_url || "",
        calendly_url: profile.calendly_url || "",
        // Service Areas
        service_cities: profile.service_cities || [],
        service_zip_codes: profile.service_zip_codes || [],
        // Social Media
        facebook_url: profile.facebook_url || "",
        instagram_url: profile.instagram_url || "",
        linkedin_url: profile.linkedin_url || "",
        tiktok_url: profile.tiktok_url || "",
        youtube_url: profile.youtube_url || "",
        zillow_url: profile.zillow_url || "",
        realtor_com_url: profile.realtor_com_url || "",
        // SEO
        seo_title: profile.seo_title || "",
        seo_description: profile.seo_description || ""
      });
    }
  }, [profile]);
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value
    });
  };
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };
  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };
  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({ ...formData, specialties: [...formData.specialties, specialtyInput.trim()] });
      setSpecialtyInput("");
    }
  };
  const removeSpecialty = (index) => {
    setFormData({ ...formData, specialties: formData.specialties.filter((_, i) => i !== index) });
  };
  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, certificationInput.trim()] });
      setCertificationInput("");
    }
  };
  const removeCertification = (index) => {
    setFormData({ ...formData, certifications: formData.certifications.filter((_, i) => i !== index) });
  };
  const addCity = () => {
    if (cityInput.trim() && !formData.service_cities.includes(cityInput.trim())) {
      setFormData({ ...formData, service_cities: [...formData.service_cities, cityInput.trim()] });
      setCityInput("");
    }
  };
  const removeCity = (index) => {
    setFormData({ ...formData, service_cities: formData.service_cities.filter((_, i) => i !== index) });
  };
  const addZip = () => {
    if (zipInput.trim() && !formData.service_zip_codes.includes(zipInput.trim())) {
      setFormData({ ...formData, service_zip_codes: [...formData.service_zip_codes, zipInput.trim()] });
      setZipInput("");
    }
  };
  const removeZip = (index) => {
    setFormData({ ...formData, service_zip_codes: formData.service_zip_codes.filter((_, i) => i !== index) });
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    if (url) {
      setFormData({ ...formData, avatar_url: url });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: "Loading..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Edit Profile" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Update your agent information and contact details" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "submit",
          disabled: updateProfile.isPending,
          className: "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            updateProfile.isPending ? "Saving..." : "Save Changes"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Profile Photo" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          formData.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: formData.avatar_url,
              alt: "Profile",
              className: "w-24 h-24 rounded-full object-cover"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary", children: formData.full_name?.split(" ").map((n) => n[0]).join("") || formData.username?.[0]?.toUpperCase() || "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => fileInputRef.current?.click(),
              disabled: uploading,
              className: "absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-4 w-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-foreground mb-1", children: "Upload Photo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "JPG, PNG or WEBP. Max size 5MB." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => fileInputRef.current?.click(),
              disabled: uploading,
              className: "px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50",
              children: uploading ? "Uploading..." : "Choose File"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/jpeg,image/jpg,image/png,image/webp",
              onChange: handleFileChange,
              className: "hidden"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "basic", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full justify-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "basic", children: "Basic Info" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "professional", children: "Professional" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "contact", children: "Contact" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "service", children: "Service Areas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "social", children: "Social Media" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "seo", children: "SEO" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "basic", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Basic Information" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Full Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "full_name",
                  value: formData.full_name,
                  onChange: handleChange,
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Username *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "username",
                  value: formData.username,
                  onChange: handleChange,
                  required: true,
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "Your profile URL: agentbio.net/",
                formData.username
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Professional Title" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "title",
                  value: formData.title,
                  onChange: handleChange,
                  placeholder: "e.g., Real Estate Agent, Broker, Team Lead",
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Professional Bio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              name: "bio",
              value: formData.bio,
              onChange: handleChange,
              rows: 6,
              maxLength: 500,
              placeholder: "Tell potential clients about your experience, specialties, and what makes you unique...",
              className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
            formData.bio.length,
            "/500 characters"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "professional", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "License & Brokerage" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "License Number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "license_number",
                  value: formData.license_number,
                  onChange: handleChange,
                  placeholder: "12345678",
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "License State" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "license_state",
                  value: formData.license_state,
                  onChange: handleChange,
                  placeholder: "CA",
                  maxLength: 2,
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Brokerage Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  name: "brokerage_name",
                  value: formData.brokerage_name,
                  onChange: handleChange,
                  placeholder: "ABC Realty",
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Years of Experience" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  name: "years_experience",
                  value: formData.years_experience || "",
                  onChange: handleChange,
                  min: "0",
                  placeholder: "0",
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Brokerage Logo URL" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "url",
                  name: "brokerage_logo",
                  value: formData.brokerage_logo,
                  onChange: handleChange,
                  placeholder: "https://example.com/logo.png",
                  className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Specialties" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: specialtyInput,
                  onChange: (e) => setSpecialtyInput(e.target.value),
                  onKeyPress: (e) => e.key === "Enter" && (e.preventDefault(), addSpecialty()),
                  placeholder: "e.g., First-Time Buyers, Luxury Homes",
                  className: "flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: addSpecialty,
                  className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: formData.specialties.map((specialty, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm",
                children: [
                  specialty,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeSpecialty(index),
                      className: "hover:text-blue-900",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ]
              },
              index
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Certifications" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: certificationInput,
                  onChange: (e) => setCertificationInput(e.target.value),
                  onKeyPress: (e) => e.key === "Enter" && (e.preventDefault(), addCertification()),
                  placeholder: "e.g., ABR, CRS, GRI",
                  className: "flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: addCertification,
                  className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: formData.certifications.map((cert, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm",
                children: [
                  cert,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeCertification(index),
                      className: "hover:text-green-900",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ]
              },
              index
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "contact", className: "space-y-6 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Contact Information" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Phone Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "tel",
                name: "phone",
                value: formData.phone,
                onChange: handlePhoneChange,
                placeholder: "(555) 123-4567",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Public Display Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "email",
                name: "email_display",
                value: formData.email_display,
                onChange: handleChange,
                placeholder: "agent@example.com",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Optional - shown on your public profile" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Website URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "website_url",
                value: formData.website_url,
                onChange: handleChange,
                placeholder: "https://yourwebsite.com",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Calendly Booking URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "calendly_url",
                value: formData.calendly_url,
                onChange: handleChange,
                placeholder: "https://calendly.com/yourname/30min",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: 'Add your Calendly link to enable "Book a Showing" on your listings' })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "service", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Service Cities" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: cityInput,
                  onChange: (e) => setCityInput(e.target.value),
                  onKeyPress: (e) => e.key === "Enter" && (e.preventDefault(), addCity()),
                  placeholder: "e.g., Los Angeles, Beverly Hills",
                  className: "flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: addCity,
                  className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: formData.service_cities.map((city, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm",
                children: [
                  city,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeCity(index),
                      className: "hover:text-purple-900",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ]
              },
              index
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Service ZIP Codes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: zipInput,
                  onChange: (e) => setZipInput(e.target.value),
                  onKeyPress: (e) => e.key === "Enter" && (e.preventDefault(), addZip()),
                  placeholder: "e.g., 90210, 90211",
                  className: "flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: addZip,
                  className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: formData.service_zip_codes.map((zip, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm",
                children: [
                  zip,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeZip(index),
                      className: "hover:text-orange-900",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ]
              },
              index
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "social", className: "space-y-6 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Social Media Links" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Facebook URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "facebook_url",
                value: formData.facebook_url,
                onChange: handleChange,
                placeholder: "https://facebook.com/yourpage",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Instagram URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "instagram_url",
                value: formData.instagram_url,
                onChange: handleChange,
                placeholder: "https://instagram.com/yourusername",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "LinkedIn URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "linkedin_url",
                value: formData.linkedin_url,
                onChange: handleChange,
                placeholder: "https://linkedin.com/in/yourprofile",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "TikTok URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "tiktok_url",
                value: formData.tiktok_url,
                onChange: handleChange,
                placeholder: "https://tiktok.com/@yourusername",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "YouTube URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "youtube_url",
                value: formData.youtube_url,
                onChange: handleChange,
                placeholder: "https://youtube.com/@yourchannel",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Zillow Profile URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "zillow_url",
                value: formData.zillow_url,
                onChange: handleChange,
                placeholder: "https://zillow.com/profile/yourprofile",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Realtor.com Profile URL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "url",
                name: "realtor_com_url",
                value: formData.realtor_com_url,
                onChange: handleChange,
                placeholder: "https://realtor.com/realestateagents/yourprofile",
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "seo", className: "space-y-6 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground mb-4", children: "Search Engine Optimization" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "Optimize how your profile appears in search engines like Google" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "SEO Title" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                name: "seo_title",
                value: formData.seo_title,
                onChange: handleChange,
                maxLength: 60,
                placeholder: `${formData.full_name || "Your Name"} - Real Estate Agent`,
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "The title that appears in Google search results" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-medium ${formData.seo_title.length > 60 ? "text-red-600" : "text-muted-foreground"}`, children: [
                formData.seo_title.length,
                "/60"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Meta Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                name: "seo_description",
                value: formData.seo_description,
                onChange: handleChange,
                maxLength: 160,
                rows: 3,
                placeholder: `Professional real estate services by ${formData.full_name || "Your Name"}. Specializing in ${formData.service_cities.join(", ") || "your area"}. Contact me today for all your real estate needs.`,
                className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "The description that appears in Google search results" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-medium ${formData.seo_description.length > 160 ? "text-red-600" : "text-muted-foreground"}`, children: [
                formData.seo_description.length,
                "/160"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground mb-3", children: "Google Search Preview" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-border rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                window.location.origin,
                "/",
                formData.username || "username"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg text-blue-600 hover:underline cursor-pointer font-medium line-clamp-1", children: formData.seo_title || `${formData.full_name || "Your Name"} - Real Estate Agent` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground line-clamp-2", children: formData.seo_description || `Professional real estate services by ${formData.full_name || "Your Name"}. Contact me today for all your real estate needs.` })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100", children: "💡 SEO Best Practices" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-800 dark:text-blue-200 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 dark:text-blue-400 mt-0.5", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Title:" }),
                  " Keep under 60 characters, include your name and location"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 dark:text-blue-400 mt-0.5", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Description:" }),
                  " Keep under 160 characters, mention your services and areas"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 dark:text-blue-400 mt-0.5", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Keywords:" }),
                  ' Include terms clients search for (e.g., "real estate agent [city]")'
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 dark:text-blue-400 mt-0.5", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Be Specific:" }),
                  " Mention specialties, certifications, or unique services"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 dark:text-blue-400 mt-0.5", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Call to Action:" }),
                  ' Encourage clicks with phrases like "Contact me today"'
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}

export { Profile as default };
