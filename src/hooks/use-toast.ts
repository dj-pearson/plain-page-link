import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

// Compatibility shim over sonner (the toaster actually mounted in App.tsx).
//
// Historically this file kept its own reducer/state but nothing ever rendered
// that state — only sonner's <Toaster> is mounted — so every toast raised
// through this hook was silently dropped. It now delegates to sonner while
// preserving the shadcn-style { title, description, variant } API so the ~50
// existing callers keep working and their notifications actually appear.

type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  id?: string | number;
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

function toast({ title, description, action, variant, duration, id }: ToastProps) {
  const toastId = id ?? genId();

  const options = {
    id: toastId,
    description,
    action,
    duration,
  };

  if (variant === 'destructive') {
    sonnerToast.error(title ?? 'Error', options);
  } else {
    sonnerToast(title ?? '', options);
  }

  return {
    id: toastId,
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (props: ToastProps) => toast({ ...props, id: toastId }),
  };
}

function useToast() {
  return {
    // Retained for API compatibility; sonner owns rendering, so this is always empty.
    toasts: [] as ToastProps[],
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
