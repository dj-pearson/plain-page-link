/**
 * AI Listing Description Generator - Main Page
 * Generates professional listing descriptions in 3 styles for real estate agents
 */

import React, { useState } from 'react';
import { PropertyDetailsForm } from '@/components/tools/listing-description-generator/PropertyDetailsForm';
import { DescriptionDisplay } from '@/components/tools/listing-description-generator/DescriptionDisplay';
import { EmailCaptureModal } from '@/components/tools/listing-description-generator/EmailCaptureModal';
import { SocialShare } from '@/components/tools/listing-description-generator/SocialShare';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, FileText, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PropertyDetails, GeneratedDescription, EmailCaptureData } from '@/lib/listing-description-generator/types';

type FlowStep = 'intro' | 'form' | 'generating' | 'results';

export default function ListingDescriptionGenerator() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro');
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [descriptions, setDescriptions] = useState<GeneratedDescription[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [listingId, setListingId] = useState<string>('');
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Track analytics event
  const trackEvent = async (eventType: string, eventData?: Record<string, any>) => {
    try {
      await supabase.from('listing_generator_analytics').insert({
        event_type: eventType,
        event_data: eventData || {},
        session_id: sessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  // Handle form submission and generate descriptions
  const handleFormSubmit = async (details: PropertyDetails) => {
    setPropertyDetails(details);
    setCurrentStep('generating');

    // Track start
    await trackEvent('generator_started', {
      propertyType: details.propertyType,
      city: details.city,
      state: details.state,
      price: details.price,
      targetBuyer: details.targetBuyer,
    });

    try {
      // Call OpenAI edge function to generate descriptions
      const { data, error } = await supabase.functions.invoke('generate-listing-description', {
        body: { propertyDetails: details },
      });

      if (error) throw error;

      // Store in database
      const { data: savedListing, error: saveError } = await supabase
        .from('listing_descriptions')
        .insert({
          property_details: details,
          descriptions: data.descriptions,
          session_id: sessionId,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setListingId(savedListing.id);
      setDescriptions(data.descriptions);
      setCurrentStep('results');

      // Track completion
      await trackEvent('generator_completed', {
        listingId: savedListing.id,
        stylesGenerated: data.descriptions.length,
      });

      toast.success('Descriptions generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate descriptions. Please try again.');
      setCurrentStep('form');
    }
  };

  // Handle email capture
  const handleEmailCapture = async (data: EmailCaptureData) => {
    try {
      // Save email capture to database
      const { data: captureData, error: captureError } = await supabase
        .from('listing_email_captures')
        .insert({
          listing_id: listingId,
          email: data.email,
          first_name: data.firstName,
          brokerage_name: data.brokerageName,
          phone_number: data.phoneNumber,
        })
        .select()
        .single();

      if (captureError) throw captureError;

      // Send welcome email via edge function
      try {
        await supabase.functions.invoke('send-listing-generator-email', {
          body: {
            email: data.email,
            firstName: data.firstName,
            propertyDetails,
            descriptions,
            listingId,
          },
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't block unlock if email fails
      }

      // Unlock all content
      setIsUnlocked(true);
      setShowEmailModal(false);

      // Track conversion
      await trackEvent('email_captured', {
        listingId,
        email: data.email,
      });

      toast.success('Success! All 3 styles unlocked. Check your email for your complete guide!');
    } catch (error) {
      console.error('Email capture error:', error);
      toast.error('Failed to capture email. Please try again.');
    }
  };

  // Handle description copy
  const handleDescriptionCopy = async (style: string, format: string) => {
    await trackEvent('description_copied', {
      listingId,
      style,
      format,
    });
  };

  // Render intro screen
  const renderIntro = () => (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">Free AI Tool for Real Estate Agents</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI Listing Description Generator
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate professional listing descriptions in 3 different styles in under 60 seconds.
          Get MLS descriptions, social media posts, emails, and SMS snippets - all optimized for your target buyer.
        </p>

        <Button
          onClick={() => {
            setCurrentStep('form');
            trackEvent('intro_cta_clicked');
          }}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
        >
          Generate My Listing Descriptions
          <Sparkles className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          No credit card required • Takes 2 minutes • Get 3 complete style options
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">3 Professional Styles</h3>
          <p className="text-sm text-gray-600">
            Luxury, Family-Friendly, and Investment styles tailored to your target buyer
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4">
            <TrendingUp className="h-6 w-6 text-pink-600" />
          </div>
          <h3 className="font-semibold mb-2">15 Ready-to-Use Formats</h3>
          <p className="text-sm text-gray-600">
            MLS, Instagram, Facebook, Email, SMS - all formats for every marketing channel
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">Buyer Psychology</h3>
          <p className="text-sm text-gray-600">
            AI-powered language that triggers emotions and drives action from qualified buyers
          </p>
        </Card>
      </div>

      {/* Social Proof */}
      <Card className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900 mb-2">4,200+ agents</p>
          <p className="text-gray-600 mb-6">are already using AI to write better listings in less time</p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 italic mb-2">
                "This tool saves me at least 2 hours per listing. The luxury style is chef's kiss!"
              </p>
              <p className="text-xs font-medium">— Sarah M., Beverly Hills</p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 italic mb-2">
                "I used to dread writing descriptions. Now I generate 3 versions in under a minute!"
              </p>
              <p className="text-xs font-medium">— Mike T., Austin</p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 italic mb-2">
                "My listings get 3x more engagement since using the family-friendly style. Game changer."
              </p>
              <p className="text-xs font-medium">— Jennifer L., Denver</p>
            </div>
          </div>
        </div>
      </Card>

      {/* SEO Content */}
      <div className="mt-12 text-sm text-gray-600 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Why Real Estate Agents Need AI Listing Description Generators
        </h2>

        <p>
          Writing compelling real estate listing descriptions is one of the most time-consuming tasks for agents.
          A great listing description can make the difference between a property sitting on the market for months
          or receiving multiple offers within days. Our AI listing description generator uses advanced natural
          language processing to create professional, emotionally resonant descriptions that speak directly to
          your target buyer's desires and needs.
        </p>

        <p>
          Whether you're marketing a luxury estate, a family-friendly suburban home, or an investment property,
          our AI generates descriptions in three distinct styles optimized for different buyer personas. Each
          description is carefully crafted to highlight key features, create emotional connections, and include
          powerful calls-to-action that drive showings and offers.
        </p>

        <p>
          Beyond just MLS descriptions, you'll receive ready-to-post content for Instagram, Facebook, LinkedIn,
          email campaigns, and SMS marketing - all generated in seconds. Stop spending hours writing listing
          copy and start focusing on what you do best: selling homes.
        </p>
      </div>
    </div>
  );

  // Render generating screen
  const renderGenerating = () => (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="animate-pulse mb-8">
        <Sparkles className="h-16 w-16 text-purple-600 mx-auto mb-4" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Generating Your Descriptions...</h2>

      <div className="space-y-3 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
          <span>Analyzing property details...</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <span>Crafting luxury style description...</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <span>Creating family-friendly version...</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <span>Optimizing investment style...</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          <span>Generating social media posts...</span>
        </div>
      </div>

      <p className="text-gray-500 mt-8">This usually takes 15-30 seconds...</p>
    </div>
  );

  // Render results screen
  const renderResults = () => (
    <div className="max-w-6xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            setCurrentStep('form');
            setDescriptions([]);
            setIsUnlocked(false);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Generate Another
        </Button>

        <div className="text-sm text-gray-600">
          {propertyDetails && (
            <>
              {propertyDetails.city}, {propertyDetails.state} • ${propertyDetails.price.toLocaleString()}
            </>
          )}
        </div>
      </div>

      {/* Success message */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">
              Your Descriptions Are Ready!
            </h3>
            <p className="text-sm text-green-700">
              {isUnlocked
                ? 'All 3 professional styles unlocked. Scroll down to view, copy, and share.'
                : 'Preview the first style below. Enter your email to unlock all 3 styles + bonus content!'}
            </p>
          </div>
        </div>
      </Card>

      {/* Description Display */}
      <DescriptionDisplay
        descriptions={descriptions}
        isUnlocked={isUnlocked}
        onUnlockClick={() => setShowEmailModal(true)}
        onCopy={handleDescriptionCopy}
      />

      {/* Social Share (only show when unlocked) */}
      {isUnlocked && propertyDetails && (
        <div className="mt-8">
          <SocialShare
            propertyAddress={propertyDetails.address || `${propertyDetails.city} Property`}
            city={propertyDetails.city}
            state={propertyDetails.state}
            price={propertyDetails.price}
            propertyType={propertyDetails.propertyType}
            description={descriptions[0]?.mlsDescription || ''}
          />
        </div>
      )}

      {/* CTA for AgentBio trial */}
      <Card className="p-8 mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Want AI-Powered Marketing for Every Listing?</h3>
          <p className="text-gray-700 mb-6">
            AgentBio creates your entire marketing presence - Instagram bios, link-in-bio pages,
            content calendars, and automated follow-up - all optimized to convert followers to clients.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => {
              window.location.href = '/register?utm_source=listing-generator&utm_medium=cta';
              trackEvent('trial_clicked');
            }}
          >
            Start Your Free 14-Day Trial
          </Button>
          <p className="text-sm text-gray-600 mt-3">
            No credit card required • Cancel anytime • 4,200+ agents trust AgentBio
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      {/* Render current step */}
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'form' && (
        <div className="max-w-4xl mx-auto">
          <PropertyDetailsForm onSubmit={handleFormSubmit} />
        </div>
      )}
      {currentStep === 'generating' && renderGenerating()}
      {currentStep === 'results' && renderResults()}

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailCapture}
      />
    </div>
  );
}
