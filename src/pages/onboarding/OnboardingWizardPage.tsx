import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, wizardData.profileBasics.photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          profileUpdates.avatar_url = publicUrl;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          // Continue even if avatar upload fails
        }
      }

      // Apply selected theme
      if (wizardData.templateChoice) {
        profileUpdates.theme = wizardData.templateChoice;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Create first listing if provided
      if (wizardData.firstListing.address || wizardData.firstListing.price) {
        try {
          let photoUrl = null;

          // Upload listing photo if provided
          if (wizardData.firstListing.photo) {
            const fileExt = wizardData.firstListing.photo.name.split('.').pop();
            const fileName = `${user.id}-listing-${Date.now()}.${fileExt}`;
            const filePath = `listings/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('listing-images')
              .upload(filePath, wizardData.firstListing.photo);

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('listing-images')
                .getPublicUrl(filePath);

              photoUrl = publicUrl;
            }
          }

          // Parse address
          const addressParts = wizardData.firstListing.address?.split(',').map((s: string) => s.trim()) || [];
          const address = addressParts[0] || '';
          const city = addressParts[1] || '';
          const stateZip = addressParts[2] || '';
          const stateParts = stateZip.split(' ');
          const state = stateParts[0] || '';
          const zip = stateParts[1] || '';

          const listingData: any = {
            user_id: user.id,
            address: address,
            city: city,
            state: state,
            zip_code: zip,
            price: wizardData.firstListing.price || '0',
            bedrooms: wizardData.firstListing.beds ? parseInt(wizardData.firstListing.beds) : null,
            bathrooms: wizardData.firstListing.baths ? parseInt(wizardData.firstListing.baths) : null,
            status: wizardData.firstListing.status || 'active',
            featured: true, // Make first listing featured
            photos: photoUrl ? [photoUrl] : [],
          };

          const { error: listingError } = await supabase
            .from('listings')
            .insert(listingData);

          if (listingError) {
            console.error('Error creating listing:', listingError);
            // Don't throw - listing is optional
          }
        } catch (error) {
          console.error('Error with first listing:', error);
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
            username: user.user_metadata?.username || 'agent'
          }
        });
      } catch (emailError) {
        console.error('Welcome email failed (non-critical):', emailError);
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
      console.error('Error completing onboarding:', error);
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

  return (
    <OnboardingWizard
      onComplete={handleComplete}
      userProfile={profile || user}
    />
  );
}
