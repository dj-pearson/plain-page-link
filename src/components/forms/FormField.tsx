import { forwardRef, useId } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Mobile-optimized input type mapping
 * Maps field types to proper HTML input types and attributes for mobile keyboards
 */
type MobileInputType = 'text' | 'email' | 'tel' | 'url' | 'number' | 'password' | 'search';

interface MobileInputConfig {
    inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search' | 'none';
    autoComplete?: string;
    pattern?: string;
}

const mobileInputConfigs: Record<MobileInputType, MobileInputConfig> = {
    text: { inputMode: 'text' },
    email: { inputMode: 'email', autoComplete: 'email' },
    tel: { inputMode: 'tel', autoComplete: 'tel', pattern: '[0-9\\-\\+\\s\\(\\)]*' },
    url: { inputMode: 'url', autoComplete: 'url' },
    number: { inputMode: 'numeric' },
    password: { autoComplete: 'current-password' },
    search: { inputMode: 'search' },
};

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
    ({ label, error, helperText, required, className, type = 'text', id, ...props }, ref) => {
        // Get mobile-optimized input configuration
        const mobileConfig = mobileInputConfigs[type as MobileInputType] || {};

        // Ensure a stable id so label association and error wiring never break,
        // even when the caller omits `id` (WCAG 1.3.1 / 3.3.2).
        const generatedId = useId();
        const fieldId = id ?? generatedId;
        const errorId = `${fieldId}-error`;

        return (
            <div className="space-y-2">
                <Label htmlFor={fieldId} className="text-sm font-medium">
                    {label}
                    {required && (
                        <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                    )}
                </Label>
                <Input
                    ref={ref}
                    id={fieldId}
                    type={type}
                    required={required}
                    aria-required={required ? "true" : undefined}
                    inputMode={props.inputMode || mobileConfig.inputMode}
                    autoComplete={props.autoComplete || mobileConfig.autoComplete}
                    pattern={props.pattern || mobileConfig.pattern}
                    className={cn(
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? errorId : undefined}
                    {...props}
                />
                {error && (
                    <p
                        id={errorId}
                        className="text-sm text-red-500 font-medium"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-sm text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

FormField.displayName = "FormField";

interface TextareaFieldProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export const TextareaField = forwardRef<
    HTMLTextAreaElement,
    TextareaFieldProps
>(({ label, error, helperText, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
                {label}
                {required && (
                    <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                )}
            </Label>
            <Textarea
                ref={ref}
                id={fieldId}
                required={required}
                aria-required={required ? "true" : undefined}
                className={cn(
                    error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? errorId : undefined}
                {...props}
            />
            {error && (
                <p
                    id={errorId}
                    className="text-sm text-red-500 font-medium"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="text-sm text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
});

TextareaField.displayName = "TextareaField";
