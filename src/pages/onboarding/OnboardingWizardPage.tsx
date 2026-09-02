import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { buildOnboardingProfileUpdate } from '@/lib/onboardingProfile';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { edgeFunctions } from '@/lib/edgeFunctions';

/**
 * OnboardingWizardPage
 * Wraps the OnboardingWizard component and handles data persistence to database
 */
export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async (wizardData: any) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete onboarding',
        variant: 'destructive',
      });
      navigate('/auth/login');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update profile with basic info.
      //
      // Built by lib/onboardingProfile, which is typed against the generated
      // Update shape and unit-tested. The mapping used to be inline and typed
      // `any`, which is how a nonexistent `city` column reached PostgREST and
      // took every other field down with it (US-108).
      let avatarUrl: string | null = null;

      // Upload profile photo if provided
      if (wizardData.profileBasics.photo) {
        try {
          const fileExt = wizardData.profileBasics.photo.name.split('.').pop();
          // US-075: the first path segment must be the uploader's id — the
          // storage policies key on it. This used to be `avatars/<uid>-<ts>`,
          // whose first segment was the literal string 'avatars', which an
          // owner-scoped policy rejects.
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, wizardData.profileBasics.photo);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from('avatars').getPublicUrl(filePath);

          avatarUrl = publicUrl;
        } catch (error) {
          // US-075: still non-fatal — onboarding should not be blocked by a
          // photo — but no longer silent.
          logger.error('Error uploading avatar', error as Error);
          toast({
            title: 'Profile photo upload failed',
            description: 'Everything else was saved. You can add a photo from Settings.',
            variant: 'destructive',
          });
        }
      }

      const profileUpdates = buildOnboardingProfileUpdate({
        fullName: wizardData.profileBasics.fullName,
        title: wizardData.profileBasics.title,
        bio: wizardData.profileBasics.bio,
        phone: wizardData.profileBasics.phone,
        location: wizardData.profileBasics.location,
        templateChoice: wizardData.templateChoice,
        avatarUrl,
      });

      // Through the store, not a direct supabase.update: it is the only writer
      // that leaves useAuthStore holding the saved row. A bare update saved the
      // profile and left `profile.onboarding_completed_at` null in memory, so
      // ProtectedRoute's first-run gate immediately sent the agent who had just
      // finished the wizard straight back into it (US-108).
      await updateProfile(profileUpdates);

      // 2. Create first listing if provided
      if (wizardData.firstListing.address || wizardData.firstListing.price) {
        try {
          let photoUrl = null;

          // Upload listing photo if provided
          if (wizardData.firstListing.photo) {
            const fileExt = wizardData.firstListing.photo.name.split('.').pop();
            // Same owner-scoped layout as above, and the bucket the rest of the
            // app uses — this wrote to 'listing-images', which exists nowhere.
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('listing-photos')
              .upload(filePath, wizardData.firstListing.photo);

            if (uploadError) {
              // US-075: this failure used to be swallowed by a bare
              // `if (!uploadError)` with no else, so a new agent's first
              // listing photo vanished without a word.
              logger.error('Failed to upload the first listing photo', uploadError);
              toast({
                title: 'Photo upload failed',
                description: 'Your listing was saved without its photo. You can add one later.',
                variant: 'destructive',
              });
            } else {
              const {
                data: { publicUrl },
              } = supabase.storage.from('listing-photos').getPublicUrl(filePath);

              photoUrl = publicUrl;
            }
          }

          // Parse address
          const addressParts =
            wizardData.firstListing.address?.split(',').map((s: string) => s.trim()) || [];
          const address = addressParts[0] || '';
          const city = addressParts[1] || '';
          const stateZip = addressParts[2] || '';
          const stateParts = stateZip.split(' ');
          const state = stateParts[0] || '';
          const zip = stateParts[1] || '';

          // Typed, not `any`. Three things were wrong here and the cast hid all
          // of them (US-106):
          //   - `beds`/`baths` were NOT NULL integers with no default and this
          //     insert never named them, so the wizard's first listing could
          //     never save at all. They are GENERATED now, so omitting them is
          //     correct.
          //   - parseInt truncated 2.5 baths to 2; bathrooms is numeric.
          //   - `featured` is not a column. The column is `is_featured`, so
          //     "make the first listing featured" never happened.
          const listingData: TablesInsert<'listings'> = {
            user_id: user.id,
            address: address,
            city: city,
            state: state,
            zip_code: zip,
            price: wizardData.firstListing.price || '0',
            // bedrooms/bathrooms are NOT NULL with a 0 default; an empty field
            // means "not stated", which is 0 rather than a failed insert.
            bedrooms: Number(wizardData.firstListing.beds) || 0,
            bathrooms: Number(wizardData.firstListing.baths) || 0,
            status: wizardData.firstListing.status || 'active',
            is_featured: true,
            photos: photoUrl ? [photoUrl] : [],
          };

          const { error: listingError } = await supabase.from('listings').insert(listingData);

          if (listingError) throw listingError;
        } catch (error) {
          // Still non-fatal — the profile is saved and onboarding should not be
          // blocked by an optional listing — but no longer silent. The agent
          // typed an address and a price and was told nothing when it vanished
          // (US-108).
          logger.error('Error with first listing', error as Error);
          toast({
            title: 'Your first listing was not saved',
            description:
              'Everything else is saved. You can add the listing from the Listings page.',
            variant: 'destructive',
          });
        }
      }

      // Send welcome email (non-blocking)
      try {
        // No body. The function reads the address from the caller's JWT and
        // the name and username from that user's own profile row — it used to
        // take all three from here, unauthenticated, which made it a branded
        // relay to any address (US-119).
        await edgeFunctions.invoke('send-welcome-email', {});
      } catch (emailError) {
        logger.error('Welcome email failed (non-critical)', emailError as Error);
        // Don't block navigation if email fails
      }

      // Success!
      toast({
        title: '🎉 Welcome to AgentBio!',
        description: 'Your profile is ready to share. Check your email for next steps!',
      });

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      logger.error('Error completing onboarding', error as Error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save your information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your profile...</h2>
          <p className="text-gray-600">This will only take a moment</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard onComplete={handleComplete} userProfile={profile} />;
}
