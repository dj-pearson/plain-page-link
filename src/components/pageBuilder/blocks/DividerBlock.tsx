/**
 * Divider Block Component
 * Visual separator between sections with various styles
 */

import { DividerBlockConfig } from "@/types/pageBuilder";

interface DividerBlockProps {
    config: DividerBlockConfig;
    isEditing?: boolean;
}

export function DividerBlock({ config, isEditing = false }: DividerBlockProps) {
    const color = config.color || "var(--theme-primary, #e5e7eb)";

    switch (config.style) {
        case "dashed":
            return (
                <div className="py-2">
                    <hr
                        className="border-0"
                        style={{
                            borderTop: `2px dashed ${color}`,
                            opacity: 0.4,
                        }}
                    />
                </div>
            );

        case "dotted":
            return (
                <div className="py-2">
                    <hr
                        className="border-0"
                        style={{
                            borderTop: `3px dotted ${color}`,
                            opacity: 0.4,
                        }}
                    />
                </div>
            );

        case "gradient":
            return (
                <div className="py-2">
                    <div
                        className="h-[2px] rounded-full"
                        style={{
                            background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                        }}
                    />
                </div>
            );

        case "wave":
            return (
                <div className="py-2 overflow-hidden">
                    <svg
                        viewBox="0 0 1200 30"
                        className="w-full h-6"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 15 Q 150 0, 300 15 T 600 15 T 900 15 T 1200 15"
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            opacity="0.4"
                        />
                    </svg>
                </div>
            );

        case "line":
        default:
            return (
                <div className="py-2">
                    <hr
                        className="border-0"
                        style={{
                            borderTop: `1px solid ${color}`,
                            opacity: 0.3,
                        }}
                    />
                </div>
            );
    }
}
