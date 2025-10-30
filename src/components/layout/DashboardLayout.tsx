import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    Home,
    LayoutDashboard,
    Building2,
    Users,
    Link as LinkIcon,
    Star,
    BarChart3,
    User,
    Palette,
    Settings,
    LogOut,
} from "lucide-react";

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, signOut } = useAuthStore();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/auth/login");
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
                <div className="p-6">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xl font-bold text-gray-900"
                    >
                        <Home className="h-6 w-6 text-blue-600" />
                        AgentBio.net
                    </Link>
                </div>

                <nav className="px-3 space-y-1">
                    <NavLink
                        to="/dashboard"
                        icon={<LayoutDashboard className="h-5 w-5" />}
                        label="Dashboard"
                        active={isActive("/dashboard")}
                    />
                    <NavLink
                        to="/dashboard/listings"
                        icon={<Building2 className="h-5 w-5" />}
                        label="Listings"
                        active={isActive("/dashboard/listings")}
                    />
                    <NavLink
                        to="/dashboard/leads"
                        icon={<Users className="h-5 w-5" />}
                        label="Leads"
                        active={isActive("/dashboard/leads")}
                    />
                    <NavLink
                        to="/dashboard/testimonials"
                        icon={<Star className="h-5 w-5" />}
                        label="Testimonials"
                        active={isActive("/dashboard/testimonials")}
                    />
                    <NavLink
                        to="/dashboard/links"
                        icon={<LinkIcon className="h-5 w-5" />}
                        label="Custom Links"
                        active={isActive("/dashboard/links")}
                    />
                    <NavLink
                        to="/dashboard/analytics"
                        icon={<BarChart3 className="h-5 w-5" />}
                        label="Analytics"
                        active={isActive("/dashboard/analytics")}
                    />

                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <NavLink
                            to="/dashboard/profile"
                            icon={<User className="h-5 w-5" />}
                            label="Profile"
                            active={isActive("/dashboard/profile")}
                        />
                        <NavLink
                            to="/dashboard/theme"
                            icon={<Palette className="h-5 w-5" />}
                            label="Theme"
                            active={isActive("/dashboard/theme")}
                        />
                        <NavLink
                            to="/dashboard/settings"
                            icon={<Settings className="h-5 w-5" />}
                            label="Settings"
                            active={isActive("/dashboard/settings")}
                        />
                    </div>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-64 min-h-screen">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dashboard
                        </h1>
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/${profile?.username || ""}`}
                                target="_blank"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View Profile →
                            </Link>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                    {getInitials(profile?.full_name)}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function NavLink({
    to,
    icon,
    label,
    active,
}: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
}) {
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
