import { useState, useEffect, useRef } from "react";
import { Camera, Save } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useToast } from "@/hooks/use-toast";

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
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    return <div className="flex items-center justify-center h-64">Loading...</div>;
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Save className="h-4 w-4" />
          Save Changes
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

      {/* Basic Information */}
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
          </div>
        </div>
      </div>


      {/* Bio */}
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
    </form>
  );
}
