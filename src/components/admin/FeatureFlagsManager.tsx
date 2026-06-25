/**
 * Feature Flags Manager (admin-only)
 *
 * Lists feature flags and lets admins toggle them on/off and adjust the
 * rollout percentage. Writes are gated by the feature_flags admin RLS policy.
 * Rendered inside the admin dashboard (already admin-gated).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface FeatureFlagRow {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
}

// feature_flags isn't in the generated Supabase types yet — isolated casts.
const flagsClient = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => {
      order: (c: string) => Promise<{ data: FeatureFlagRow[] | null; error: unknown }>;
    };
    update: (v: Partial<FeatureFlagRow>) => {
      eq: (c: string, v: string) => Promise<{ error: unknown }>;
    };
  };
};

export function FeatureFlagsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingPct, setPendingPct] = useState<Record<string, number>>({});

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async (): Promise<FeatureFlagRow[]> => {
      const { data, error } = await flagsClient
        .from('feature_flags')
        .select('id, name, description, enabled, rollout_percentage')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<FeatureFlagRow> }) => {
      const { error } = await flagsClient.from('feature_flags').update(changes).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({ title: 'Flag updated' });
    },
    onError: (e) =>
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update flag',
        variant: 'destructive',
      }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading flags…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Feature Flags</h2>
        <p className="text-muted-foreground">
          Toggle features and control gradual rollouts. Changes apply within ~5 minutes (client
          cache).
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {(flags ?? []).map((flag) => (
          <div key={flag.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-[200px]">
              <div className="font-medium text-foreground">{flag.name}</div>
              {flag.description && (
                <div className="text-sm text-muted-foreground">{flag.description}</div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Rollout %</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-20"
                  value={pendingPct[flag.id] ?? flag.rollout_percentage}
                  onChange={(e) =>
                    setPendingPct((p) => ({
                      ...p,
                      [flag.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    }))
                  }
                  onBlur={() => {
                    const next = pendingPct[flag.id];
                    if (next !== undefined && next !== flag.rollout_percentage) {
                      update.mutate({ id: flag.id, changes: { rollout_percentage: next } });
                    }
                  }}
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{flag.enabled ? 'On' : 'Off'}</span>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(checked) =>
                    update.mutate({ id: flag.id, changes: { enabled: checked } })
                  }
                  disabled={update.isPending}
                />
              </label>
            </div>
          </div>
        ))}
        {(flags ?? []).length === 0 && (
          <div className="p-6 text-center text-muted-foreground">No feature flags defined.</div>
        )}
      </div>
    </div>
  );
}
