// ============================================
// Usage Tracking Service
// ============================================
// Tracks feature usage and manages billing/metering

import { supabase } from '@/integrations/supabase/client';
import type {
  FeatureUsage,
  FeatureLimitCheck,
  MonthlyUsageSummary,
} from '@/types/features';

export class UsageTrackingService {
  /**
   * Check if user can use a feature
   */
  static async checkFeatureLimit(
    userId: string,
    featureKey: string
  ): Promise<FeatureLimitCheck> {
    try {
      const { data, error } = await supabase.rpc('check_feature_limit', {
        p_user_id: userId,
        p_feature_key: featureKey,
      });

      if (error) throw error;

      return data[0] as FeatureLimitCheck;
    } catch (error) {
      console.error('Error checking feature limit:', error);
      return {
        allowed: false,
        remaining: 0,
        limit_reached: true,
        overage_allowed: false,
      };
    }
  }

  /**
   * Record feature usage
   */
  static async recordUsage(
    userId: string,
    featureKey: string,
    usageCount: number = 1,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('record_feature_usage', {
        p_user_id: userId,
        p_feature_key: featureKey,
        p_usage_count: usageCount,
        p_metadata: metadata || null,
      });

      if (error) throw error;

      // Sync to Stripe if overage
      const usage = await this.getUsage(data);
      if (usage && !usage.included_in_plan && usage.charged_amount > 0) {
        await this.syncToStripe(usage);
      }

      return data;
    } catch (error) {
      console.error('Error recording usage:', error);
      return null;
    }
  }

  /**
   * Get usage record by ID
   */
  static async getUsage(usageId: string): Promise<FeatureUsage | null> {
    try {
      const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('id', usageId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting usage:', error);
      return null;
    }
  }

  /**
   * Get current month usage for a feature
   */
  static async getCurrentMonthUsage(
    userId: string,
    featureKey: string
  ): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('feature_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature_key', featureKey)
        .gte('used_at', startOfMonth.toISOString());

      if (error) throw error;

      return data.reduce((sum, record) => sum + record.usage_count, 0);
    } catch (error) {
      console.error('Error getting current month usage:', error);
      return 0;
    }
  }

  /**
   * Get usage stats for all features
   */
  static async getAllUsageStats(userId: string): Promise<{
    [featureKey: string]: {
      currentMonth: number;
      limit: number;
      remaining: number;
      overageCount: number;
      overageCharges: number;
    };
  }> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const { data, error } = await supabase
        .from('monthly_usage_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;

      const stats: any = {};

      for (const summary of data || []) {
        const limitCheck = await this.checkFeatureLimit(userId, summary.feature_key);

        stats[summary.feature_key] = {
          currentMonth: summary.total_usage,
          limit: limitCheck.remaining + summary.total_usage,
          remaining: limitCheck.remaining,
          overageCount: summary.overage_usage,
          overageCharges: summary.total_charged,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {};
    }
  }

  /**
   * Sync usage to Stripe for billing
   */
  static async syncToStripe(usage: FeatureUsage): Promise<boolean> {
    try {
      // Get or create Stripe customer
      const stripeCustomer = await this.getOrCreateStripeCustomer(usage.user_id);
      if (!stripeCustomer) {
        console.error('No Stripe customer found');
        return false;
      }

      // Get active subscription
      const subscription = await this.getActiveSubscription(usage.user_id);
      if (!subscription) {
        console.error('No active subscription found');
        return false;
      }

      // Find the subscription item for usage-based billing
      const subscriptionItemId = await this.getUsageSubscriptionItem(
        subscription.id,
        usage.feature_key
      );

      if (!subscriptionItemId) {
        console.error('No subscription item for usage billing');
        return false;
      }

      // Report usage to Stripe
      const { data, error } = await supabase.functions.invoke('report-stripe-usage', {
        body: {
          subscription_item_id: subscriptionItemId,
          quantity: usage.usage_count,
          timestamp: Math.floor(new Date(usage.used_at).getTime() / 1000),
          action: 'increment',
        },
      });

      if (error) throw error;

      // Update usage record with Stripe info
      await supabase
        .from('feature_usage')
        .update({
          billing_status: 'billed',
          billed_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      // Record in stripe_usage_records
      await supabase.from('stripe_usage_records').insert({
        user_id: usage.user_id,
        stripe_subscription_item_id: subscriptionItemId,
        feature_key: usage.feature_key,
        quantity: usage.usage_count,
        timestamp: new Date(usage.used_at).toISOString(),
        synced_to_stripe: true,
        synced_at: new Date().toISOString(),
        stripe_usage_record_id: data?.id,
      });

      return true;
    } catch (error) {
      console.error('Error syncing to Stripe:', error);

      // Mark as failed
      await supabase
        .from('feature_usage')
        .update({
          billing_status: 'failed',
        })
        .eq('id', usage.id);

      return false;
    }
  }

  /**
   * Get or create Stripe customer
   */
  private static async getOrCreateStripeCustomer(userId: string): Promise<any> {
    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingCustomer) {
        return existingCustomer;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      // Create Stripe customer via Edge Function
      const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
        body: {
          email: profile.email,
          name: profile.full_name || profile.username,
          metadata: {
            user_id: userId,
          },
        },
      });

      if (error) throw error;

      // Save to database
      const { data: newCustomer } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: data.id,
          email: profile.email,
          name: profile.full_name || profile.username,
        })
        .select()
        .single();

      return newCustomer;
    } catch (error) {
      console.error('Error getting/creating Stripe customer:', error);
      return null;
    }
  }

  /**
   * Get active subscription for user
   */
  private static async getActiveSubscription(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription item for usage billing
   */
  private static async getUsageSubscriptionItem(
    subscriptionId: string,
    featureKey: string
  ): Promise<string | null> {
    // This would need to be stored when subscription is created
    // For now, return a placeholder
    // In production, you'd query Stripe API or local database
    return null;
  }

  /**
   * Get monthly summary for billing period
   */
  static async getMonthlyUsageSummary(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyUsageSummary[]> {
    try {
      const { data, error } = await supabase
        .from('monthly_usage_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return [];
    }
  }

  /**
   * Calculate projected monthly bill
   */
  static async calculateProjectedBill(userId: string): Promise<{
    basePlan: number;
    overageCharges: number;
    total: number;
    breakdown: Array<{
      featureKey: string;
      featureName: string;
      usage: number;
      limit: number;
      overage: number;
      charge: number;
    }>;
  }> {
    try {
      // Get user's plan
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subscription) {
        return {
          basePlan: 0,
          overageCharges: 0,
          total: 0,
          breakdown: [],
        };
      }

      const plan = subscription.subscription_plans;
      const basePlanPrice = plan.price_monthly;

      // Get current month usage
      const stats = await this.getAllUsageStats(userId);

      const breakdown: any[] = [];
      let totalOverageCharges = 0;

      for (const [featureKey, usage] of Object.entries(stats)) {
        if (usage.overageCharges > 0) {
          const { data: featureCatalog } = await supabase
            .from('feature_catalog')
            .select('feature_name, price_per_use')
            .eq('feature_key', featureKey)
            .single();

          breakdown.push({
            featureKey,
            featureName: featureCatalog?.feature_name || featureKey,
            usage: usage.currentMonth,
            limit: usage.limit,
            overage: usage.overageCount,
            charge: usage.overageCharges,
          });

          totalOverageCharges += usage.overageCharges;
        }
      }

      return {
        basePlan: basePlanPrice,
        overageCharges: totalOverageCharges,
        total: basePlanPrice + totalOverageCharges,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating projected bill:', error);
      return {
        basePlan: 0,
        overageCharges: 0,
        total: 0,
        breakdown: [],
      };
    }
  }

  /**
   * Generate usage report for user
   */
  static async generateUsageReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalUsage: number;
    totalCost: number;
    byFeature: Array<{
      featureKey: string;
      featureName: string;
      usageCount: number;
      cost: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('feature_usage')
        .select('*, feature_catalog(feature_name)')
        .eq('user_id', userId)
        .gte('used_at', startDate.toISOString())
        .lte('used_at', endDate.toISOString());

      if (error) throw error;

      const byFeature: Record<string, any> = {};

      for (const usage of data || []) {
        if (!byFeature[usage.feature_key]) {
          byFeature[usage.feature_key] = {
            featureKey: usage.feature_key,
            featureName: usage.feature_catalog?.feature_name || usage.feature_key,
            usageCount: 0,
            cost: 0,
          };
        }

        byFeature[usage.feature_key].usageCount += usage.usage_count;
        byFeature[usage.feature_key].cost += usage.charged_amount;
      }

      const totalUsage = data.reduce((sum, u) => sum + u.usage_count, 0);
      const totalCost = data.reduce((sum, u) => sum + u.charged_amount, 0);

      return {
        totalUsage,
        totalCost,
        byFeature: Object.values(byFeature),
      };
    } catch (error) {
      console.error('Error generating usage report:', error);
      return {
        totalUsage: 0,
        totalCost: 0,
        byFeature: [],
      };
    }
  }
}

// ============================================
// CONVENIENCE HOOKS FOR REACT COMPONENTS
// ============================================

/**
 * Check if feature can be used before triggering action
 */
export async function canUseFeature(
  userId: string,
  featureKey: string
): Promise<{ allowed: boolean; message?: string }> {
  const check = await UsageTrackingService.checkFeatureLimit(userId, featureKey);

  if (!check.allowed && !check.overage_allowed) {
    return {
      allowed: false,
      message: 'You have reached your monthly limit for this feature. Please upgrade your plan.',
    };
  }

  if (check.limit_reached && check.overage_allowed) {
    // Get overage price
    const { data: feature } = await supabase
      .from('feature_catalog')
      .select('price_per_use')
      .eq('feature_key', featureKey)
      .single();

    return {
      allowed: true,
      message: `You have exceeded your monthly limit. Each additional use will be charged $${feature?.price_per_use || 0}.`,
    };
  }

  return {
    allowed: true,
    message: check.remaining > 0 ? `${check.remaining} remaining this month` : undefined,
  };
}

/**
 * Track usage with automatic error handling
 */
export async function trackUsage(
  userId: string,
  featureKey: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const usageId = await UsageTrackingService.recordUsage(
    userId,
    featureKey,
    1,
    metadata
  );

  return usageId !== null;
}

export default UsageTrackingService;
