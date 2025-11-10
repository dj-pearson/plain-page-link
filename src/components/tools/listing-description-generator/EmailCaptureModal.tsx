/**
 * Email Capture Modal for Listing Description Generator
 * Unlocks all 3 description styles + bonus resources
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailCaptureData } from '@/lib/listing-description-generator/types';
import {
  Gift,
  FileText,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Star,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmailCaptureData) => Promise<void>;
  listingId: string;
}

interface FormData {
  email: string;
  firstName: string;
  brokerageName?: string;
  phoneNumber?: string;
}

export function EmailCaptureModal({ isOpen, onClose, onSubmit, listingId }: EmailCaptureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const captureData: EmailCaptureData = {
        ...data,
        listingId,
        capturedAt: new Date().toISOString(),
      };

      await onSubmit(captureData);
      toast.success('Success! All descriptions are now unlocked 🎉');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 -mx-6 -mt-6 p-8 text-white mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Unlock All 3 Styles + Bonuses
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Get complete access to all description formats and bonus resources
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-600" />
            Here's What You'll Get Instantly:
          </h3>

          <div className="grid gap-3">
            {[
              {
                icon: FileText,
                title: 'All 3 Writing Styles',
                desc: 'Luxury, Family-Friendly, and Investment-Focused descriptions',
              },
              {
                icon: Sparkles,
                title: '5 Formats Per Style (15 total)',
                desc: 'MLS, Instagram, Facebook, Email, and SMS versions',
              },
              {
                icon: Lightbulb,
                title: '50 Power Words for Real Estate',
                desc: 'PDF guide with proven words that sell properties faster',
              },
              {
                icon: TrendingUp,
                title: 'Listing Photography Checklist',
                desc: '25-point checklist for photos that get more showings',
              },
              {
                icon: CheckCircle,
                title: 'Pricing Strategy Guide',
                desc: 'Data-driven strategies to price listings competitively',
              },
              {
                icon: Star,
                title: 'Weekly Marketing Tips',
                desc: 'Email newsletter with proven listing marketing strategies',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <div>
              <p className="text-sm italic text-gray-700 mb-1">
                "This AI tool writes better descriptions than I ever could. Saved me hours and my listings are getting way more interest!"
              </p>
              <p className="text-xs font-semibold text-gray-600">
                - Sarah M., Top Producer in Austin, TX
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register('firstName', { required: 'First name is required' })}
              className="mt-1"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brokerageName">
              Brokerage <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="brokerageName"
              placeholder="Keller Williams, Coldwell Banker, etc."
              {...register('brokerageName')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('phoneNumber')}
              className="mt-1"
            />
          </div>

          {/* Trust Signals */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Join 4,200+ agents using AI for listing descriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No spam. Unsubscribe anytime.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Your data is secure and never shared</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg py-6"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Unlocking...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                Unlock All Descriptions + Bonuses
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By submitting, you agree to receive helpful listing marketing tips and information
            about AgentBio. You can unsubscribe at any time.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Unlock CTA Component
 * Shows when content is locked
 */
export function UnlockCTA({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-8 text-center text-white">
      <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-90" />
      <h3 className="text-2xl font-bold mb-2">Want All 3 Styles?</h3>
      <p className="text-blue-100 mb-6 max-w-md mx-auto">
        Unlock all description variations (Luxury, Family-Friendly, Investment-Focused) plus bonus resources.
        100% free, no credit card required.
      </p>

      <Button
        onClick={onUnlock}
        size="lg"
        className="bg-white text-blue-600 hover:bg-gray-100 gap-2 text-lg px-8"
      >
        <Unlock className="w-5 h-5" />
        Unlock Now - It's Free
      </Button>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          <span>4,200+ agents unlocked</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" />
          <span>4.9/5 rating</span>
        </div>
      </div>
    </div>
  );
}
