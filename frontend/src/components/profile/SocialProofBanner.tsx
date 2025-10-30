import { TrendingUp, Home, Star, Award } from "lucide-react";

interface SocialProofStats {
    propertiesSold?: number;
    totalVolume?: number;
    averageRating?: number;
    reviewCount?: number;
    yearsExperience?: number;
    certifications?: string[];
}

interface SocialProofBannerProps {
    stats: SocialProofStats;
}

export function SocialProofBanner({ stats }: SocialProofBannerProps) {
    const formatVolume = (value: number): string => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M+`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K+`;
        }
        return `$${value.toLocaleString()}`;
    };

    const statsToDisplay = [
        stats.propertiesSold && {
            icon: Home,
            value: stats.propertiesSold,
            label: "Properties Sold",
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        stats.totalVolume && {
            icon: TrendingUp,
            value: formatVolume(stats.totalVolume),
            label: "Total Volume",
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        stats.averageRating &&
            stats.reviewCount && {
                icon: Star,
                value: `${stats.averageRating.toFixed(1)}/5`,
                label: `${stats.reviewCount} Reviews`,
                color: "text-yellow-600",
                bgColor: "bg-yellow-100",
            },
        stats.yearsExperience && {
            icon: Award,
            value: `${stats.yearsExperience}+`,
            label: "Years Experience",
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
    ].filter(Boolean);

    if (statsToDisplay.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 rounded-xl shadow-lg">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-center text-lg font-semibold mb-6">
                    Trusted by Hundreds of Happy Clients
                </h3>
                <div
                    className={`grid grid-cols-2 md:grid-cols-${Math.min(
                        statsToDisplay.length,
                        4
                    )} gap-6`}
                >
                    {statsToDisplay.map((stat, index) => {
                        if (!stat) return null;
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm opacity-90">
                                    {stat.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
