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

interface ContactBlockProps {
    config: ContactBlockConfig;
    isEditing?: boolean;
}

export function ContactBlock({ config, isEditing = false }: ContactBlockProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) return;

        setIsSubmitting(true);

        try {
            // TODO: Implement actual form submission
            await new Promise((resolve) => setTimeout(resolve, 1500));

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
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (fieldId: string, value: any) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
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
                                value={formData[field.id] || ""}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
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
                                value={formData[field.id] || ""}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
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
                                value={formData[field.id] || ""}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                            />
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                            <Textarea
                                id={field.id}
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isEditing || isSubmitting}
                                value={formData[field.id] || ""}
                                onChange={(e) =>
                                    handleChange(field.id, e.target.value)
                                }
                                rows={4}
                            />
                        )}

                        {/* Select */}
                        {field.type === "select" && field.options && (
                            <Select
                                disabled={isEditing || isSubmitting}
                                value={formData[field.id]}
                                onValueChange={(value) =>
                                    handleChange(field.id, value)
                                }
                            >
                                <SelectTrigger>
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
                                    checked={formData[field.id] || false}
                                    onCheckedChange={(checked) =>
                                        handleChange(field.id, checked)
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
