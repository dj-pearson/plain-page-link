import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImprovedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryContent?: React.ReactNode;
}

export function ImprovedEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryContent,
}: ImprovedEmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>

      {secondaryContent && (
        <div className="mb-6">
          {secondaryContent}
        </div>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
