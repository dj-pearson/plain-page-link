import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Crown } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentPlan?: string;
  requiredPlan?: string;
}

const featureRecommendations: Record<string, { plan: string; icon: typeof Zap }> = {
  listings: { plan: "Starter", icon: TrendingUp },
  testimonials: { plan: "Starter", icon: Crown },
  links: { plan: "Starter", icon: TrendingUp },
  custom_domain: { plan: "Professional", icon: Crown },
  lead_export: { plan: "Starter", icon: TrendingUp },
  analytics: { plan: "Professional", icon: TrendingUp },
  premium_themes: { plan: "Professional", icon: Crown },
};

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  currentPlan = "Free",
  requiredPlan,
}: UpgradeModalProps) {
  const recommendation = featureRecommendations[feature] || { plan: "Professional", icon: Zap };
  const Icon = recommendation.icon;
  const suggestedPlan = requiredPlan || recommendation.plan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to unlock {feature.replace(/_/g, " ")}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            You've reached the limit of your <Badge variant="secondary">{currentPlan}</Badge> plan.
            Upgrade to <Badge variant="default">{suggestedPlan}</Badge> to unlock this feature.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <h4 className="font-semibold mb-2">What you'll get:</h4>
          <ul className="space-y-2 text-sm">
            {feature === "listings" && (
              <>
                <li className="flex items-center gap-2">✓ Up to 20 active listings (Starter)</li>
                <li className="flex items-center gap-2">✓ Featured property showcase</li>
                <li className="flex items-center gap-2">✓ Sold properties tracking</li>
              </>
            )}
            {feature === "testimonials" && (
              <>
                <li className="flex items-center gap-2">✓ Up to 10 testimonials (Starter)</li>
                <li className="flex items-center gap-2">✓ Client reviews showcase</li>
                <li className="flex items-center gap-2">✓ Rating display</li>
              </>
            )}
            {feature === "links" && (
              <>
                <li className="flex items-center gap-2">✓ Up to 15 custom links (Starter)</li>
                <li className="flex items-center gap-2">✓ Link analytics</li>
                <li className="flex items-center gap-2">✓ Custom icons</li>
              </>
            )}
            {feature === "lead_export" && (
              <>
                <li className="flex items-center gap-2">✓ Export all leads to CSV</li>
                <li className="flex items-center gap-2">✓ CRM integration ready</li>
                <li className="flex items-center gap-2">✓ Lead management tools</li>
              </>
            )}
            {feature === "custom_domain" && (
              <>
                <li className="flex items-center gap-2">✓ Connect your own domain</li>
                <li className="flex items-center gap-2">✓ Professional branding</li>
                <li className="flex items-center gap-2">✓ SSL certificate included</li>
              </>
            )}
            {feature === "premium_themes" && (
              <>
                <li className="flex items-center gap-2">✓ 10+ premium themes</li>
                <li className="flex items-center gap-2">✓ 3D animated backgrounds</li>
                <li className="flex items-center gap-2">✓ Advanced customization</li>
              </>
            )}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Link to="/pricing">
            <Button className="w-full sm:w-auto">
              <Zap className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}