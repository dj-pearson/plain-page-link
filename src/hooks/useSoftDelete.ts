import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface DeleteQueueItem<T> {
  id: string;
  data: T;
  timeoutId: NodeJS.Timeout;
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

  const { toast, dismiss } = useToast();
  const [deletionQueue, setDeletionQueue] = useState<Map<string, DeleteQueueItem<T>>>(new Map());
  const queueRef = useRef(deletionQueue);

  // Keep ref in sync with state
  queueRef.current = deletionQueue;

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
      const timeoutId = setTimeout(async () => {
        try {
          await onDelete(item.id);

          // Remove from queue after successful deletion
          setDeletionQueue((prev) => {
            const newQueue = new Map(prev);
            newQueue.delete(item.id);
            return newQueue;
          });

          // Show success toast
          toast({
            title: `${resourceName} deleted`,
            description: `Your ${resourceName} has been permanently removed.`,
          });
        } catch (error) {
          // Show error toast
          toast({
            title: "Deletion failed",
            description: `Failed to delete ${resourceName}. Please try again.`,
            variant: "destructive",
          });

          // Remove from queue on error
          setDeletionQueue((prev) => {
            const newQueue = new Map(prev);
            newQueue.delete(item.id);
            return newQueue;
          });
        }
      }, deleteDelay);

      // Add to deletion queue
      const queueItem: DeleteQueueItem<T> = {
        id: item.id,
        data: item,
        timeoutId,
        timestamp: Date.now(),
      };

      setDeletionQueue((prev) => {
        const newQueue = new Map(prev);
        newQueue.set(item.id, queueItem);
        return newQueue;
      });

      // Show undo toast
      const { dismiss: dismissToast } = toast({
        title: `${resourceName} deleted`,
        description: undoMessage?.(item) || `Deleting ${resourceName} in ${deleteDelay / 1000} seconds...`,
        action: {
          label: "Undo",
          onClick: () => {
            undoDelete(item.id);
            dismissToast();
          },
        },
        duration: deleteDelay,
      });
    },
    [onDelete, deleteDelay, undoMessage, resourceName, toast]
  );

  /**
   * Cancels a pending deletion
   */
  const undoDelete = useCallback((id: string) => {
    const queueItem = queueRef.current.get(id);

    if (!queueItem) {
      return;
    }

    // Cancel the timeout
    clearTimeout(queueItem.timeoutId);

    // Remove from queue
    setDeletionQueue((prev) => {
      const newQueue = new Map(prev);
      newQueue.delete(id);
      return newQueue;
    });

    // Show undo confirmation
    toast({
      title: "Deletion cancelled",
      description: `Your ${resourceName} has been restored.`,
    });
  }, [resourceName, toast]);

  /**
   * Checks if an item is pending deletion
   */
  const isPendingDeletion = useCallback(
    (id: string): boolean => {
      return queueRef.current.has(id);
    },
    []
  );

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
    queueRef.current.forEach((item) => {
      clearTimeout(item.timeoutId);
    });
    setDeletionQueue(new Map());

    if (queueRef.current.size > 0) {
      toast({
        title: "All deletions cancelled",
        description: `${queueRef.current.size} ${resourceName}${queueRef.current.size > 1 ? 's' : ''} restored.`,
      });
    }
  }, [resourceName, toast]);

  /**
   * Forces immediate deletion of a queued item
   */
  const forceDelete = useCallback(
    async (id: string) => {
      const queueItem = queueRef.current.get(id);

      if (!queueItem) {
        return;
      }

      // Cancel the timeout
      clearTimeout(queueItem.timeoutId);

      // Remove from queue
      setDeletionQueue((prev) => {
        const newQueue = new Map(prev);
        newQueue.delete(id);
        return newQueue;
      });

      // Execute deletion immediately
      try {
        await onDelete(id);
        toast({
          title: `${resourceName} deleted`,
          description: `Your ${resourceName} has been permanently removed.`,
        });
      } catch (error) {
        toast({
          title: "Deletion failed",
          description: `Failed to delete ${resourceName}. Please try again.`,
          variant: "destructive",
        });
      }
    },
    [onDelete, resourceName, toast]
  );

  return {
    softDelete,
    undoDelete,
    isPendingDeletion,
    getPendingDeletions,
    cancelAllDeletions,
    forceDelete,
    pendingCount: deletionQueue.size,
  };
}
