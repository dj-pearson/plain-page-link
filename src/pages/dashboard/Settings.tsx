import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { validateUsername } from '@/lib/usernameValidation';
import { SETTINGS_TOOLS } from '@/config/dashboard-nav';
import { Bell, CreditCard, User, Lock, Save, Eye, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettings } from '@/hooks/useSettings';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UsernameInput } from '@/components/UsernameInput';
import { ProfileURLCard } from '@/components/settings/ProfileURLCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileDisplaySettings } from '@/components/settings/ProfileDisplaySettings';
import { SessionManagement } from '@/components/settings/SessionManagement';
import { LeadNotificationPreferences } from '@/components/settings/LeadNotificationPreferences';
import { NativeMFASettings } from '@/components/auth/mfa/NativeMFASettings';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { GDPRSettings } from '@/components/settings/GDPRSettings';

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
    current: '',
    new: '',
    confirm: '',
  });

  // Profile state — through useProfile, not a second query under the same key.
  //
  // This declared its own useQuery on ['profile', user.id] returning the raw
  // row, while useProfile returns toProfile(data) with the phone decrypted.
  // Two queryFns under one key is the cache collision US-094 fixed on
  // ['leads']: whichever mounted first decided the shape the other saw, so
  // Profile.tsx could render ciphertext in the phone field after a visit to
  // Settings (US-117).
  const { profile } = useProfile();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  // plan_name is stored lowercase ('professional', 'team'); this is the only
  // place it is turned into something to show an agent, and it is derived from
  // the row rather than assumed.
  const [confirmRename, setConfirmRename] = useState(false);

  /**
   * Save, asking first when the username has changed.
   *
   * Everything else on this card is an edit; the username is an address.
   */
  const handleSaveProfile = () => {
    const next = formData.username.trim().toLowerCase();
    if (profile?.username && next && next !== profile.username) {
      setConfirmRename(true);
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const planLabel = subscription?.plan_name
    ? subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1)
    : 'Free';

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

      // Normalised here as well as in the input. The public lookup
      // (usePublicProfile) matches on the column exactly, so a stray capital
      // saved from anywhere makes the profile reachable at one casing only —
      // which is what the second, raw editor on the Profile page used to do
      // (US-117).
      const username = data.username.trim().toLowerCase();

      const validation = validateUsername(username);
      if (!validation.valid) {
        throw new Error(validation.error || 'That username is not valid');
      }

      // The unique index is case-sensitive, so a collision surfaced as a bare
      // "Failed to update profile". Asking first means the agent is told which
      // field is the problem.
      const { data: isFree, error: checkError } = await supabase.rpc('check_username_available', {
        _username: username,
        _current_user_id: user.id,
      });
      if (checkError) throw checkError;
      if (isFree !== true) {
        throw new Error(`The username "${username}" is already taken`);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: data.full_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
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
    setNotifications((prev) => ({ ...prev, [key]: value }));

    // Map frontend keys to database column names
    const dbKey =
      key === 'emailLeads'
        ? 'email_leads'
        : key === 'smsLeads'
          ? 'sms_leads'
          : key === 'weeklyReport'
            ? 'weekly_report'
            : 'marketing_emails';

    try {
      await updateSettings.mutateAsync({ [dbKey]: value });
      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    }
  };

  const handleProfileVisibilityChange = async (
    key: keyof typeof profileVisibility,
    value: boolean
  ) => {
    setProfileVisibility((prev) => ({ ...prev, [key]: value }));

    // Map frontend keys to database column names
    const dbKey =
      key === 'showListings'
        ? 'show_listings'
        : key === 'showSoldProperties'
          ? 'show_sold_properties'
          : key === 'showTestimonials'
            ? 'show_testimonials'
            : key === 'showSocialProof'
              ? 'show_social_proof'
              : 'show_contact_buttons';

    try {
      await updateSettings.mutateAsync({ [dbKey]: value });
      toast({
        title: 'Profile visibility updated',
        description: 'Your profile display preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility settings.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.new !== password.confirm) {
      toast({
        title: 'Error',
        description: "New passwords don't match.",
        variant: 'destructive',
      });
      return;
    }

    if (password.new.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.new,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });

      setPassword({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password.',
        variant: 'destructive',
      });
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile & Username Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile & Username</CardTitle>
          <CardDescription>Manage your public profile and unique URL</CardDescription>
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
            currentUserId={user?.id}
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
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
          </button>

          {/* Changing a username is not an edit like the others: it moves the
              agent's public address. Every business card, every Instagram bio
              and every link already shared points at the old one, and nothing
              warned about that (US-117). */}
          <AlertDialog open={confirmRename} onOpenChange={setConfirmRename}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change your public address?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>
                      Your profile moves from{' '}
                      <strong className="whitespace-nowrap">
                        agentbio.net/{profile?.username}
                      </strong>{' '}
                      to{' '}
                      <strong className="whitespace-nowrap">
                        agentbio.net/{formData.username}
                      </strong>
                      .
                    </p>
                    <p>
                      Every link you have already shared — printed cards, your Instagram bio, past
                      emails — will stop working. The old address is not kept.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep {profile?.username}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmRename(false);
                    updateProfileMutation.mutate(formData);
                  }}
                >
                  Change it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Profile URL Card */}
      {profile?.username && <ProfileURLCard username={profile.username} />}

      {/* Profile Display Settings */}
      <ProfileDisplaySettings />

      {/* Account Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Account Information</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Email Address</div>
              <div className="text-sm text-muted-foreground">{user?.email || 'Not available'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">User ID</div>
              <div className="text-sm text-muted-foreground font-mono text-xs">
                {user?.id || 'Not available'}
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
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
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
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
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
          <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
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
          <h2 className="text-lg font-semibold text-foreground">Profile Visibility</h2>
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
                onChange={(e) =>
                  handleProfileVisibilityChange('showContactButtons', e.target.checked)
                }
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
                onChange={(e) =>
                  handleProfileVisibilityChange('showSoldProperties', e.target.checked)
                }
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
                onChange={(e) =>
                  handleProfileVisibilityChange('showTestimonials', e.target.checked)
                }
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
          <h2 className="text-lg font-semibold text-foreground">Billing & Subscription</h2>
        </div>
        {/* The real subscription, or nothing.
            This block used to render "Professional - $49/month", a card ending
            4242 and "February 15, 2024" as literals, with Manage / Update /
            View Invoices buttons that had no handlers at all. An agent on the
            free plan read that they were paying $49 a month with a card on
            file, and pressing the buttons did nothing to correct them
            (US-117). */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Current Plan</div>
              <div className="text-sm text-muted-foreground">
                {subscriptionLoading
                  ? 'Loading…'
                  : subscription
                    ? `${planLabel}${subscription.status && subscription.status !== 'active' ? ` · ${subscription.status}` : ''}`
                    : 'Free'}
              </div>
            </div>
            <Link
              to="/dashboard/subscription"
              className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
            >
              {subscription ? 'Manage Plan' : 'View Plans'}
            </Link>
          </div>

          {subscription?.current_period_end && (
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <div className="font-medium text-foreground">Renews</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Payment method and invoices live in Stripe's own billing portal,
              which /dashboard/subscription opens. Restating them here would
              mean inventing them again. */}
          <p className="text-sm text-muted-foreground pt-1">
            Payment method and invoices are managed in the billing portal, from the subscription
            page.
          </p>
        </div>
      </div>

      {/* Security & Privacy Section Header */}
      <div className="pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Security & Privacy</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage your security settings, active sessions, and data privacy
        </p>
      </div>

      {/* Lead Notification Preferences */}
      <LeadNotificationPreferences />

      {/* Two-Factor Authentication */}
      <NativeMFASettings />

      {/* Session Management */}
      <SessionManagement />

      {/* Security Activity / Audit Logs */}
      <AuditLogViewer />

      {/* GDPR Settings (Data Export & Account Deletion) */}
      <GDPRSettings />

      {/* Everything the sidebar no longer carries.
          The dashboard nav had fifteen entries for a product aimed at people
          who are not technical; it is seven now, and these are the rest — in
          one place an agent can find rather than competing with the things
          they do every day. /dashboard/settings/delete-account in particular
          had no link anywhere in the app at all (US-120). */}
      <Card>
        <CardHeader>
          <CardTitle>More tools</CardTitle>
          <CardDescription>Everything else on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {SETTINGS_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  to={tool.href}
                  className="flex items-center gap-4 py-3 min-h-[44px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <tool.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground group-hover:underline">
                      {tool.label}
                    </span>
                    {tool.description && (
                      <span className="block text-sm text-muted-foreground">
                        {tool.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
