import { Phone, Mail, MessageSquare } from "lucide-react";
import type { Profile } from "@/types";

interface ContactButtonsProps {
    profile: Profile;
    onContactClick?: (method: string) => void;
}

export default function ContactButtons({
    profile,
    onContactClick,
}: ContactButtonsProps) {
    const handleClick = (method: string, value: string) => {
        if (onContactClick) {
            onContactClick(method);
        }

        // Open native app/action
        if (method === "phone") {
            window.location.href = `tel:${value}`;
        } else if (method === "email") {
            window.location.href = `mailto:${value}`;
        } else if (method === "sms") {
            window.location.href = `sms:${value}`;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Get in Touch
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Phone Button */}
                {profile.phone && (
                    <button
                        onClick={() => handleClick("phone", profile.phone!)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        style={{
                            backgroundColor: `hsl(var(--theme-primary, 217 91% 60%))`,
                            color: 'white'
                        }}
                    >
                        <Phone className="h-5 w-5" />
                        <span>Call</span>
                    </button>
                )}

                {/* Email Button */}
                {profile.email_display && (
                    <button
                        onClick={() =>
                            handleClick("email", profile.email_display!)
                        }
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        style={{
                            backgroundColor: `hsl(var(--theme-secondary, 142 71% 45%))`,
                            color: 'white'
                        }}
                    >
                        <Mail className="h-5 w-5" />
                        <span>Email</span>
                    </button>
                )}

                {/* SMS Button */}
                {profile.phone && profile.sms_enabled && (
                    <button
                        onClick={() => handleClick("sms", profile.phone!)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        style={{
                            backgroundColor: `hsl(var(--theme-accent, 38 92% 50%))`,
                            color: 'white'
                        }}
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span>Text</span>
                    </button>
                )}
            </div>

            {/* Contact info display for desktop */}
            <div className="hidden md:block mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
                    {profile.phone && (
                        <a
                            href={`tel:${profile.phone}`}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {profile.phone}
                        </a>
                    )}
                    {profile.email_display && (
                        <a
                            href={`mailto:${profile.email_display}`}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {profile.email_display}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
