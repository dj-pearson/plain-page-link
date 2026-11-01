import { useState, useCallback, useRef, useEffect } from 'react';
// Use sonner directly: it is the toaster actually mounted in App.tsx and it
// natively supports the { action: { label, onClick }, duration } shape this hook
// relies on. The custom use-toast hook does not, so the Undo action never rendered.
import { toast as sonnerToast } from 'sonner';

interface DeleteQueueItem<T> {
  id: string;
  data: T;
  timeoutId: ReturnType<typeof setTimeout>;
  timestamp: number;
}

interface UseSoftDeleteOptions<T> {
  /**
   * Callback to execute the permanent deletion
   */
  onDelete: (id: string) => Promise<void>;

  /**
   * Delay in milliseconds before permanent deletion (default: 10000ms / 10 seconds)
   */
  deleteDelay?: number;

  /**
   * Custom undo message
   */
  undoMessage?: (item: T) => string;

  /**
   * Resource name for toast messages (e.g., "listing", "link", "testimonial")
   */
  resourceName: string;
}

export function useSoftDelete<T extends { id: string }>(options: UseSoftDeleteOptions<T>) {
  const {
    onDelete,
    deleteDelay = 10000, // 10 seconds default
    undoMessage,
    resourceName,
  } = options;

  // The queue itself lives in a ref so timers, unmount and pagehide all see the
  // same Map synchronously. The ids are mirrored into state so a render follows
  // every change: `isPendingDeletion` used to read the ref through a callback
  // that never changed identity, and a memo keyed on it (Links.tsx) never
  // re-ran, so a deleted row stayed on screen until the timer fired (US-252).
  const queueRef = useRef<Map<string, DeleteQueueItem<T>>>(new Map());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const mountedRef = useRef(true);
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;
  const resourceNameRef = useRef(resourceName);
  resourceNameRef.current = resourceName;

  const syncPending = useCallback(() => {
    if (!mountedRef.current) return;
    setPendingIds(new Set(queueRef.current.keys()));
  }, []);

  /** Removes an item from the queue and stops its timer. */
  const takeFromQueue = useCallback((id: string): DeleteQueueItem<T> | undefined => {
    const queueItem = queueRef.current.get(id);
    if (!queueItem) return undefined;
    clearTimeout(queueItem.timeoutId);
    queueRef.current.delete(id);
    return queueItem;
  }, []);

  /** Performs the permanent delete now; reports the outcome by toast. */
  const runDelete = useCallback(async (id: string) => {
    const name = resourceNameRef.current;
    try {
      await onDeleteRef.current(id);
      sonnerToast.success(`${name} deleted`, {
        description: `Your ${name} has been permanently removed.`,
      });
    } catch (error) {
      sonnerToast.error('Deletion failed', {
        description: `Failed to delete ${name}. Please try again.`,
      });
    }
  }, []);

  // A pending delete the agent did not undo is a delete they asked for. Leaving
  // the page inside the undo window used to clear the timers, so the item came
  // back on the next visit (US-252). Flush them instead: on unmount (an in-app
  // navigation) and on pagehide (a reload, a closed tab, an external link).
  useEffect(() => {
    mountedRef.current = true;
    const flushAll = () => {
      const ids = Array.from(queueRef.current.keys());
      ids.forEach((id) => {
        if (takeFromQueue(id)) void runDelete(id);
      });
      syncPending();
    };
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('pagehide', flushAll);
      mountedRef.current = false;
      flushAll();
    };
  }, [takeFromQueue, runDelete, syncPending]);

  /**
   * Cancels a pending deletion
   */
  const undoDelete = useCallback(
    (id: string) => {
      if (!takeFromQueue(id)) return;
      syncPending();

      // Show undo confirmation
      sonnerToast.success('Deletion cancelled', {
        description: `Your ${resourceName} has been restored.`,
      });
    },
    [resourceName, takeFromQueue, syncPending]
  );

  /**
   * Initiates a soft delete with undo option
   */
  const softDelete = useCallback(
    async (item: T) => {
      // If already in queue, skip
      if (queueRef.current.has(item.id)) {
        return;
      }

      // Create timeout for permanent deletion
      const timeoutId = setTimeout(() => {
        if (!takeFromQueue(item.id)) return;
        syncPending();
        void runDelete(item.id);
      }, deleteDelay);

      queueRef.current.set(item.id, {
        id: item.id,
        data: item,
        timeoutId,
        timestamp: Date.now(),
      });
      syncPending();

      // Show undo toast (sonner renders the action button and honors duration)
      const toastId = sonnerToast(`${resourceName} deleted`, {
        description:
          undoMessage?.(item) || `Deleting ${resourceName} in ${deleteDelay / 1000} seconds...`,
        duration: deleteDelay,
        action: {
          label: 'Undo',
          onClick: () => {
            undoDelete(item.id);
            sonnerToast.dismiss(toastId);
          },
        },
      });
    },
    [deleteDelay, undoMessage, resourceName, undoDelete, takeFromQueue, syncPending, runDelete]
  );

  /**
   * Checks if an item is pending deletion. Its identity changes whenever the
   * pending set does, so memos and effects that depend on it re-run.
   */
  const isPendingDeletion = useCallback((id: string): boolean => pendingIds.has(id), [pendingIds]);

  /**
   * Gets all items pending deletion
   */
  const getPendingDeletions = useCallback((): T[] => {
    return Array.from(queueRef.current.values()).map((item) => item.data);
  }, []);

  /**
   * Cancels all pending deletions
   */
  const cancelAllDeletions = useCallback(() => {
    const count = queueRef.current.size;
    Array.from(queueRef.current.keys()).forEach((id) => takeFromQueue(id));
    syncPending();

    if (count > 0) {
      sonnerToast.success('All deletions cancelled', {
        description: `${count} ${resourceName}${count > 1 ? 's' : ''} restored.`,
      });
    }
  }, [resourceName, takeFromQueue, syncPending]);

  /**
   * Forces immediate deletion of a queued item
   */
  const forceDelete = useCallback(
    async (id: string) => {
      if (!takeFromQueue(id)) return;
      syncPending();
      await runDelete(id);
    },
    [takeFromQueue, syncPending, runDelete]
  );

  return {
    softDelete,
    undoDelete,
    isPendingDeletion,
    pendingIds,
    getPendingDeletions,
    cancelAllDeletions,
    forceDelete,
    pendingCount: pendingIds.size,
  };
}
