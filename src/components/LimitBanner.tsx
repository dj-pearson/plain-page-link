import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LimitBannerProps {
  feature: string;
  current: number;
  limit: number;
  className?: string;
}

export function LimitBanner({ feature, current, limit, className }: LimitBannerProps) {
  const percentage = (current / limit) * 100;
  const isAtLimit = current >= limit;
  const isNearLimit = percentage >= 80;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <Alert
      className={className}
      variant={isAtLimit ? "destructive" : "default"}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold mb-2">
            {isAtLimit
              ? `You've reached your ${feature} limit`
              : `You're running out of ${feature}`}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {current} of {limit} used
              </span>
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </div>
        <Link to="/pricing">
          <Button size="sm" variant={isAtLimit ? "secondary" : "outline"}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}