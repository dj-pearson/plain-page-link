import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "./FormField";
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
import { TrendingUp, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitLead, trackFormSubmission } from "@/lib/leadSubmission";
import { useToast } from "@/hooks/use-toast";

const valuationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    address: z.string().min(5, "Please enter your property address"),
    propertyType: z.string().min(1, "Please select a property type"),
    bedrooms: z.string().min(1, "Please select number of bedrooms"),
    bathrooms: z.string().min(1, "Please select number of bathrooms"),
    squareFeet: z.string().min(1, "Please enter square footage"),
    yearBuilt: z.string().optional(),
    condition: z.string().min(1, "Please select property condition"),
});

type ValuationFormData = z.infer<typeof valuationSchema>;

interface HomeValuationFormProps {
    agentId: string;
    agentName: string;
    onSuccess?: () => void;
}

export function HomeValuationForm({
    agentId,
    agentName,
    onSuccess,
}: HomeValuationFormProps) {
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
    } = useForm<ValuationFormData>({
        resolver: zodResolver(valuationSchema),
    });

    const onSubmit = async (data: ValuationFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitLead({
                agentId,
                leadType: "valuation",
                name: data.name,
                email: data.email,
                phone: data.phone,
                data: {
                    address: data.address,
                    propertyType: data.propertyType,
                    bedrooms: data.bedrooms,
                    bathrooms: data.bathrooms,
                    squareFeet: data.squareFeet,
                    yearBuilt: data.yearBuilt,
                    condition: data.condition,
                },
            });

            if (result.success) {
                trackFormSubmission("valuation_request", true);
                toast({
                    title: "Valuation Request Submitted!",
                    description: `${agentName} will send you a detailed report within 24 hours.`,
                });
                setIsSuccess(true);
                reset();

                setTimeout(() => {
                    setIsSuccess(false);
                    onSuccess?.();
                }, 3000);
            } else {
                throw new Error(result.error || "Failed to submit valuation request");
            }
        } catch (error) {
            console.error("Error submitting valuation request:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to submit valuation request. Please try again.";
            setError(errorMessage);
            trackFormSubmission("valuation_request", false);
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
                                Valuation Request Received!
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                                {agentName} will send you a detailed home
                                valuation report within 24 hours.
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
                    <TrendingUp className="w-5 h-5" />
                    Free Home Valuation
                </CardTitle>
                <CardDescription>
                    Find out what your home is worth in today's market with{" "}
                    {agentName}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

                    <FormField
                        label="Property Address"
                        id="address"
                        placeholder="123 Main Street, City, State, ZIP"
                        error={errors.address?.message}
                        helperText="Full address helps us provide the most accurate valuation"
                        required
                        {...register("address")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-family">
                                        Single Family Home
                                    </SelectItem>
                                    <SelectItem value="condo">Condo</SelectItem>
                                    <SelectItem value="townhouse">
                                        Townhouse
                                    </SelectItem>
                                    <SelectItem value="multi-family">
                                        Multi-Family
                                    </SelectItem>
                                    <SelectItem value="manufactured">
                                        Manufactured
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.propertyType && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.propertyType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="condition">
                                Property Condition{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) =>
                                    setValue("condition", value)
                                }
                            >
                                <SelectTrigger id="condition">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="excellent">
                                        Excellent
                                    </SelectItem>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="average">
                                        Average
                                    </SelectItem>
                                    <SelectItem value="fair">Fair</SelectItem>
                                    <SelectItem value="needs-work">
                                        Needs Work
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.condition && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.condition.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="6+">6+</SelectItem>
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
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="4.5+">4.5+</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.bathrooms && (
                                <p className="text-sm text-red-500 font-medium">
                                    {errors.bathrooms.message}
                                </p>
                            )}
                        </div>

                        <FormField
                            label="Square Feet"
                            id="squareFeet"
                            type="number"
                            placeholder="2,000"
                            error={errors.squareFeet?.message}
                            required
                            {...register("squareFeet")}
                        />
                    </div>

                    <FormField
                        label="Year Built"
                        id="yearBuilt"
                        type="number"
                        placeholder="1995"
                        error={errors.yearBuilt?.message}
                        helperText="Optional, but helps with accuracy"
                        {...register("yearBuilt")}
                    />

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                            What You'll Get:
                        </h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>✓ Detailed market analysis report</li>
                            <li>✓ Comparable sales in your area</li>
                            <li>✓ Current market trends</li>
                            <li>✓ Personalized selling strategy</li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Get Free Valuation Report
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        100% free with no obligation. Results delivered to your
                        email.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
