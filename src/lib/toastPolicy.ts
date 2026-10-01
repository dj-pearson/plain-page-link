/**
 * Error toasts stay until dismissed (US-238, SC 2.2.1).
 *
 * sonner closes every toast after four seconds. An error that vanishes before
 * a screen-reader user has finished hearing it — or before someone who reads
 * slowly has read it — is an error they never got. Errors now persist, and the
 * <Toaster> in App.tsx shows a close button on every toast.
 *
 * Done once here rather than at the ~35 call sites that use sonner directly;
 * a caller that passes its own `duration` still wins.
 */
import { toast } from 'sonner';

const PATCHED = Symbol.for('agentbio.toastPolicy');

type ErrorFn = typeof toast.error;

export function installToastPolicy(): void {
  const t = toast as typeof toast & { [PATCHED]?: boolean };
  if (t[PATCHED]) return;
  const original: ErrorFn = toast.error.bind(toast);
  t.error = ((message, data) => original(message, { duration: Infinity, ...data })) as ErrorFn;
  t[PATCHED] = true;
}
