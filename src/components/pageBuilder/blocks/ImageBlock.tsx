/**
 * Image Block Component
 * Displays an image with optional caption and link
 */

import { ImageBlockConfig } from "@/types/pageBuilder";
import { ImageIcon } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface ImageBlockProps {
    config: ImageBlockConfig;
    isEditing?: boolean;
}

export function ImageBlock({ config, isEditing = false }: ImageBlockProps) {
    const getSizeClass = () => {
        switch (config.size) {
            case "small":
                return "max-w-sm";
            case "medium":
                return "max-w-md";
            case "large":
                return "max-w-2xl";
            case "full":
                return "w-full";
            default:
                return "max-w-md";
        }
    };

    // US-233: a linked image is an <a href>, not a <div onClick> a keyboard
    // cannot reach. The link opens in a new tab, as it always did.
    const safeLink = !isEditing && config.link ? sanitizeUrl(config.link) : null;

    // Sanitize image URL
    const safeImageUrl = sanitizeUrl(config.imageUrl || "");

    if (!config.imageUrl && isEditing) {
        return (
            <div className={`${getSizeClass()} mx-auto`}>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-medium">No image</p>
                        <p className="text-sm">Upload an image</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${getSizeClass()} mx-auto space-y-2`}>
            {safeLink ? (
                <a
                    href={safeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <img src={safeImageUrl} alt={config.alt} className="w-full h-auto" />
                    <span className="sr-only"> (opens in a new tab)</span>
                </a>
            ) : (
                <div className="rounded-lg overflow-hidden">
                    <img src={safeImageUrl} alt={config.alt} className="w-full h-auto" />
                </div>
            )}

            {/* Caption */}
            {config.caption && (
                <p className="text-sm text-gray-600 text-center italic">
                    {config.caption}
                </p>
            )}
        </div>
    );
}
