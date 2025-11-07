# Image Optimization Guide for AgentBio.net

**Last Updated**: November 2025
**Purpose**: Comprehensive guide for implementing image optimization strategies across the AgentBio platform

## Table of Contents
1. [Alt Text Guidelines](#alt-text-guidelines)
2. [WebP Implementation](#webp-implementation)
3. [Lazy Loading Strategy](#lazy-loading-strategy)
4. [Image Sizing & Responsive Images](#image-sizing--responsive-images)
5. [Implementation Checklist](#implementation-checklist)
6. [Helper Functions & Components](#helper-functions--components)
7. [Performance Metrics](#performance-metrics)

---

## Alt Text Guidelines

### Purpose of Alt Text
Alt text serves three critical functions:
1. **Accessibility**: Screen readers describe images to visually impaired users
2. **SEO**: Search engines understand image content and context
3. **Fallback**: Displays when images fail to load

### Alt Text Best Practices

#### ✅ DO:
- **Be descriptive and specific**: "Professional headshot of Sarah Johnson, real estate agent in downtown Chicago"
- **Include context**: "Modern kitchen with white cabinets and stainless steel appliances in Lincoln Park home"
- **Keep it concise**: 125 characters or less (screen reader limitation)
- **Include relevant keywords naturally**: "Luxury condominium lobby featuring marble floors and chandelier"
- **Describe the function for clickable images**: "Click to view full property gallery"
- **Use empty alt="" for decorative images**: Background patterns, spacers, purely decorative icons

#### ❌ DON'T:
- Start with "Image of" or "Picture of" (screen readers already announce "image")
- Keyword stuff: "real estate agent property home house listing for sale best realtor"
- Use file names: "IMG_1234.jpg"
- Repeat surrounding text verbatim
- Include irrelevant details: "Photo taken on sunny day with blue sky"

### Alt Text Formula by Image Type

#### Agent Profile Photos
```
Format: [Name], [Title] in [Location]
Example: "Michael Chen, luxury real estate specialist in San Francisco"
```

#### Property Listings
```
Format: [Property type] [key feature] in [neighborhood/city]
Example: "3-bedroom Victorian home with bay windows in Pacific Heights"
```

#### Interior Photos
```
Format: [Room type] featuring [1-2 standout features]
Example: "Master bedroom with walk-in closet and city views"
```

#### Neighborhood/Location Photos
```
Format: [Landmark/area] in [neighborhood]
Example: "Tree-lined street in the historic Wicker Park district"
```

#### Marketing Images
```
Format: [What the image represents/conveys]
Example: "Happy family moving into new home with moving boxes"
```

#### Logo/Branding
```
Format: [Company name] logo
Example: "AgentBio logo"
```

---

## WebP Implementation

### Why WebP?
- **25-35% smaller** file size than JPEG at same quality
- **26% smaller** than PNG for lossless compression
- Supports transparency (like PNG) and animation (like GIF)
- Supported by 95%+ of browsers (as of 2024)

### Implementation Strategy

#### Option 1: Picture Element with Fallback (Recommended)
```jsx
<picture>
  <source
    srcSet="/images/agent-photo.webp"
    type="image/webp"
  />
  <source
    srcSet="/images/agent-photo.jpg"
    type="image/jpeg"
  />
  <img
    src="/images/agent-photo.jpg"
    alt="Sarah Johnson, real estate agent in downtown Chicago"
    loading="lazy"
    width="400"
    height="400"
  />
</picture>
```

#### Option 2: Responsive Images with WebP
```jsx
<picture>
  <source
    type="image/webp"
    srcSet="
      /images/property-320w.webp 320w,
      /images/property-640w.webp 640w,
      /images/property-960w.webp 960w,
      /images/property-1280w.webp 1280w
    "
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  <source
    type="image/jpeg"
    srcSet="
      /images/property-320w.jpg 320w,
      /images/property-640w.jpg 640w,
      /images/property-960w.jpg 960w,
      /images/property-1280w.jpg 1280w
    "
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  <img
    src="/images/property-640w.jpg"
    alt="Luxury condominium with lake views"
    loading="lazy"
    width="960"
    height="640"
  />
</picture>
```

### WebP Conversion Tools

#### Build-Time Conversion (Recommended)
```bash
# Using sharp in Node.js build process
npm install sharp

# Convert images during build
const sharp = require('sharp');

sharp('input.jpg')
  .webp({ quality: 80 })
  .toFile('output.webp');
```

#### Online Tools
- Squoosh.app (Google)
- CloudConvert.com
- TinyPNG.com (also supports WebP)

#### Vite Plugin (For Build Integration)
```bash
npm install vite-plugin-webp
```

```javascript
// vite.config.ts
import webp from 'vite-plugin-webp';

export default {
  plugins: [
    webp({
      quality: 80,
      autoUseWebP: true
    })
  ]
};
```

---

## Lazy Loading Strategy

### Native Lazy Loading (Recommended)
```jsx
<img
  src="/images/property.jpg"
  alt="Modern apartment in downtown"
  loading="lazy"
  width="800"
  height="600"
/>
```

### When to Use Lazy Loading

#### ✅ DO Use Lazy Loading:
- Images below the fold
- Gallery images
- Property listing cards
- Blog article featured images (if not in viewport)
- Testimonial avatars in long lists
- Footer images

#### ❌ DON'T Use Lazy Loading:
- Hero images (largest contentful paint)
- Logo in header
- Critical above-the-fold images
- First 2-3 property cards on listing page

### Advanced Lazy Loading with Intersection Observer

```jsx
import { useEffect, useRef, useState } from 'react';

export function LazyImage({ src, alt, className, ...props }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Load 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
}
```

### Loading States & Placeholders

#### Low-Quality Image Placeholder (LQIP)
```jsx
export function OptimizedImage({ src, placeholder, alt, ...props }) {
  const [imgSrc, setImgSrc] = useState(placeholder);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onLoad={() => setImgSrc(src)}
      style={{
        filter: imgSrc === placeholder ? 'blur(10px)' : 'none',
        transition: 'filter 0.3s ease-out'
      }}
      {...props}
    />
  );
}
```

#### Skeleton Placeholder
```jsx
export function ImageSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg">
      <div className="aspect-video w-full" />
    </div>
  );
}
```

---

## Image Sizing & Responsive Images

### Recommended Image Sizes

#### Agent Profile Photos
- **Avatar (small)**: 80x80px, 160x160px @2x
- **Card thumbnail**: 200x200px, 400x400px @2x
- **Full profile hero**: 400x400px, 800x800px @2x
- **Format**: WebP/JPEG, circular crop

#### Property Listings
- **Thumbnail**: 320x240px (4:3)
- **Card image**: 640x480px (4:3)
- **Gallery main**: 1280x960px (4:3)
- **Full screen**: 1920x1440px (4:3)
- **Format**: WebP/JPEG

#### Hero Images
- **Mobile**: 768x432px (16:9)
- **Tablet**: 1024x576px (16:9)
- **Desktop**: 1920x1080px (16:9)
- **Format**: WebP/JPEG

#### Blog Featured Images
- **Card thumbnail**: 640x360px (16:9)
- **Article header**: 1200x630px (Open Graph standard)
- **Format**: WebP/JPEG

### Responsive Image Sizes Attribute
```jsx
<img
  srcSet="
    /property-320w.jpg 320w,
    /property-640w.jpg 640w,
    /property-960w.jpg 960w,
    /property-1280w.jpg 1280w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  src="/property-640w.jpg"
  alt="Modern condo with city views"
/>
```

### Aspect Ratio Control
```jsx
// Using Tailwind CSS
<div className="aspect-video w-full overflow-hidden rounded-lg">
  <img
    src="/property.jpg"
    alt="Property exterior"
    className="w-full h-full object-cover"
  />
</div>

// Using CSS aspect-ratio property
<img
  src="/property.jpg"
  alt="Property exterior"
  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
/>
```

---

## Implementation Checklist

### Phase 1: Audit Current Images
- [ ] List all pages with images
- [ ] Identify images missing alt text
- [ ] Measure current image file sizes
- [ ] Check current format distribution (JPEG/PNG/WebP)
- [ ] Identify hero/above-fold images

### Phase 2: Alt Text Implementation
- [ ] Agent profile photos
- [ ] Property listing images
- [ ] Blog featured images
- [ ] Marketing/promotional images
- [ ] UI icons (functional vs decorative)
- [ ] Footer logos and badges

### Phase 3: WebP Conversion
- [ ] Set up build-time image optimization
- [ ] Convert existing images to WebP
- [ ] Implement picture element with fallbacks
- [ ] Test on Safari, Chrome, Firefox, Edge
- [ ] Test fallback on older browsers

### Phase 4: Lazy Loading
- [ ] Add loading="lazy" to below-fold images
- [ ] Ensure hero images DON'T use lazy loading
- [ ] Implement Intersection Observer for advanced cases
- [ ] Add loading states/skeletons
- [ ] Test on slow 3G connections

### Phase 5: Responsive Images
- [ ] Define breakpoints and sizes
- [ ] Generate multiple image sizes
- [ ] Implement srcset and sizes attributes
- [ ] Test on various screen sizes
- [ ] Validate with Chrome DevTools Network panel

### Phase 6: Testing & Monitoring
- [ ] Run Lighthouse performance audit
- [ ] Check Google PageSpeed Insights
- [ ] Test with WebPageTest.org
- [ ] Monitor Largest Contentful Paint (LCP)
- [ ] Track bandwidth savings

---

## Helper Functions & Components

### OptimizedImage Component
```tsx
// src/components/OptimizedImage.tsx
import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean; // Don't lazy load if true
}

export function OptimizedImage({
  src,
  webpSrc,
  alt,
  width,
  height,
  loading = 'lazy',
  className = '',
  objectFit = 'cover',
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use eager loading for priority images
  const loadingAttribute = priority ? 'eager' : loading;

  return (
    <picture className={className}>
      {webpSrc && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loadingAttribute}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{ objectFit }}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${hasError ? 'bg-gray-200' : ''}
        `}
      />
    </picture>
  );
}
```

### ResponsiveImage Component
```tsx
// src/components/ResponsiveImage.tsx
interface ImageSource {
  src: string;
  width: number;
}

interface ResponsiveImageProps {
  sources: ImageSource[];
  webpSources?: ImageSource[];
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

export function ResponsiveImage({
  sources,
  webpSources,
  alt,
  sizes = '100vw',
  loading = 'lazy',
  className = '',
  aspectRatio
}: ResponsiveImageProps) {
  const srcSet = sources
    .map(s => `${s.src} ${s.width}w`)
    .join(', ');

  const webpSrcSet = webpSources
    ?.map(s => `${s.src} ${s.width}w`)
    .join(', ');

  return (
    <picture className={className}>
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}
      <source
        type="image/jpeg"
        srcSet={srcSet}
        sizes={sizes}
      />
      <img
        src={sources[0].src}
        alt={alt}
        loading={loading}
        style={{ aspectRatio }}
        className="w-full h-auto"
      />
    </picture>
  );
}
```

### Image URL Helper
```typescript
// src/lib/imageHelpers.ts

/**
 * Generate responsive image sources
 */
export function generateImageSources(
  basePath: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): { src: string; width: number }[] {
  return widths.map(width => ({
    src: `${basePath}-${width}w.jpg`,
    width
  }));
}

/**
 * Generate WebP sources
 */
export function generateWebPSources(
  basePath: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): { src: string; width: number }[] {
  return widths.map(width => ({
    src: `${basePath}-${width}w.webp`,
    width
  }));
}

/**
 * Get optimized Supabase image URL
 */
export function getOptimizedSupabaseImage(
  url: string,
  width?: number,
  quality: number = 80
): string {
  const supabaseUrl = new URL(url);
  const params = new URLSearchParams();

  if (width) params.set('width', width.toString());
  params.set('quality', quality.toString());

  return `${supabaseUrl.pathname}?${params.toString()}`;
}

/**
 * Generate alt text for property images
 */
export function generatePropertyAlt(
  propertyType: string,
  features: string[],
  location: string
): string {
  const featureText = features.slice(0, 2).join(' and ');
  return `${propertyType} with ${featureText} in ${location}`;
}

/**
 * Generate alt text for agent photos
 */
export function generateAgentAlt(
  name: string,
  title: string,
  location: string
): string {
  return `${name}, ${title} in ${location}`;
}
```

### Build Script for Image Optimization
```javascript
// scripts/optimize-images.js
import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';

const QUALITY = 80;
const WIDTHS = [320, 640, 960, 1280, 1920];

async function optimizeImage(inputPath) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const dirname = path.dirname(inputPath);

  for (const width of WIDTHS) {
    // Generate JPEG
    await sharp(inputPath)
      .resize(width)
      .jpeg({ quality: QUALITY })
      .toFile(path.join(dirname, `${basename}-${width}w.jpg`));

    // Generate WebP
    await sharp(inputPath)
      .resize(width)
      .webp({ quality: QUALITY })
      .toFile(path.join(dirname, `${basename}-${width}w.webp`));
  }

  console.log(`✓ Optimized: ${inputPath}`);
}

async function main() {
  const images = await glob('public/images/**/*.{jpg,jpeg,png}');

  console.log(`Found ${images.length} images to optimize...`);

  for (const image of images) {
    await optimizeImage(image);
  }

  console.log('✓ All images optimized!');
}

main();
```

---

## Performance Metrics

### Target Metrics
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Image file size**: < 200KB for hero images, < 100KB for thumbnails
- **WebP adoption**: > 90% of images served as WebP
- **Above-fold images**: Load within 1.5s on 3G

### Monitoring Tools
1. **Google PageSpeed Insights**: https://pagespeed.web.dev/
2. **Chrome DevTools Lighthouse**: Built into Chrome
3. **WebPageTest**: https://www.webpagetest.org/
4. **Chrome DevTools Coverage**: Find unused image bytes
5. **Network Panel**: Monitor image load times and sizes

### Key Metrics to Track
```javascript
// Track LCP for images
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];

  if (lastEntry.element?.tagName === 'IMG') {
    console.log('LCP Image:', lastEntry.element.src);
    console.log('LCP Time:', lastEntry.renderTime || lastEntry.loadTime);
  }
}).observe({ entryTypes: ['largest-contentful-paint'] });

