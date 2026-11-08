/**
 * Custom CSS for the agent's public page (US-514, owner decision 2026-11-08).
 *
 * What the agent types is stored as typed; what visitors get is what
 * sanitizeCustomCss keeps, and the editor shows the difference as they type:
 * every removal is listed in plain words before they save, so nothing is
 * silently dropped, and the Theme page's Live Preview renders the sanitised
 * result as they type (US-533). Plans without customThemes see what the feature does and
 * where to get it; the database refuses the write regardless.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useAgentCustomCss } from '@/hooks/useAgentCustomCss';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { useToast } from '@/hooks/use-toast';
import { CUSTOM_CSS_MAX_LENGTH, sanitizeCustomCss } from '@/lib/customCss';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EXAMPLE = `/* Rounder buttons and a warmer heading */
h1 { letter-spacing: -0.01em; }
a[role="button"], button { border-radius: 9999px; }`;

interface CustomCssEditorProps {
  /**
   * Receives the sanitised draft as the agent types (US-533), so the Theme
   * page's Live Preview can show it before it is saved. '' when the plan does
   * not include custom CSS, because the public page would not apply it.
   */
  onPreviewCssChange?: (css: string) => void;
}

export function CustomCssEditor({ onPreviewCssChange }: CustomCssEditorProps = {}) {
  const { toast } = useToast();
  const { hasFeature, isLoading: planLoading } = usePlanUsage();
  const { css: stored, isLoading, isError, save } = useAgentCustomCss();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const entitled = hasFeature('customThemes');
  const result = useMemo(() => sanitizeCustomCss(draft), [draft]);
  const overLimit = draft.length > CUSTOM_CSS_MAX_LENGTH;
  const dirty = draft !== stored;
  const previewCss = entitled ? result.css : '';

  useEffect(() => {
    onPreviewCssChange?.(previewCss);
  }, [previewCss, onPreviewCssChange]);

  const persist = (value: string) =>
    save.mutate(value, {
      onSuccess: () =>
        toast({
          title: value.trim() ? 'Custom CSS saved' : 'Custom CSS removed',
          description: value.trim()
            ? 'It applies to your public page the next time it loads.'
            : 'Your page uses your theme alone again.',
        }),
      onError: (error: unknown) =>
        toast({
          title: 'Could not save your custom CSS',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        }),
    });

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <CardTitle className="text-base sm:text-lg">Custom CSS</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Fine-tune your public page with your own styles. They apply to your page&apos;s
              content only — your licence and Equal Housing footer always shows as AgentBio renders
              it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!planLoading && !entitled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Custom CSS comes with the Starter plan and above.
              {stored.trim()
                ? ' The CSS you saved earlier is kept, but your page does not use it on this plan.'
                : ''}
            </p>
            <Button asChild size="sm" className="min-h-[44px] sm:min-h-0">
              <Link to="/dashboard/subscription">See plans</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="custom-css-input">Your CSS</Label>
              <Textarea
                id="custom-css-input"
                name="custom_css"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={EXAMPLE}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={10}
                disabled={isLoading || isError}
                aria-describedby="custom-css-help custom-css-count"
                aria-invalid={overLimit || undefined}
                className="font-mono text-xs leading-relaxed sm:text-sm"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
                <p id="custom-css-help">
                  Write selectors as if your page were the whole document: <code>h1</code>,{' '}
                  <code>a</code>, <code>body</code>. Images must be on your own site; fonts and
                  imports from other sites are not loaded. The Live Preview above shows the result
                  as you type.
                </p>
                <p
                  id="custom-css-count"
                  className={overLimit ? 'font-medium text-destructive' : undefined}
                >
                  {draft.length.toLocaleString('en-US')} /{' '}
                  {CUSTOM_CSS_MAX_LENGTH.toLocaleString('en-US')}
                </p>
              </div>
            </div>

            {isError && (
              <p className="text-sm text-destructive" role="alert">
                Your saved CSS could not be loaded. Refresh the page to try again.
              </p>
            )}

            {draft.trim() && result.removed.length > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm" role="status" aria-live="polite">
                <p className="font-medium">Visitors will not get:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {result.removed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => persist(draft)}
                disabled={!dirty || overLimit || save.isPending || isLoading || isError}
                className="min-h-[44px] sm:min-h-0"
              >
                {save.isPending ? 'Saving…' : 'Save custom CSS'}
              </Button>
              {stored.trim() && (
                <Button
                  variant="outline"
                  onClick={() => persist('')}
                  disabled={save.isPending}
                  className="min-h-[44px] sm:min-h-0"
                >
                  Remove custom CSS
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
