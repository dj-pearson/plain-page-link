/**
 * Text Block Component
 * Displays custom text content
 */

import { TextBlockConfig } from "@/types/pageBuilder";

interface TextBlockProps {
    config: TextBlockConfig;
    isEditing?: boolean;
}

export function TextBlock({ config, isEditing = false }: TextBlockProps) {
    const getAlignClass = () => {
        switch (config.align) {
            case "center":
                return "text-center";
            case "right":
                return "text-right";
            case "left":
            default:
                return "text-left";
        }
    };

    const getFontSizeClass = () => {
        switch (config.fontSize) {
            case "small":
                return "text-sm";
            case "large":
                return "text-lg";
            case "medium":
            default:
                return "text-base";
        }
    };

    return (
        <div className={`${getAlignClass()} ${getFontSizeClass()}`}>
            {config.content ? (
                <p className="whitespace-pre-wrap text-gray-700">
                    {config.content}
                </p>
            ) : (
                isEditing && (
                    <p className="text-gray-400 italic">
                        Enter your text here...
                    </p>
                )
            )}
        </div>
    );
}
