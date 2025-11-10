/**
 * Multi-step form for Instagram Bio Analyzer
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { BioAnalysisInput } from '@/lib/instagram-bio-analyzer/types';
import { ArrowRight, ArrowLeft, Instagram, TrendingUp } from 'lucide-react';

interface BioAnalyzerFormProps {
  onSubmit: (data: BioAnalysisInput) => void;
  onStepChange?: (step: number) => void;
}

const PRIMARY_FOCUS_OPTIONS = [
  { value: 'buyers', label: 'Buyers' },
  { value: 'sellers', label: 'Sellers' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'first-time-buyers', label: 'First-time Buyers' },
  { value: 'investment', label: 'Investment Properties' },
];

export function BioAnalyzerForm({ onSubmit, onStepChange }: BioAnalyzerFormProps) {
  const [step, setStep] = useState(1);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BioAnalysisInput>();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    const newStep = Math.min(step + 1, totalSteps);
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const handleFormSubmit = (data: BioAnalysisInput) => {
    // Add selected focus areas
    data.primaryFocus = selectedFocus;
    onSubmit(data);
  };

  const toggleFocus = (value: string) => {
    setSelectedFocus(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 1: Current Bio Analysis */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Current Bio Analysis</h2>
              <p className="text-gray-600">Let's analyze your existing Instagram bio</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="instagramHandle">
                Instagram Handle <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="instagramHandle"
                placeholder="@yourusername"
                {...register('instagramHandle')}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">We'll use this for screenshot features</p>
            </div>

            <div>
              <Label htmlFor="currentBio">
                Current Bio Text <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="currentBio"
                placeholder="Paste your current Instagram bio here..."
                maxLength={150}
                rows={4}
                {...register('currentBio', { required: 'Bio text is required' })}
                className="mt-1"
              />
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Max 150 characters</span>
                <span className={watch('currentBio')?.length > 140 ? 'text-red-500' : 'text-gray-500'}>
                  {watch('currentBio')?.length || 0}/150
                </span>
              </div>
              {errors.currentBio && (
                <p className="text-red-500 text-sm mt-1">{errors.currentBio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="linkSituation">
                Current Link Situation <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: any) => setValue('linkSituation', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your current link setup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linktree">One Linktree link</SelectItem>
                  <SelectItem value="website">Website link</SelectItem>
                  <SelectItem value="dm-only">DM only (no link)</SelectItem>
                  <SelectItem value="multiple-posts">Multiple links in posts</SelectItem>
                  <SelectItem value="nothing">Nothing (no link at all)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="profilePicture">
                Profile Picture Quality <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: any) => setValue('profilePicture', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Describe your profile picture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional headshot</SelectItem>
                  <SelectItem value="casual">Casual photo</SelectItem>
                  <SelectItem value="logo">Logo/branding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Agent Context */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Tell Us About You</h2>
              <p className="text-gray-600">Help us personalize your analysis</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>
                Primary Focus <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {PRIMARY_FOCUS_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => toggleFocus(option.value)}
                    className={`
                      border-2 rounded-lg p-3 cursor-pointer transition-all
                      ${selectedFocus.includes(option.value)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedFocus.includes(option.value)}
                        onCheckedChange={() => toggleFocus(option.value)}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Miami"
                  {...register('city', { required: 'City is required' })}
                  className="mt-1"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="FL"
                  {...register('state', { required: 'State is required' })}
                  className="mt-1"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">
                Full Market Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                placeholder="Miami, FL"
                {...register('location', { required: 'Location is required' })}
                className="mt-1"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="yearsExperience">
                Years of Experience <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: any) => setValue('yearsExperience', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1">Less than 1 year</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="followerCount">
                Current Follower Count <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: any) => setValue('followerCount', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select follower range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<500">Less than 500</SelectItem>
                  <SelectItem value="500-2K">500 - 2,000</SelectItem>
                  <SelectItem value="2K-5K">2,000 - 5,000</SelectItem>
                  <SelectItem value="5K-10K">5,000 - 10,000</SelectItem>
                  <SelectItem value="10K+">10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monthlyLeads">
                Monthly Leads from Instagram <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: any) => setValue('monthlyLeads', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Average monthly leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 leads/month</SelectItem>
                  <SelectItem value="1-3">1-3 leads/month</SelectItem>
                  <SelectItem value="4-10">4-10 leads/month</SelectItem>
                  <SelectItem value="10+">10+ leads/month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Goals */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Primary Goal</h2>
              <p className="text-gray-600">What's your #1 objective on Instagram?</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { value: 'seller-leads', label: 'Generate Seller Leads', desc: 'Get more home valuations and listing opportunities' },
              { value: 'buyer-leads', label: 'Get Buyer Leads', desc: 'Connect with people ready to purchase' },
              { value: 'brand', label: 'Build Brand Authority', desc: 'Establish yourself as the local expert' },
              { value: 'following', label: 'Grow Following', desc: 'Increase reach and visibility' },
              { value: 'referrals', label: 'Get Referrals', desc: 'Generate word-of-mouth business' },
            ].map((goal) => (
              <div
                key={goal.value}
                onClick={() => setValue('primaryGoal', goal.value as any)}
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${watch('primaryGoal') === goal.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="primaryGoal"
                    value={goal.value}
                    {...register('primaryGoal', { required: true })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold">{goal.label}</div>
                    <div className="text-sm text-gray-600">{goal.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {step < totalSteps ? (
          <Button
            type="button"
            onClick={nextStep}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Analyze My Bio
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
