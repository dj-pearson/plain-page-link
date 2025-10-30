import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SubscriptionGuardProps {
  children: ReactNode;
  resource: string;
  currentCount: number;
  feature?: string;
}

export const SubscriptionGuard = ({ 
  children, 
  resource, 
  currentCount,
  feature 
}: SubscriptionGuardProps) => {
  const { checkLimit, hasFeature, subscription } = useSubscription();
  const navigate = useNavigate();

  const canProceed = feature 
    ? hasFeature(feature)
    : checkLimit(resource, currentCount);

  if (!canProceed) {
    const limit = subscription?.limits[resource] || 0;
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Usage Limit Reached</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            {feature 
              ? `This feature requires a higher plan. Upgrade to access ${feature.replace(/_/g, ' ')}.`
              : `You've reached your limit of ${limit} ${resource}. Upgrade your plan to add more.`
            }
          </p>
          <Button onClick={() => navigate('/pricing')} size="sm">
            View Plans
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};