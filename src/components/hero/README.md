# 3D Hero Components

Professional, interactive 3D hero section components built with React Three Fiber and integrated with the Liquid Glass design system.

## Components

### `Hero3D`

The core 3D visual component that renders interactive geometric shapes, particles, and animations.

**Features:**
- Interactive 3D geometric shapes (icosahedrons, spheres, toruses)
- Floating animations with smooth transitions
- Particle system for depth and ambiance
- Star field background
- Auto-rotating camera controls
- Liquid Glass color scheme integration
- Performance optimized with proper suspense and lazy loading

**Props:**
- `className?: string` - Additional CSS classes
- `height?: string` - Height of the 3D canvas (default: "600px")

**Example:**
```tsx
import { Hero3D } from '@/components/hero';

function MyComponent() {
  return <Hero3D height="500px" className="shadow-2xl" />;
}
```

### `HeroSection`

Complete hero section combining 3D visuals with content overlay using Liquid Glass design patterns.

**Features:**
- Responsive two-column layout (content + 3D visual)
- Customizable badge, title, description, and CTAs
- Optional statistics display
- Floating accent cards with animations
- Full Liquid Glass styling integration
- Professional glassmorphism effects

**Props:**
- `title?: string` - Main heading text
- `subtitle?: string` - Subtitle with gradient effect
- `description?: string` - Descriptive text
- `primaryCta?: { text: string; href: string }` - Primary call-to-action
- `secondaryCta?: { text: string; href: string }` - Secondary call-to-action
- `badge?: { icon?: React.ReactNode; text: string }` - Top badge element
- `showStats?: boolean` - Display statistics section (default: true)

**Example:**
```tsx
import { HeroSection } from '@/components/hero';

function Landing() {
  return (
    <HeroSection
      title="Professional Real Estate Agent"
      subtitle="Portfolio Link"
      description="Create your professional agent portfolio link..."
      primaryCta={{ text: 'Start Free Trial', href: '/auth/register' }}
      secondaryCta={{ text: 'See How It Works', href: '#features' }}
      showStats={true}
    />
  );
}
```

## Design System Integration

### Liquid Glass Colors Used

The 3D components use the following Liquid Glass color palette:

- **Teal**: `#80d0c7` - Primary shapes and accents
- **Blue**: `#a1c4fd` - Secondary shapes and gradients
- **Light Blue**: `#c2e9fb` - Tertiary accents

### CSS Classes

The components utilize these Liquid Glass CSS classes:

- `glass-heading` - Gradient text for headings
- `glass-body` - Muted body text
- `glass-accent` - Accent text with gradient
- `bg-glass-background` - Glassmorphism background
- `backdrop-blur-md` - Backdrop blur effect
- `border-glass-border` - Glass-style borders

## 3D Elements

### Shapes

1. **Central Sphere** - Main focal point with distortion material
2. **Floating Icosahedrons** - 4 animated geometric shapes
3. **Rotating Rings** - 2 concentric torus rings
4. **Particle System** - 2000 ambient particles
5. **Star Field** - Background stars for depth

### Animations

- Continuous rotation on all axes
- Floating Y-axis motion with sine waves
- Auto-rotating camera orbit
- Hover-reactive materials (metalness/roughness)
- Smooth opacity transitions

## Performance Optimizations

1. **Suspense Boundaries** - Lazy loading with fallback UI
2. **Device Pixel Ratio** - Adaptive resolution (1-2x)
3. **Frustum Culling** - Off-screen object culling
4. **Material Optimization** - Shared materials where possible
5. **GPU Acceleration** - Hardware-accelerated rendering

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Mobile browsers with WebGL support

## Dependencies

- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for R3F
- `three` - 3D library
- `framer-motion` - Animation utilities (optional)

## Accessibility

- Proper semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Reduced motion support (can be enhanced)
- Screen reader friendly content overlay

## Customization

### Changing Colors

Edit the colors object in `Hero3D.tsx`:

```tsx
const colors = {
  teal: '#80d0c7',      // Your custom teal
  blue: '#a1c4fd',      // Your custom blue
  lightBlue: '#c2e9fb', // Your custom light blue
};
```

### Adjusting Animation Speed

Modify the speed values in animation components:

```tsx
// Slower rotation
meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1; // was 0.5

// Faster floating
autoRotateSpeed={2} // was 0.5
```

### Adding More Shapes

Add additional shape instances in the Scene component:

```tsx
<AnimatedShape
  position={[x, y, z]}
  scale={0.5}
  color={colors.teal}
  speed={1.0}
/>
```

## Troubleshooting

### 3D Scene Not Rendering

1. Check WebGL support in browser
2. Verify Three.js dependencies are installed
3. Check browser console for errors
4. Ensure proper Suspense boundaries

### Performance Issues

1. Reduce particle count (default: 2000)
2. Lower device pixel ratio (dpr={[1, 1.5]})
3. Simplify geometry (fewer vertices)
4. Disable auto-rotate on mobile

### Styling Issues

1. Verify Liquid Glass CSS is loaded
2. Check Tailwind config includes required classes
3. Ensure CSS variables are defined in :root
4. Check z-index stacking context

## Future Enhancements

- [ ] Add touch/mouse interactivity
- [ ] Implement reduced motion preferences
- [ ] Add more shape variety options
- [ ] Create preset themes
- [ ] Add particle effects on hover
- [ ] Implement dynamic lighting based on scroll
- [ ] Add sound effects (optional)
- [ ] Create loading progress indicator
