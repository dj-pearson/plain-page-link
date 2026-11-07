/**
 * Stats Block Component
 * Showcases the agent's figures.
 *
 * Live items (a `source`) read the agent's real counts; typed items are the
 * agent's own words. Figures a template invented are never shown (US-305) —
 * see src/lib/agentPageFacts.ts.
 */

import { StatsBlockConfig } from '@/types/pageBuilder';
import { TrendingUp, Award, Home, Users, DollarSign, Clock, Star, Target } from 'lucide-react';
import { useAgentPageFacts } from '@/hooks/useAgentPageFacts';
import {
  AGENT_STAT_SOURCES,
  isAgentStatSource,
  resolveAgentStat,
  shownStats,
} from '@/lib/agentPageFacts';

interface StatsBlockProps {
  config: StatsBlockConfig;
  isEditing?: boolean;
  /** The agent whose figures live items read. */
  userId?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  trending: <TrendingUp className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
  home: <Home className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  dollar: <DollarSign className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
};

function pluralFigures(n: number) {
  return n === 1 ? '1 example figure' : `${n} example figures`;
}

export function StatsBlock({ config, isEditing = false, userId }: StatsBlockProps) {
  const stats = Array.isArray(config.stats) ? config.stats : [];
  const hasLive = stats.some((s) => isAgentStatSource(s?.source));
  const factsQuery = useAgentPageFacts(userId, hasLive);
  const facts = factsQuery.data?.facts ?? null;
  const { shown, hiddenFabricated, pendingLive } = shownStats(stats, facts);

  const getLayoutClass = () => {
    switch (config.layout) {
      case 'grid':
        return 'grid grid-cols-2 gap-6';
      case 'cards':
        return 'grid grid-cols-2 md:grid-cols-4 gap-4';
      case 'row':
      default:
        return 'flex flex-wrap justify-center gap-8 md:gap-12';
    }
  };

  // Live figures still loading: show nothing rather than a half-filled row.
  if (hasLive && factsQuery.isLoading) return null;

  const editorNotes: string[] = [];
  if (isEditing && hiddenFabricated > 0) {
    const one = hiddenFabricated === 1;
    editorNotes.push(
      `${pluralFigures(hiddenFabricated)} from a template ${one ? 'is' : 'are'} hidden — ${one ? 'it was' : 'they were'} not yours. Remove ${one ? 'it' : 'them'} in the settings panel.`
    );
  }
  if (isEditing && pendingLive > 0) {
    const missing = new Set<string>();
    for (const s of stats) {
      if (!isAgentStatSource(s?.source)) continue;
      if (facts && resolveAgentStat(s.source, facts) !== null) continue;
      const meta = AGENT_STAT_SOURCES.find((m) => m.source === s.source);
      if (meta) missing.add(meta.from);
    }
    editorNotes.push(`Hidden until you have figures for it: ${[...missing].join(', ')}.`);
  }

  if (shown.length === 0) {
    if (!isEditing) return null;
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-gray-500 font-medium">Stats Block</p>
        <p className="text-sm text-gray-500">Add stats in the settings panel</p>
        {editorNotes.map((note) => (
          <p key={note} className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {note}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {config.title && (
        <h3
          className="text-2xl font-bold text-center"
          style={{ fontFamily: 'var(--theme-font-heading, inherit)' }}
        >
          {config.title}
        </h3>
      )}

      <div className={getLayoutClass()}>
        {shown.map((stat) => (
          <div
            key={stat.id}
            className={`text-center ${config.layout === 'cards' ? 'p-6 rounded-xl border bg-white/50 backdrop-blur-sm' : 'p-4'}`}
          >
            {stat.icon && iconMap[stat.icon] && (
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--theme-primary, #2563eb)',
                  color: 'white',
                  opacity: 0.9,
                }}
              >
                {iconMap[stat.icon]}
              </div>
            )}
            <div
              className="text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--theme-primary, #2563eb)' }}
            >
              {stat.prefix}
              {stat.value}
              {stat.suffix}
            </div>
            <div className="text-sm text-gray-600 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {editorNotes.map((note) => (
        <p key={note} className="text-sm text-gray-500 text-center">
          {note}
        </p>
      ))}
    </div>
  );
}
