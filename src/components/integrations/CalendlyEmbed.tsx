import { useEffect, useRef, useState } from 'react';
import { loadCalendly } from '@/lib/calendly';

/**
 * Calendly's inline scheduler.
 *
 * US-221: this used to append widget.js and rely on its one-time DOM scan for
 * `.calendly-inline-widget`. The scan runs once, on load — so a modal opened a
 * second time, after the script was already there, rendered an empty box. The
 * widget is now initialised explicitly on every mount.
 */
interface CalendlyEmbedProps {
  url: string;
  minHeight?: string;
  className?: string;
}

export function CalendlyEmbed({ url, minHeight = '630px', className = '' }: CalendlyEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadCalendly()
      .then((calendly) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = '';
        calendly.initInlineWidget({ url, parentElement: ref.current });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center p-6 text-center ${className}`} style={{ minHeight }}>
        <p className="text-sm text-muted-foreground">
          The scheduler could not load.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Open it in a new tab
          </a>
          .
        </p>
      </div>
    );
  }

  return <div ref={ref} className={className} style={{ minWidth: '320px', height: minHeight }} />;
}
