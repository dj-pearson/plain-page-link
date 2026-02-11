/**
 * Hero Block Component
 * Prominent header section with background image, gradient overlay, and CTA
 */

import { HeroBlockConfig } from "@/types/pageBuilder";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface HeroBlockProps {
    config: HeroBlockConfig;
    isEditing?: boolean;
}

export function HeroBlock({ config, isEditing = false }: HeroBlockProps) {
    const getHeightClass = () => {
        switch (config.height) {
            case "small": return "min-h-[200px]";
            case "large": return "min-h-[400px]";
            case "medium":
            default: return "min-h-[300px]";
        }
    };

    const getOverlayStyle = (): React.CSSProperties => {
        switch (config.backgroundOverlay) {
            case "light":
                return { background: "rgba(255,255,255,0.6)" };
            case "dark":
                return { background: "rgba(0,0,0,0.55)" };
            case "gradient":
                return { background: "linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(124,58,237,0.85) 100%)" };
            case "none":
            default:
                return config.backgroundImageUrl
                    ? { background: "rgba(0,0,0,0.3)" }
                    : {};
        }
    };

    const getTextColor = () => {
        if (!config.backgroundImageUrl && config.backgroundOverlay !== "gradient") {
            return "text-current";
        }
        if (config.backgroundOverlay === "light") return "text-gray-900";
        return "text-white";
    };

    const getLayoutClass = () => {
        switch (config.layout) {
            case "left": return "items-start text-left";
            case "split": return "items-start text-left md:items-center md:text-left";
            case "centered":
            default: return "items-center text-center";
        }
    };

    const handleCtaClick = () => {
        if (isEditing || !config.ctaUrl) return;
        const safeUrl = sanitizeUrl(config.ctaUrl);
        if (safeUrl) {
            window.open(safeUrl, "_blank", "noopener,noreferrer");
        }
    };

    if (!config.headline && isEditing) {
        return (
            <div className={`${getHeightClass()} rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50`}>
                <div className="text-center text-gray-500">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 text-blue-400" />
                    <p className="font-medium">Hero Section</p>
                    <p className="text-sm">Add a headline to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative ${getHeightClass()} rounded-xl overflow-hidden flex`}
            style={{
                backgroundImage: config.backgroundImageUrl
                    ? `url(${config.backgroundImageUrl})`
                    : "linear-gradient(135deg, var(--theme-primary, #2563eb) 0%, var(--theme-accent, #7c3aed) 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0"
                style={getOverlayStyle()}
            />

            {/* Content */}
            <div className={`relative z-10 flex flex-col ${getLayoutClass()} justify-center w-full p-8 md:p-12`}>
                <h1
                    className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight ${getTextColor()}`}
                    style={{ fontFamily: "var(--theme-font-heading, inherit)" }}
                >
                    {config.headline}
                </h1>

                {config.subheadline && (
                    <p className={`mt-4 text-lg md:text-xl opacity-90 max-w-2xl ${getTextColor()}`}>
                        {config.subheadline}
                    </p>
                )}

                {config.ctaText && (
                    <Button
                        onClick={handleCtaClick}
                        disabled={isEditing}
                        size="lg"
                        className="mt-6 gap-2 text-base px-8 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        style={{
                            backgroundColor: "var(--theme-primary, #2563eb)",
                            borderRadius: "var(--theme-border-radius, 0.5rem)",
                        }}
                    >
                        {config.ctaText}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
