/**
 * Email Capture Modal
 * Captures email to unlock full analysis and bio rewrites
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
import { EmailCaptureData } from '@/lib/instagram-bio-analyzer/types';
import {
  Gift,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Star,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmailCaptureData) => Promise<void>;
  analysisId: string;
}

interface FormData {
  email: string;
  firstName: string;
  market: string;
  brokerage?: string;
}

export function EmailCaptureModal({ isOpen, onClose, onSubmit, analysisId }: EmailCaptureModalProps) {
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
        analysisId,
        capturedAt: new Date().toISOString(),
      };

      await onSubmit(captureData);
      toast.success('Success! Your full analysis is now unlocked 🎉');
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
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 -mx-6 -mt-6 p-8 text-white mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Unlock Your Complete Analysis
              </DialogTitle>
              <DialogDescription className="text-purple-100">
                Get all 3 optimized bios + comprehensive strategy report
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Here's What You'll Get Instantly:
          </h3>

          <div className="grid gap-3">
            {[
              {
                icon: FileText,
                title: '3 Professionally Rewritten Bios',
                desc: 'Different styles optimized for your market and goals',
              },
              {
                icon: TrendingUp,
                title: 'Complete Analysis Report (PDF)',
                desc: 'Detailed breakdown with actionable recommendations',
              },
              {
                icon: CheckCircle,
                title: 'Instagram Profile Optimization Checklist',
                desc: 'Step-by-step guide to maximize your profile',
              },
              {
                icon: Calendar,
                title: '30-Day Content Calendar Template',
                desc: 'Proven post ideas that drive engagement',
              },
              {
                icon: Sparkles,
                title: '50 High-Performing Post Ideas',
                desc: 'Real estate content that converts followers to leads',
              },
              {
                icon: Star,
                title: 'Weekly Instagram Tips Newsletter',
                desc: 'Ongoing strategies from top-performing agents',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-purple-600" />
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
                "Changed my bio, got 3 leads in the first week! This tool is a game-changer."
              </p>
              <p className="text-xs font-semibold text-gray-600">
                - Jennifer K., Miami Real Estate Agent
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
            <Label htmlFor="market">
              Real Estate Market <span className="text-red-500">*</span>
            </Label>
            <Input
              id="market"
              placeholder="Miami, FL"
              {...register('market', { required: 'Market is required' })}
              className="mt-1"
            />
            {errors.market && (
              <p className="text-red-500 text-sm mt-1">{errors.market.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brokerage">
              Brokerage <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="brokerage"
              placeholder="Keller Williams, Coldwell Banker, etc."
              {...register('brokerage')}
              className="mt-1"
            />
          </div>

          {/* Trust Signals */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Join 2,847 agents getting more leads from Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No spam. Unsubscribe anytime.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Used by agents at Keller Williams, Coldwell Banker, RE/MAX</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Unlocking...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                Unlock My Complete Analysis
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By submitting, you agree to receive helpful Instagram marketing tips and information
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
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white">
      <Lock className="w-16 h-16 mx-auto mb-4 opacity-90" />
      <h3 className="text-2xl font-bold mb-2">Want the Full Analysis?</h3>
      <p className="text-purple-100 mb-6 max-w-md mx-auto">
        Unlock all 3 professionally rewritten bios, complete analysis report, and bonus resources.
        100% free, no credit card required.
      </p>

      <Button
        onClick={onUnlock}
        size="lg"
        className="bg-white text-purple-600 hover:bg-gray-100 gap-2 text-lg px-8"
      >
        <Unlock className="w-5 h-5" />
        Unlock Now - It's Free
      </Button>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          <span>2,847 agents unlocked</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" />
          <span>4.9/5 rating</span>
        </div>
      </div>
    </div>
  );
}
