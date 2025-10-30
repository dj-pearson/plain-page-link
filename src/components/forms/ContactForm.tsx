import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextareaField } from "./FormField";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, CheckCircle } from "lucide-react";

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
    agentId: string;
    agentName: string;
    onSuccess?: () => void;
}

export function ContactForm({
    agentId,
    agentName,
    onSuccess,
}: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        try {
            // TODO: Integrate with API
            console.log("Contact form submitted:", { ...data, agentId });

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setIsSuccess(true);
            reset();

            setTimeout(() => {
                setIsSuccess(false);
                onSuccess?.();
            }, 3000);
        } catch (error) {
            console.error("Error submitting contact form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-green-900">
                                Message Sent!
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                                {agentName} will get back to you shortly.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Send a Message
                </CardTitle>
                <CardDescription>
                    Get in touch with {agentName} directly
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        label="Your Name"
                        id="name"
                        placeholder="John Doe"
                        error={errors.name?.message}
                        required
                        {...register("name")}
                    />

                    <FormField
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        error={errors.email?.message}
                        required
                        {...register("email")}
                    />

                    <FormField
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        error={errors.phone?.message}
                        required
                        {...register("phone")}
                    />

                    <TextareaField
                        label="Message"
                        id="message"
                        placeholder="Tell me about your real estate needs..."
                        rows={4}
                        error={errors.message?.message}
                        required
                        {...register("message")}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Your information is secure and will never be shared.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
