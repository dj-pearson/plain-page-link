/**
 * The toast for a save the database refused. If the refusal is a plan limit
 * (20260923000002) it says so and offers the plan that lifts it; anything else
 * gets the caller's generic message.
 */
import { toast } from 'sonner';
import { UPGRADE_PATH, planLimitKeyFromError, upgradePitch } from '@/lib/planLimits';

/** Returns true when the error was a plan limit and has been reported. */
export function toastSaveError(
  error: unknown,
  fallback: string,
  planName?: string | null
): boolean {
  const key = planLimitKeyFromError(error);
  if (!key) {
    toast.error(fallback);
    return false;
  }
  const message =
    error &&
    typeof error === 'object' &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Your plan limit has been reached.';
  toast.error(message, {
    description: upgradePitch(key, planName) ?? undefined,
    action: {
      label: 'See plans',
      onClick: () => window.location.assign(UPGRADE_PATH),
    },
  });
  return true;
}
