import { useEffect } from 'react';

/**
 * CalendlyEmbed Component
 * Embeds Calendly scheduling widget inline
 */

interface CalendlyEmbedProps {
  url: string;
  minHeight?: string;
  className?: string;
}

export function CalendlyEmbed({ url, minHeight = '630px', className = '' }: CalendlyEmbedProps) {
  useEffect(() => {
    // Load Calendly widget script if not already loaded
    const script = document.querySelector('script[src*="calendly.com"]');
    if (!script) {
      const newScript = document.createElement('script');
      newScript.src = 'https://assets.calendly.com/assets/external/widget.js';
      newScript.async = true;
      document.body.appendChild(newScript);
    }
  }, []);

  return (
    <div
      className={`calendly-inline-widget ${className}`}
      data-url={url}
      style={{ minWidth: '320px', height: minHeight }}
    />
  );
}

/**
 * CalendlyPopupButton Component
 * Opens Calendly in a popup modal
 */

interface CalendlyPopupButtonProps {
  url: string;
  text?: string;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: Record<string, string>;
  };
}

export function CalendlyPopupButton({
  url,
  text = 'Schedule Time',
  className = '',
  prefill
}: CalendlyPopupButtonProps) {
  useEffect(() => {
    // Load Calendly popup widget script
    const script = document.querySelector('script[src*="calendly.com"]');
    if (!script) {
      const newScript = document.createElement('script');
      newScript.src = 'https://assets.calendly.com/assets/external/widget.js';
      newScript.async = true;
      document.body.appendChild(newScript);
    }
  }, []);

  const handleClick = () => {
    // @ts-ignore - Calendly is loaded from external script
    if (window.Calendly) {
      // @ts-ignore
      window.Calendly.initPopupWidget({
        url,
        prefill: prefill || {}
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      type="button"
    >
      {text}
    </button>
  );
}

/**
 * CalendlyBadgeWidget Component
 * Floating button that sticks to the bottom of the page
 */

interface CalendlyBadgeWidgetProps {
  url: string;
  text?: string;
  color?: string;
  textColor?: string;
}

export function CalendlyBadgeWidget({
  url,
  text = 'Schedule time with me',
  color = '#0069ff',
  textColor = '#ffffff'
}: CalendlyBadgeWidgetProps) {
  useEffect(() => {
    // Load Calendly badge widget script
    const script = document.querySelector('script[src*="calendly.com"]');
    if (!script) {
      const newScript = document.createElement('script');
      newScript.src = 'https://assets.calendly.com/assets/external/widget.js';
      newScript.async = true;
      document.body.appendChild(newScript);
    }

    // Initialize badge widget after script loads
    const initBadge = () => {
      // @ts-ignore
      if (window.Calendly) {
        // @ts-ignore
        window.Calendly.initBadgeWidget({
          url,
          text,
          color,
          textColor,
          branding: false
        });
      }
    };

    // Try to init immediately or wait for script
    if (document.querySelector('script[src*="calendly.com"]')) {
      setTimeout(initBadge, 100);
    } else {
      document.addEventListener('DOMContentLoaded', initBadge);
    }

    return () => {
      // Cleanup badge on unmount
      const badge = document.querySelector('.calendly-badge-widget');
      if (badge) {
        badge.remove();
      }
    };
  }, [url, text, color, textColor]);

  return null; // Badge is added to DOM by Calendly script
}
