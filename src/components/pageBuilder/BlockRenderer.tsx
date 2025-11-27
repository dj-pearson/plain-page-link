/**
 * Block Renderer
 * Routes to the appropriate block component based on type
 */

import { PageBlock } from "@/types/pageBuilder";
import { BioBlock } from "./blocks/BioBlock";
import { ListingsBlock } from "./blocks/ListingsBlock";
import { LinkBlock } from "./blocks/LinkBlock";
import { ContactBlock } from "./blocks/ContactBlock";
import { SocialBlock } from "./blocks/SocialBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { SpacerBlock } from "./blocks/SpacerBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";

interface BlockRendererProps {
    block: PageBlock;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    userId?: string; // User ID for data fetching
}

export function BlockRenderer({
    block,
    isEditing = false,
    isSelected = false,
    onSelect,
    userId,
}: BlockRendererProps) {
    const renderBlock = () => {
        switch (block.type) {
            case "bio":
                return (
                    <BioBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "listings":
                return (
                    <ListingsBlock
                        config={block.config as any}
                        isEditing={isEditing}
                        userId={userId}
                    />
                );
            case "link":
                return (
                    <LinkBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "contact":
                return (
                    <ContactBlock
                        config={block.config as any}
                        isEditing={isEditing}
                        userId={userId}
                    />
                );
            case "social":
                return (
                    <SocialBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "video":
                return (
                    <VideoBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "spacer":
                return (
                    <SpacerBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "text":
                return (
                    <TextBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            case "image":
                return (
                    <ImageBlock
                        config={block.config as any}
                        isEditing={isEditing}
                    />
                );
            default:
                return (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
                        <p className="text-yellow-800">
                            Unknown block type: {block.type}
                        </p>
                    </div>
                );
        }
    };

    if (!isEditing) {
        // Public view - render block without editing features
        return (
            <div className={!block.visible ? "hidden" : ""}>
                {renderBlock()}
            </div>
        );
    }

    // Editor view - with selection and editing features
    return (
        <div
            onClick={onSelect}
            className={`
                relative group transition-all
                ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                ${!block.visible ? "opacity-50" : ""}
                ${onSelect ? "cursor-pointer" : ""}
            `}
        >
            {/* Block content */}
            {renderBlock()}

            {/* Selection overlay */}
            {onSelect && (
                <div
                    className={`
                        absolute inset-0 pointer-events-none
                        ${
                            isSelected
                                ? ""
                                : "group-hover:ring-1 group-hover:ring-gray-300"
                        }
                    `}
                />
            )}
        </div>
    );
}
