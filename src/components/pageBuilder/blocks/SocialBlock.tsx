/**
 * Social Links Block Component
 * Displays social media links
 */

import { SocialBlockConfig } from "@/types/pageBuilder";
import {
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Youtube,
    Music,
    Home,
    Building,
} from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface SocialBlockProps {
    config: SocialBlockConfig;
    isEditing?: boolean;
}

export function SocialBlock({ config, isEditing = false }: SocialBlockProps) {
    const getIcon = (platform: string) => {
        const iconClass = `w-${
            config.iconSize === "small"
                ? "5"
                : config.iconSize === "large"
                ? "8"
                : "6"
        } h-${
            config.iconSize === "small"
                ? "5"
                : config.iconSize === "large"
                ? "8"
                : "6"
        }`;

        switch (platform) {
            case "facebook":
                return <Facebook className={iconClass} />;
            case "instagram":
                return <Instagram className={iconClass} />;
            case "twitter":
                return <Twitter className={iconClass} />;
            case "linkedin":
                return <Linkedin className={iconClass} />;
            case "youtube":
                return <Youtube className={iconClass} />;
            case "tiktok":
                return <Music className={iconClass} />;
            case "zillow":
                return <Home className={iconClass} />;
            case "realtor":
                return <Building className={iconClass} />;
            default:
                return null;
        }
    };

    const getPlatformColor = (platform: string) => {
        const colors: Record<string, string> = {
            facebook: "hover:bg-blue-600",
            instagram: "hover:bg-pink-600",
            twitter: "hover:bg-sky-500",
            linkedin: "hover:bg-blue-700",
            youtube: "hover:bg-red-600",
            tiktok: "hover:bg-black",
            zillow: "hover:bg-blue-800",
            realtor: "hover:bg-red-700",
        };
        return colors[platform] || "hover:bg-gray-700";
    };

    const handleClick = (url: string) => {
        if (!isEditing) {
            // Sanitize URL to prevent XSS via javascript: or data: protocols
            const safeUrl = sanitizeUrl(url);
            if (safeUrl) {
                window.open(safeUrl, "_blank", "noopener,noreferrer");
            }
        }
    };

    const getLayoutClass = () => {
        switch (config.layout) {
            case "vertical":
                return "flex-col items-center";
            case "grid":
                return "grid grid-cols-4 gap-3";
            case "horizontal":
            default:
                return "flex-row justify-center";
        }
    };

    return (
        <div className="space-y-4">
            {/* Title */}
            {config.title && (
                <h3 className="text-xl font-semibold text-center">
                    {config.title}
                </h3>
            )}

            {/* Social Links */}
            <div className={`flex gap-3 ${getLayoutClass()}`}>
                {config.links.map((link) => {
                    const platformLabel = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
                    const accessibleLabel = link.username
                        ? `${platformLabel}: ${link.username}`
                        : `Visit our ${platformLabel} profile`;
                    return (
                        <button
                            key={link.id}
                            onClick={() => handleClick(link.url)}
                            disabled={isEditing}
                            aria-label={accessibleLabel}
                            className={`
                                p-3 rounded-full bg-gray-800 text-white
                                transition-all hover:scale-110
                                ${getPlatformColor(link.platform)}
                                ${isEditing ? "cursor-default" : "cursor-pointer"}
                            `}
                        >
                            <span aria-hidden="true">{getIcon(link.platform)}</span>
                            <span className="sr-only">{accessibleLabel}</span>
                        </button>
                    );
                })}
            </div>

            {/* Empty State */}
            {config.links.length === 0 && isEditing && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No social links added yet</p>
                </div>
            )}
        </div>
    );
}
