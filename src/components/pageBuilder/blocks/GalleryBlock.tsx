/**
 * Gallery Block Component
 * Photo showcase with multiple layout options
 */

import { useState } from "react";
import { GalleryBlockConfig } from "@/types/pageBuilder";
import { ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryBlockProps {
    config: GalleryBlockConfig;
    isEditing?: boolean;
}

export function GalleryBlock({ config, isEditing = false }: GalleryBlockProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const getGridClass = () => {
        const cols = config.columns || 3;
        switch (config.layout) {
            case "masonry":
                return `columns-${cols} gap-4 space-y-4`;
            case "carousel":
                return "flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4";
            case "grid":
            default:
                return `grid grid-cols-2 ${cols >= 3 ? "md:grid-cols-3" : ""} ${cols >= 4 ? "lg:grid-cols-4" : ""} gap-3`;
        }
    };

    const openLightbox = (index: number) => {
        if (!isEditing) {
            setLightboxIndex(index);
        }
    };

    const closeLightbox = () => setLightboxIndex(null);

    const nextImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % config.images.length);
        }
    };

    const prevImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + config.images.length) % config.images.length);
        }
    };

    if (config.images.length === 0 && isEditing) {
        return (
            <div className="text-center py-12">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 font-medium">Gallery Block</p>
                <p className="text-sm text-gray-400">Add images in the settings panel</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {config.title && (
                <h3
                    className="text-2xl font-bold text-center"
                    style={{ fontFamily: "var(--theme-font-heading, inherit)" }}
                >
                    {config.title}
                </h3>
            )}

            <div className={getGridClass()}>
                {config.images.map((image, index) => (
                    <div
                        key={image.id}
                        className={`group relative overflow-hidden rounded-lg ${
                            config.layout === "carousel" ? "min-w-[280px] snap-center flex-shrink-0" : ""
                        } ${config.layout === "masonry" ? "break-inside-avoid" : ""}`}
                        onClick={() => openLightbox(index)}
                    >
                        <img
                            src={image.url}
                            alt={image.alt}
                            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                config.layout === "masonry" ? "h-auto" : "aspect-square"
                            } ${!isEditing ? "cursor-pointer" : ""}`}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        {image.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm">{image.caption}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && !isEditing && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    <img
                        src={config.images[lightboxIndex].url}
                        alt={config.images[lightboxIndex].alt}
                        className="max-w-[90vw] max-h-[85vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {config.images[lightboxIndex].caption && (
                        <p className="absolute bottom-8 text-white text-center px-8">
                            {config.images[lightboxIndex].caption}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
