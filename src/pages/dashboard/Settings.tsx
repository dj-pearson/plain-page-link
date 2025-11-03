import { useState, useEffect } from "react";
import { Shield, Bell, CreditCard, User, Lock, Mail, Save, Eye } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsernameInput } from "@/components/UsernameInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  const { user } = useAuthStore();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState({
    emailLeads: true,
    smsLeads: false,
    weeklyReport: true,
    marketingEmails: false,
  });

  const [profileVisibility, setProfileVisibility] = useState({
    showListings: true,
    showSoldProperties: true,
    showTestimonials: true,
    showSocialProof: true,
    showContactButtons: true,
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Profile state
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Sync local state with settings from database
  useEffect(() => {
    if (settings) {
      setNotifications({
        emailLeads: settings.email_leads,
        smsLeads: settings.sms_leads,
        weeklyReport: settings.weekly_report,
        marketingEmails: settings.marketing_emails,
      });
      setProfileVisibility({
        showListings: settings.show_listings,
        showSoldProperties: settings.show_sold_properties,
        showTestimonials: settings.show_testimonials,
        showSocialProof: settings.show_social_proof,
        showContactButtons: settings.show_contact_buttons,
      });
    }
  }, [settings]);

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    
    // Map frontend keys to database column names
    const dbKey = key === 'emailLeads' ? 'email_leads' :
                  key === 'smsLeads' ? 'sms_leads' :
                  key === 'weeklyReport' ? 'weekly_report' :
                  'marketing_emails';
    
    try {
      await updateSettings.mutateAsync({ [dbKey]: value });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  const handleProfileVisibilityChange = async (key: keyof typeof profileVisibility, value: boolean) => {
    setProfileVisibility(prev => ({ ...prev, [key]: value }));
    
    // Map frontend keys to database column names
    const dbKey = key === 'showListings' ? 'show_listings' :
                  key === 'showSoldProperties' ? 'show_sold_properties' :
                  key === 'showTestimonials' ? 'show_testimonials' :
                  key === 'showSocialProof' ? 'show_social_proof' :
                  'show_contact_buttons';
    
    try {
      await updateSettings.mutateAsync({ [dbKey]: value });
      toast({
        title: "Profile visibility updated",
        description: "Your profile display preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visibility settings.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.new !== password.confirm) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (password.new.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.new,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setPassword({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    }
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile & Username Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile & Username</CardTitle>
          <CardDescription>
            Manage your public profile and unique URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile?.full_name?.[0] || profile?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <UsernameInput
            value={formData.username}
            onChange={(value) => setFormData({ ...formData, username: value })}
            currentUsername={profile?.username}
          />

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>

          <button
            onClick={() => updateProfileMutation.mutate(formData)}
            disabled={updateProfileMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </CardContent>
      </Card>

      {/* Account Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Account Information
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Email Address</div>
              <div className="text-sm text-muted-foreground">
                {user?.email || "Not available"}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">User ID</div>
              <div className="text-sm text-muted-foreground font-mono text-xs">
                {user?.id || "Not available"}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-foreground">Member Since</div>
              <div className="text-sm text-muted-foreground">{memberSince}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Change Password
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password.new}
              onChange={(e) => setPassword({ ...password, new: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={password.confirm}
              onChange={(e) =>
                setPassword({ ...password, confirm: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Save className="h-4 w-4" />
            Update Password
          </button>
        </div>
      </form>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Notification Preferences
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Email Notifications for New Leads</div>
              <div className="text-sm text-muted-foreground">
                Get notified immediately when someone submits a lead form
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailLeads}
                onChange={(e) => handleNotificationChange('emailLeads', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">SMS Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive text messages for urgent leads
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.smsLeads}
                onChange={(e) => handleNotificationChange('smsLeads', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Weekly Performance Report</div>
              <div className="text-sm text-muted-foreground">
                Get a summary of your profile analytics every Monday
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.weeklyReport}
                onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-foreground">Marketing Emails</div>
              <div className="text-sm text-muted-foreground">
                Tips, updates, and special offers from AgentBio.net
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketingEmails}
                onChange={(e) => handleNotificationChange('marketingEmails', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Profile Visibility
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Control which sections appear on your public profile page
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Show Contact Buttons</div>
              <div className="text-sm text-muted-foreground">
                Display email, phone, and text buttons
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileVisibility.showContactButtons}
                onChange={(e) => handleProfileVisibilityChange('showContactButtons', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Show Social Proof Banner</div>
              <div className="text-sm text-muted-foreground">
                Display stats like properties sold and total volume
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileVisibility.showSocialProof}
                onChange={(e) => handleProfileVisibilityChange('showSocialProof', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Show Active Listings</div>
              <div className="text-sm text-muted-foreground">
                Display your currently available properties
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileVisibility.showListings}
                onChange={(e) => handleProfileVisibilityChange('showListings', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Show Sold Properties</div>
              <div className="text-sm text-muted-foreground">
                Display your past sales and success history
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileVisibility.showSoldProperties}
                onChange={(e) => handleProfileVisibilityChange('showSoldProperties', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-foreground">Show Testimonials</div>
              <div className="text-sm text-muted-foreground">
                Display client reviews and ratings
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileVisibility.showTestimonials}
                onChange={(e) => handleProfileVisibilityChange('showTestimonials', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Billing & Subscription
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Current Plan</div>
              <div className="text-sm text-muted-foreground">
                Professional - $49/month
              </div>
            </div>
            <button className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium">
              Manage Plan
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Payment Method</div>
              <div className="text-sm text-muted-foreground">
                •••• •••• •••• 4242
              </div>
            </div>
            <button className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium">
              Update
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-foreground">Next Billing Date</div>
              <div className="text-sm text-muted-foreground">February 15, 2024</div>
            </div>
            <button className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium">
              View Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-red-800 dark:text-red-200">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
