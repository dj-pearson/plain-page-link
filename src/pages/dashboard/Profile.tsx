import { useState, useEffect, useRef } from "react";
import { Camera, Save, Plus, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonProfile } from "@/components/ui/skeleton";

export default function Profile() {
  const { profile, isLoading, updateProfile } = useProfile();
  const { uploadAvatar, uploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
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
    specialties: [] as string[],
    certifications: [] as string[],

    // Contact Information
    phone: "",
    email_display: "",
    website_url: "",
    calendly_url: "",

    // Service Areas
    service_cities: [] as string[],
    service_zip_codes: [] as string[],

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
    seo_description: "",
  });

  // States for managing array inputs
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [zipInput, setZipInput] = useState("");

  useEffect(() => {
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
        seo_description: profile.seo_description || "",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  // Phone number formatting
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // Array field management
  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({ ...formData, specialties: [...formData.specialties, specialtyInput.trim()] });
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData({ ...formData, specialties: formData.specialties.filter((_, i) => i !== index) });
  };

  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, certificationInput.trim()] });
      setCertificationInput("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData({ ...formData, certifications: formData.certifications.filter((_, i) => i !== index) });
  };

  const addCity = () => {
    if (cityInput.trim() && !formData.service_cities.includes(cityInput.trim())) {
      setFormData({ ...formData, service_cities: [...formData.service_cities, cityInput.trim()] });
      setCityInput("");
    }
  };

  const removeCity = (index: number) => {
    setFormData({ ...formData, service_cities: formData.service_cities.filter((_, i) => i !== index) });
  };

  const addZip = () => {
    if (zipInput.trim() && !formData.service_zip_codes.includes(zipInput.trim())) {
      setFormData({ ...formData, service_zip_codes: [...formData.service_zip_codes, zipInput.trim()] });
      setZipInput("");
    }
  };

  const removeZip = (index: number) => {
    setFormData({ ...formData, service_zip_codes: formData.service_zip_codes.filter((_, i) => i !== index) });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAvatar(file);
    if (url) {
      setFormData({ ...formData, avatar_url: url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <SkeletonProfile />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">
            Update your agent information and contact details
          </p>
        </div>
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Profile Photo */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Profile Photo
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {formData.full_name?.split(' ').map(n => n[0]).join('') || formData.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Upload Photo</h3>
            <p className="text-sm text-muted-foreground mb-3">
              JPG, PNG or WEBP. Max size 5MB.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Choose File"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="service">Service Areas</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your profile URL: agentbio.net/{formData.username}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Professional Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Real Estate Agent, Broker, Team Lead"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Professional Bio
            </h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={6}
              maxLength={500}
              placeholder="Tell potential clients about your experience, specialties, and what makes you unique..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </TabsContent>

        {/* Professional Details Tab */}
        <TabsContent value="professional" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              License & Brokerage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="12345678"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  License State
                </label>
                <input
                  type="text"
                  name="license_state"
                  value={formData.license_state}
                  onChange={handleChange}
                  placeholder="CA"
                  maxLength={2}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brokerage Name
                </label>
                <input
                  type="text"
                  name="brokerage_name"
                  value={formData.brokerage_name}
                  onChange={handleChange}
                  placeholder="ABC Realty"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="years_experience"
                  value={formData.years_experience || ""}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brokerage Logo URL
                </label>
                <input
                  type="url"
                  name="brokerage_logo"
                  value={formData.brokerage_logo}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Specialties
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                  placeholder="e.g., First-Time Buyers, Luxury Homes"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(index)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Certifications
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                  placeholder="e.g., ABR, CRS, GRI"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Public Display Email
                </label>
                <input
                  type="email"
                  name="email_display"
                  value={formData.email_display}
                  onChange={handleChange}
                  placeholder="agent@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional - shown on your public profile
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Calendly Booking URL
                </label>
                <input
                  type="url"
                  name="calendly_url"
                  value={formData.calendly_url}
                  onChange={handleChange}
                  placeholder="https://calendly.com/yourname/30min"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add your Calendly link to enable "Book a Showing" on your listings
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="service" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Service Cities
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                  placeholder="e.g., Los Angeles, Beverly Hills"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCity}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.service_cities.map((city, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => removeCity(index)}
                      className="hover:text-purple-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Service ZIP Codes
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addZip())}
                  placeholder="e.g., 90210, 90211"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addZip}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.service_zip_codes.map((zip, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {zip}
                    <button
                      type="button"
                      onClick={() => removeZip(index)}
                      className="hover:text-orange-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Social Media Links
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourusername"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  TikTok URL
                </label>
                <input
                  type="url"
                  name="tiktok_url"
                  value={formData.tiktok_url}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourusername"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Zillow Profile URL
                </label>
                <input
                  type="url"
                  name="zillow_url"
                  value={formData.zillow_url}
                  onChange={handleChange}
                  placeholder="https://zillow.com/profile/yourprofile"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Realtor.com Profile URL
                </label>
                <input
                  type="url"
                  name="realtor_com_url"
                  value={formData.realtor_com_url}
                  onChange={handleChange}
                  placeholder="https://realtor.com/realestateagents/yourprofile"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Search Engine Optimization
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Optimize how your profile appears in search engines like Google
            </p>

            <div className="space-y-6">
              {/* SEO Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  name="seo_title"
                  value={formData.seo_title}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder={`${formData.full_name || 'Your Name'} - Real Estate Agent`}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    The title that appears in Google search results
                  </p>
                  <span className={`text-xs font-medium ${
                    formData.seo_title.length > 60 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {formData.seo_title.length}/60
                  </span>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description
                </label>
                <textarea
                  name="seo_description"
                  value={formData.seo_description}
                  onChange={handleChange}
                  maxLength={160}
                  rows={3}
                  placeholder={`Professional real estate services by ${formData.full_name || 'Your Name'}. Specializing in ${formData.service_cities.join(', ') || 'your area'}. Contact me today for all your real estate needs.`}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    The description that appears in Google search results
                  </p>
                  <span className={`text-xs font-medium ${
                    formData.seo_description.length > 160 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {formData.seo_description.length}/160
                  </span>
                </div>
              </div>

              {/* Google Search Preview */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Google Search Preview
                </h3>
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {window.location.origin}/{formData.username || 'username'}
                    </div>
                    <div className="text-lg text-blue-600 hover:underline cursor-pointer font-medium line-clamp-1">
                      {formData.seo_title || `${formData.full_name || 'Your Name'} - Real Estate Agent`}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {formData.seo_description || `Professional real estate services by ${formData.full_name || 'Your Name'}. Contact me today for all your real estate needs.`}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Tips */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">
                  <span role="img" aria-label="Tip">💡</span> SEO Best Practices
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Title:</strong> Keep under 60 characters, include your name and location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Description:</strong> Keep under 160 characters, mention your services and areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Keywords:</strong> Include terms clients search for (e.g., "real estate agent [city]")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Be Specific:</strong> Mention specialties, certifications, or unique services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Call to Action:</strong> Encourage clicks with phrases like "Contact me today"</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
