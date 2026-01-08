import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * OTP Input Component
 * 
 * Based on best practices from AUTH_SETUP_DOCUMENTATION.md:
 * - 6-digit code input
 * - Auto-focus and auto-advance
 * - Paste support
 * - Keyboard navigation
 * - Visual feedback
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Focus active input when activeIndex changes
  useEffect(() => {
    inputRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const handleChange = (index: number, digit: string) => {
    // Only allow single digits
    const sanitized = digit.replace(/[^0-9]/g, '').slice(0, 1);
    
    const newValue = value.split('');
    newValue[index] = sanitized;
    
    const updatedValue = newValue.join('');
    onChange(updatedValue);

    // Auto-advance to next input
    if (sanitized && index < length - 1) {
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newValue = value.split('');
      
      if (newValue[index]) {
        // Clear current digit
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        setActiveIndex(index - 1);
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setActiveIndex(index - 1);
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);
    
    onChange(digits);
    
    // Focus last filled input or last input
    const nextIndex = Math.min(digits.length, length - 1);
    setActiveIndex(nextIndex);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, index) => {
        const digit = value[index] || '';
        const isFilled = !!digit;
        const isActive = index === activeIndex;

        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={disabled}
            className={cn(
              'w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : isFilled
                ? 'border-blue-500 bg-blue-50'
                : isActive
                ? 'border-blue-500 focus:border-blue-600 focus:ring-blue-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
              'sm:w-14 sm:h-16 sm:text-3xl'
            )}
            aria-label={`Digit ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
