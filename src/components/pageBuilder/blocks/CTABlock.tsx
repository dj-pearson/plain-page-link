/**
 * CTA (Call-to-Action) Block Component
 * Prominent call-to-action section with eye-catching design
 */

import { CTABlockConfig } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { usableLinkUrl } from '@/lib/blockLinkTarget';

interface CTABlockProps {
  config: CTABlockConfig;
  isEditing?: boolean;
}

export function CTABlock({ config, isEditing = false }: CTABlockProps) {
  // Sanitised, and '' for a placeholder ('#', example.com) that a visitor
  // would click and go nowhere (US-350, as LinkBlock does since US-327).
  const safeUrl = usableLinkUrl(config.buttonUrl);

  // A call to action whose button leads nowhere is a promise with no way to
  // act on it, so the whole block stays off the public page.
  if (!isEditing && !safeUrl) return null;

  const handleClick = () => {
    if (isEditing || !safeUrl) return;
    if (config.openInNewTab) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = safeUrl;
    }
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (config.variant) {
      case 'gradient':
        return {
          background:
            'linear-gradient(135deg, var(--theme-primary, #2563eb) 0%, var(--theme-accent, #7c3aed) 100%)',
          color: 'white',
          borderRadius: 'var(--theme-border-radius, 0.75rem)',
        };
      case 'outline':
        return {
          background: 'transparent',
          border: `2px solid var(--theme-primary, #2563eb)`,
          color: 'var(--theme-primary, #2563eb)',
          borderRadius: 'var(--theme-border-radius, 0.75rem)',
        };
      case 'solid':
      default:
        return {
          background: 'var(--theme-primary, #2563eb)',
          color: 'white',
          borderRadius: 'var(--theme-border-radius, 0.75rem)',
        };
    }
  };

  const getButtonStyles = (): React.CSSProperties => {
    switch (config.variant) {
      case 'gradient':
        return {
          backgroundColor: 'white',
          color: 'var(--theme-primary, #2563eb)',
          borderRadius: 'var(--theme-border-radius, 0.5rem)',
        };
      case 'outline':
        return {
          backgroundColor: 'var(--theme-primary, #2563eb)',
          color: 'white',
          borderRadius: 'var(--theme-border-radius, 0.5rem)',
        };
      case 'solid':
      default:
        return {
          backgroundColor: 'white',
          color: 'var(--theme-primary, #2563eb)',
          borderRadius: 'var(--theme-border-radius, 0.5rem)',
        };
    }
  };

  return (
    <div className="p-8 md:p-12 text-center space-y-4" style={getVariantStyles()}>
      <h3
        className="text-2xl md:text-3xl font-bold"
        style={{ fontFamily: 'var(--theme-font-heading, inherit)' }}
      >
        {config.headline}
      </h3>

      {config.description && (
        <p className="text-lg opacity-90 max-w-xl mx-auto">{config.description}</p>
      )}

      <Button
        onClick={handleClick}
        disabled={isEditing}
        size="lg"
        className="mt-4 gap-2 text-base px-8 font-semibold hover:scale-105 transition-transform shadow-lg"
        style={getButtonStyles()}
      >
        {config.buttonText || 'Get Started'}
        <ArrowRight className="w-5 h-5" />
      </Button>

      {isEditing && !safeUrl && (
        <p
          role="note"
          className="mx-auto max-w-md rounded-md bg-background/90 px-3 py-2 text-sm text-foreground"
        >
          No destination yet, so this block is hidden on your public page. Add a button URL in the
          block settings.
        </p>
      )}
    </div>
  );
}
