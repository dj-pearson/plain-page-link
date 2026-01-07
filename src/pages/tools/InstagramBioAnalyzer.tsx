/**
 * Instagram Bio Analyzer - Main Page
 * Lead magnet tool for AgentBio.net
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { BioAnalyzerForm } from '@/components/tools/instagram-bio-analyzer/BioAnalyzerForm';
import { ScoreDisplay } from '@/components/tools/instagram-bio-analyzer/ScoreDisplay';
import { CategoryBreakdown } from '@/components/tools/instagram-bio-analyzer/CategoryBreakdown';
import { BioRewriteDisplay } from '@/components/tools/instagram-bio-analyzer/BioRewriteDisplay';
import { InstagramMockup, InstagramComparison } from '@/components/tools/instagram-bio-analyzer/InstagramMockup';
import { EmailCaptureModal, UnlockCTA } from '@/components/tools/instagram-bio-analyzer/EmailCaptureModal';
import { SocialShare, ScoreLeaderboard } from '@/components/tools/instagram-bio-analyzer/SocialShare';
import { Button } from '@/components/ui/button';
import { BioAnalysisInput, BioAnalysisResult, EmailCaptureData } from '@/lib/instagram-bio-analyzer/types';
import { analyzeBio } from '@/lib/instagram-bio-analyzer/scoring';
import { generateBioRewrites } from '@/lib/instagram-bio-analyzer/bio-generator';
import { analyzeLinkStrategy, calculateLeadLoss } from '@/lib/instagram-bio-analyzer/link-strategy';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/lib/edgeFunctions';
import {
  Instagram,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function InstagramBioAnalyzer() {
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const [analysisInput, setAnalysisInput] = useState<BioAnalysisInput | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BioAnalysisResult | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const toolUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tools/instagram-bio-analyzer`
    : 'https://agentbio.net/tools/instagram-bio-analyzer';

  const handleFormSubmit = async (data: BioAnalysisInput) => {
    setIsAnalyzing(true);
    setAnalysisInput(data);

    try {
      // Run analysis
      const result = analyzeBio(data);

      // Generate bio rewrites
      const rewrites = generateBioRewrites(data);
      result.rewrittenBios = rewrites;

      setAnalysisResult(result);

      // Save analysis to Supabase
      const { data: savedAnalysis, error } = await supabase
        .from('instagram_bio_analyses')
        .insert({
          input_data: data,
          result_data: result,
          overall_score: result.overallScore,
          market: data.location,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving analysis:', error);
      } else if (savedAnalysis) {
        setAnalysisId(savedAnalysis.id);
      }

      // Track analytics event
      await trackEvent('analyzer_completed', {
        score: result.overallScore,
        market: data.location,
        yearsExperience: data.yearsExperience,
        followerCount: data.followerCount,
      });

      // Move to results
      setCurrentStep('results');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEmailCapture = async (data: EmailCaptureData) => {
    try {
      // Save email capture to Supabase
      const { data: captureData, error: captureError } = await supabase
        .from('instagram_bio_email_captures')
        .insert({
          analysis_id: analysisId,
          email: data.email,
          first_name: data.firstName,
          market: data.market,
          brokerage: data.brokerage,
          email_sequence_started: true,
        })
        .select()
        .single();

      if (captureError) throw captureError;

      // Track analytics
      await trackEvent('email_captured', {
        market: data.market,
        brokerage: data.brokerage,
      });

      // Send welcome email with bio rewrites via Resend
      if (analysisResult) {
        try {
          const { data: functionData, error: functionError } = await edgeFunctions.invoke(
            'send-bio-analyzer-email',
            {
              body: {
                analysisId: captureData?.id || analysisId,
                email: data.email,
                firstName: data.firstName,
                market: data.market,
                brokerage: data.brokerage,
                score: analysisResult.overallScore,
                bioRewrites: analysisResult.rewrittenBios.map(b => b.bio),
              },
            }
          );

          if (functionError) {
            console.error('Error sending email:', functionError);
            // Don't throw - email is nice to have but shouldn't block unlock
          }
        } catch (emailError) {
          console.error('Email function error:', emailError);
          // Don't throw - email failure shouldn't prevent unlock
        }
      }

      // Unlock content
      setIsUnlocked(true);
      setShowEmailModal(false);

      toast.success('Success! Check your email for all 3 bio rewrites.');
    } catch (error) {
      console.error('Email capture error:', error);
      throw error;
    }
  };

  const trackEvent = async (eventType: string, eventData: any) => {
    try {
      await supabase.from('instagram_bio_analytics').insert({
        event_type: eventType,
        event_data: eventData,
        session_id: getSessionId(),
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('bio_analyzer_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('bio_analyzer_session', sessionId);
    }
    return sessionId;
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "name": "Free Instagram Bio Analyzer for Real Estate Agents",
        "description": "Analyze your realtor Instagram bio in 60 seconds. Get your effectiveness score + 3 optimized bio rewrites. Free tool for agents.",
        "url": toolUrl,
      },
      {
        "@type": "HowTo",
        "name": "How to Analyze Your Real Estate Instagram Bio",
        "description": "Step-by-step guide to analyzing and optimizing your realtor Instagram bio for maximum lead generation.",
        "step": [
          {
            "@type": "HowToStep",
            "name": "Enter Your Current Instagram Bio",
            "text": "Paste your current Instagram bio text into the analyzer tool. Include your full bio exactly as it appears on your profile.",
          },
          {
            "@type": "HowToStep",
            "name": "Add Your Market Details",
            "text": "Enter your location, years of experience, follower count, and monthly Instagram traffic to get personalized analysis.",
          },
          {
            "@type": "HowToStep",
            "name": "Get Your Effectiveness Score",
            "text": "Receive an instant score based on 6 key factors: clarity, call-to-action strength, keyword optimization, link strategy, credibility signals, and mobile readability.",
          },
          {
            "@type": "HowToStep",
            "name": "Review Your Optimized Bios",
            "text": "Get 3 professionally rewritten bio versions optimized for your specific market, experience level, and business goals.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What does the Instagram bio analyzer check?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Instagram bio analyzer evaluates your realtor bio across 6 critical factors: clarity of value proposition, call-to-action effectiveness, keyword optimization for your market, link strategy, credibility signals (years of experience, certifications), and mobile readability. Each factor is scored and you receive an overall effectiveness grade from F to A+.",
            },
          },
          {
            "@type": "Question",
            "name": "How long does the Instagram bio analysis take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Instagram bio analysis takes approximately 60 seconds. You simply enter your current bio text, add your market details, and receive instant results including your effectiveness score, category-by-category breakdown, and 3 professionally rewritten bio versions optimized for real estate lead generation.",
            },
          },
          {
            "@type": "Question",
            "name": "Is the Instagram bio analyzer really free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, the Instagram bio analyzer is 100% free to use with no signup required. You can analyze your bio and see your score immediately. To unlock all 3 optimized bio rewrites and detailed recommendations, simply enter your email to receive the full report.",
            },
          },
          {
            "@type": "Question",
            "name": "What makes a good real estate Instagram bio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A good real estate Instagram bio includes: your specific market/location, years of experience or credentials, a clear value proposition (what makes you different), a strong call-to-action, and a strategic link to your portfolio or listings. Top-performing agent bios score 85+ on our analyzer by balancing these elements for mobile readability.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Free Instagram Bio Analyzer for Real Estate Agents | AgentBio</title>
        <meta
          name="description"
          content="Analyze your realtor Instagram bio in 60 seconds. Get your effectiveness score + 3 optimized bio rewrites. Free tool for agents. No signup required."
        />
        <meta
          name="keywords"
          content="instagram bio for realtors, real estate instagram bio, realtor bio examples, instagram bio analyzer"
        />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
        {/* Breadcrumb Navigation */}
        <div className="bg-white/80 border-b border-gray-200 py-3">
          <div className="container mx-auto px-4">
            <Breadcrumb
              items={[
                { name: "Home", url: window.location.origin },
                { name: "Free Tools", url: "/tools/instagram-bio-analyzer" },
                { name: "Instagram Bio Analyzer", url: "/tools/instagram-bio-analyzer" }
              ]}
            />
          </div>
        </div>

        {/* Hero Section */}
        {currentStep === 'form' && (
          <>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
              <div className="container max-w-4xl mx-auto px-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold">Free Tool for Real Estate Agents</span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    Is Your Instagram Bio
                    <br />
                    <span className="text-purple-200">Costing You Leads?</span>
                  </h1>

                  <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
                    Get your bio effectiveness score in 60 seconds + 3 professionally rewritten
                    versions optimized for your market and goals
                  </p>
                  <p className="text-base text-purple-200 mb-6 max-w-2xl mx-auto">
                    Want to learn more about optimizing your Instagram for leads?{' '}
                    <a href="/instagram-bio-for-realtors" className="underline hover:text-white font-semibold">
                      Read our complete Instagram bio guide for realtors →
                    </a>
                  </p>

                  <div className="flex flex-wrap justify-center gap-6 text-left">
                    {[
                      { icon: CheckCircle, text: 'Instant analysis & score' },
                      { icon: Sparkles, text: '3 optimized bio rewrites' },
                      { icon: Award, text: 'Beat your competition' },
                      { icon: Target, text: '100% free, no signup' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                        <item.icon className="w-5 h-5" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Answer for GEO/AEO - First 100 words */}
            <div className="bg-white border-b border-gray-200 py-8">
              <div className="container max-w-4xl mx-auto px-4">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  <strong>The Instagram Bio Analyzer is a free tool designed specifically for real estate agents to evaluate and optimize their Instagram bio for maximum lead generation.</strong> In 60 seconds, you'll receive an effectiveness score (0-100) based on six key factors—clarity, call-to-action strength, keyword optimization, link strategy, credibility signals, and mobile readability—plus three professionally rewritten bio versions tailored to your market and experience level. Top-performing agent bios score 85+ and convert 3x more Instagram followers into qualified buyer and seller leads compared to generic, unoptimized bios.
                </p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white border-y border-gray-200 py-8">
              <div className="container max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                  {[
                    { icon: Users, number: '2,847+', label: 'Agents Analyzed' },
                    { icon: TrendingUp, number: '3X', label: 'Average Lead Increase' },
                    { icon: DollarSign, number: '$50M+', label: 'In Deals Generated' },
                    { icon: Award, number: '4.9/5', label: 'Agent Rating' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <stat.icon className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="container max-w-3xl mx-auto px-4 py-16">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Analyzing Your Bio...</h3>
                    <p className="text-gray-600">
                      Running 6-point analysis and generating personalized recommendations
                    </p>
                  </div>
                ) : (
                  <BioAnalyzerForm onSubmit={handleFormSubmit} onStepChange={() => {}} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Results Section */}
        {currentStep === 'results' && analysisResult && analysisInput && (
          <div className="container max-w-6xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Your Instagram Bio Analysis</h1>
              <p className="text-xl text-gray-600">
                Here's how your bio stacks up against top-performing real estate agents
              </p>
            </div>

            {/* Overall Score */}
            <div className="mb-16">
              <ScoreDisplay score={analysisResult.overallScore} showGrade />
            </div>

            {/* Category Breakdown */}
            <div className="mb-16">
              <CategoryBreakdown analysis={analysisResult} showDetails={isUnlocked} />
            </div>

            {/* Bio Rewrites */}
            <div className="mb-16">
              <BioRewriteDisplay
                rewrites={analysisResult.rewrittenBios}
                isLocked={!isUnlocked}
                onUnlock={() => setShowEmailModal(true)}
              />
            </div>

            {/* Unlock CTA */}
            {!isUnlocked && (
              <div className="mb-16">
                <UnlockCTA onUnlock={() => setShowEmailModal(true)} />
              </div>
            )}

            {/* Instagram Comparison (Unlocked) */}
            {isUnlocked && (
              <div className="mb-16">
                <InstagramComparison
                  beforeBio={analysisInput.currentBio}
                  afterBio={analysisResult.rewrittenBios[0].bio}
                  username={analysisInput.instagramHandle}
                  fullName={analysisInput.city}
                  location={analysisInput.location}
                />
              </div>
            )}

            {/* Link Strategy Analysis (Unlocked) */}
            {isUnlocked && (
              <div className="mb-16">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold mb-6">Your Link Strategy Analysis</h2>
                  {(() => {
                    const linkAnalysis = analyzeLinkStrategy(analysisInput);
                    const leadLoss = calculateLeadLoss(analysisInput, linkAnalysis);

                    return (
                      <div className="space-y-6">
                        {/* Current Diagnosis */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                          <h3 className="font-bold text-red-900 mb-2">Current Situation</h3>
                          <p className="text-red-800">{linkAnalysis.currentDiagnosis}</p>
                        </div>

                        {/* Lead Loss Calculator */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                          <h3 className="font-bold text-purple-900 mb-4">What You're Missing</h3>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600">
                                {leadLoss.leadsLost}
                              </div>
                              <div className="text-sm text-purple-800">Leads Lost/Month</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600">
                                {leadLoss.potentialMonthlyLeads}
                              </div>
                              <div className="text-sm text-purple-800">Potential Monthly Leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600">
                                ${(leadLoss.annualValue / 1000).toFixed(0)}K
                              </div>
                              <div className="text-sm text-purple-800">Potential Annual Value</div>
                            </div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3">Recommended Structure</h3>
                          <ul className="space-y-2">
                            {linkAnalysis.recommendedStructure.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Social Share */}
            <div className="mb-16">
              <SocialShare
                score={analysisResult.overallScore}
                toolUrl={toolUrl}
                onShare={(platform) => trackEvent('shared', { platform })}
              />
            </div>

            {/* Leaderboard */}
            <div className="mb-16">
              <ScoreLeaderboard
                userScore={analysisResult.overallScore}
                market={analysisInput.location}
              />
            </div>

            {/* AgentBio CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Convert More Instagram Followers?</h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Your optimized bio is just the start.{' '}
                <a href="/for-real-estate-agents" className="underline hover:text-white font-semibold">
                  AgentBio gives you a complete link-in-bio platform
                </a>{' '}
                built specifically for real estate agents.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  'Auto-updated MLS listings',
                  'Built-in lead capture forms',
                  'Advanced analytics & tracking',
                  'QR codes for offline marketing',
                  'Testimonial showcases',
                  'Professional templates',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 gap-2 text-lg px-8"
                onClick={() => {
                  trackEvent('trial_clicked', {});
                  window.location.href = '/auth/register';
                }}
              >
                Start Your Free 14-Day Trial
                <ArrowRight className="w-5 h-5" />
              </Button>

              <p className="text-sm text-purple-200 mt-4">
                No credit card required • Cancel anytime • Used by 10,000+ agents
              </p>
            </div>

            {/* Restart Button */}
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setCurrentStep('form');
                  setAnalysisResult(null);
                  setIsUnlocked(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Analyze Another Bio
              </Button>
            </div>
          </div>
        )}

        {/* Email Capture Modal */}
        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSubmit={handleEmailCapture}
          analysisId={analysisId}
        />
      </div>
    </>
  );
}
