import { Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRatio } from '@/lib/wcagContrast';
import type { ContrastCheck, ThemeColors } from '@/lib/themeContrast';

interface ContrastPanelProps {
  checks: ContrastCheck[];
  onFix: (key: keyof ThemeColors, value: string) => void;
  onFixAll: () => void;
}

/**
 * US-234: the live contrast of each colour pair a theme produces.
 *
 * Pass/fail is said in words and an icon, not only by colour, and the save
 * button refuses while any row fails — the editor used to publish whatever five
 * colours it was given.
 */
export function ContrastPanel({ checks, onFix, onFixAll }: ContrastPanelProps) {
  const failing = checks.filter((k) => !k.pass);
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Readability</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Text needs a contrast of at least 4.5:1 to be readable by visitors with low vision
          (WCAG&nbsp;2.2&nbsp;AA). A theme that falls short cannot be saved.{' '}
          <a href="/accessibility/agents#colours" target="_blank" rel="noopener noreferrer" className="underline">
            Why this matters<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {failing.length === 0
            ? 'Every colour pair is readable.'
            : `${failing.length} colour ${failing.length === 1 ? 'pair is' : 'pairs are'} too low to save.`}
        </p>
        <ul className="divide-y">
          {checks.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-3 py-2">
              <span
                className="inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-md border text-sm font-semibold"
                style={{ color: k.fg, backgroundColor: k.bg }}
                aria-hidden="true"
              >
                Aa
              </span>
              <span className="min-w-0 flex-1 text-sm">
                {k.label}
                <span className="block text-xs text-muted-foreground">
                  {formatRatio(k.ratio)} — needs {k.min}:1
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm">
                {k.pass ? (
                  <>
                    <Check className="h-4 w-4 text-green-700 dark:text-green-400" aria-hidden="true" />
                    Passes
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden="true" />
                    Too low
                  </>
                )}
              </span>
              {k.fix && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => onFix(k.fix!.key, k.fix!.value)}
                  aria-label={`Use nearest passing colour for ${k.label.toLowerCase()}`}
                >
                  Use nearest passing colour
                </Button>
              )}
            </li>
          ))}
        </ul>
        {failing.length > 1 && (
          <Button type="button" variant="secondary" className="min-h-[44px]" onClick={onFixAll}>
            Fix all
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
