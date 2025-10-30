import {
    Instagram,
    Facebook,
    Linkedin,
    Music,
    Youtube,
    Home,
    Building,
    Globe,
} from "lucide-react";
import type { Profile } from "@/types";

interface SocialLinksProps {
    profile: Profile;
}

const socialPlatforms = [
    {
        key: "instagram_url" as const,
        icon: Instagram,
        label: "Instagram",
        color: "hover:text-pink-600",
    },
    {
        key: "facebook_url" as const,
        icon: Facebook,
        label: "Facebook",
        color: "hover:text-blue-600",
    },
    {
        key: "linkedin_url" as const,
        icon: Linkedin,
        label: "LinkedIn",
        color: "hover:text-blue-700",
    },
    {
        key: "tiktok_url" as const,
        icon: Music,
        label: "TikTok",
        color: "hover:text-gray-900",
    },
    {
        key: "youtube_url" as const,
        icon: Youtube,
        label: "YouTube",
        color: "hover:text-red-600",
    },
    {
        key: "zillow_url" as const,
        icon: Home,
        label: "Zillow",
        color: "hover:text-blue-600",
    },
    {
        key: "realtor_com_url" as const,
        icon: Building,
        label: "Realtor.com",
        color: "hover:text-red-600",
    },
    {
        key: "website_url" as const,
        icon: Globe,
        label: "Website",
        color: "hover:text-blue-600",
    },
];

export default function SocialLinks({ profile }: SocialLinksProps) {
    const activeSocials = socialPlatforms.filter(
        (platform) => profile[platform.key]
    );

    if (activeSocials.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Connect With Me
            </h3>

            <div className="flex flex-wrap justify-center gap-3">
                {activeSocials.map((platform) => {
                    const Icon = platform.icon;
                    const url = profile[platform.key];

                    return (
                        <a
                            key={platform.key}
                            href={url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700 font-medium transition-all ${platform.color} hover:border-current hover:shadow-md`}
                            aria-label={platform.label}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="hidden sm:inline">
                                {platform.label}
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
