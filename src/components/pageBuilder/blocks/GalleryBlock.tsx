/**
 * Gallery Block Component
 * Photo showcase with multiple layout options
 */

import { useRef, useState } from 'react';
import { GalleryBlockConfig } from '@/types/pageBuilder';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface GalleryBlockProps {
  config: GalleryBlockConfig;
  isEditing?: boolean;
}

export function GalleryBlock({ config, isEditing = false }: GalleryBlockProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // The modal Dialog returns focus to its Trigger on close; the lightbox is
  // opened from whichever tile was activated, so remember that tile and send
  // focus back to it ourselves.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const getGridClass = () => {
    const cols = config.columns || 3;
    switch (config.layout) {
      case 'masonry':
        return `columns-${cols} gap-4 space-y-4`;
      case 'carousel':
        return 'flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4';
      case 'grid':
      default:
        return `grid grid-cols-2 ${cols >= 3 ? 'md:grid-cols-3' : ''} ${cols >= 4 ? 'lg:grid-cols-4' : ''} gap-3`;
    }
  };

  const openLightbox = (index: number) => {
    if (!isEditing) {
      setLightboxIndex(index);
    }
  };

  const closeLightbox = () => setLightboxIndex(null);

  const total = config.images.length;
  const current = lightboxIndex !== null ? (config.images[lightboxIndex] ?? null) : null;

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
          style={{ fontFamily: 'var(--theme-font-heading, inherit)' }}
        >
          {config.title}
        </h3>
      )}

      <div className={getGridClass()}>
        {config.images.map((image, index) => {
          const tileClass = `group relative block w-full overflow-hidden rounded-lg ${
            config.layout === 'carousel' ? 'min-w-[280px] snap-center flex-shrink-0' : ''
          } ${config.layout === 'masonry' ? 'break-inside-avoid' : ''}`;
          const tileContent = (
            <>
              <img
                src={image.url}
                alt={image.alt}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  config.layout === 'masonry' ? 'h-auto' : 'aspect-square'
                }`}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              )}
            </>
          );

          // In the editor the tiles are inert; on the public page each
          // one is a real button so keyboards and screen readers can
          // open the lightbox (US-245).
          return isEditing ? (
            <div key={image.id} className={tileClass}>
              {tileContent}
            </div>
          ) : (
            <button
              key={image.id}
              type="button"
              className={`${tileClass} cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                openLightbox(index);
              }}
              aria-label={`Open photo ${index + 1} of ${total}${image.alt ? `: ${image.alt}` : ''}`}
            >
              {tileContent}
            </button>
          );
        })}
      </div>

      {/* Lightbox: Radix Dialog gives the focus trap, Escape and a title. */}
      {!isEditing && (
        <Dialog
          open={current !== null}
          onOpenChange={(open) => {
            if (!open) closeLightbox();
          }}
        >
          <DialogContent
            className="max-w-none w-screen h-[100dvh] max-h-none sm:w-screen rounded-none sm:rounded-none border-0 bg-black/95 p-0 sm:p-0 flex items-center justify-center"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              openerRef.current?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImage();
              }
            }}
            {...(current?.caption ? {} : { 'aria-describedby': undefined })}
          >
            {current && lightboxIndex !== null && (
              <>
                <DialogTitle className="sr-only">
                  {`Photo ${lightboxIndex + 1} of ${total}${current.alt ? `: ${current.alt}` : ''}`}
                </DialogTitle>
                {total > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="Previous photo"
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
                    >
                      <ChevronLeft className="w-8 h-8" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next photo"
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
                    >
                      <ChevronRight className="w-8 h-8" aria-hidden="true" />
                    </button>
                  </>
                )}
                <img
                  src={current.url}
                  alt={current.alt}
                  className="max-w-[90vw] max-h-[85vh] object-contain"
                />
                {current.caption && (
                  <DialogDescription className="absolute bottom-8 left-0 right-0 text-white text-sm sm:text-base text-center px-8">
                    {current.caption}
                  </DialogDescription>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
