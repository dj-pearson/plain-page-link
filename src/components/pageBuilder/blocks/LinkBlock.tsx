/**
 * Link Block Component
 * Displays a customizable link button
 */

import { LinkBlockConfig } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { usableLinkUrl } from '@/lib/blockLinkTarget';

interface LinkBlockProps {
  config: LinkBlockConfig;
  isEditing?: boolean;
}

export function LinkBlock({ config, isEditing = false }: LinkBlockProps) {
  // Sanitised (no javascript: or data:), and '' for a placeholder such as
  // '#' or example.com, which a visitor would click and go nowhere (US-327).
  const safeUrl = usableLinkUrl(config.url);

  // A button with no destination is not published.
  if (!isEditing && !safeUrl) return null;

  const handleClick = () => {
    if (isEditing || !safeUrl) return;

    if (config.openInNewTab) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = safeUrl;
    }
  };

  const renderButton = () => (
    <Button
      onClick={handleClick}
      disabled={isEditing}
      className="w-full gap-2 justify-between"
      variant={config.style === 'minimal' ? 'ghost' : 'default'}
      size="lg"
    >
      <span className="flex items-center gap-2">
        {config.icon && <span>{config.icon}</span>}
        {config.title}
      </span>
      {config.openInNewTab ? (
        <ExternalLink className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </Button>
  );

  const renderCard = () => (
    <div
      onClick={handleClick}
      className={`
                p-4 rounded-lg border bg-white hover:shadow-md transition-all
                ${!isEditing && 'cursor-pointer hover:border-primary'}
            `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.icon && <div className="text-2xl">{config.icon}</div>}
          <span className="font-semibold">{config.title}</span>
        </div>
        {config.openInNewTab ? (
          <ExternalLink className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div
      onClick={handleClick}
      className={`
                py-3 px-4 text-center
                ${!isEditing && 'cursor-pointer hover:text-primary'}
                transition-colors
            `}
    >
      <span className="flex items-center justify-center gap-2">
        {config.icon && <span>{config.icon}</span>}
        <span className="font-medium">{config.title}</span>
        {config.openInNewTab && <ExternalLink className="w-4 h-4" />}
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {config.style === 'button' && renderButton()}
      {config.style === 'card' && renderCard()}
      {config.style === 'minimal' && renderMinimal()}
      {isEditing && !safeUrl && (
        <p role="note" className="mt-2 text-sm text-muted-foreground">
          No destination yet, so this button is hidden on your public page. Add a URL in the block
          settings.
        </p>
      )}
    </div>
  );
}
