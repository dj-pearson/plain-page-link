/**
 * Mobile Bottom Navigation Component
 * Touch-friendly navigation for mobile devices with expanded menu
 */

import { useState } from "react";
import { Home, ListTodo, Users, BarChart3, Menu, Star, Link as LinkIcon, Zap, FileText, User, Palette, Settings, LogOut, Shield, ExternalLink, Workflow } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface NavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
}

export function MobileNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, signOut, role } = useAuthStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems: NavItem[] = [
        { label: "Home", icon: Home, href: "/dashboard" },
        { label: "Listings", icon: ListTodo, href: "/dashboard/listings" },
        { label: "Leads", icon: Users, href: "/dashboard/leads" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    ];

    const secondaryNavItems = [
        { label: "Testimonials", icon: Star, href: "/dashboard/testimonials" },
        { label: "Custom Links", icon: LinkIcon, href: "/dashboard/links" },
        { label: "Quick Actions", icon: Zap, href: "/dashboard/quick-actions" },
        { label: "Page Builder", icon: FileText, href: "/dashboard/page-builder" },
        { label: "Workflows", icon: Workflow, href: "/dashboard/workflows" },
        { label: "Profile", icon: User, href: "/dashboard/profile" },
        { label: "Theme", icon: Palette, href: "/dashboard/theme" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    ];

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await signOut();
        navigate("/auth/login");
    };

    const handleNavigate = (href: string) => {
        setIsMenuOpen(false);
        navigate(href);
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-inset-bottom shadow-lg" aria-label="Mobile navigation">
                <div className="flex justify-around items-center h-16 px-1">
                    {navItems.map((item) => {
                        const isItemActive = isActive(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full relative",
                                    "transition-all duration-200 rounded-lg mx-0.5",
                                    "min-w-[44px] min-h-[44px]", // iOS touch target minimum
                                    "active:scale-95 active:bg-gray-100", // Touch feedback
                                    isItemActive
                                        ? "text-primary bg-primary/5"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                )}
                                aria-label={item.label}
                                aria-current={isItemActive ? "page" : undefined}
                            >
                                <div className="relative">
                                    <Icon className={cn(
                                        "w-6 h-6 transition-transform",
                                        isItemActive && "scale-110"
                                    )} />
                                    {item.badge && item.badge > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse" aria-label={`${item.badge} unread`}>
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xs mt-1 font-medium transition-all",
                                    isItemActive && "font-semibold"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full relative",
                            "transition-all duration-200 rounded-lg mx-0.5",
                            "min-w-[44px] min-h-[44px]",
                            "active:scale-95 active:bg-gray-100", // Touch feedback
                            "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                        aria-label="Open menu with more options"
                        aria-expanded={isMenuOpen}
                    >
                        <Menu className="w-6 h-6" />
                        <span className="text-xs mt-1 font-medium">
                            More
                        </span>
                    </button>
                </div>
            </nav>

            {/* More Menu Dialog */}
            <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Menu</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-1 py-2">
                        {/* View Public Profile */}
                        <Link
                            to={`/${profile?.username || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                                <span className="font-medium text-sm">View My Public Profile</span>
                                <p className="text-xs text-gray-500">See how visitors see your page</p>
                            </div>
                        </Link>

                        <div className="border-t border-gray-200 my-2" />

                        {/* Admin Link (if admin) */}
                        {role === 'admin' && (
                            <>
                                <button
                                    onClick={() => handleNavigate("/admin")}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left min-h-[44px]",
                                        isActive("/admin")
                                            ? "bg-blue-50 text-blue-600 font-medium"
                                            : "text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <Shield className="h-5 w-5 flex-shrink-0" />
                                    <div className="flex items-center gap-2 flex-1">
                                        <span>Admin Panel</span>
                                        <Badge variant="secondary" className="text-xs">ROOT</Badge>
                                    </div>
                                </button>
                                <div className="border-t border-gray-200 my-2" />
                            </>
                        )}

                        {/* Secondary Navigation Items */}
                        {secondaryNavItems.map((item) => {
                            const Icon = item.icon;
                            const itemActive = isActive(item.href);

                            return (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left min-h-[44px]",
                                        itemActive
                                            ? "bg-blue-50 text-blue-600 font-medium"
                                            : "text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}

                        <div className="border-t border-gray-200 my-2" />

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left min-h-[44px]"
                        >
                            <LogOut className="h-5 w-5 flex-shrink-0" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
