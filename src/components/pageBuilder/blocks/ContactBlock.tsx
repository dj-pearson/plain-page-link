/**
 * Contact Form Block Component
 * Displays a customizable contact form
 */

import { useState } from "react";
import { ContactBlockConfig } from "@/types/pageBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContactBlockProps {
    config: ContactBlockConfig;
    isEditing?: boolean;
    userId?: string;
}

interface FormDataState {
    [key: string]: string | boolean | undefined;
}

export function ContactBlock({ config, isEditing = false, userId }: ContactBlockProps) {
    const [formData, setFormData] = useState<FormDataState>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        for (const field of config.fields) {
            const value = formData[field.id];

            // Check required fields
            if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
                errors[field.id] = `${field.label} is required`;
                continue;
            }

            // Validate email format
            if (field.type === 'email' && value && typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[field.id] = 'Please enter a valid email address';
                }
            }

            // Validate phone format (basic)
            if (field.type === 'phone' && value && typeof value === 'string') {
                const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
                if (!phoneRegex.test(value)) {
                    errors[field.id] = 'Please enter a valid phone number';
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) return;

        // Validate form before submitting
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        if (!userId) {
            toast.error("Unable to submit form. Please try again later.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Extract common fields from form data
            const nameField = config.fields.find(f => f.id === 'name' || f.label.toLowerCase().includes('name'));
            const emailField = config.fields.find(f => f.type === 'email');
            const phoneField = config.fields.find(f => f.type === 'phone');
            const messageField = config.fields.find(f => f.type === 'textarea' || f.id === 'message');

            const leadData = {
                user_id: userId,
                name: nameField ? String(formData[nameField.id] || '') : 'Anonymous',
                email: emailField ? String(formData[emailField.id] || '') : '',
                phone: phoneField ? String(formData[phoneField.id] || '') : undefined,
                message: messageField ? String(formData[messageField.id] || '') : undefined,
                lead_type: 'contact',
                referrer_url: window.location.href,
                device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            };

            // Call the submit-lead edge function
            const { data, error } = await supabase.functions.invoke('submit-lead', {
                body: leadData,
            });

            if (error) {
                throw new Error(error.message || 'Failed to submit form');
            }

            setIsSuccess(true);
            toast.success(
                config.successMessage || "Message sent successfully!"
            );

            // Reset form after 3 seconds
            setTimeout(() => {
                setFormData({});
                setIsSuccess(false);
            }, 3000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (fieldId: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
        // Clear validation error when user starts typing
        if (validationErrors[fieldId]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto p-8 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-lg font-semibold text-green-900">
                        Message Sent!
                    </h3>
                    <p className="text-green-700">{config.successMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            {/* Title */}
            {config.title && (
                <h3 className="text-2xl font-bold text-center mb-6">
                    {config.title}
                </h3>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {config.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </Label>

                        {/* Text Input */}
                        {field.type === "text" && (
                            <Input
                                id={field.id}
                                type="text"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isEditing || isSubmitting}
                                value={String(formData[field.id] || "")}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                                className={validationErrors[field.id] ? "border-red-500" : ""}
                            />
                        )}

                        {/* Email Input */}
                        {field.type === "email" && (
                            <Input
                                id={field.id}
                                type="email"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isEditing || isSubmitting}
                                value={String(formData[field.id] || "")}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                                className={validationErrors[field.id] ? "border-red-500" : ""}
                            />
                        )}

                        {/* Phone Input */}
                        {field.type === "phone" && (
                            <Input
                                id={field.id}
                                type="tel"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isEditing || isSubmitting}
                                value={String(formData[field.id] || "")}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                                className={validationErrors[field.id] ? "border-red-500" : ""}
                            />
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                            <Textarea
                                id={field.id}
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isEditing || isSubmitting}
                                value={String(formData[field.id] || "")}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                                rows={4}
                                className={validationErrors[field.id] ? "border-red-500" : ""}
                            />
                        )}

                        {/* Select */}
                        {field.type === "select" && field.options && (
                            <Select
                                disabled={isEditing || isSubmitting}
                                value={formData[field.id] as string | undefined}
                                onValueChange={(value) =>
                                    handleChange(field.id, value)
                                }
                            >
                                <SelectTrigger className={validationErrors[field.id] ? "border-red-500" : ""}>
                                    <SelectValue
                                        placeholder={field.placeholder}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Checkbox */}
                        {field.type === "checkbox" && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={field.id}
                                    disabled={isEditing || isSubmitting}
                                    checked={Boolean(formData[field.id]) || false}
                                    onCheckedChange={(checked) =>
                                        handleChange(field.id, Boolean(checked))
                                    }
                                />
                                <label
                                    htmlFor={field.id}
                                    className="text-sm cursor-pointer"
                                >
                                    {field.label}
                                </label>
                            </div>
                        )}

                        {/* Validation Error */}
                        {validationErrors[field.id] && (
                            <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
                        )}
                    </div>
                ))}

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isEditing || isSubmitting}
                >
                    {isSubmitting && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isSubmitting
                        ? "Sending..."
                        : config.submitButtonText || "Submit"}
                </Button>
            </form>
        </div>
    );
}
