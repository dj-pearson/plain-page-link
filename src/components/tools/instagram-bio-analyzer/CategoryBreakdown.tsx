/**
 * Category Breakdown Component
 * Displays detailed scores and recommendations for each category
 */

import React from 'react';
import { BioAnalysisResult } from '@/lib/instagram-bio-analyzer/types';
import { ScoreBadge } from './ScoreDisplay';
import {
  Eye,
  Sparkles,
  MessageSquare,
  MapPin,
  Award,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

interface CategoryBreakdownProps {
  analysis: BioAnalysisResult;
  showDetails?: boolean;
}

const CATEGORY_ICONS = {
  clarity: Eye,
  differentiation: Sparkles,
  callToAction: MessageSquare,
  localAuthority: MapPin,
  trustSignals: Award,
  linkStrategy: LinkIcon,
};

const CATEGORY_LABELS = {
  clarity: 'Clarity',
  differentiation: 'Differentiation',
  callToAction: 'Call-to-Action',
  localAuthority: 'Local Authority',
  trustSignals: 'Trust Signals',
  linkStrategy: 'Link Strategy',
};

export function CategoryBreakdown({ analysis, showDetails = false }: CategoryBreakdownProps) {
  const categories = Object.entries(analysis.categoryScores);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Category Breakdown</h2>
        <p className="text-gray-600">
          Here's how your bio performs across the 6 key conversion factors
        </p>
      </div>

      {/* Category Scores */}
      <div className="space-y-3">
        {categories.map(([key, category]) => {
          const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
          const label = CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS];

          return (
            <div key={key} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Score Header */}
              <div className="p-4 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{category.impact}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {category.score}/{category.maxScore}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((category.score / category.maxScore) * 100)}%
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              {showDetails && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  {/* Issues */}
                  {category.issues.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-red-700">Issues Found</span>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {category.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-gray-700 list-disc">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {category.recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-green-700">How to Fix</span>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {category.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-gray-700 list-disc">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {category.examples.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-amber-700">Examples</span>
                      </div>
                      <div className="space-y-2 ml-6">
                        {category.examples.map((example, i) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 rounded p-2">
                            <code className="text-sm text-gray-800">{example}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Competitive Analysis */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Competitive Analysis
        </h3>
        <p className="text-gray-700 mb-4">{analysis.competitiveAnalysis.vsTopPerformers}</p>

        {analysis.competitiveAnalysis.missingElements.length > 0 && (
          <div>
            <p className="font-semibold text-gray-900 mb-2">
              You're missing these elements that top performers have:
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.competitiveAnalysis.missingElements.map((element, i) => (
                <span
                  key={i}
                  className="bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-200"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Conversion Potential</span>
            <span className="text-2xl font-bold text-purple-600">
              {analysis.competitiveAnalysis.conversionPotential}%
            </span>
          </div>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${analysis.competitiveAnalysis.conversionPotential}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
