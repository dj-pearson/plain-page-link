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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Home, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitLead, trackFormSubmission } from "@/lib/leadSubmission";
import { useToast } from "@/hooks/use-toast";

const buyerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    propertyType: z.string().min(1, "Please select a property type"),
    priceRange: z.string().min(1, "Please select a price range"),
    bedrooms: z.string().min(1, "Please select number of bedrooms"),
    timeline: z.string().min(1, "Please select a timeline"),
    preApproved: z.string().min(1, "Please select pre-approval status"),
    message: z.string().optional(),
});

type BuyerFormData = z.infer<typeof buyerSchema>;

interface BuyerInquiryFormProps {
    agentId: string;
    agentName: string;
    onSuccess?: () => void;
}

export function BuyerInquiryForm({
    agentId,
    agentName,
    onSuccess,
}: BuyerInquiryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<BuyerFormData>({
        resolver: zodResolver(buyerSchema),
    });

    const onSubmit = async (data: BuyerFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitLead({
                agentId,
                leadType: "buyer",
                name: data.name,
                email: data.email,
                phone: data.phone,
                data: {
                    propertyType: data.propertyType,
                    priceRange: data.priceRange,
                    bedrooms: data.bedrooms,
                    timeline: data.timeline,
                    preApproved: data.preApproved,
                    message: data.message,
                },
            });

            if (result.success) {
                trackFormSubmission("buyer_inquiry", true);
                toast({
                    title: "Inquiry Submitted!",
                    description: `${agentName} will contact you within 24 hours.`,
                });
                setIsSuccess(true);
                reset();

                setTimeout(() => {
                    setIsSuccess(false);
                    onSuccess?.();
                }, 3000);
            } else {
                throw new Error(result.error || "Failed to submit inquiry");
            }
        } catch (error) {
            console.error("Error submitting buyer inquiry:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to submit inquiry. Please try again.";
            setError(errorMessage);
            trackFormSubmission("buyer_inquiry", false);
            toast({
                title: "Submission Failed",
                description: errorMessage,
                variant: "destructive",
            });
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
                                Inquiry Received!
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                                {agentName} will contact you within 24 hours to
                                discuss your home search.
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
                    <Home className="w-5 h-5" />
                    Find Your Dream Home
                </CardTitle>
                <CardDescription>
                    Let {agentName} help you find the perfect property
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900 text-sm">
                                    Submission Error
                                </h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <FormField
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        error={errors.phone?.message}
                        required
                        {...register("phone")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="propertyType">
                                Property Type{" "}
                                <span className="text-red-500" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("propertyType", value)
                                }
                            >
                                <SelectTrigger
                                    id="propertyType"
                                    aria-required="true"
                                    aria-invalid={!!errors.propertyType}
                                    aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
                                >
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-family">
                                        Single Family Home
                                    </SelectItem>
                                    <SelectItem value="condo">
                                        Condo/Townhouse
                                    </SelectItem>
                                    <SelectItem value="multi-family">
                                        Multi-Family
                                    </SelectItem>
                                    <SelectItem value="land">
                                        Land/Lot
                                    </SelectItem>
                                    <SelectItem value="luxury">
                                        Luxury Estate
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.propertyType && (
                                <p id="propertyType-error" role="alert" className="text-sm text-red-500 font-medium">
                                    {errors.propertyType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priceRange">
                                Price Range{" "}
                                <span className="text-red-500" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("priceRange", value)
                                }
                            >
                                <SelectTrigger
                                    id="priceRange"
                                    aria-required="true"
                                    aria-invalid={!!errors.priceRange}
                                    aria-describedby={errors.priceRange ? "priceRange-error" : undefined}
                                >
                                    <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0-250k">
                                        Under $250k
                                    </SelectItem>
                                    <SelectItem value="250k-500k">
                                        $250k - $500k
                                    </SelectItem>
                                    <SelectItem value="500k-750k">
                                        $500k - $750k
                                    </SelectItem>
                                    <SelectItem value="750k-1m">
                                        $750k - $1M
                                    </SelectItem>
                                    <SelectItem value="1m-2m">
                                        $1M - $2M
                                    </SelectItem>
                                    <SelectItem value="2m+">$2M+</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priceRange && (
                                <p id="priceRange-error" role="alert" className="text-sm text-red-500 font-medium">
                                    {errors.priceRange.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">
                                Bedrooms{" "}
                                <span className="text-red-500" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("bedrooms", value)
                                }
                            >
                                <SelectTrigger
                                    id="bedrooms"
                                    aria-required="true"
                                    aria-invalid={!!errors.bedrooms}
                                    aria-describedby={errors.bedrooms ? "bedrooms-error" : undefined}
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Bed</SelectItem>
                                    <SelectItem value="2">2 Beds</SelectItem>
                                    <SelectItem value="3">3 Beds</SelectItem>
                                    <SelectItem value="4">4 Beds</SelectItem>
                                    <SelectItem value="5+">5+ Beds</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.bedrooms && (
                                <p id="bedrooms-error" role="alert" className="text-sm text-red-500 font-medium">
                                    {errors.bedrooms.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeline">
                                Timeline{" "}
                                <span className="text-red-500" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("timeline", value)
                                }
                            >
                                <SelectTrigger
                                    id="timeline"
                                    aria-required="true"
                                    aria-invalid={!!errors.timeline}
                                    aria-describedby={errors.timeline ? "timeline-error" : undefined}
                                >
                                    <SelectValue placeholder="When are you buying?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="immediate">
                                        ASAP (0-30 days)
                                    </SelectItem>
                                    <SelectItem value="1-3-months">
                                        1-3 months
                                    </SelectItem>
                                    <SelectItem value="3-6-months">
                                        3-6 months
                                    </SelectItem>
                                    <SelectItem value="6+-months">
                                        6+ months
                                    </SelectItem>
                                    <SelectItem value="just-looking">
                                        Just looking
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.timeline && (
                                <p id="timeline-error" role="alert" className="text-sm text-red-500 font-medium">
                                    {errors.timeline.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="preApproved">
                            Pre-Approval Status{" "}
                            <span className="text-red-500" aria-hidden="true">*</span>
                            <span className="sr-only">(required)</span>
                        </Label>
                        <Select
                            onValueChange={(value) =>
                                setValue("preApproved", value)
                            }
                        >
                            <SelectTrigger
                                id="preApproved"
                                aria-required="true"
                                aria-invalid={!!errors.preApproved}
                                aria-describedby={errors.preApproved ? "preApproved-error" : undefined}
                            >
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yes">
                                    Yes, I'm pre-approved
                                </SelectItem>
                                <SelectItem value="in-process">
                                    In process
                                </SelectItem>
                                <SelectItem value="not-yet">
                                    Not yet, need help
                                </SelectItem>
                                <SelectItem value="cash">Cash buyer</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.preApproved && (
                            <p id="preApproved-error" role="alert" className="text-sm text-red-500 font-medium">
                                {errors.preApproved.message}
                            </p>
                        )}
                    </div>

                    <TextareaField
                        label="Additional Details"
                        id="message"
                        placeholder="Tell us more about your ideal home..."
                        rows={3}
                        error={errors.message?.message}
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
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Home className="mr-2 h-4 w-4" />
                                Start Your Home Search
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Your information is secure. No spam, ever.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
