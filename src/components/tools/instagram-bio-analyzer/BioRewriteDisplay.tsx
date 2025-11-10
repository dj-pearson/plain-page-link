/**
 * Bio Rewrite Display Component
 * Shows the 3 optimized bio versions with copy functionality
 */

import React, { useState } from 'react';
import { BioRewrite } from '@/lib/instagram-bio-analyzer/types';
import { Button } from '@/components/ui/button';
import { Copy, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface BioRewriteDisplayProps {
  rewrites: BioRewrite[];
  isLocked?: boolean;
  onUnlock?: () => void;
}

const STYLE_COLORS = {
  professional: 'from-blue-500 to-blue-600',
  friendly: 'from-green-500 to-green-600',
  'problem-solver': 'from-purple-500 to-purple-600',
};

const STYLE_DESCRIPTIONS = {
  professional: 'Best for established agents who want to emphasize credentials and expertise',
  friendly: 'Perfect for agents who want an approachable, community-focused presence',
  'problem-solver': 'Ideal for agents who want to focus on solutions and results',
};

export function BioRewriteDisplay({ rewrites, isLocked = false, onUnlock }: BioRewriteDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (bio: string, index: number) => {
    try {
      await navigator.clipboard.writeText(bio);
      setCopiedIndex(index);
      toast.success('Bio copied to clipboard!');

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy bio');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Your Optimized Bios</h2>
        <p className="text-gray-600">
          {isLocked
            ? 'Preview one optimized bio - unlock all 3 versions + full report'
            : 'Choose your favorite or mix and match elements from each'}
        </p>
      </div>

      <div className="grid gap-6">
        {rewrites.map((rewrite, index) => {
          const isPreview = isLocked && index > 0;
          const gradientColor = STYLE_COLORS[rewrite.style];

          return (
            <div
              key={index}
              className={`
                relative rounded-lg border-2 overflow-hidden
                ${isPreview ? 'border-gray-300' : 'border-gray-200'}
              `}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{rewrite.title}</h3>
                    <p className="text-sm opacity-90">
                      {STYLE_DESCRIPTIONS[rewrite.style]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Style</div>
                    <div className="font-semibold capitalize">{rewrite.style}</div>
                  </div>
                </div>
              </div>

              {/* Bio Content */}
              <div className="p-6 bg-white">
                {isPreview ? (
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      <div className="font-mono text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {rewrite.bio.substring(0, 50)}...
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={onUnlock}
                        className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Lock className="w-4 h-4" />
                        Unlock All 3 Bios
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                      <div className="font-mono text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {rewrite.bio}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-4">
                        <span>
                          Character count:{' '}
                          <span className={rewrite.characterCount > 150 ? 'text-red-500 font-semibold' : 'font-semibold'}>
                            {rewrite.characterCount}/150
                          </span>
                        </span>
                        {rewrite.emojis.length > 0 && (
                          <span>
                            Emojis: {rewrite.emojis.join(' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <Button
                      onClick={() => handleCopy(rewrite.bio, index)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Bio
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Reasoning */}
              {!isPreview && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Why this works: </span>
                    <span className="text-gray-600">{rewrite.reasoning}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Implementation Tips */}
      {!isLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">Implementation Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Test each bio for 1-2 weeks and track your analytics</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Feel free to mix elements from different versions</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Update your bio to match seasonal changes or new specialties</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Make sure your link-in-bio matches the promise in your bio</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Bio Comparison Component
 * Shows before/after comparison
 */
export function BioComparison({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Before */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <h3 className="font-bold text-gray-900">Before</h3>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="font-mono text-sm text-gray-900 whitespace-pre-wrap">
            {before}
          </div>
        </div>
      </div>

      {/* After */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <h3 className="font-bold text-gray-900">After</h3>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="font-mono text-sm text-gray-900 whitespace-pre-wrap">
            {after}
          </div>
        </div>
      </div>
    </div>
  );
}
