/**
 * useScrollDirection Hook
 * Detects scroll direction for hide-on-scroll navigation patterns
 * Optimized for mobile with throttling and threshold support
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
    /** Minimum scroll distance before triggering direction change (default: 10px) */
    threshold?: number;
    /** Throttle scroll events for performance (default: 100ms) */
    throttleMs?: number;
    /** Initial visibility state (default: true) */
    initialVisible?: boolean;
    /** Scroll position at which to always show nav (default: 100px) */
    topThreshold?: number;
}

interface ScrollDirectionResult {
    /** Current scroll direction */
    scrollDirection: ScrollDirection;
    /** Whether navigation should be visible */
    isVisible: boolean;
    /** Current scroll position */
    scrollY: number;
    /** Whether user is at top of page */
    isAtTop: boolean;
}

export function useScrollDirection({
    threshold = 10,
    throttleMs = 100,
    initialVisible = true,
    topThreshold = 100,
}: UseScrollDirectionOptions = {}): ScrollDirectionResult {
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [scrollY, setScrollY] = useState(0);

    const lastScrollY = useRef(0);
    const lastUpdateTime = useRef(0);
    const ticking = useRef(false);

    const updateScrollDirection = useCallback(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY.current;

        setScrollY(currentScrollY);

        // Always show nav at top of page
        if (currentScrollY < topThreshold) {
            setIsVisible(true);
            setScrollDirection('none');
            lastScrollY.current = currentScrollY;
            ticking.current = false;
            return;
        }

        // Check if scroll exceeds threshold
        if (Math.abs(diff) < threshold) {
            ticking.current = false;
            return;
        }

        if (diff > 0) {
            // Scrolling down
            setScrollDirection('down');
            setIsVisible(false);
        } else {
            // Scrolling up
            setScrollDirection('up');
            setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
    }, [threshold, topThreshold]);

    const handleScroll = useCallback(() => {
        const now = Date.now();

        // Throttle scroll events
        if (now - lastUpdateTime.current < throttleMs) {
            if (!ticking.current) {
                ticking.current = true;
                requestAnimationFrame(() => {
                    updateScrollDirection();
                });
            }
            return;
        }

        lastUpdateTime.current = now;
        updateScrollDirection();
    }, [throttleMs, updateScrollDirection]);

    useEffect(() => {
        // Set initial scroll position
        lastScrollY.current = window.scrollY;
        setScrollY(window.scrollY);

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    return {
        scrollDirection,
        isVisible,
        scrollY,
        isAtTop: scrollY < topThreshold,
    };
}

/**
 * Simple hook that just returns whether nav should be visible
 * Based on scroll direction with sensible defaults
 */
export function useNavVisibility(): boolean {
    const { isVisible } = useScrollDirection();
    return isVisible;
}
