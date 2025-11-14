import { MapPin, Award, Calendar, ShieldCheck, Zap, Star, Building2, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
    profile: Profile;
    stats?: {
        propertiesSold?: number;
        averageRating?: number;
        reviewCount?: number;
        responseTime?: string;
    };
}

function TrustBadge({
    icon: Icon,
    label,
    variant = "default"
}: {
    icon: React.ElementType;
    label: string;
    variant?: "default" | "success" | "warning" | "info";
}) {
    const variantStyles = {
        default: "bg-gray-100 text-gray-700 border-gray-200",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
    };

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border",
            variantStyles[variant]
        )}>
            <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>{label}</span>
        </div>
    );
}

export default function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
    return (
        <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white opacity-60" />
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            <div className="relative p-6 md:p-8">
                {/* Main Grid Layout */}
                <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                    {/* Left Column - Avatar & Status */}
                    <div className="flex flex-col items-center md:items-start">
                        {/* Profile Photo */}
                        <div className="relative mb-3">
                            {profile.profile_photo ? (
                                <img
                                    src={profile.profile_photo}
                                    alt={profile.display_name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                                />
                            ) : (
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl">
                                    <span className="text-3xl md:text-4xl font-bold text-white">
                                        {(profile.display_name || profile.full_name || profile.username || "U")
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </span>
                                </div>
                            )}
                            {/* Available Status Indicator */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 border-2 border-white">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                Available Now
                            </div>
                        </div>

                        {/* Verified Badge */}
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                            <ShieldCheck className="h-4 w-4 fill-current" />
                            <span>Verified Agent</span>
                        </div>
                    </div>

                    {/* Right Column - Info */}
                    <div className="flex-1 text-center md:text-left">
                        {/* Name & Title */}
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                                {profile.display_name || profile.full_name || profile.username}
                            </h1>
                            {profile.title && (
                                <p className="text-base md:text-lg text-blue-600 font-semibold">
                                    {profile.title}
                                </p>
                            )}
                            {/* Brokerage */}
                            {profile.brokerage_name && (
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mt-2">
                                    <Building2 className="h-4 w-4" />
                                    {profile.brokerage_logo ? (
                                        <img
                                            src={profile.brokerage_logo}
                                            alt={profile.brokerage_name}
                                            className="h-5 object-contain"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium">{profile.brokerage_name}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                            {stats?.propertiesSold && stats.propertiesSold > 0 && (
                                <TrustBadge
                                    icon={CheckCircle2}
                                    label={`${stats.propertiesSold} Homes Sold`}
                                    variant="success"
                                />
                            )}
                            {stats?.averageRating && stats.averageRating >= 4.5 && (
                                <TrustBadge
                                    icon={Star}
                                    label={`${stats.averageRating.toFixed(1)} Rating`}
                                    variant="warning"
                                />
                            )}
                            {profile.years_experience && profile.years_experience >= 5 && (
                                <TrustBadge
                                    icon={Award}
                                    label={`${profile.years_experience} Years Experience`}
                                    variant="info"
                                />
                            )}
                            {stats?.responseTime && (
                                <TrustBadge
                                    icon={Zap}
                                    label={`${stats.responseTime} Response`}
                                    variant="default"
                                />
                            )}
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-4 max-w-2xl whitespace-pre-line">
                                {profile.bio}
                            </p>
                        )}

                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 justify-center md:justify-start">
                            {profile.service_cities && profile.service_cities.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{profile.service_cities[0]}</span>
                                    {profile.service_cities.length > 1 && (
                                        <span className="text-blue-600 font-semibold">
                                            +{profile.service_cities.length - 1} more
                                        </span>
                                    )}
                                </div>
                            )}
                            {profile.license_number && profile.license_state && (
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <span>License #{profile.license_number} ({profile.license_state})</span>
                                </div>
                            )}
                        </div>

                        {/* Specialties */}
                        {profile.specialties && profile.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {profile.specialties.map((specialty, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg text-xs md:text-sm font-semibold border border-blue-200/50"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Certifications */}
                        {profile.certifications && profile.certifications.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                                {profile.certifications.map((cert, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium border border-yellow-200"
                                    >
                                        <Award className="h-3 w-3" />
                                        {cert}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
