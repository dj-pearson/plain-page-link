import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // US-663: default, secondary and outline were light-only, so on the
        // dark dashboard the default badge was a near-black patch on a
        // near-black page and outline text (gray-900) all but vanished. Each
        // now inverts in dark mode; badge.test.tsx checks both pairs.
        default:
          'border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80',
        // US-193: three of these six failed WCAG AA. Badge text is
        // 12px semibold, so it is "normal text" and needs 4.5:1 —
        // gray-50 on red-500 was 3.60, white on green-500 was 2.28,
        // and white on yellow-500 was 1.92, which is a pale label on a
        // bright field and close to unreadable. The shades below all
        // clear 4.5:1 against white and are checked by badge.test.tsx
        // rather than eyeballed.
        destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
        // Sits on the page's own surface: white in light mode, the dark
        // dashboard background (slate-950-ish) in dark mode.
        outline: 'text-gray-900 dark:text-gray-100',
        // destructive/success/warning keep one pair in both themes: the
        // text sits on the badge's own fill, so its contrast does not depend
        // on the page behind it.
        success: 'border-transparent bg-green-700 text-white hover:bg-green-800',
        warning: 'border-transparent bg-amber-700 text-white hover:bg-amber-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
