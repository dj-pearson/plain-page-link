/**
 * Social Sharing Component
 * Enables viral sharing of bio scores and results
 */

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Share2,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { getScoreGrade } from '@/lib/instagram-bio-analyzer/scoring';

interface SocialShareProps {
  score: number;
  toolUrl: string;
  onShare?: (platform: string) => void;
}

export function SocialShare({ score, toolUrl, onShare }: SocialShareProps) {
  const [copied, setCopied] = React.useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { grade, color, label } = getScoreGrade(score);

  // Pre-populated social posts
  const socialPosts = {
    instagram: `My Instagram bio scored ${score}/100 😱 What's yours? ${toolUrl}`,
    facebook: `Just optimized my real estate Instagram bio with this free tool. Every agent needs this: ${toolUrl}`,
    linkedin: `Analyzed my Instagram strategy with this tool - game-changer for agent lead generation. ${toolUrl}`,
    twitter: `My real estate Instagram bio scored ${score}/100 on this analyzer. Real estate agents, check yours: ${toolUrl}`,
  };

  const handleShare = async (platform: keyof typeof socialPosts) => {
    const text = socialPosts[platform];
    onShare?.(platform);

    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(toolUrl)}&quote=${encodeURIComponent(text)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(toolUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'instagram':
        // Copy to clipboard for Instagram story
        try {
          await navigator.clipboard.writeText(text);
          toast.success('Copied! Paste into your Instagram story');
        } catch (error) {
          toast.error('Failed to copy text');
        }
        break;
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(toolUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const downloadScoreCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for Instagram story (1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#9333ea'); // purple-600
    gradient.addColorStop(1, '#ec4899'); // pink-500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Score circle
    const centerX = canvas.width / 2;
    const centerY = 700;
    const radius = 300;

    // Circle background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Score text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toString(), centerX, centerY - 40);

    // "out of 100" text
    ctx.font = '40px Arial';
    ctx.fillText('out of 100', centerX, centerY + 80);

    // Grade badge
    ctx.fillStyle = color;
    ctx.fillRect(centerX - 150, centerY + 180, 300, 100);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(`Grade: ${grade}`, centerX, centerY + 230);

    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 70px Arial';
    ctx.fillText('My Instagram Bio Score', centerX, 300);

    // Subtitle
    ctx.font = '40px Arial';
    ctx.fillText('Instagram Bio Analyzer', centerX, 400);

    // Call to action
    ctx.font = 'bold 50px Arial';
    ctx.fillText('What\'s yours?', centerX, 1400);

    // URL
    ctx.font = '35px Arial';
    ctx.fillText('agentbio.net/tools/instagram-bio-analyzer', centerX, 1500);

    // Download
    const link = document.createElement('a');
    link.download = `instagram-bio-score-${score}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast.success('Score card downloaded! Share it on Instagram');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Share Your Results</h3>
        <p className="text-gray-600">
          Challenge other agents to beat your score!
        </p>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => handleShare('instagram')}
          className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Instagram className="w-4 h-4" />
          Instagram
        </Button>
        <Button
          onClick={() => handleShare('facebook')}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </Button>
        <Button
          onClick={() => handleShare('linkedin')}
          className="gap-2 bg-blue-700 hover:bg-blue-800"
        >
          <Linkedin className="w-4 h-4" />
          LinkedIn
        </Button>
        <Button
          onClick={() => handleShare('twitter')}
          className="gap-2 bg-sky-500 hover:bg-sky-600"
        >
          <Twitter className="w-4 h-4" />
          Twitter
        </Button>
      </div>

      {/* Copy Link */}
      <div className="flex gap-2">
        <input
          type="text"
          value={toolUrl}
          readOnly
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
        />
        <Button onClick={copyLink} variant="outline" className="gap-2">
          {copied ? (
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

      {/* Download Score Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-1">Download Score Card</h4>
            <p className="text-sm text-gray-600">
              Perfect for Instagram stories! Pre-designed and ready to share.
            </p>
          </div>
          <Button
            onClick={downloadScoreCard}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Hidden canvas for generating share image */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Referral Incentive */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Earn Rewards
        </h4>
        <p className="text-sm text-amber-800 mb-3">
          Share this tool with 3 agents and get our "Real Estate Instagram Mastery" video course
          (worth $97) absolutely free!
        </p>
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: '0%' }} />
          </div>
          <span className="font-semibold">0/3 referrals</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Leaderboard Component
 * Shows anonymized scores to create competition
 */
export function ScoreLeaderboard({ userScore, market }: { userScore: number; market?: string }) {
  // Mock data - would be populated from Supabase in production
  const leaderboard = [
    { rank: 1, score: 94, market: 'Miami, FL' },
    { rank: 2, score: 91, market: 'Austin, TX' },
    { rank: 3, score: 88, market: 'San Diego, CA' },
    { rank: 4, score: 86, market: 'Denver, CO' },
    { rank: 5, score: 84, market: 'Seattle, WA' },
  ];

  const userRank = leaderboard.findIndex(item => item.score <= userScore) + 1 || leaderboard.length + 1;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        🏆 Top Scores {market && `in ${market}`}
      </h3>

      <div className="space-y-2">
        {leaderboard.map((item) => (
          <div
            key={item.rank}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm">
                {item.rank}
              </div>
              <span className="text-sm text-gray-600">{item.market}</span>
            </div>
            <div className="font-bold text-lg">{item.score}</div>
          </div>
        ))}

        {userRank > 5 && (
          <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg border-2 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                {userRank}
              </div>
              <span className="text-sm font-semibold text-purple-900">You</span>
            </div>
            <div className="font-bold text-lg text-purple-900">{userScore}</div>
          </div>
        )}
      </div>

      {userRank > 1 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 You're {leaderboard[0].score - userScore} points away from #1!
            Implement our recommendations to climb the leaderboard.
          </p>
        </div>
      )}
    </div>
  );
}
