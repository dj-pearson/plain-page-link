import { useNavigate } from 'react-router-dom';
import { readPlanIntent } from '@/lib/signupIntent';
import { useState } from 'react';
import {
  OnboardingWizard,
  buildFirstListingInsert,
  firstListingState,
  type OnboardingWizardData,
} from '@/components/onboarding/OnboardingWizard';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
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
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Saves everything the wizard collected. Resolves true on success.
   *
   * US-238: on failure this resolves false and the wizard — which is never
   * unmounted while saving — keeps the agent on the same step with every field
   * and photo intact and the reason inline. It used to swap the wizard for a
   * spinner screen, which threw its state away, so a failed save sent the
   * agent back to step 1 with an empty form and a toast.
   */
  const handleComplete = async (wizardData: OnboardingWizardData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete onboarding',
        variant: 'destructive',
      });
      navigate('/auth/login');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

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

      // 2. Create first listing if provided.
      //
      // Only a complete one: street address, city and a price (US-238). The
      // wizard will not leave step 3 half-filled, but "Skip Setup" can, and a
      // listing with an empty city or a '0' price is worse than none.
      const listingState = firstListingState(wizardData.firstListing);
      if (listingState === 'incomplete') {
        toast({
          title: 'Your first listing was not saved',
          description:
            'It needs a street address, city and price. You can add it from the Listings page.',
          variant: 'destructive',
        });
      }
      if (listingState === 'complete') {
        try {
          let photoUrl: string | null = null;

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

          const listingData = buildFirstListingInsert(user.id, wizardData.firstListing, photoUrl);
          if (!listingData) throw new Error('First listing is incomplete');

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
      return true;
    } catch (error) {
      logger.error('Error completing onboarding', error as Error);
      setSaveError(
        'Everything you entered is still here. Check your connection and press the button again.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // US-232: a visitor who chose a plan on /pricing before signing up goes
  // straight to checkout for it; everyone else to the dashboard.
  const handleFinish = () => {
    const intent = readPlanIntent();
    navigate(
      intent
        ? `/dashboard/subscription?checkout=${encodeURIComponent(intent.plan)}&interval=${intent.interval}`
        : '/dashboard',
      { replace: true }
    );
  };

  return (
    <>
      <OnboardingWizard
        onComplete={handleComplete}
        onFinish={handleFinish}
        isSaving={isSaving}
        saveError={saveError}
        userProfile={profile}
      />
      {/* An overlay, not a replacement: unmounting the wizard here is what lost
          every answer when the save failed (US-238). */}
      {isSaving && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm px-4"
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your profile...</h2>
            <p className="text-gray-600">This will only take a moment</p>
          </div>
        </div>
      )}
    </>
  );
}
