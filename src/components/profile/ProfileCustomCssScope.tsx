import type { CSSProperties, ReactNode } from 'react';
import { CUSTOM_CSS_SCOPE_CLASS } from '@/lib/customCss';
import { cn } from '@/lib/utils';

/**
 * `contain: paint` makes this box the containing block for anything inside it,
 * fixed-position boxes included, and clips their painting to it. With it the
 * agent's CSS cannot place or paint anything outside the container — over the
 * compliance footer that follows it, the sticky action bar or the modals —
 * even through a value the sanitiser cannot see (a var(), a transform).
 * Applied only when there is custom CSS, so a page without any is unchanged.
 */
const CONTAINED: CSSProperties = { contain: 'paint', isolation: 'isolate' };

interface ProfileCustomCssScopeProps {
  /** Output of sanitizeCustomCss (useProfileCustomCss) — never raw input. */
  css: string;
  className?: string;
  children: ReactNode;
}

/**
 * The part of the public page the agent's custom CSS may style (US-514).
 * Everything the visitor must always see as AgentBio renders it — the Equal
 * Housing / licence footer above all — sits outside it.
 */
export function ProfileCustomCssScope({ css, className, children }: ProfileCustomCssScopeProps) {
  return (
    <div
      className={cn(CUSTOM_CSS_SCOPE_CLASS, className)}
      style={css ? CONTAINED : undefined}
      data-custom-css={css ? 'applied' : undefined}
    >
      {/* `hidden` keeps it out of Tailwind's space-y sibling margins. */}
      {css ? <style hidden>{css}</style> : null}
      {children}
    </div>
  );
}
