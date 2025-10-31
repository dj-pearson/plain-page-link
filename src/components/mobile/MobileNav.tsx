/**
 * Mobile Bottom Navigation Component
 * Touch-friendly navigation for mobile devices
 */

import { Home, ListTodo, Users, BarChart3, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
}

export function MobileNav() {
    const location = useLocation();

    const navItems: NavItem[] = [
        { label: "Home", icon: Home, href: "/dashboard" },
        { label: "Listings", icon: ListTodo, href: "/listings" },
        { label: "Leads", icon: Users, href: "/leads" },
        { label: "Analytics", icon: BarChart3, href: "/analytics" },
        { label: "More", icon: Menu, href: "/settings" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full relative",
                                "transition-colors duration-200",
                                "min-w-[44px] min-h-[44px]", // iOS touch target minimum
                                isActive
                                    ? "text-primary"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <div className="relative">
                                <Icon className="w-6 h-6" />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-1 font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
