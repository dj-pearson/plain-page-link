/**
 * Block Renderer
 * Routes to the appropriate block component based on type
 * Applies per-block styling and animation wrappers
 */

import { PageBlock, BlockStyle } from "@/types/pageBuilder";
import { BioBlock } from "./blocks/BioBlock";
import { ListingsBlock } from "./blocks/ListingsBlock";
import { LinkBlock } from "./blocks/LinkBlock";
import { ContactBlock } from "./blocks/ContactBlock";
import { SocialBlock } from "./blocks/SocialBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { SpacerBlock } from "./blocks/SpacerBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { HeroBlock } from "./blocks/HeroBlock";
import { StatsBlock } from "./blocks/StatsBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { CTABlock } from "./blocks/CTABlock";
import { TestimonialBlock } from "./blocks/TestimonialBlock";
import { DividerBlock } from "./blocks/DividerBlock";

interface BlockRendererProps {
    block: PageBlock;
    isEditing?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    userId?: string;
}

function getBlockStyleCSS(style?: BlockStyle): React.CSSProperties {
    if (!style) return {};

    const paddingMap = { none: "0", small: "0.75rem", medium: "1.5rem", large: "2.5rem" };
    const marginMap = { none: "0", small: "0.5rem", medium: "1rem", large: "2rem" };
    const radiusMap = { none: "0", small: "0.375rem", medium: "0.75rem", large: "1rem", full: "1.5rem" };
    const shadowMap: Record<string, string> = {
        none: "none",
        small: "0 1px 3px rgba(0,0,0,0.1)",
        medium: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        large: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        glow: "0 0 20px rgba(37,99,235,0.3)",
    };

    return {
        ...(style.backgroundColor && { backgroundColor: style.backgroundColor }),
        ...(style.backgroundGradient && { background: style.backgroundGradient }),
        ...(style.padding && { padding: paddingMap[style.padding] }),
        ...(style.margin && { margin: marginMap[style.margin] }),
        ...(style.borderRadius && { borderRadius: radiusMap[style.borderRadius] }),
        ...(style.border && { border: style.border }),
        ...(style.shadow && style.shadow !== "none" && { boxShadow: shadowMap[style.shadow] }),
        ...(style.textColor && { color: style.textColor }),
    };
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
                return <BioBlock config={block.config as any} isEditing={isEditing} />;
            case "listings":
                return <ListingsBlock config={block.config as any} isEditing={isEditing} userId={userId} />;
            case "link":
                return <LinkBlock config={block.config as any} isEditing={isEditing} />;
            case "contact":
                return <ContactBlock config={block.config as any} isEditing={isEditing} userId={userId} />;
            case "social":
                return <SocialBlock config={block.config as any} isEditing={isEditing} />;
            case "video":
                return <VideoBlock config={block.config as any} isEditing={isEditing} />;
            case "testimonial":
                return <TestimonialBlock config={block.config as any} isEditing={isEditing} userId={userId} />;
            case "spacer":
                return <SpacerBlock config={block.config as any} isEditing={isEditing} />;
            case "text":
                return <TextBlock config={block.config as any} isEditing={isEditing} />;
            case "image":
                return <ImageBlock config={block.config as any} isEditing={isEditing} />;
            case "hero":
                return <HeroBlock config={block.config as any} isEditing={isEditing} />;
            case "stats":
                return <StatsBlock config={block.config as any} isEditing={isEditing} />;
            case "gallery":
                return <GalleryBlock config={block.config as any} isEditing={isEditing} />;
            case "cta":
                return <CTABlock config={block.config as any} isEditing={isEditing} />;
            case "divider":
                return <DividerBlock config={block.config as any} isEditing={isEditing} />;
            default:
                return (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
                        <p className="text-yellow-800">Unknown block type: {block.type}</p>
                    </div>
                );
        }
    };

    const blockStyleCSS = getBlockStyleCSS(block.style);

    if (!isEditing) {
        return (
            <div
                className={!block.visible ? "hidden" : ""}
                style={blockStyleCSS}
            >
                {renderBlock()}
            </div>
        );
    }

    return (
        <div
            onClick={onSelect}
            style={blockStyleCSS}
            className={`
                relative group transition-all rounded-lg
                ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                ${!block.visible ? "opacity-50" : ""}
                ${onSelect ? "cursor-pointer" : ""}
            `}
        >
            {renderBlock()}
            {onSelect && (
                <div
                    className={`
                        absolute inset-0 pointer-events-none rounded-lg
                        ${isSelected ? "" : "group-hover:ring-1 group-hover:ring-gray-300"}
                    `}
                />
            )}
        </div>
    );
}
