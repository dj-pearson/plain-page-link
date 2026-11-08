/**
 * The Theme page's Live Preview (US-533, US-524).
 *
 * A small sample of the agent's public page in the colours and fonts they are
 * editing, with their custom CSS applied as visitors would get it: the
 * sanitised output of sanitizeCustomCss, inside the same ProfileCustomCssScope
 * the public page uses. Every rule in that output is prefixed with the scope
 * class, and the scope sits inside a `contain: paint` boundary, so what the
 * agent types restyles this sample and nothing else on the dashboard.
 *
 * The sample uses the elements the public page uses (an h1 for the agent's
 * name, h2 section headings, links and buttons), so `h1 { … }` in the editor
 * does here what it does on /:username. Colours and fonts arrive as custom
 * properties read through classes rather than inline styles: an inline style
 * would beat the agent's rules, and the preview would show their CSS losing
 * where on the real page it wins.
 *
 * The sample is a picture, not a page: it is hidden from assistive technology
 * and its buttons are out of the tab order.
 */
import type { CSSProperties } from 'react';
import type { ThemeConfig } from '@/lib/themes';
import { ProfileCustomCssScope } from '@/components/profile/ProfileCustomCssScope';
import { cn } from '@/lib/utils';

interface ThemeLivePreviewProps {
  colors: ThemeConfig['colors'];
  fonts: ThemeConfig['fonts'];
  mode: 'desktop' | 'mobile';
  /** Output of sanitizeCustomCss — never what the agent typed. */
  customCss: string;
}

const HEADING = 'font-[family-name:var(--preview-heading-font)]';
const BODY = 'font-[family-name:var(--preview-body-font)]';

export function ThemeLivePreview({ colors, fonts, mode, customCss }: ThemeLivePreviewProps) {
  const mobile = mode === 'mobile';
  const vars = {
    '--preview-primary': colors.primary,
    '--preview-secondary': colors.secondary,
    '--preview-accent': colors.accent,
    '--preview-background': colors.background,
    '--preview-foreground': colors.foreground,
    '--preview-muted': colors.muted,
    '--preview-heading-font': fonts.heading,
    '--preview-body-font': fonts.body,
  } as CSSProperties;

  const button = cn(
    'min-h-[44px] rounded-lg py-2 text-xs font-medium text-white sm:text-sm',
    mobile ? 'w-full px-4' : 'px-3 sm:px-4'
  );

  return (
    <div
      className="flex justify-center rounded-lg bg-muted p-4 sm:p-8"
      style={vars}
      data-testid="theme-live-preview"
    >
      <div
        className={cn('w-full transition-[max-width] duration-300', mobile && 'max-w-[375px]')}
        aria-hidden="true"
      >
        <ProfileCustomCssScope
          css={customCss}
          className={cn(
            'space-y-3 rounded-lg bg-[var(--preview-background)] p-4 text-[color:var(--preview-foreground)] sm:space-y-4 sm:p-6',
            BODY,
            mobile && 'shadow-lg'
          )}
        >
          <header
            className={cn(
              'flex items-start',
              mobile ? 'flex-col items-center text-center' : 'gap-4'
            )}
          >
            <div
              className={cn(
                'shrink-0 rounded-full bg-[var(--preview-primary)]',
                mobile ? 'mb-3 h-16 w-16' : 'h-20 w-20'
              )}
            />
            <div className="flex-1 space-y-2">
              <h1 className={cn('font-bold', mobile ? 'text-xl' : 'text-2xl', HEADING)}>
                Agent Name
              </h1>
              <p className="text-sm text-[color:var(--preview-muted)]">
                Realtor® | Luxury Home Specialist
              </p>
            </div>
          </header>

          <div className={cn('flex gap-2', mobile ? 'w-full flex-col' : 'flex-wrap')}>
            <button
              type="button"
              tabIndex={-1}
              className={cn(button, 'bg-[var(--preview-primary)]')}
            >
              Primary Button
            </button>
            <button
              type="button"
              tabIndex={-1}
              className={cn(button, 'bg-[var(--preview-secondary)]')}
            >
              Secondary Button
            </button>
            {!mobile && (
              <button
                type="button"
                tabIndex={-1}
                className={cn(button, 'bg-[var(--preview-accent)]')}
              >
                Accent Button
              </button>
            )}
          </div>

          <section className="space-y-2">
            <h2 className={cn('text-sm font-semibold', HEADING)}>Featured Listings</h2>
            <div className="rounded-lg border border-black/10 p-4">
              <h3 className={cn('mb-1 text-sm font-semibold', HEADING)}>Property Card</h3>
              <p className="text-xs text-[color:var(--preview-muted)]">
                {mobile
                  ? 'Mobile view'
                  : 'This is how property cards will appear with your selected theme.'}
              </p>
              <a className="mt-2 inline-block text-xs font-medium text-[color:var(--preview-primary)] underline">
                View details
              </a>
            </div>
          </section>
        </ProfileCustomCssScope>
      </div>
    </div>
  );
}
