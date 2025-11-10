/**
 * Description Display Component
 * Shows generated descriptions in multiple formats with copy functionality
 */

import React, { useState } from 'react';
import { GeneratedDescription } from '@/lib/listing-description-generator/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Lock, FileText, Instagram, Facebook, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface DescriptionDisplayProps {
  descriptions: GeneratedDescription[];
  isLocked?: boolean;
  onUnlock?: () => void;
}

const STYLE_INFO = {
  luxury: {
    title: 'Luxury / Upscale',
    color: 'from-amber-500 to-amber-600',
    description: 'Sophisticated language for high-end buyers',
    icon: '👑'
  },
  'family-friendly': {
    title: 'Family-Friendly',
    color: 'from-green-500 to-green-600',
    description: 'Warm, emotional appeal for families',
    icon: '🏡'
  },
  investment: {
    title: 'Investment-Focused',
    color: 'from-blue-500 to-blue-600',
    description: 'ROI and numbers for investors',
    icon: '📈'
  }
};

export function DescriptionDisplay({ descriptions, isLocked = false, onUnlock }: DescriptionDisplayProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState(0);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);

      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy text');
    }
  };

  if (descriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Your AI-Generated Descriptions</h2>
        <p className="text-gray-600">
          {isLocked
            ? 'Preview one description - unlock all 3 styles + multiple formats'
            : 'Choose your favorite or customize to your needs'}
        </p>
      </div>

      {/* Style Selector */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {descriptions.map((desc, index) => {
          const styleInfo = STYLE_INFO[desc.style];
          const isActive = activeStyle === index;
          const isPreview = isLocked && index > 0;

          return (
            <button
              key={index}
              onClick={() => !isPreview && setActiveStyle(index)}
              disabled={isPreview}
              className={`
                relative p-6 rounded-lg border-2 transition-all text-left
                ${isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isPreview ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="text-3xl mb-2">{styleInfo.icon}</div>
              <h3 className="font-bold text-lg mb-1">{styleInfo.title}</h3>
              <p className="text-sm text-gray-600">{styleInfo.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active Description */}
      {descriptions[activeStyle] && (
        <Tabs defaultValue="mls" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="mls" className="gap-2">
              <FileText className="w-4 h-4" />
              MLS
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-2">
              <Facebook className="w-4 h-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* MLS Description */}
          <TabsContent value="mls" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Full MLS Description</h3>
                  <p className="text-sm text-gray-600">
                    {descriptions[activeStyle].wordCount} words • {descriptions[activeStyle].characterCount} characters
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(descriptions[activeStyle].mlsDescription, 'MLS Description')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedText === 'MLS Description' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap leading-relaxed">
                  {descriptions[activeStyle].mlsDescription}
                </div>
              </div>

              {/* Power Words */}
              {descriptions[activeStyle].powerWords && descriptions[activeStyle].powerWords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Power Words Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {descriptions[activeStyle].powerWords.map((word, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Instagram Caption */}
          <TabsContent value="instagram" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Instagram Caption</h3>
                  <p className="text-sm text-gray-600">
                    Perfect for posts and stories
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(descriptions[activeStyle].instagramCaption, 'Instagram Caption')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedText === 'Instagram Caption' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {descriptions[activeStyle].instagramCaption}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Facebook Post */}
          <TabsContent value="facebook" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Facebook Post</h3>
                  <p className="text-sm text-gray-600">
                    Optimized for Facebook reach
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(descriptions[activeStyle].facebookPost, 'Facebook Post')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedText === 'Facebook Post' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {descriptions[activeStyle].facebookPost}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Email Version */}
          <TabsContent value="email" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Email Version</h3>
                  <p className="text-sm text-gray-600">
                    For listing announcements and newsletters
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(descriptions[activeStyle].emailVersion, 'Email Version')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedText === 'Email Version' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {descriptions[activeStyle].emailVersion}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SMS Snippet */}
          <TabsContent value="sms" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">SMS Snippet</h3>
                  <p className="text-sm text-gray-600">
                    160 characters - perfect for text messages
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(descriptions[activeStyle].smsSnippet, 'SMS Snippet')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedText === 'SMS Snippet' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {descriptions[activeStyle].smsSnippet}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {descriptions[activeStyle].smsSnippet.length}/160 characters
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Implementation Tips */}
      {!isLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Pro Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Customize these descriptions to match your personal style</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Mix and match sections from different styles</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Add specific room dimensions for more detail</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Update seasonal details (fall colors, spring blooms, etc.)</span>
            </li>
          </ul>
        </div>
      )}

      {/* Unlock CTA */}
      {isLocked && onUnlock && (
        <div className="text-center mt-8">
          <Button
            onClick={onUnlock}
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Lock className="w-5 h-5" />
            Unlock All 3 Styles + Multiple Formats
          </Button>
        </div>
      )}
    </div>
  );
}
