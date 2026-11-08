import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Save, Plus, X, ImagePlus } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useBrokerageLogoUpload } from '@/hooks/useBrokerageLogoUpload';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonProfile } from '@/components/ui/skeleton';
import { planLimitKeyFromError, UPGRADE_PATH } from '@/lib/planLimits';
import { urlSchemeErrorFrom } from '@/lib/urlSchemeErrors';
import {
  normalizeProfileUrls,
  PROFILE_URL_FIELDS,
  PROFILE_URL_FIELD_NAMES,
  type ProfileUrlErrors,
  type ProfileUrlField,
} from '@/lib/profileUrls';

function emptyForm() {
  return {
    full_name: '',
    username: '',
    bio: '',
    avatar_url: '',

    // Professional Information
    title: '',
    license_number: '',
    license_state: '',
    brokerage_name: '',
    brokerage_logo: '',
    years_experience: 0,
    specialties: [] as string[],
    certifications: [] as string[],

    // Contact Information
    phone: '',
    email_display: '',
    website_url: '',
    calendly_url: '',

    // Service Areas
    service_cities: [] as string[],
    service_zip_codes: [] as string[],

    // Social Media
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    tiktok_url: '',
    youtube_url: '',
    zillow_url: '',
    realtor_com_url: '',

    // SEO
    seo_title: '',
    seo_description: '',
  };
}

type ProfileForm = ReturnType<typeof emptyForm>;

function profileToForm(
  profile: NonNullable<ReturnType<typeof useProfile>['profile']>
): ProfileForm {
  return {
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',

    // Professional Information
    title: profile.title || '',
    license_number: profile.license_number || '',
    license_state: profile.license_state || '',
    brokerage_name: profile.brokerage_name || '',
    brokerage_logo: profile.brokerage_logo || '',
    years_experience: profile.years_experience || 0,
    specialties: profile.specialties || [],
    certifications: profile.certifications || [],

    // Contact Information
    phone: profile.phone || '',
    email_display: profile.email_display || '',
    website_url: profile.website_url || '',
    calendly_url: profile.calendly_url || '',

    // Service Areas
    service_cities: profile.service_cities || [],
    service_zip_codes: profile.service_zip_codes || [],

    // Social Media
    facebook_url: profile.facebook_url || '',
    instagram_url: profile.instagram_url || '',
    linkedin_url: profile.linkedin_url || '',
    tiktok_url: profile.tiktok_url || '',
    youtube_url: profile.youtube_url || '',
    zillow_url: profile.zillow_url || '',
    realtor_com_url: profile.realtor_com_url || '',

    // SEO
    seo_title: profile.seo_title || '',
    seo_description: profile.seo_description || '',
  };
}

interface SaveError {
  message: string;
  /** A plan limit refused it; offer the upgrade path. */
  planLimit: boolean;
}

/**
 * The reason a save failed, in words the agent can act on (US-237). The form
 * used to say "Failed to update profile. Please try again." whatever the
 * cause, so a plan-limit refusal read as a transient fault to retry.
 */
function describeSaveError(error: unknown): SaveError {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  if (planLimitKeyFromError(error)) {
    // The trigger's message is written for the agent (20260923000002).
    return { message: message || 'Your plan does not include this change.', planLimit: true };
  }
  // US-456: the database refuses a social/website/Calendly value that is not
  // an https:// address; say which field, not the constraint name.
  const urlError = urlSchemeErrorFrom(error);
  if (urlError) {
    return { message: `Your profile was not saved: ${urlError.message}`, planLimit: false };
  }
  return {
    message: message
      ? `Your profile was not saved: ${message}`
      : 'Your profile was not saved. Check your connection and try again.',
    planLimit: false,
  };
}

const INPUT_CLASS =
  'w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

interface UrlInputProps {
  field: ProfileUrlField;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
}

/**
 * A profile link field (US-290). type="text" with inputMode="url" rather than
 * type="url": the browser's URL check refuses "zillow.com/me", which the save
 * now fixes by adding https://, and it accepts "javascript:x", which the save
 * refuses — so the check runs in handleSubmit and the error is shown here.
 */
