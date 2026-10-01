/**
 * CTA (Call-to-Action) Block Component
 * Prominent call-to-action section with eye-catching design
 */

import { CTABlockConfig } from "@/types/pageBuilder";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface CTABlockProps {
    config: CTABlockConfig;
    isEditing?: boolean;
}

export function CTABlock({ config, isEditing = false }: CTABlockProps) {
    const handleClick = () => {
        if (isEditing) return;
        const safeUrl = sanitizeUrl(config.buttonUrl);
        if (!safeUrl) return;
        if (config.openInNewTab) {
            window.open(safeUrl, "_blank", "noopener,noreferrer");
        } else {
            window.location.href = safeUrl;
        }
    };

    // US-234: text on a theme fill uses --theme-on-* (black or white, chosen
    // from the colour) instead of hard-coded white, which was 1.67:1 on Luxe.
    // The inverse button is the on-colour filled with the primary as text, so
    // it passes whenever the fill does — "white with primary text" did not on
    // any theme with a light primary.
    const ON_PRIMARY = "var(--theme-on-primary, #ffffff)";
    const PRIMARY = "var(--theme-primary, #2563eb)";

    const getVariantStyles = (): React.CSSProperties => {
        switch (config.variant) {
            case "gradient":
                return {
                    background: "linear-gradient(135deg, var(--theme-primary, #2563eb) 0%, var(--theme-accent, #7c3aed) 100%)",
                    color: ON_PRIMARY,
                    borderRadius: "var(--theme-border-radius, 0.75rem)",
                };
            case "outline":
                return {
                    background: "transparent",
                    border: `2px solid var(--theme-primary, #2563eb)`,
                    color: "var(--theme-primary, #2563eb)",
                    borderRadius: "var(--theme-border-radius, 0.75rem)",
                };
            case "solid":
            default:
                return {
                    background: PRIMARY,
                    color: ON_PRIMARY,
                    borderRadius: "var(--theme-border-radius, 0.75rem)",
                };
        }
    };

    const getButtonStyles = (): React.CSSProperties => {
        switch (config.variant) {
            case "gradient":
                return {
                    backgroundColor: ON_PRIMARY,
                    color: PRIMARY,
                    borderRadius: "var(--theme-border-radius, 0.5rem)",
                };
            case "outline":
                return {
                    backgroundColor: PRIMARY,
                    color: ON_PRIMARY,
                    borderRadius: "var(--theme-border-radius, 0.5rem)",
                };
            case "solid":
            default:
                return {
                    backgroundColor: ON_PRIMARY,
                    color: PRIMARY,
                    borderRadius: "var(--theme-border-radius, 0.5rem)",
                };
        }
    };

    return (
        <div
            className="p-8 md:p-12 text-center space-y-4"
            style={getVariantStyles()}
        >
            <h3
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: "var(--theme-font-heading, inherit)" }}
            >
                {config.headline}
            </h3>

            {config.description && (
                <p className="text-lg opacity-90 max-w-xl mx-auto">
                    {config.description}
                </p>
            )}

            <Button
                onClick={handleClick}
                disabled={isEditing}
                size="lg"
                className="mt-4 gap-2 text-base px-8 font-semibold hover:scale-105 transition-transform shadow-lg"
                style={getButtonStyles()}
            >
                {config.buttonText || "Get Started"}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>
        </div>
    );
}
