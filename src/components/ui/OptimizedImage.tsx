import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ImageSource {
  url: string;
  width: number;
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Primary image source URL */
  src: string;
  /** Required alt text for accessibility and SEO */
  alt: string;
  /** Optional WebP source for modern browsers */
  webpSrc?: string;
  /** Optional array of image sources for srcset */
  sources?: ImageSource[];
  /** Optional WebP sources for srcset */
  webpSources?: ImageSource[];
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Whether to lazy load the image (default: true) */
  lazy?: boolean;
  /** Optional placeholder for blur-up effect */
  placeholder?: string;
  /** Image width for aspect ratio */
  width?: number;
  /** Image height for aspect ratio */
  height?: number;
  /** CSS class for the image */
  className?: string;
  /** CSS class for the container */
  containerClassName?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Priority loading for LCP images */
  priority?: boolean;
  /** Image caption for schema markup */
  caption?: string;
}

/**
 * OptimizedImage Component
 *
 * Features:
 * - WebP format support with fallback
 * - Responsive srcset for different screen sizes
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Proper alt text enforcement (required prop)
 * - Schema.org ImageObject markup
 * - Priority loading for above-the-fold images
 *
 * @example
 * <OptimizedImage
 *   src="/images/property.jpg"
 *   webpSrc="/images/property.webp"
 *   alt="Beautiful 3-bedroom home in Miami"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   sources={[
 *     { url: '/images/property-400.jpg', width: 400 },
 *     { url: '/images/property-800.jpg', width: 800 },
 *     { url: '/images/property-1200.jpg', width: 1200 },
 *   ]}
 * />
 */
export function OptimizedImage({
  src,
  alt,
  webpSrc,
  sources = [],
  webpSources = [],
  sizes = '100vw',
  lazy = true,
  placeholder,
  width,
  height,
  className,
  containerClassName,
  onLoad,
  priority = false,
  caption,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);

  // Generate srcset from sources
  const generateSrcSet = (imageSources: ImageSource[]): string => {
    if (imageSources.length === 0) return '';
    return imageSources
      .map(source => `${source.url} ${source.width}w`)
      .join(', ');
  };

  const jpgSrcSet = generateSrcSet(sources);
  const webpSrcSet = generateSrcSet(webpSources);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    const element = document.getElementById(`optimized-img-${src.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src, lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    console.error('Failed to load image:', src);
  };

  // Calculate aspect ratio for preventing layout shift
  const aspectRatio = width && height ? width / height : undefined;

  return (
    <figure
      id={`optimized-img-${src.replace(/[^a-zA-Z0-9]/g, '-')}`}
      className={cn('relative overflow-hidden', containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
      itemScope
      itemType="https://schema.org/ImageObject"
    >
      {/* Placeholder for blur-up effect */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-300',
            isLoaded && 'opacity-0'
          )}
        />
      )}

      {/* Loading skeleton when no placeholder */}
      {!placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      {/* Picture element with WebP and fallback */}
      {isInView && (
        <picture>
          {/* WebP sources for modern browsers */}
          {webpSrc && (
            <source
              type="image/webp"
              srcSet={webpSrcSet || webpSrc}
              sizes={sizes}
            />
          )}

          {/* JPEG/PNG fallback with srcset */}
          {jpgSrcSet && (
            <source
              srcSet={jpgSrcSet}
              sizes={sizes}
            />
          )}

          {/* Main image */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              !isLoaded && 'opacity-0',
              isLoaded && 'opacity-100',
              className
            )}
            itemProp="contentUrl"
            {...props}
          />
        </picture>
      )}

      {/* Schema.org metadata */}
      <meta itemProp="name" content={alt} />
      {caption && <meta itemProp="caption" content={caption} />}
      {width && <meta itemProp="width" content={String(width)} />}
      {height && <meta itemProp="height" content={String(height)} />}

      {/* Visible caption if provided */}
      {caption && (
        <figcaption className="sr-only" itemProp="description">
          {caption}
        </figcaption>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </figure>
  );
}

/**
 * Utility to generate responsive image sources from a base URL
 * Assumes images are stored with width suffixes (e.g., image-400.jpg, image-800.jpg)
 */
export function generateResponsiveSources(
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600]
): { sources: ImageSource[]; webpSources: ImageSource[] } {
  const extension = baseUrl.split('.').pop() || 'jpg';
  const basePath = baseUrl.replace(`.${extension}`, '');

  const sources: ImageSource[] = widths.map(width => ({
    url: `${basePath}-${width}.${extension}`,
    width
  }));

  const webpSources: ImageSource[] = widths.map(width => ({
    url: `${basePath}-${width}.webp`,
    width
  }));

  return { sources, webpSources };
}

/**
 * Utility to generate Supabase Storage optimized URLs
 * Uses Supabase's image transformation API
 */
export function generateSupabaseImageSources(
  storageUrl: string,
  widths: number[] = [400, 800, 1200]
): { sources: ImageSource[]; webpSources: ImageSource[] } {
  // Supabase storage transformation URL pattern
  // https://your-project.supabase.co/storage/v1/render/image/public/bucket/path?width=400&format=webp

  const sources: ImageSource[] = widths.map(width => ({
    url: `${storageUrl}?width=${width}&quality=80`,
    width
  }));

  const webpSources: ImageSource[] = widths.map(width => ({
    url: `${storageUrl}?width=${width}&format=webp&quality=80`,
    width
  }));

  return { sources, webpSources };
}
