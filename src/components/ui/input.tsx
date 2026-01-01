import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Whether the input is in an error state
     * Sets aria-invalid automatically
     */
    error?: boolean;
    /**
     * ID of the element that describes this input (for error messages)
     * Used for aria-describedby
     */
    errorId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, errorId, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
        // Combine any existing aria-describedby with errorId
        const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

        return (
            <input
                type={type}
                aria-invalid={ariaInvalid ?? (error ? "true" : undefined)}
                aria-describedby={describedBy}
                className={cn(
                    "flex h-11 sm:h-10 w-full rounded-md border bg-white px-3 sm:px-3 py-2.5 sm:py-2 text-base sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target transition-all",
                    error
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300 focus-visible:ring-blue-500",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };

