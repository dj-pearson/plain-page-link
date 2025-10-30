import { Eye, Users, MousePointerClick, TrendingUp } from "lucide-react";

export default function Overview() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back!
                </h2>
                <p className="text-gray-600">
                    Here's what's happening with your profile
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Eye className="h-6 w-6 text-blue-600" />}
                    label="Profile Views"
                    value="1,234"
                    change="+12.5%"
                    positive
                />
                <StatCard
                    icon={<Users className="h-6 w-6 text-green-600" />}
                    label="New Leads"
                    value="45"
                    change="+23.1%"
                    positive
                />
                <StatCard
                    icon={
                        <MousePointerClick className="h-6 w-6 text-purple-600" />
                    }
                    label="Link Clicks"
                    value="892"
                    change="+8.2%"
                    positive
                />
                <StatCard
                    icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
                    label="Conversion Rate"
                    value="3.6%"
                    change="+0.4%"
                    positive
                />
            </div>

            {/* Coming Soon Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                <ComingSoonCard
                    title="Recent Leads"
                    description="View and manage your latest inquiries"
                />
                <ComingSoonCard
                    title="Top Listings"
                    description="See which properties are getting the most views"
                />
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    change,
    positive,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    change: string;
    positive: boolean;
}) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
                <span
                    className={`text-sm font-medium ${
                        positive ? "text-green-600" : "text-red-600"
                    }`}
                >
                    {change}
                </span>
            </div>
            <div>
                <p className="text-sm text-gray-600 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function ComingSoonCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-900 font-medium">
                    🚧 Coming Soon
                </p>
            </div>
        </div>
    );
}
