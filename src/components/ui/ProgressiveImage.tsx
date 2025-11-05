import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
}

/**
 * Progressive Image component with blur-up effect
 * Shows a low-quality placeholder that transitions to high-quality image
 */
export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  className,
  containerClassName,
  onLoad,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    const element = document.getElementById(`progressive-img-${src}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [src]);

  // Load high-quality image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      // If high-quality fails, keep showing placeholder
      console.error('Failed to load image:', src);
    };
  }, [isInView, src, onLoad]);

  return (
    <div
      id={`progressive-img-${src}`}
      className={cn('relative overflow-hidden bg-gray-100', containerClassName)}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          !isLoaded && placeholderSrc && 'blur-sm scale-110',
          isLoaded && 'blur-0 scale-100',
          className
        )}
        loading="lazy"
        {...props}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/**
 * Generate a tiny placeholder image data URL
 * This can be used as placeholderSrc for blur-up effect
 */
export function generatePlaceholder(width: number = 20, height: number = 20): string {
  // Create a tiny canvas for placeholder
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Fill with gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}
