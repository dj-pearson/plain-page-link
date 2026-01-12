# Accessibility Guidelines for AgentBio

**Last Updated:** January 12, 2026
**Target Conformance:** WCAG 2.1 Level AA

---

## Table of Contents

1. [Overview](#overview)
2. [Accessibility Components](#accessibility-components)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Testing Procedures](#testing-procedures)
5. [Common Patterns](#common-patterns)
6. [Checklist](#checklist)

---

## Overview

AgentBio is committed to providing an accessible platform that meets WCAG 2.1 Level AA standards. This document provides guidelines for developers to maintain and improve accessibility throughout the codebase.

### Key Principles (POUR)

1. **Perceivable** - Information must be presentable to users in ways they can perceive
2. **Operable** - UI components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough for assistive technologies

---

## Accessibility Components

### Live Regions (`src/components/ui/live-region.tsx`)

Use live regions to announce dynamic content changes to screen readers.

```tsx
import { LiveRegion, useAnnouncer, AnnouncerProvider } from "@/components/ui/live-region";

// Basic usage
<LiveRegion politeness="polite">
  {statusMessage}
</LiveRegion>

// With hook
function MyComponent() {
  const { announce, AnnouncerPortal } = useAnnouncer();

  const handleSave = async () => {
    try {
      await saveData();
      announce("Data saved successfully!");
    } catch (error) {
      announce("Failed to save data", "assertive");
    }
  };

  return (
    <>
      <AnnouncerPortal />
      <button onClick={handleSave}>Save</button>
    </>
  );
}
```

### Accessible Loading (`src/components/ui/accessible-loading.tsx`)

Use accessible loading components to provide feedback during async operations.

```tsx
import {
  AccessibleLoading,
  AccessibleSpinner,
  AccessibleSkeleton,
  AccessibleProgressBar
} from "@/components/ui/accessible-loading";

// Wrap async content
<AccessibleLoading
  isLoading={isLoading}
  loadingMessage="Loading your data..."
  completeMessage="Data loaded successfully"
>
  <DataList data={data} />
</AccessibleLoading>

// Simple spinner
<AccessibleSpinner size="lg" label="Processing payment" />

// Skeleton loading
<AccessibleSkeleton lines={3} label="Loading article" />

// Progress bar
<AccessibleProgressBar value={75} label="Upload progress" showPercentage />
```

### Accessibility Hooks (`src/hooks/useAccessibility.ts`)

```tsx
import {
  useFocusTrap,
  useEscapeKey,
  useReducedMotion,
  useKeyboardNavigation,
  useAccessibility,
} from "@/hooks/useAccessibility";

// Focus trap for modals
function Modal({ isOpen, onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, isOpen);
  useEscapeKey(onClose, isOpen);

  return isOpen ? (
    <div ref={containerRef} role="dialog" aria-modal="true">
      ...
    </div>
  ) : null;
}

// Respect reduced motion preference
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      ...
    </motion.div>
  );
}

// Combined hook
function MyComponent() {
  const { prefersReducedMotion, isKeyboardUser, announce } = useAccessibility();
  ...
}
```

### Tables (`src/components/ui/table.tsx`)

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableRowHeader,
  SortableTableHead,
} from "@/components/ui/table";

// Accessible table with proper headers
<Table aria-label="Product inventory">
  <TableCaption>Current inventory levels</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Product</TableHead>
      <SortableTableHead
        sortDirection={sortConfig.direction}
        onSort={() => handleSort("price")}
      >
        Price
      </SortableTableHead>
      <TableHead scope="col">Stock</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableRowHeader>Widget A</TableRowHeader>
      <TableCell>$19.99</TableCell>
      <TableCell>150</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Implementation Guidelines

### 1. Semantic HTML

Always use semantic HTML elements:

```tsx
// Good
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<article>...</article>
<aside>...</aside>
<footer role="contentinfo">...</footer>

// Bad
<div class="nav">...</div>
<div class="main">...</div>
```

### 2. Heading Hierarchy

Maintain proper heading hierarchy (never skip levels):

```tsx
// Good
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// Bad - skips h2
<h1>Page Title</h1>
<h3>Section Title</h3>
```

### 3. Form Labels

Every form input must have an associated label:

```tsx
// Good - using FormField component
<FormField
  label="Email Address"
  id="email"
  type="email"
  error={errors.email?.message}
  required
  {...register("email")}
/>

// Good - explicit label association
<label htmlFor="username">Username</label>
<input id="username" type="text" />

// Bad - no label association
<input type="text" placeholder="Username" />
```

### 4. Error Messages

Properly associate error messages with form fields:

```tsx
<div className="space-y-2">
  <label htmlFor="email">Email</label>
  <input
    id="email"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" role="alert">
      {errors.email.message}
    </p>
  )}
</div>
```

### 5. Focus Management

Ensure visible focus indicators and logical focus order:

```tsx
// Button with focus styles (already in button.tsx)
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
  Click me
</button>

// Modal focus trap
const containerRef = useRef(null);
useFocusTrap(containerRef, isOpen);
```

### 6. Images

Provide meaningful alt text for images:

```tsx
// Informative image
<img src="chart.png" alt="Sales growth chart showing 50% increase in Q4" />

// Decorative image
<img src="decorative.png" alt="" aria-hidden="true" />

// Using OptimizedImage component
<OptimizedImage
  src="property.jpg"
  alt="Modern 3-bedroom home with pool in Austin, TX"
/>
```

### 7. Icons and Buttons

Icon-only buttons need accessible labels:

```tsx
// Good
<button aria-label="Close dialog">
  <X className="h-5 w-5" aria-hidden="true" />
</button>

// Good - with visible text
<button>
  <X className="h-5 w-5 mr-2" aria-hidden="true" />
  Close
</button>
```

### 8. Touch Targets

Ensure minimum 44x44px touch targets on mobile:

```tsx
<button className="min-h-[44px] min-w-[44px] p-2">
  <Menu className="h-6 w-6" />
</button>
```

### 9. Color Contrast

Maintain WCAG AA contrast ratios:
- Normal text: 4.5:1
- Large text (18pt or 14pt bold): 3:1
- UI components: 3:1

```tsx
// Use predefined color pairs from CSS variables
<p className="text-gray-900">High contrast text</p>
<p className="text-gray-600">Secondary text (still meets 4.5:1)</p>

// Avoid
<p className="text-gray-400">Low contrast - may not meet requirements</p>
```

### 10. Skip Links

Use skip navigation for keyboard users:

```tsx
import { SkipLink } from "@/components/SkipLink";
import { SkipNavContent } from "@/components/ui/skip-nav";

function Layout() {
  return (
    <>
      <SkipLink />
      <header>...</header>
      <SkipNavContent>
        <main id="main-content">...</main>
      </SkipNavContent>
    </>
  );
}
```

---

## Testing Procedures

### Automated Testing

1. Run the accessibility tester:
```bash
npm run test:accessibility
```

2. Use browser extensions:
   - axe DevTools
   - WAVE
   - Lighthouse

### Manual Testing

#### Keyboard Navigation

1. Navigate through the page using only Tab, Shift+Tab, Enter, Space, and arrow keys
2. Verify all interactive elements are reachable
3. Check focus is visible at all times
4. Test Escape key closes modals/dropdowns
5. Verify logical tab order

#### Screen Reader Testing

Test with at least one screen reader:

- **Windows:** NVDA (free) or JAWS
- **macOS/iOS:** VoiceOver
- **Android:** TalkBack

Key checks:
1. Page title is announced
2. Headings create logical outline
3. Form labels are announced
4. Error messages are announced
5. Dynamic content changes are announced
6. Images have appropriate alt text
7. Buttons have accessible names

#### Visual Testing

1. Zoom to 200% - ensure content remains usable
2. Test with browser's high contrast mode
3. Verify color is not the only means of conveying information
4. Check for sufficient color contrast

### Testing Checklist

Use this checklist for each component/page:

- [ ] Keyboard navigation works
- [ ] Focus is always visible
- [ ] Tab order is logical
- [ ] Screen reader announces content correctly
- [ ] All images have alt text
- [ ] Forms have labels and error handling
- [ ] Color contrast meets requirements
- [ ] Touch targets are 44x44px minimum
- [ ] Reduced motion is respected
- [ ] No content flashes more than 3 times/second

---

## Common Patterns

### Modal Dialog

```tsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, isOpen);
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4"
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

### Tabs

```tsx
function AccessibleTabs({ tabs, activeTab, onChange }) {
  return (
    <div>
      <div role="tablist" aria-label="Content sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Alert/Notification

```tsx
function AccessibleAlert({ type, message, onDismiss }) {
  return (
    <div
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`p-4 rounded ${typeStyles[type]}`}
    >
      <div className="flex items-start gap-3">
        <AlertIcon type={type} aria-hidden="true" />
        <p>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss alert"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Checklist

### Page-Level Requirements

- [ ] Page has a unique, descriptive `<title>`
- [ ] Page has a single `<h1>` that describes the page content
- [ ] Language is specified (`<html lang="en">`)
- [ ] Skip navigation link is present
- [ ] Main content has `<main id="main-content">`
- [ ] Navigation has `<nav aria-label="...">`
- [ ] Footer has proper landmark

### Component Requirements

- [ ] Interactive elements are focusable
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] All functionality is keyboard accessible
- [ ] ARIA attributes are used correctly
- [ ] Loading states are announced
- [ ] Error states are announced

### Form Requirements

- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Error messages are associated with fields
- [ ] Success/error feedback is provided
- [ ] Autocomplete is used where appropriate

### Media Requirements

- [ ] Images have alt text
- [ ] Decorative images are hidden from AT
- [ ] Videos have captions
- [ ] Audio has transcripts

### Mobile Requirements

- [ ] Touch targets are 44x44px minimum
- [ ] Content works in portrait and landscape
- [ ] Zoom is not disabled
- [ ] Content reflows at 320px width

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [Accessibility Statement](/accessibility)

---

## Contact

For accessibility questions or to report issues:

- Email: accessibility@agentbio.net
- File an issue on GitHub

---

*This document should be updated as new accessibility patterns are implemented.*
