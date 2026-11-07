import { useCallback, useState } from 'react';

/**
 * Whether a lazily loaded dialog should be in the tree.
 *
 * False until the dialog is first opened, so its chunk is not fetched with the
 * page that hosts it (US-412). True from then on, so closing it keeps the
 * component mounted the way an always-rendered dialog was: its exit animation
 * still plays and any state it holds while closed survives a reopen.
 *
 * `unmount` puts it back to the first state. Call it when the dialog's chunk
 * failed to load and the user dismissed the error, so the next open retries
 * instead of rendering the error boundary that is still holding the failure.
 */
export function useMountOnFirstOpen(open: boolean): { mounted: boolean; unmount: () => void } {
  const [opened, setOpened] = useState(open);
  // Derived from props during render, React's documented alternative to an
  // effect: the dialog mounts in the same render that opens it.
  if (open && !opened) setOpened(true);
  const unmount = useCallback(() => setOpened(false), []);
  return { mounted: open || opened, unmount };
}
