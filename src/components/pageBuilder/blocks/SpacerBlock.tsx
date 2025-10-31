/**
 * Spacer Block Component
 * Adds vertical space between blocks
 */

import { SpacerBlockConfig } from "@/types/pageBuilder";

interface SpacerBlockProps {
    config: SpacerBlockConfig;
    isEditing?: boolean;
}

export function SpacerBlock({ config, isEditing = false }: SpacerBlockProps) {
    return (
        <div
            style={{ height: `${config.height}px` }}
            className={
                isEditing
                    ? "border-2 border-dashed border-gray-300 rounded"
                    : ""
            }
        >
            {isEditing && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    {config.height}px spacer
                </div>
            )}
        </div>
    );
}
