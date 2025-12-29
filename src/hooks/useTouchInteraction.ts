/**
 * Touch Interaction Utilities
 * Provides haptic feedback and touch gesture utilities for mobile
 */

import { useCallback, useRef, useState } from 'react';

/**
 * Haptic feedback patterns using the Vibration API
 * Falls back gracefully on unsupported devices
 */
export const hapticPatterns = {
    /** Light tap - single short vibration (10ms) */
    light: [10],
    /** Medium tap - slightly longer vibration (25ms) */
    medium: [25],
    /** Heavy tap - strong vibration (50ms) */
    heavy: [50],
    /** Success feedback - two quick pulses */
    success: [10, 50, 10],
    /** Warning feedback - three quick pulses */
    warning: [10, 30, 10, 30, 10],
    /** Error feedback - long vibration */
    error: [100],
    /** Selection change - very light tap */
    selection: [5],
} as const;

export type HapticPattern = keyof typeof hapticPatterns;

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param pattern - Named pattern or custom vibration pattern array
 */
export function triggerHaptic(pattern: HapticPattern | number[]): boolean {
    if (!isHapticSupported()) return false;

    const vibrationPattern = Array.isArray(pattern)
        ? pattern
        : hapticPatterns[pattern];

    try {
        return navigator.vibrate(vibrationPattern);
    } catch {
        return false;
    }
}

/**
 * Hook for haptic feedback
 */
export function useHaptic() {
    const isSupported = isHapticSupported();

    const vibrate = useCallback((pattern: HapticPattern | number[] = 'light') => {
        return triggerHaptic(pattern);
    }, []);

    return {
        isSupported,
        vibrate,
        light: () => vibrate('light'),
        medium: () => vibrate('medium'),
        heavy: () => vibrate('heavy'),
        success: () => vibrate('success'),
        warning: () => vibrate('warning'),
        error: () => vibrate('error'),
        selection: () => vibrate('selection'),
    };
}

/**
 * Long press detection hook
 * Detects long press gestures with configurable duration
 */
interface UseLongPressOptions {
    /** Duration in ms before triggering long press (default: 500ms) */
    duration?: number;
    /** Callback when long press is triggered */
    onLongPress?: () => void;
    /** Callback when press starts */
    onPressStart?: () => void;
    /** Callback when press ends (cancelled or completed) */
    onPressEnd?: () => void;
    /** Enable haptic feedback on long press (default: true) */
    hapticFeedback?: boolean;
}

export function useLongPress({
    duration = 500,
    onLongPress,
    onPressStart,
    onPressEnd,
    hapticFeedback = true,
}: UseLongPressOptions = {}) {
    const [isPressed, setIsPressed] = useState(false);
    const [isLongPress, setIsLongPress] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const haptic = useHaptic();

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handlePressStart = useCallback(() => {
        setIsPressed(true);
        setIsLongPress(false);
        onPressStart?.();

        timerRef.current = setTimeout(() => {
            setIsLongPress(true);
            if (hapticFeedback) {
                haptic.medium();
            }
            onLongPress?.();
        }, duration);
    }, [duration, onLongPress, onPressStart, hapticFeedback, haptic]);

    const handlePressEnd = useCallback(() => {
        clear();
        setIsPressed(false);
        onPressEnd?.();
    }, [clear, onPressEnd]);

    const handlers = {
        onMouseDown: handlePressStart,
        onMouseUp: handlePressEnd,
        onMouseLeave: handlePressEnd,
        onTouchStart: handlePressStart,
        onTouchEnd: handlePressEnd,
        onTouchCancel: handlePressEnd,
    };

    return {
        isPressed,
        isLongPress,
        handlers,
    };
}

/**
 * Double tap detection hook
 */
interface UseDoubleTapOptions {
    /** Time window for double tap in ms (default: 300ms) */
    timeout?: number;
    /** Callback when double tap is detected */
    onDoubleTap?: () => void;
    /** Callback when single tap is detected (after timeout) */
    onSingleTap?: () => void;
    /** Enable haptic feedback (default: true) */
    hapticFeedback?: boolean;
}

export function useDoubleTap({
    timeout = 300,
    onDoubleTap,
    onSingleTap,
    hapticFeedback = true,
}: UseDoubleTapOptions = {}) {
    const lastTapTime = useRef(0);
    const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const haptic = useHaptic();

    const handleTap = useCallback(() => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime.current;

        if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
        }

        if (timeSinceLastTap < timeout) {
            // Double tap detected
            lastTapTime.current = 0;
            if (hapticFeedback) {
                haptic.light();
            }
            onDoubleTap?.();
        } else {
            // Wait to see if this is a single tap
            lastTapTime.current = now;
            singleTapTimer.current = setTimeout(() => {
                onSingleTap?.();
                lastTapTime.current = 0;
            }, timeout);
        }
    }, [timeout, onDoubleTap, onSingleTap, hapticFeedback, haptic]);

    return {
        onClick: handleTap,
        onTouchEnd: handleTap,
    };
}

/**
 * Swipe gesture detection hook
 */
interface SwipeEvent {
    direction: 'left' | 'right' | 'up' | 'down';
    distance: number;
    velocity: number;
}

interface UseSwipeOptions {
    /** Minimum distance to trigger swipe (default: 50px) */
    threshold?: number;
    /** Enable haptic feedback on swipe (default: true) */
    hapticFeedback?: boolean;
    onSwipeLeft?: (event: SwipeEvent) => void;
    onSwipeRight?: (event: SwipeEvent) => void;
    onSwipeUp?: (event: SwipeEvent) => void;
    onSwipeDown?: (event: SwipeEvent) => void;
}

export function useSwipe({
    threshold = 50,
    hapticFeedback = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
}: UseSwipeOptions = {}) {
    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const haptic = useHaptic();

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStart.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determine primary direction
        const isHorizontal = absX > absY;
        const distance = isHorizontal ? absX : absY;
        const velocity = distance / deltaTime;

        if (distance < threshold) {
            touchStart.current = null;
            return;
        }

        const swipeEvent: SwipeEvent = {
            direction: isHorizontal
                ? (deltaX > 0 ? 'right' : 'left')
                : (deltaY > 0 ? 'down' : 'up'),
            distance,
            velocity,
        };

        if (hapticFeedback) {
            haptic.light();
        }

        if (isHorizontal) {
            if (deltaX > 0) {
                onSwipeRight?.(swipeEvent);
            } else {
                onSwipeLeft?.(swipeEvent);
            }
        } else {
            if (deltaY > 0) {
                onSwipeDown?.(swipeEvent);
            } else {
                onSwipeUp?.(swipeEvent);
            }
        }

        touchStart.current = null;
    }, [threshold, hapticFeedback, haptic, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    return {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    };
}
