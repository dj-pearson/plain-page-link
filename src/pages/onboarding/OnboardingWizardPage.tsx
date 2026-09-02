import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
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
  const { user, profile } = useAuthStore();
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
      // 1. Update profile with basic info
      const profileUpdates: any = {};

      if (wizardData.profileBasics.fullName) {
        profileUpdates.full_name = wizardData.profileBasics.fullName;
      }
      if (wizardData.profileBasics.title) {
        profileUpdates.title = wizardData.profileBasics.title;
      }
      if (wizardData.profileBasics.bio) {
        profileUpdates.bio = wizardData.profileBasics.bio;
      }
      if (wizardData.profileBasics.phone) {
        profileUpdates.phone = wizardData.profileBasics.phone;
      }
      if (wizardData.profileBasics.location) {
        // Parse location into city/state if possible
        const parts = wizardData.profileBasics.location.split(',').map((s: string) => s.trim());
        if (parts.length >= 2) {
          profileUpdates.city = parts[0];
          profileUpdates.license_state = parts[1];
        }
      }

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

          profileUpdates.avatar_url = publicUrl;
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

      // Apply selected theme
      if (wizardData.templateChoice) {
        profileUpdates.theme = wizardData.templateChoice;
      }

      // Mark onboarding complete so the user isn't routed back into the wizard.
      profileUpdates.onboarding_completed_at = new Date().toISOString();

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select('id')
        .single();

      if (profileError) throw profileError;

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

          if (listingError) {
            logger.error('Error creating listing', listingError as Error);
            // Don't throw - listing is optional
          }
        } catch (error) {
          logger.error('Error with first listing', error as Error);
          // Continue even if listing creation fails
        }
      }

      // Send welcome email (non-blocking)
      try {
        await edgeFunctions.invoke('send-welcome-email', {
          body: {
            user_id: user.id,
            email: user.email,
            full_name: wizardData.profileBasics.fullName || user.user_metadata?.full_name,
            username: user.user_metadata?.username || 'agent',
          },
        });
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
