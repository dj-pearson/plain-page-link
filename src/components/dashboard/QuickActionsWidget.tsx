/**
 * Quick Actions Widget
 * Provides one-click access to common dashboard tasks
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Eye,
    Link as LinkIcon,
    MessageSquare,
    BarChart3,
    Home,
    Star,
    Palette,
    FileText,
} from "lucide-react";

interface QuickAction {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

export function QuickActionsWidget() {
    const actions: QuickAction[] = [
        {
            id: "add-listing",
            label: "Add Listing",
            description: "Post a new property",
            icon: <Home className="w-5 h-5" />,
            href: "/dashboard/listings?action=new",
            color: "bg-blue-500 hover:bg-blue-600",
        },
        {
            id: "add-link",
            label: "Add Link",
            description: "Create custom link",
            icon: <LinkIcon className="w-5 h-5" />,
            href: "/dashboard/links?action=new",
            color: "bg-purple-500 hover:bg-purple-600",
        },
        {
            id: "view-profile",
            label: "View Profile",
            description: "See your public page",
            icon: <Eye className="w-5 h-5" />,
            href: "#", // Will be dynamically set
            color: "bg-green-500 hover:bg-green-600",
        },
        {
            id: "check-leads",
            label: "Check Leads",
            description: "Review inquiries",
            icon: <MessageSquare className="w-5 h-5" />,
            href: "/dashboard/leads",
            color: "bg-orange-500 hover:bg-orange-600",
        },
        {
            id: "view-analytics",
            label: "Analytics",
            description: "View performance",
            icon: <BarChart3 className="w-5 h-5" />,
            href: "/dashboard/analytics",
            color: "bg-cyan-500 hover:bg-cyan-600",
        },
        {
            id: "add-testimonial",
            label: "Add Review",
            description: "Post testimonial",
            icon: <Star className="w-5 h-5" />,
            href: "/dashboard/testimonials?action=new",
            color: "bg-yellow-500 hover:bg-yellow-600",
        },
        {
            id: "customize-theme",
            label: "Customize",
            description: "Edit theme",
            icon: <Palette className="w-5 h-5" />,
            href: "/dashboard/theme",
            color: "bg-pink-500 hover:bg-pink-600",
        },
        {
            id: "page-builder",
            label: "Page Builder",
            description: "Build custom page",
            icon: <FileText className="w-5 h-5" />,
            href: "/dashboard/page-builder",
            color: "bg-indigo-500 hover:bg-indigo-600",
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {actions.map((action) => (
                        <Link
                            key={action.id}
                            to={action.href}
                            className="group"
                        >
                            <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all active:scale-95">
                                <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-2 transition-colors`}
                                >
                                    {action.icon}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                                        {action.label}
                                    </p>
                                    <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
