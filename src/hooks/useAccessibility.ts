import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook to manage focus trapping within a container
 * Essential for modals, dialogs, and dropdown menus (WCAG 2.4.3)
 *
 * @example
 * function Modal({ isOpen, onClose, children }) {
 *   const containerRef = useRef(null);
 *   useFocusTrap(containerRef, isOpen);
 *
 *   return isOpen ? (
 *     <div ref={containerRef} role="dialog">
 *       {children}
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   ) : null;
 * }
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(', ');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        // Filter out elements that are not visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: If focus is on first element, move to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: If focus is on last element, move to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef]);
}

/**
 * Hook to handle Escape key press for closing modals/dropdowns
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   useEscapeKey(onClose, isOpen);
 *   return isOpen ? <div>...</div> : null;
 * }
 */
export function useEscapeKey(
  onEscape: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}

/**
 * Hook to detect user's reduced motion preference
 * Essential for WCAG 2.3.3 Animation from Interactions
 *
 * @example
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ opacity: 1 }}
 *       transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy Safari
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect user's high contrast preference
 *
 * @example
 * function ThemedComponent() {
 *   const prefersHighContrast = useHighContrast();
 *
 *   return (
 *     <div className={prefersHighContrast ? 'high-contrast' : 'normal'}>
 *       Content
 *     </div>
 *   );
 * }
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook to generate unique IDs for accessibility attributes
 * Ensures proper association between labels and inputs
 *
 * @example
 * function FormField({ label }) {
 *   const id = useId('input');
 *   const errorId = useId('error');
 *
 *   return (
 *     <div>
 *       <label htmlFor={id}>{label}</label>
 *       <input id={id} aria-describedby={errorId} />
 *       <span id={errorId}>Error message</span>
 *     </div>
 *   );
 * }
 */
let idCounter = 0;
export function useAccessibilityId(prefix: string = 'a11y'): string {
  const [id] = useState(() => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  });
  return id;
}

/**
 * Hook to manage roving tabindex for keyboard navigation
 * Essential for toolbar, menu, and listbox patterns (WCAG 2.1.1)
 *
 * @example
 * function Toolbar() {
 *   const items = ['Bold', 'Italic', 'Underline'];
 *   const { currentIndex, getItemProps } = useRovingTabIndex(items.length);
 *
 *   return (
 *     <div role="toolbar">
 *       {items.map((item, index) => (
 *         <button key={item} {...getItemProps(index)}>
 *           {item}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useRovingTabIndex(itemCount: number, initialIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const focusItem = useCallback((index: number) => {
    const normalizedIndex = Math.max(0, Math.min(index, itemCount - 1));
    setCurrentIndex(normalizedIndex);
    itemRefs.current[normalizedIndex]?.focus();
  }, [itemCount]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = itemCount - 1;
        break;
      default:
        return;
    }

    focusItem(nextIndex);
  }, [currentIndex, itemCount, focusItem]);

  const getItemProps = useCallback((index: number) => ({
    ref: setItemRef(index),
    tabIndex: index === currentIndex ? 0 : -1,
    onKeyDown: handleKeyDown,
    onClick: () => setCurrentIndex(index),
  }), [currentIndex, handleKeyDown, setItemRef]);

  return {
    currentIndex,
    setCurrentIndex,
    focusItem,
    getItemProps,
  };
}

/**
 * Hook to detect if user is navigating with keyboard
 * Useful for showing focus indicators only when needed
 *
 * @example
 * function Button({ children }) {
 *   const isKeyboardUser = useKeyboardNavigation();
 *
 *   return (
 *     <button className={isKeyboardUser ? 'focus-ring' : ''}>
 *       {children}
 *     </button>
 *   );
 * }
 */
export function useKeyboardNavigation(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

/**
 * Hook to manage aria-live announcements
 *
 * @example
 * function SearchResults({ results }) {
 *   const announce = useAriaLive();
 *
 *   useEffect(() => {
 *     announce(`${results.length} results found`);
 *   }, [results, announce]);
 *
 *   return <ul>...</ul>;
 * }
 */
export function useAriaLive() {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Create a temporary element to announce
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', politeness);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement is made
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
}

/**
 * Hook to detect screen reader usage (heuristic-based)
 * Note: This is not 100% reliable but can help optimize UX
 */
export function useScreenReaderHint(): boolean {
  const [maybeScreenReader, setMaybeScreenReader] = useState(false);

  useEffect(() => {
    // Check for common screen reader indicators
    const checkScreenReader = () => {
      // Check if reduced motion is preferred (common among SR users)
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      // Check for high contrast mode
      const prefersHighContrast = window.matchMedia(
        '(prefers-contrast: more)'
      ).matches;

      // If either is true, user might be using assistive technology
      setMaybeScreenReader(prefersReducedMotion || prefersHighContrast);
    };

    checkScreenReader();
  }, []);

  return maybeScreenReader;
}

/**
 * Hook to manage skip link functionality
 *
 * @example
 * function App() {
 *   const { skipLinkProps, targetProps } = useSkipLink();
 *
 *   return (
 *     <>
 *       <a {...skipLinkProps}>Skip to main content</a>
 *       <nav>...</nav>
 *       <main {...targetProps}>...</main>
 *     </>
 *   );
 * }
 */
export function useSkipLink(targetId: string = 'main-content') {
  const targetRef = useRef<HTMLElement>(null);

  const handleSkip = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    const target = document.getElementById(targetId) ?? targetRef.current;
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  const skipLinkProps = {
    href: `#${targetId}`,
    onClick: handleSkip,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleSkip(event);
      }
    },
  };

  const targetProps = {
    id: targetId,
    ref: targetRef,
    tabIndex: -1,
  };

  return { skipLinkProps, targetProps };
}

/**
 * Combined accessibility hook that provides common patterns
 *
 * @example
 * function AccessibleComponent() {
 *   const a11y = useAccessibility();
 *
 *   return (
 *     <div>
 *       <p>Reduced motion: {a11y.prefersReducedMotion ? 'Yes' : 'No'}</p>
 *       <p>Keyboard user: {a11y.isKeyboardUser ? 'Yes' : 'No'}</p>
 *       <button onClick={() => a11y.announce('Hello!')}>Announce</button>
 *     </div>
 *   );
 * }
 */
export function useAccessibility() {
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();
  const isKeyboardUser = useKeyboardNavigation();
  const announce = useAriaLive();

  return {
    prefersReducedMotion,
    prefersHighContrast,
    isKeyboardUser,
    announce,
  };
}

export default useAccessibility;
