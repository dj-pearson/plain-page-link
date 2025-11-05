/**
 * ProfileCompletionWidget Component
 * Shows agents their profile completion progress and suggests next steps
 * Improves onboarding and activation rates
 */

import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useProfile";
import { useListings } from "@/hooks/useListings";
import { useTestimonials } from "@/hooks/useTestimonials";
import { useLinks } from "@/hooks/useLinks";

interface CompletionStep {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    link: string;
    priority: "high" | "medium" | "low";
}

export function ProfileCompletionWidget() {
    const { data: profile } = useProfile();
    const { data: listings } = useListings();
    const { data: testimonials } = useTestimonials();
    const { data: links } = useLinks();

    if (!profile) return null;

    const steps: CompletionStep[] = [
        {
            id: "avatar",
            label: "Add profile photo",
            description: "Upload a professional headshot",
            completed: !!profile.avatar_url,
            link: "/dashboard/profile",
            priority: "high"
        },
        {
            id: "bio",
            label: "Write your bio",
            description: "Tell visitors about your experience",
            completed: !!profile.bio && profile.bio.length > 50,
            link: "/dashboard/profile",
            priority: "high"
        },
        {
            id: "contact",
            label: "Add contact info",
            description: "Phone and email for leads",
            completed: !!profile.phone || !!profile.email_display,
            link: "/dashboard/profile",
            priority: "high"
        },
        {
            id: "listings",
            label: "Add your first listing",
            description: "Showcase properties you're selling",
            completed: (listings?.length || 0) > 0,
            link: "/dashboard/listings",
            priority: "medium"
        },
        {
            id: "testimonials",
            label: "Add testimonials",
            description: "Build trust with client reviews",
            completed: (testimonials?.length || 0) > 0,
            link: "/dashboard/testimonials",
            priority: "medium"
        },
        {
            id: "links",
            label: "Add custom links",
            description: "Link to your website and social",
            completed: (links?.length || 0) > 0,
            link: "/dashboard/links",
            priority: "low"
        },
        {
            id: "theme",
            label: "Customize theme",
            description: "Match your brand colors",
            completed: !!profile.theme,
            link: "/dashboard/theme",
            priority: "low"
        }
    ];

    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Only show if profile is not 100% complete
    if (completionPercentage === 100) return null;

    const highPriorityIncomplete = steps.filter(s => s.priority === "high" && !s.completed);
    const nextStep = highPriorityIncomplete[0] || steps.find(s => !s.completed);

    return (
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            {completionPercentage < 50 ? (
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-blue-500" />
                            )}
                            Profile Completion
                        </CardTitle>
                        <CardDescription>
                            {completionPercentage}% complete - {completedSteps} of {totalSteps} steps done
                        </CardDescription>
                    </div>
                </div>
                <Progress value={completionPercentage} className="mt-4" />
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Next Recommended Step */}
                {nextStep && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                        {completedSteps + 1}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900">
                                    Next: {nextStep.label}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {nextStep.description}
                                </p>
                                <Link
                                    to={nextStep.link}
                                    className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Complete this step →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Steps Checklist */}
                <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 list-none flex items-center gap-2">
                        <span>View all steps</span>
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                        {steps.map((step) => (
                            <Link
                                key={step.id}
                                to={step.link}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white transition-colors group/item"
                            >
                                {step.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${
                                        step.completed ? "text-gray-500 line-through" : "text-gray-900"
                                    }`}>
                                        {step.label}
                                    </div>
                                    <div className="text-xs text-gray-500">{step.description}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </details>
            </CardContent>
        </Card>
    );
}