// Track image loading performance
performance.getEntriesByType('resource')
  .filter(entry => entry.initiatorType === 'img')
  .forEach(entry => {
    console.log(entry.name, entry.duration, entry.transferSize);
  });
```

---

## Implementation Priority

### High Priority (Week 1)
1. Add alt text to all agent profile photos
2. Add alt text to all property listing images
3. Add alt text to hero images on public pages
4. Implement lazy loading on property listing cards
5. Optimize hero images (compress, convert to WebP)

### Medium Priority (Week 2)
1. Create OptimizedImage component
2. Convert all public-facing images to WebP with fallbacks
3. Implement responsive images for property listings
4. Add loading states/skeletons
5. Set up build-time image optimization

### Low Priority (Week 3-4)
1. Optimize blog images
2. Implement advanced lazy loading with Intersection Observer
3. Generate multiple sizes for all images
4. Add LQIP (Low-Quality Image Placeholder) technique
5. Fine-tune responsive image sizes based on analytics

---

## Testing Checklist

### Manual Testing
- [ ] Images load correctly on desktop
- [ ] Images load correctly on mobile
- [ ] WebP images load in modern browsers
- [ ] JPEG fallbacks work in older browsers
- [ ] Lazy loading works (scroll test)
- [ ] Alt text is appropriate and descriptive
- [ ] No layout shift when images load
- [ ] Loading states appear correctly
- [ ] Images display correctly on slow connections

### Automated Testing
- [ ] Lighthouse score > 90 for performance
- [ ] PageSpeed Insights score > 85
- [ ] All images have alt attributes (HTML validator)
- [ ] No 404 errors for images (broken links)
- [ ] WebP images served to supporting browsers
- [ ] Correct image dimensions specified

### Accessibility Testing
- [ ] Screen reader announces meaningful alt text
- [ ] Decorative images have empty alt=""
- [ ] Linked images have descriptive alt text
- [ ] High contrast mode displays properly
- [ ] Images don't convey information not available in text

---

## Resources

### Documentation
- [WebP image format](https://developers.google.com/speed/webp)
- [MDN: Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web.dev: Fast load times](https://web.dev/fast/)
- [W3C Web Accessibility: Images](https://www.w3.org/WAI/tutorials/images/)

### Tools
- [Squoosh](https://squoosh.app/) - Image compression and conversion
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js image processing
- [ImageOptim](https://imageoptim.com/) - Mac image optimization
- [TinyPNG](https://tinypng.com/) - Online image compression

### Browser Support
- [Can I Use: WebP](https://caniuse.com/webp)
- [Can I Use: Lazy Loading](https://caniuse.com/loading-lazy-attr)
- [Can I Use: srcset](https://caniuse.com/srcset)

---

## Conclusion

Image optimization is critical for:
- **SEO**: Faster sites rank higher, alt text helps search engines understand content
- **User Experience**: Fast loading improves engagement and conversions
- **Accessibility**: Alt text enables screen reader users to understand visual content
- **Performance**: Reduced bandwidth usage, especially on mobile devices

Implement these strategies progressively, starting with high-traffic pages and hero images, then expanding to all images across the platform.

**Next Review Date**: Quarterly review of image performance metrics
