import type { CSSProperties, ReactNode } from 'react';
import { CUSTOM_CSS_SCOPE_CLASS } from '@/lib/customCss';
import { cn } from '@/lib/utils';

/**
 * `contain: paint` makes the wrapper the containing block for anything inside
 * it, fixed-position boxes included, and clips their painting to it;
 * `overflow: clip` and `isolation` back it up. It sits on an outer element with
 * no class or id, so no scoped selector the agent writes can match it and turn
 * it off (a `contain: none !important` on `body` reaches the inner scope div
 * only). The agent's CSS therefore cannot place or paint anything outside the
 * wrapper — over the compliance footer that follows it, the sticky action bar
 * or the modals — even by moving the scope div itself, or through a value the
 * sanitiser cannot see (a var()). Applied only when there is custom CSS, so a
 * page without any is unchanged.
 */
const CONTAINED: CSSProperties = { contain: 'paint', overflow: 'clip', isolation: 'isolate' };

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
  const scope = (
    <div
      className={cn(CUSTOM_CSS_SCOPE_CLASS, className)}
      data-custom-css={css ? 'applied' : undefined}
    >
      {/* `hidden` keeps it out of Tailwind's space-y sibling margins. */}
      {css ? <style hidden>{css}</style> : null}
      {children}
    </div>
  );
  if (!css) return scope;
  return (
    <div style={CONTAINED} data-custom-css-boundary="">
      {scope}
    </div>
  );
}
