/**
 * Account deletion and the subscription that pays for the account (US-250).
 *
 * Before this, gdpr-deletion scheduled an erasure without telling Stripe, and
 * the erasure deleted auth.users — cascading away user_subscriptions, the only
 * record of the Stripe subscription id. The card kept being charged for an
 * account that no longer existed, and nothing could find the subscription to
 * stop it. The erasure itself was also never run: scheduled-maintenance called
 * process-account-deletions through SUPABASE_URL (the Supabase edge runtime, via Kong), a runtime
 * that serves no functions.
 *
 * The lifecycle now:
 *   request  → the subscription is set to cancel at period end; the flag it
 *              had before is remembered on the schedule row.
 *   cancel   → that flag is put back, so a subscriber who had already chosen to
 *              cancel stays cancelling and everyone else keeps their plan.
 *   erasure  → a still-live subscription is cancelled immediately and its row
 *              marked canceled, then process_scheduled_account_deletions()
 *              runs. That function refuses to erase an account whose row still
 *              shows a live subscription, so a Stripe failure leaves the
 *              deletion for the next run rather than orphaning the charge.
 *
 * Free of Deno globals and esm.sh runtime imports so vitest can run it.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { ENDED_SUBSCRIPTION_STATUSES, type SubscriptionApi } from './stripe-subscriptions.ts';

export interface PendingDeletion {
  stripeSubscriptionId: string | null;
  priorCancelAtPeriodEnd: boolean | null;
}

export interface DueDeletion {
  userId: string;
  gdprRequestId: string | null;
  scheduledFor: string;
  requestedAt: string | null;
}

/** The reads and writes this module needs; supabaseDeletionStore() is the real one. */
export interface DeletionStore {
  /** Stripe subscription ids on the user's row that are not marked canceled. */
  liveSubscriptionIds(userId: string): Promise<string[]>;
  pendingDeletion(userId: string): Promise<PendingDeletion | null>;
  rememberSubscription(userId: string, subscriptionId: string, priorCancelAtPeriodEnd: boolean): Promise<void>;
  dueDeletions(): Promise<DueDeletion[]>;
  markSubscriptionCanceled(subscriptionId: string): Promise<void>;
  logFailure(deletion: DueDeletion, detail: string): Promise<void>;
  /** process_scheduled_account_deletions(); the number of accounts erased. */
  eraseDue(): Promise<number>;
}

export interface DeletionDeps {
  store: DeletionStore;
  /** Null when STRIPE_SECRET_KEY is not set. */
  stripe: SubscriptionApi | null;
  log?: (message: string) => void;
}

export type BillingOutcome =
  | { subscription: 'none' }
  | { subscription: 'ends_at_period_end'; periodEnd: string | null }
  | { subscription: 'restored' }
  | { subscription: 'unchanged'; error?: string };

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
const logOf = (deps: DeletionDeps) => deps.log ?? ((m: string) => console.error(m));

/**
 * After a deletion is requested: stop the subscription renewing. Never throws —
 * the deletion is already scheduled, and the erasure cancels the subscription
 * outright if this did not manage to.
 */
export async function pauseBillingForDeletion(deps: DeletionDeps, userId: string): Promise<BillingOutcome> {
  try {
    const [subscriptionId] = await deps.store.liveSubscriptionIds(userId);
    if (!subscriptionId) return { subscription: 'none' };
    if (!deps.stripe) throw new Error('STRIPE_SECRET_KEY is not set');

    const current = await deps.stripe.retrieve(subscriptionId);
    if (!current || ENDED_SUBSCRIPTION_STATUSES.has(current.status)) return { subscription: 'none' };

    // Remember first: if this write fails nothing at Stripe has changed yet.
    await deps.store.rememberSubscription(userId, subscriptionId, current.cancel_at_period_end);
    const updated = current.cancel_at_period_end
      ? current
      : await deps.stripe.setCancelAtPeriodEnd(subscriptionId, true);

    return {
      subscription: 'ends_at_period_end',
      periodEnd: updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : null,
    };
  } catch (error) {
    logOf(deps)(`[account-deletion] could not stop renewal for ${userId}: ${errorText(error)}`);
    return { subscription: 'unchanged', error: errorText(error) };
  }
}

/**
 * After a deletion is cancelled: put cancel_at_period_end back as it was.
 * `pending` is the schedule row read before the cancellation. Never throws.
 */
export async function restoreBillingAfterCancel(
  deps: DeletionDeps,
  userId: string,
  pending: PendingDeletion | null
): Promise<BillingOutcome> {
  const subscriptionId = pending?.stripeSubscriptionId;
  // Only undo what the request did: it changed nothing if the flag was already set.
  if (!subscriptionId || pending?.priorCancelAtPeriodEnd !== false) return { subscription: 'unchanged' };
  try {
    // US-353: only touch a subscription that is this user's own. The schedule
    // row is the pointer, and until 20261107000353 its owner could rewrite it
    // through PostgREST — pointing it at someone else's subscription turned
    // this call into "switch renewal back on for any Stripe subscription".
    // The row is now system-written only; this is the second lock.
    const own = await deps.store.liveSubscriptionIds(userId);
    if (!own.includes(subscriptionId)) {
      logOf(deps)(`[account-deletion] refused to restore renewal for ${userId}: ${subscriptionId} is not on their subscription row`);
      return { subscription: 'unchanged', error: 'subscription does not belong to this account' };
    }
    if (!deps.stripe) throw new Error('STRIPE_SECRET_KEY is not set');
    const current = await deps.stripe.retrieve(subscriptionId);
    if (!current || ENDED_SUBSCRIPTION_STATUSES.has(current.status)) return { subscription: 'none' };
    if (current.cancel_at_period_end) await deps.stripe.setCancelAtPeriodEnd(subscriptionId, false);
    return { subscription: 'restored' };
  } catch (error) {
    logOf(deps)(`[account-deletion] could not restore renewal for ${userId}: ${errorText(error)}`);
    return { subscription: 'unchanged', error: errorText(error) };
  }
}

