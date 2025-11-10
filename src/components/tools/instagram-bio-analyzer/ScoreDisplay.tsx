/**
 * Score Display Component
 * Shows overall effectiveness score with visual gauge
 */

import React from 'react';
import { getScoreGrade } from '@/lib/instagram-bio-analyzer/scoring';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  showGrade?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ScoreDisplay({ score, maxScore = 100, showGrade = true, size = 'large' }: ScoreDisplayProps) {
  const percentage = (score / maxScore) * 100;
  const { grade, color, label } = getScoreGrade(score);

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const textSizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl',
  };

  // Calculate circle properties
  const radius = size === 'small' ? 50 : size === 'medium' ? 80 : 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular Progress */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ strokeDashoffset }}
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${textSizes[size]}`} style={{ color }}>
            {score}
          </div>
          <div className="text-gray-500 text-sm">out of {maxScore}</div>
        </div>
      </div>

      {/* Grade and Label */}
      {showGrade && (
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-xl mb-2"
            style={{ backgroundColor: color }}
          >
            {score >= 70 ? (
              <TrendingUp className="w-5 h-5" />
            ) : score >= 50 ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            Grade: {grade}
          </div>
          <div className="text-lg text-gray-600">{label}</div>
        </div>
      )}

      {/* Interpretation */}
      <div className="max-w-md text-center">
        {score >= 85 && (
          <p className="text-gray-700">
            🎉 Excellent! Your bio is highly optimized and likely converting well.
          </p>
        )}
        {score >= 70 && score < 85 && (
          <p className="text-gray-700">
            👍 Good work! A few tweaks could push you into the top 5%.
          </p>
        )}
        {score >= 50 && score < 70 && (
          <p className="text-gray-700">
            ⚠️ Room for improvement. Implementing our recommendations could 2-3X your leads.
          </p>
        )}
        {score < 50 && (
          <p className="text-gray-700">
            🚨 Critical issues detected. Your bio is likely costing you 60-80% of potential leads.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Mini Score Badge for category scores
 */
export function ScoreBadge({ score, maxScore, label }: { score: number; maxScore: number; label: string }) {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="font-bold min-w-[60px] text-right" style={{ color }}>
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}