function UrlInput({ field, value, onChange, placeholder, error }: UrlInputProps) {
  const errorId = `profile-${field}-error`;
  return (
    <>
      <input
        id={`profile-${field}`}
        // The visible <label htmlFor> lives in the caller; naming it here too
        // keeps the static field-name check (US-261) able to see it.
        aria-labelledby={`profile-${field}-label`}
        type="text"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        spellCheck={false}
        name={field}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${INPUT_CLASS} ${error ? 'border-destructive' : 'border-input'}`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

export default function Profile() {
  const { profile, isLoading, updateProfile } = useProfile();
  const { uploadAvatar, uploading } = useAvatarUpload();
  const { toast } = useToast();
  const { uploadLogo, uploading: uploadingLogo } = useBrokerageLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProfileForm>(emptyForm);
  // What the server holds, as the form spells it — the baseline for "unsaved".
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyForm);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [urlErrors, setUrlErrors] = useState<ProfileUrlErrors>({});
  const [tab, setTab] = useState('basic');
  const hydrated = useRef(false);

  // States for managing array inputs
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [zipInput, setZipInput] = useState('');

  // Hydrate from the server once (US-237). This ran on every new `profile`
  // object, and an avatar upload invalidated the query, so the refetch reset
  // every field the agent had typed but not saved. A later refetch (after a
  // save, or a window refocus) must not overwrite the form either.
  useEffect(() => {
    if (profile && !hydrated.current) {
      hydrated.current = true;
      const initial = profileToForm(profile);
      setFormData(initial);
      setSavedForm(initial);
    }
  }, [profile]);

  // Both start as emptyForm and are set together on hydrate, so this is false
  // until the agent changes something.
  const isDirty = JSON.stringify(formData) !== JSON.stringify(savedForm);
  useUnsavedChangesWarning(isDirty);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name in urlErrors) {
      setUrlErrors((prev) => {
        const next = { ...prev };
        delete next[name as ProfileUrlField];
        return next;
      });
    }
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  // Phone number formatting
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
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
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData({ ...formData, specialties: formData.specialties.filter((_, i) => i !== index) });
  };

  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certificationInput.trim()],
      });
      setCertificationInput('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const addCity = () => {
    if (cityInput.trim() && !formData.service_cities.includes(cityInput.trim())) {
      setFormData({ ...formData, service_cities: [...formData.service_cities, cityInput.trim()] });
      setCityInput('');
    }
  };

  const removeCity = (index: number) => {
    setFormData({
      ...formData,
      service_cities: formData.service_cities.filter((_, i) => i !== index),
    });
  };

  const addZip = () => {
    if (zipInput.trim() && !formData.service_zip_codes.includes(zipInput.trim())) {
      setFormData({
        ...formData,
        service_zip_codes: [...formData.service_zip_codes, zipInput.trim()],
      });
      setZipInput('');
    }
  };

  const removeZip = (index: number) => {
    setFormData({
      ...formData,
      service_zip_codes: formData.service_zip_codes.filter((_, i) => i !== index),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAvatar(file);
    if (url) {
      // Functional updates: the upload takes seconds, and the agent may type
      // meanwhile. `{ ...formData }` here was the form as it stood when the
      // file was picked. The upload already saved avatar_url, so the
      // baseline moves too — it is not an unsaved change (US-237).
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      setSavedForm((prev) => ({ ...prev, avatar_url: url }));
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    const url = await uploadLogo(file);
    if (url) {
      // Saved by the upload, like the avatar: not an unsaved change.
      setFormData((prev) => ({ ...prev, brokerage_logo: url }));
      setSavedForm((prev) => ({ ...prev, brokerage_logo: url }));
    }
  };

  // Removing is an ordinary edit, persisted by Save like any other field.
  const removeLogo = () => setFormData((prev) => ({ ...prev, brokerage_logo: '' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    // US-290: check the link fields before anything is sent. A bare host
    // gains https://; a value that is not a web address is refused next to
    // its field, and the tab holding the first one is brought forward,
    // because the other tabs are not mounted.
    const { values: urls, errors } = normalizeProfileUrls(formData);
    const refused = PROFILE_URL_FIELD_NAMES.filter((field) => errors[field]);
    setUrlErrors(errors);
    if (refused.length > 0) {
      setTab(PROFILE_URL_FIELDS[refused[0]]);
      setSaveError({
        message:
          refused.length === 1
            ? `Your profile was not saved: ${errors[refused[0]]}`
            : 'Your profile was not saved: some links are not web addresses. Fix the fields marked below.',
        planLimit: false,
      });
      return;
    }
    const submitted = { ...formData, ...urls };
    // Show what will be stored ("https://zillow.com/me", not "zillow.com/me").
    setFormData(submitted);
    try {
      // The username is not editable here any more, so it must not be sent:
      // this form used to submit whatever was in the field, raw and
      // un-normalised, competing with Settings' validated editor (US-117).
      const { username: _username, phone, ...rest } = submitted;
      // A phone that could not be decrypted was never shown, so an empty
      // field means "unknown", not "remove it". Leave the stored number alone
      // unless the agent typed a new one (US-237).
      const editableFields = profile?.phoneUnavailable && phone === '' ? rest : { ...rest, phone };
      await updateProfile.mutateAsync(editableFields);
      setSavedForm(submitted);
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      setSaveError(describeSaveError(error));
    }
  };

  const saveLabel = updateProfile.isPending ? 'Saving...' : 'Save Changes';

  if (isLoading) {
    return <SkeletonProfile />;
  }

  return (
    // pb-20 on phones: room for the fixed save bar below the last field.
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">
            Update your agent information and contact details
          </p>
        </div>
        {/* On phones the save bar at the bottom takes over (US-237): this
            button scrolled away with the header, above six tabs of fields. */}
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
      </div>

      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <p>{saveError.message}</p>
          {saveError.planLimit && (
            <Link
              to={UPGRADE_PATH}
              className="mt-2 inline-block font-medium text-primary underline underline-offset-2"
            >
              See plans
            </Link>
          )}
        </div>
      )}

      {/* Mobile save bar. Fixed rather than sticky: the dashboard scrolls the
          window. It sits on top of MobileNav (h-16, plus the home-indicator
          inset that nav pads itself with) and below it in z-order. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 md:hidden">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
      </div>

      {/* Profile Photo */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile Photo</h2>
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
                {formData.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') ||
                  formData.username?.[0]?.toUpperCase() ||
                  '?'}
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
            <p className="text-sm text-muted-foreground mb-3">JPG, PNG or WEBP. Max size 5MB.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
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
      <Tabs value={tab} onValueChange={setTab} className="w-full">
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-full_name"
                >
                  Full Name
                </label>
                <input
                  id="profile-full_name"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Read-only. There were two username editors: this one, a plain
                  required <input> whose value handleSubmit sent raw, and
                  Settings' UsernameInput, which lowercases, validates and
                  checks availability. The public lookup matches the column
                  exactly, so a "JohnSmith" saved here was reachable only at
                  /JohnSmith; a collision surfaced as "Failed to update
                  profile"; and nothing warned that every card already printed
                  would stop working. One editor, and it is the safe one
                  (US-117). */}
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-username"
                >
                  Username
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={formData.username}
                  readOnly
                  aria-describedby="profile-username-hint"
                  className="w-full px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg cursor-not-allowed"
                />
                <p id="profile-username-hint" className="text-xs text-muted-foreground mt-1">
                  Your profile URL: agentbio.net/{formData.username} —{' '}
                  <Link to="/dashboard/settings" className="underline underline-offset-2">
                    change it in Settings
                  </Link>
                </p>
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-title"
                >
                  Professional Title
                </label>
                <input
                  id="profile-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Real Estate Agent, Broker, Team Lead"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 id="profile-bio-heading" className="text-lg font-semibold text-foreground mb-4">
              Professional Bio
            </h2>
            <textarea
              id="profile-bio"
              aria-labelledby="profile-bio-heading"
              aria-describedby="profile-bio-count"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={6}
              maxLength={500}
              placeholder="Tell potential clients about your experience, specialties, and what makes you unique..."
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p id="profile-bio-count" className="text-sm text-muted-foreground mt-2">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </TabsContent>

        {/* Professional Details Tab */}
        <TabsContent value="professional" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">License & Brokerage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-license_number"
                >
                  License Number
                </label>
                <input
                  id="profile-license_number"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="12345678"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-license_state"
                >
                  License State
                </label>
                <input
                  id="profile-license_state"
                  type="text"
                  name="license_state"
                  value={formData.license_state}
                  onChange={handleChange}
                  placeholder="CA"
                  maxLength={2}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-brokerage_name"
                >
                  Brokerage Name
                </label>
                <input
                  id="profile-brokerage_name"
                  type="text"
                  name="brokerage_name"
                  value={formData.brokerage_name}
                  onChange={handleChange}
                  placeholder="ABC Realty"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-years_experience"
                >
                  Years of Experience
                </label>
                <input
                  id="profile-years_experience"
                  type="number"
                  name="years_experience"
                  value={formData.years_experience || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <span
                  className="block text-sm font-medium text-foreground mb-2"
                  id="brokerage-logo-label"
                >
                  Brokerage Logo
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-border bg-background p-2">
                    {formData.brokerage_logo ? (
                      <img
                        src={formData.brokerage_logo}
                        alt={
                          formData.brokerage_name
                            ? `${formData.brokerage_name} logo`
                            : 'Brokerage logo'
                        }
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        aria-describedby="brokerage-logo-help"
                        className="min-h-[44px] px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {uploadingLogo
                          ? 'Uploading...'
                          : formData.brokerage_logo
                            ? 'Replace Logo'
                            : 'Upload Logo'}
                      </button>
                      {formData.brokerage_logo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          disabled={uploadingLogo}
                          className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p id="brokerage-logo-help" className="text-sm text-muted-foreground">
                      JPG, PNG or WEBP. Max size 2MB. Shown under your name on your page, in place
                      of the brokerage name.
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoChange}
                    aria-labelledby="brokerage-logo-label"
                    data-testid="brokerage-logo-input"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Specialties</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Add a specialty"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="e.g., First-Time Buyers, Luxury Homes"
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  aria-label="Add a specialty"
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
                      aria-label={`Remove ${specialty}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Certifications</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Add a certification"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  placeholder="e.g., ABR, CRS, GRI"
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCertification}
                  aria-label="Add a certification"
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
                      aria-label={`Remove ${cert}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-phone"
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  aria-describedby={profile?.phoneUnavailable ? 'profile-phone-note' : undefined}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {profile?.phoneUnavailable && (
                  <p id="profile-phone-note" className="mt-2 text-sm text-muted-foreground">
                    Your saved number could not be loaded just now. Leave this blank to keep it, or
                    type a new one to replace it.
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-email_display"
                >
                  Public Display Email
                </label>
                <input
                  id="profile-email_display"
                  type="email"
                  name="email_display"
                  value={formData.email_display}
                  onChange={handleChange}
                  placeholder="agent@example.com"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional - shown on your public profile
                </p>
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-website_url"
                  id="profile-website_url-label"
                >
                  Website URL
                </label>
                <UrlInput
                  field="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  error={urlErrors.website_url}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-calendly_url"
                  id="profile-calendly_url-label"
                >
                  Calendly Booking URL
                </label>
                <UrlInput
                  field="calendly_url"
                  value={formData.calendly_url}
                  onChange={handleChange}
                  placeholder="https://calendly.com/yourname/30min"
                  error={urlErrors.calendly_url}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add your Calendly link to enable &ldquo;Book a Showing&rdquo; on your listings
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="service" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Service Cities</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Add a service city"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                  placeholder="e.g., Los Angeles, Beverly Hills"
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCity}
                  aria-label="Add a service city"
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
                      aria-label={`Remove ${city}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Service ZIP Codes</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Add a service ZIP code"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addZip())}
                  placeholder="e.g., 90210, 90211"
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addZip}
                  aria-label="Add a service ZIP code"
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
                      aria-label={`Remove ${zip}`}
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Social Media Links</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-facebook_url"
                  id="profile-facebook_url-label"
                >
                  Facebook URL
                </label>
                <UrlInput
                  field="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpage"
                  error={urlErrors.facebook_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-instagram_url"
                  id="profile-instagram_url-label"
                >
                  Instagram URL
                </label>
                <UrlInput
                  field="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourusername"
                  error={urlErrors.instagram_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-linkedin_url"
                  id="profile-linkedin_url-label"
                >
                  LinkedIn URL
                </label>
                <UrlInput
                  field="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  error={urlErrors.linkedin_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-tiktok_url"
                  id="profile-tiktok_url-label"
                >
                  TikTok URL
                </label>
                <UrlInput
                  field="tiktok_url"
                  value={formData.tiktok_url}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourusername"
                  error={urlErrors.tiktok_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-youtube_url"
                  id="profile-youtube_url-label"
                >
                  YouTube URL
                </label>
                <UrlInput
                  field="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannel"
                  error={urlErrors.youtube_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-zillow_url"
                  id="profile-zillow_url-label"
                >
                  Zillow Profile URL
                </label>
                <UrlInput
                  field="zillow_url"
                  value={formData.zillow_url}
                  onChange={handleChange}
                  placeholder="https://zillow.com/profile/yourprofile"
                  error={urlErrors.zillow_url}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-realtor_com_url"
                  id="profile-realtor_com_url-label"
                >
                  Realtor.com Profile URL
                </label>
                <UrlInput
                  field="realtor_com_url"
                  value={formData.realtor_com_url}
                  onChange={handleChange}
                  placeholder="https://realtor.com/realestateagents/yourprofile"
                  error={urlErrors.realtor_com_url}
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
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-seo_title"
                >
                  SEO Title
                </label>
                <input
                  id="profile-seo_title"
                  type="text"
                  name="seo_title"
                  value={formData.seo_title}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder={`${formData.full_name || 'Your Name'} - Real Estate Agent`}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    The title that appears in Google search results
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      formData.seo_title.length > 60 ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    {formData.seo_title.length}/60
                  </span>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="profile-seo_description"
                >
                  Meta Description
                </label>
                <textarea
                  id="profile-seo_description"
                  name="seo_description"
                  value={formData.seo_description}
                  onChange={handleChange}
                  maxLength={160}
                  rows={3}
                  placeholder={`Professional real estate services by ${formData.full_name || 'Your Name'}. Specializing in ${formData.service_cities.join(', ') || 'your area'}. Contact me today for all your real estate needs.`}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    The description that appears in Google search results
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      formData.seo_description.length > 160
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}
                  >
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
                      {formData.seo_title ||
                        `${formData.full_name || 'Your Name'} - Real Estate Agent`}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {formData.seo_description ||
                        `Professional real estate services by ${formData.full_name || 'Your Name'}. Contact me today for all your real estate needs.`}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Tips */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">
                  <span role="img" aria-label="Tip">
                    💡
                  </span>{' '}
                  SEO Best Practices
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong>Title:</strong> Keep under 60 characters, include your name and
                      location
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong>Description:</strong> Keep under 160 characters, mention your services
                      and areas
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong>Keywords:</strong> Include terms clients search for (e.g., "real
                      estate agent [city]")
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong>Be Specific:</strong> Mention specialties, certifications, or unique
                      services
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong>Call to Action:</strong> Encourage clicks with phrases like "Contact
                      me today"
                    </span>
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
