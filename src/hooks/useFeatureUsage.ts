// ============================================
// React Hooks for Feature Usage Tracking
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UsageTrackingService, canUseFeature, trackUsage } from '@/lib/usageTracking';
import type { FeatureLimitCheck } from '@/types/features';
import { toast } from 'sonner';

/**
 * Hook to check if a feature can be used
 */
export function useFeatureAccess(featureKey: string) {
  const { user } = useAuthStore();
  const [check, setCheck] = useState<FeatureLimitCheck>({
    allowed: false,
    remaining: 0,
    limit_reached: false,
    overage_allowed: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const result = await UsageTrackingService.checkFeatureLimit(user.id, featureKey);
        setCheck(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check feature access');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [user?.id, featureKey]);

  return { ...check, loading, error };
}

/**
 * Hook to track feature usage
 */
export function useTrackFeature(featureKey: string) {
  const { user } = useAuthStore();
  const [isTracking, setIsTracking] = useState(false);

  const track = useCallback(
    async (metadata?: Record<string, any>) => {
      if (!user?.id) {
        toast.error('You must be logged in to use this feature');
        return false;
      }

      setIsTracking(true);

      try {
        // Check if allowed first
        const accessCheck = await canUseFeature(user.id, featureKey);

        if (!accessCheck.allowed) {
          toast.error(accessCheck.message || 'Feature limit reached');
          return false;
        }

        // Show warning if overage
        if (accessCheck.message) {
          toast.warning(accessCheck.message);
        }

        // Track usage
        const success = await trackUsage(user.id, featureKey, metadata);

        if (!success) {
          toast.error('Failed to track usage');
          return false;
        }

        return true;
      } catch (err) {
        toast.error('An error occurred');
        return false;
      } finally {
        setIsTracking(false);
      }
    },
    [user?.id, featureKey]
  );

  return { track, isTracking };
}

/**
 * Hook to get current usage stats
 */
export function useUsageStats() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await UsageTrackingService.getAllUsageStats(user.id);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

/**
 * Hook to get projected monthly bill
 */
export function useProjectedBill() {
  const { user } = useAuthStore();
  const [bill, setBill] = useState<{
    basePlan: number;
    overageCharges: number;
    total: number;
    breakdown: any[];
  }>({
    basePlan: 0,
    overageCharges: 0,
    total: 0,
    breakdown: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await UsageTrackingService.calculateProjectedBill(user.id);
      setBill(data);
    } catch (err) {
      console.error('Failed to calculate bill:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bill, loading, refresh };
}

/**
 * Hook for feature with usage tracking built-in
 */
export function useFeatureWithTracking<T>(
  featureKey: string,
  action: (params: T) => Promise<any>
) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (params: T, metadata?: Record<string, any>) => {
      if (!user?.id) {
        toast.error('You must be logged in to use this feature');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check access
        const accessCheck = await canUseFeature(user.id, featureKey);

        if (!accessCheck.allowed) {
          toast.error(accessCheck.message || 'Feature limit reached');
          setError(accessCheck.message || 'Feature limit reached');
          return null;
        }

        // Show overage warning
        if (accessCheck.message) {
          toast.warning(accessCheck.message);
        }

        // Execute the action
        const result = await action(params);

        // Track usage on success
        await trackUsage(user.id, featureKey, {
          ...metadata,
          timestamp: new Date().toISOString(),
        });

        toast.success('Action completed successfully');
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, featureKey, action]
  );

  return { execute, isLoading, error };
}

/**
 * Hook to get usage history
 */
export function useUsageHistory(featureKey?: string, limit: number = 50) {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');

        let query = supabase
          .from('feature_usage')
          .select('*, feature_catalog(feature_name)')
          .eq('user_id', user.id)
          .order('used_at', { ascending: false })
          .limit(limit);

        if (featureKey) {
          query = query.eq('feature_key', featureKey);
        }

        const { data, error } = await query;

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Failed to load usage history:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user?.id, featureKey, limit]);

  return { history, loading };
}

export default useFeatureAccess;
