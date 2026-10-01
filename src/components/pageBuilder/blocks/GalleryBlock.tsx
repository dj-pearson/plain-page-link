/**
 * Gallery Block Component
 * Photo showcase with multiple layout options
 */

import { useRef, useState } from "react";
import { GalleryBlockConfig } from "@/types/pageBuilder";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface GalleryBlockProps {
    config: GalleryBlockConfig;
    isEditing?: boolean;
}

export function GalleryBlock({ config, isEditing = false }: GalleryBlockProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    // Radix returns focus only to a DialogTrigger; these thumbnails open the
    // dialog themselves, so remember which one did.
    const openerRef = useRef<HTMLElement | null>(null);

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
            openerRef.current = document.activeElement as HTMLElement | null;
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

            {/* US-233: thumbnails were clickable <div>s and the lightbox a
                hand-built overlay — no dialog role, no Escape, no focus trap or
                return, and three unnamed icon buttons. Buttons and the shared
                Radix Dialog now. */}
            <ul className={getGridClass()}>
                {config.images.map((image, index) => {
                    const imgClass = `w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        config.layout === "masonry" ? "h-auto" : "aspect-square"
                    }`;
                    const overlay = (
                        <>
                            <img src={image.url} alt={image.alt} className={imgClass} />
                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" aria-hidden="true" />
                            {image.caption && (
                                <span className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                                    <span className="text-white text-sm">{image.caption}</span>
                                </span>
                            )}
                        </>
                    );
                    return (
                        <li
                            key={image.id}
                            className={`group relative overflow-hidden rounded-lg ${
                                config.layout === "carousel" ? "min-w-[280px] snap-center flex-shrink-0" : ""
                            } ${config.layout === "masonry" ? "break-inside-avoid" : ""}`}
                        >
                            {isEditing ? (
                                <div className="relative">{overlay}</div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => openLightbox(index)}
                                    className="relative block w-full text-left focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label={`View larger: ${image.alt || `photo ${index + 1}`} (${index + 1} of ${config.images.length})`}
                                >
                                    {overlay}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            <Dialog open={lightboxIndex !== null && !isEditing} onOpenChange={(open) => !open && closeLightbox()}>
                <DialogContent
                    className="max-w-[95vw] sm:max-w-5xl bg-black/95 border-0 p-4 sm:p-8 text-white"
                    onCloseAutoFocus={(e) => {
                        if (openerRef.current) {
                            e.preventDefault();
                            openerRef.current.focus();
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowRight") nextImage();
                        if (e.key === "ArrowLeft") prevImage();
                    }}
                >
                    {lightboxIndex !== null && (
                        <>
                            <DialogTitle className="sr-only">
                                {config.title ? `${config.title}: ` : ""}photo {lightboxIndex + 1} of {config.images.length}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Use the previous and next buttons, or the left and right arrow keys, to move between photos.
                            </DialogDescription>
                            <div className="relative flex items-center justify-center">
                                <img
                                    src={config.images[lightboxIndex].url}
                                    alt={config.images[lightboxIndex].alt}
                                    className="max-w-full max-h-[75vh] object-contain"
                                />
                                {config.images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={prevImage}
                                            aria-label="Previous photo"
                                            className="absolute left-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white"
                                        >
                                            <ChevronLeft className="w-7 h-7" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextImage}
                                            aria-label="Next photo"
                                            className="absolute right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white"
                                        >
                                            <ChevronRight className="w-7 h-7" aria-hidden="true" />
                                        </button>
                                    </>
                                )}
                            </div>
                            {config.images[lightboxIndex].caption && (
                                <p className="mt-4 text-center text-white">{config.images[lightboxIndex].caption}</p>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
