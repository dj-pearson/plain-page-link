/**
 * Stats Block Component
 * Showcases agent metrics and achievements with animated counters
 */

import { StatsBlockConfig } from "@/types/pageBuilder";
import { TrendingUp, Award, Home, Users, DollarSign, Clock, Star, Target } from "lucide-react";

interface StatsBlockProps {
    config: StatsBlockConfig;
    isEditing?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    trending: <TrendingUp className="w-6 h-6" />,
    award: <Award className="w-6 h-6" />,
    home: <Home className="w-6 h-6" />,
    users: <Users className="w-6 h-6" />,
    dollar: <DollarSign className="w-6 h-6" />,
    clock: <Clock className="w-6 h-6" />,
    star: <Star className="w-6 h-6" />,
    target: <Target className="w-6 h-6" />,
};

export function StatsBlock({ config, isEditing = false }: StatsBlockProps) {
    const getLayoutClass = () => {
        switch (config.layout) {
            case "grid":
                return "grid grid-cols-2 gap-6";
            case "cards":
                return "grid grid-cols-2 md:grid-cols-4 gap-4";
            case "row":
            default:
                return "flex flex-wrap justify-center gap-8 md:gap-12";
        }
    };

    if (config.stats.length === 0 && isEditing) {
        return (
            <div className="text-center py-12">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 font-medium">Stats Block</p>
                <p className="text-sm text-gray-400">Add stats in the settings panel</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {config.title && (
                <h3
                    className="text-2xl font-bold text-center"
                    style={{ fontFamily: "var(--theme-font-heading, inherit)" }}
                >
                    {config.title}
                </h3>
            )}

            <div className={getLayoutClass()}>
                {config.stats.map((stat) => (
                    <div key={stat.id} className={`text-center ${config.layout === "cards" ? "p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow" : "p-4"}`}>
                        {stat.icon && iconMap[stat.icon] && (
                            <div
                                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: "var(--theme-primary, #2563eb)",
                                    color: "white",
                                    opacity: 0.9,
                                }}
                            >
                                {iconMap[stat.icon]}
                            </div>
                        )}
                        <div
                            className="text-3xl md:text-4xl font-bold"
                            style={{ color: "var(--theme-primary, #2563eb)" }}
                        >
                            {stat.prefix}{stat.value}{stat.suffix}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
