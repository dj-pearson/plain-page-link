/**
 * Bio Block Component
 * Displays agent profile and bio information
 */

import { BioBlockConfig } from "@/types/pageBuilder";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

interface BioBlockProps {
    config: BioBlockConfig;
    isEditing?: boolean;
}

export function BioBlock({ config, isEditing = false }: BioBlockProps) {
    return (
        <div className="text-center space-y-4 p-6" style={{
            fontFamily: "var(--theme-font-body, inherit)",
        }}>
            {/* Avatar */}
            {config.avatarUrl && (
                <div className="flex justify-center">
                    <Avatar className="w-24 h-24">
                        <AvatarImage
                            src={config.avatarUrl}
                            alt={config.title}
                        />
                        <AvatarFallback className="text-2xl">
                            {config.title.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}

            {/* Name/Title */}
            <div>
                <h1 className="text-3xl font-bold" style={{
                    color: "var(--theme-text, #1f2937)",
                    fontFamily: "var(--theme-font-heading, inherit)",
                }}>
                    {config.title}
                </h1>
                {config.subtitle && (
                    <p className="text-lg text-gray-600 mt-1">
                        {config.subtitle}
                    </p>
                )}
            </div>

            {/* Description */}
            {config.description && (
                <p className="text-gray-700 max-w-2xl mx-auto whitespace-pre-wrap">
                    {config.description}
                </p>
            )}

            {/* Contact Button */}
            {config.showContactButton && !isEditing && (
                <div className="flex gap-3 justify-center pt-2">
                    <Button className="gap-2" style={{
                        backgroundColor: "var(--theme-primary, #2563eb)",
                        borderRadius: "var(--theme-border-radius, 0.5rem)",
                    }}>
                        <Mail className="w-4 h-4" />
                        Contact Me
                    </Button>
                    <Button variant="outline" className="gap-2" style={{
                        borderRadius: "var(--theme-border-radius, 0.5rem)",
                        borderColor: "var(--theme-primary, #2563eb)",
                        color: "var(--theme-primary, #2563eb)",
                    }}>
                        <Phone className="w-4 h-4" />
                        Call Now
                    </Button>
                </div>
            )}
        </div>
    );
}
