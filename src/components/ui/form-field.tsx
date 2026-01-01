import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input, type InputProps } from "./input";

interface FormFieldProps extends Omit<InputProps, "error" | "errorId"> {
    /**
     * Field label text
     */
    label: string;
    /**
     * Unique ID for the input (required for accessibility)
     */
    id: string;
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Helper text to display below the input
     */
    helperText?: string;
    /**
     * Whether the field is required
     */
    required?: boolean;
    /**
     * Additional class name for the wrapper
     */
    wrapperClassName?: string;
}

/**
 * FormField component that properly associates label, input, and error message
 * for WCAG 2.1 AA compliance
 *
 * @example
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   required
 *   error={errors.email}
 *   placeholder="you@example.com"
 * />
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
    (
        {
            label,
            id,
            error,
            helperText,
            required,
            wrapperClassName,
            className,
            ...inputProps
        },
        ref
    ) => {
        const errorId = error ? `${id}-error` : undefined;
        const helperId = helperText ? `${id}-helper` : undefined;
        const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

        return (
            <div className={cn("space-y-1.5", wrapperClassName)}>
                <Label htmlFor={id} required={required}>
                    {label}
                </Label>
                <Input
                    ref={ref}
                    id={id}
                    error={!!error}
                    aria-describedby={describedBy}
                    aria-required={required}
                    className={className}
                    {...inputProps}
                />
                {helperText && !error && (
                    <p
                        id={helperId}
                        className="text-xs text-gray-500"
                    >
                        {helperText}
                    </p>
                )}
                {error && (
                    <p
                        id={errorId}
                        className="text-xs text-red-500 flex items-center gap-1"
                        role="alert"
                    >
                        <svg
                            className="h-3 w-3 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormField.displayName = "FormField";

export { FormField };