export interface ErasureReport {
  /** Accounts erased. */
  processed: number;
  /** Due deletions held back because their subscription could not be cancelled. */
  blocked: number;
  errors: string[];
}

/**
 * Cancel every due account's live subscription, then erase. An account whose
 * subscription could not be cancelled stays scheduled — the database refuses
 * to erase it — and is retried on the next run.
 */
export async function processDueDeletions(deps: DeletionDeps): Promise<ErasureReport> {
  const errors: string[] = [];
  let blocked = 0;

  for (const deletion of await deps.store.dueDeletions()) {
    const ids = await deps.store.liveSubscriptionIds(deletion.userId);
    for (const subscriptionId of ids) {
      try {
        if (!deps.stripe) throw new Error('STRIPE_SECRET_KEY is not set');
        const current = await deps.stripe.retrieve(subscriptionId);
        if (current && !ENDED_SUBSCRIPTION_STATUSES.has(current.status)) {
          await deps.stripe.cancel(subscriptionId);
        }
        await deps.store.markSubscriptionCanceled(subscriptionId);
      } catch (error) {
        const detail = `could not cancel Stripe subscription ${subscriptionId}: ${errorText(error)}`;
        blocked++;
        errors.push(`${deletion.userId}: ${detail}`);
        logOf(deps)(`[account-deletion] ${deletion.userId} ${detail}; erasure left for retry`);
        await deps.store.logFailure(deletion, detail).catch((logError: unknown) =>
          logOf(deps)(`[account-deletion] could not log failure: ${errorText(logError)}`)
        );
        break;
      }
    }
  }

  const processed = await deps.store.eraseDue();
  return { processed, blocked, errors };
}

function must<T extends { error: { message: string } | null }>(result: T, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result;
}

/** The store over a service-role Supabase client. */
export function supabaseDeletionStore(db: SupabaseClient): DeletionStore {
  return {
    async liveSubscriptionIds(userId) {
      const { data } = must(
        await db
          .from('user_subscriptions')
          .select('stripe_subscription_id, status')
          .eq('user_id', userId)
          .not('stripe_subscription_id', 'is', null),
        'user_subscriptions'
      );
      return ((data ?? []) as { stripe_subscription_id: string | null; status: string | null }[])
        .filter((row) => row.stripe_subscription_id && row.status !== 'canceled')
        .map((row) => row.stripe_subscription_id as string);
    },

    async pendingDeletion(userId) {
      const { data } = must(
        await db
          .from('account_deletion_scheduled')
          .select('stripe_subscription_id, prior_cancel_at_period_end')
          .eq('user_id', userId)
          .eq('cancelled', false)
          .eq('executed', false)
          .maybeSingle(),
        'account_deletion_scheduled'
      );
      const row = data as { stripe_subscription_id: string | null; prior_cancel_at_period_end: boolean | null } | null;
      return row
        ? { stripeSubscriptionId: row.stripe_subscription_id, priorCancelAtPeriodEnd: row.prior_cancel_at_period_end }
        : null;
    },

    async rememberSubscription(userId, subscriptionId, prior) {
      must(
        await db
          .from('account_deletion_scheduled')
          .update({ stripe_subscription_id: subscriptionId, prior_cancel_at_period_end: prior })
          .eq('user_id', userId)
          .eq('cancelled', false)
          .eq('executed', false),
        'account_deletion_scheduled update'
      );
    },

    async dueDeletions() {
      const { data } = must(
        await db
          .from('account_deletion_scheduled')
          .select('user_id, gdpr_request_id, scheduled_for, created_at')
          .eq('cancelled', false)
          .eq('executed', false)
          .lte('scheduled_for', new Date().toISOString()),
        'account_deletion_scheduled'
      );
      return (
        (data ?? []) as {
          user_id: string;
          gdpr_request_id: string | null;
          scheduled_for: string;
          created_at: string | null;
        }[]
      ).map((row) => ({
        userId: row.user_id,
        gdprRequestId: row.gdpr_request_id,
        scheduledFor: row.scheduled_for,
        requestedAt: row.created_at,
      }));
    },

    async markSubscriptionCanceled(subscriptionId) {
      must(
        await db
          .from('user_subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: false })
          .eq('stripe_subscription_id', subscriptionId),
        'user_subscriptions update'
      );
    },

    async logFailure(deletion, detail) {
      must(
        await db.from('account_deletion_log').insert({
          user_id: deletion.userId,
          gdpr_request_id: deletion.gdprRequestId,
          scheduled_for: deletion.scheduledFor,
          requested_at: deletion.requestedAt,
          status: 'failed',
          error_detail: detail.slice(0, 1000),
        }),
        'account_deletion_log insert'
      );
    },

    async eraseDue() {
      const { data } = must(await db.rpc('process_scheduled_account_deletions'), 'process_scheduled_account_deletions');
      return typeof data === 'number' ? data : 0;
    },
  };
}
