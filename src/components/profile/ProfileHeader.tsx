import { MapPin, Award, Calendar } from "lucide-react";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
    profile: Profile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 text-center">
            {/* Profile Photo */}
            <div className="mb-4">
                {profile.profile_photo ? (
                    <img
                        src={profile.profile_photo}
                        alt={profile.display_name}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto object-cover border-4 border-blue-100"
                    />
                ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-100">
                        <span className="text-4xl md:text-5xl font-bold text-white">
                            {(profile.display_name || profile.full_name || profile.username || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                        </span>
                    </div>
                )}
            </div>

            {/* Name & Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {profile.display_name || profile.full_name || profile.username}
            </h1>
            {profile.title && (
                <p className="text-lg text-blue-600 font-medium mb-4">
                    {profile.title}
                </p>
            )}

            {/* Brokerage */}
            {profile.brokerage_name && (
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                    {profile.brokerage_logo ? (
                        <img
                            src={profile.brokerage_logo}
                            alt={profile.brokerage_name}
                            className="h-6 object-contain"
                        />
                    ) : (
                        <span>{profile.brokerage_name}</span>
                    )}
                </div>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 mb-6">
                {profile.years_experience && (
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{profile.years_experience} years</span>
                    </div>
                )}
                {profile.service_cities && profile.service_cities.length > 0 && (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.service_cities[0]}</span>
                        {profile.service_cities.length > 1 && (
                            <span className="text-blue-600">
                                +{profile.service_cities.length - 1} more
                            </span>
                        )}
                    </div>
                )}
                {profile.certifications && profile.certifications.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{profile.certifications.join(", ")}</span>
                    </div>
                )}
            </div>

            {/* Bio */}
            {profile.bio && (
                <div className="max-w-2xl mx-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.bio}
                    </p>
                </div>
            )}

            {/* Specialties */}
            {profile.specialties && profile.specialties.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-wrap justify-center gap-2">
                        {profile.specialties.map((specialty, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                            >
                                {specialty}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* License Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    License #{profile.license_number} ({profile.license_state})
                </p>
            </div>
        </div>
    );
}
