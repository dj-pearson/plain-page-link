/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for better user experience on touch devices
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Check if the device supports haptic feedback
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with different intensities
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;

  try {
    switch (pattern) {
      case 'light':
        // Light tap - for button press
        navigator.vibrate(10);
        break;

      case 'medium':
        // Medium tap - for selections
        navigator.vibrate(20);
        break;

      case 'heavy':
        // Heavy tap - for confirmations
        navigator.vibrate(40);
        break;

      case 'success':
        // Success pattern - short burst
        navigator.vibrate([10, 20, 10]);
        break;

      case 'warning':
        // Warning pattern - two short bursts
        navigator.vibrate([15, 50, 15]);
        break;

      case 'error':
        // Error pattern - three quick bursts
        navigator.vibrate([10, 50, 10, 50, 10]);
        break;

      case 'selection':
        // Very light tap - for scrolling through items
        navigator.vibrate(5);
        break;

      default:
        navigator.vibrate(10);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (isHapticSupported()) {
    navigator.vibrate(0);
  }
}

/**
 * Hook-friendly haptic functions
 */
export const hapticFeedback = {
  // Button interactions
  tap: () => haptic('light'),
  press: () => haptic('medium'),
  hold: () => haptic('heavy'),

  // Results
  success: () => haptic('success'),
  warning: () => haptic('warning'),
  error: () => haptic('error'),

  // Navigation
  selection: () => haptic('selection'),

  // Utility
  cancel: cancelHaptic,
  isSupported: isHapticSupported,
};

/**
 * React wrapper for haptic feedback
 * Usage: const { tap, success } = useHaptic();
 */
export function useHaptic() {
  return hapticFeedback;
}
