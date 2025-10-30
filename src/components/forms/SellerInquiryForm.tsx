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
import { DollarSign, Loader2, CheckCircle } from "lucide-react";

const sellerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    address: z.string().min(5, "Please enter your property address"),
    propertyType: z.string().min(1, "Please select a property type"),
    bedrooms: z.string().min(1, "Please select number of bedrooms"),
    bathrooms: z.string().min(1, "Please select number of bathrooms"),
    timeline: z.string().min(1, "Please select a timeline"),
    reason: z.string().min(1, "Please select a reason"),
    message: z.string().optional(),
});

type SellerFormData = z.infer<typeof sellerSchema>;

interface SellerInquiryFormProps {
    agentId: string;
    agentName: string;
    onSuccess?: () => void;
}

export function SellerInquiryForm({
    agentId,
    agentName,
    onSuccess,
}: SellerInquiryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<SellerFormData>({
        resolver: zodResolver(sellerSchema),
    });

    const onSubmit = async (data: SellerFormData) => {
        setIsSubmitting(true);
        try {
            // TODO: Integrate with API
            console.log("Seller inquiry submitted:", {
                ...data,
                agentId,
                leadType: "seller",
            });

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setIsSuccess(true);
            reset();

            setTimeout(() => {
                setIsSuccess(false);
                onSuccess?.();
            }, 3000);
        } catch (error) {
            console.error("Error submitting seller inquiry:", error);
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
                                Request Received!
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                                {agentName} will contact you within 24 hours to
                                discuss selling your home.
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
                    <DollarSign className="w-5 h-5" />
                    Sell Your Home
                </CardTitle>
                <CardDescription>
                    Get a competitive market analysis from {agentName}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                    <FormField
                        label="Property Address"
                        id="address"
                        placeholder="123 Main Street, City, State"
                        error={errors.address?.message}
                        helperText="We'll use this for a detailed market analysis"
                        required
                        {...register("address")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="propertyType">
                                Property Type{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("propertyType", value)
                                }
                            >
                                <SelectTrigger id="propertyType">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-family">
                                        Single Family
                                    </SelectItem>
                                    <SelectItem value="condo">Condo</SelectItem>
                                    <SelectItem value="townhouse">
                                        Townhouse
                                    </SelectItem>
                                    <SelectItem value="multi-family">
                                        Multi-Family
                                    </SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.propertyType && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.propertyType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">
                                Bedrooms <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("bedrooms", value)
                                }
                            >
                                <SelectTrigger id="bedrooms">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5+">5+</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.bedrooms && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.bedrooms.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">
                                Bathrooms{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("bathrooms", value)
                                }
                            >
                                <SelectTrigger id="bathrooms">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="1.5">1.5</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="2.5">2.5</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="3.5">3.5</SelectItem>
                                    <SelectItem value="4+">4+</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.bathrooms && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.bathrooms.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="timeline">
                                When are you selling?{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("timeline", value)
                                }
                            >
                                <SelectTrigger id="timeline">
                                    <SelectValue placeholder="Select timeline" />
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
                                    <SelectItem value="just-exploring">
                                        Just exploring
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.timeline && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.timeline.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                Reason for selling{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("reason", value)
                                }
                            >
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upsizing">
                                        Upsizing
                                    </SelectItem>
                                    <SelectItem value="downsizing">
                                        Downsizing
                                    </SelectItem>
                                    <SelectItem value="relocation">
                                        Relocation
                                    </SelectItem>
                                    <SelectItem value="investment">
                                        Investment property
                                    </SelectItem>
                                    <SelectItem value="financial">
                                        Financial reasons
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.reason && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.reason.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <TextareaField
                        label="Additional Details"
                        id="message"
                        placeholder="Tell us about your property (recent upgrades, special features, etc.)"
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
                                <DollarSign className="mr-2 h-4 w-4" />
                                Get Free Market Analysis
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        No obligation. Your information is secure and
                        confidential.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
