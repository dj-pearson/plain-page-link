/**
 * Block Settings
 * Settings panel for configuring page builder blocks
 */

import { PageBlock, BlockConfig } from "@/types/pageBuilder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface BlockSettingsProps {
    block: PageBlock;
    onUpdate: (config: Partial<BlockConfig>) => void;
}

export function BlockSettings({ block, onUpdate }: BlockSettingsProps) {
    const config = block.config;

    // Render settings based on block type
    switch (block.type) {
        case "bio":
            return <BioSettings config={config as any} onUpdate={onUpdate} />;
        case "link":
            return <LinkSettings config={config as any} onUpdate={onUpdate} />;
        case "listings":
            return <ListingsSettings config={config as any} onUpdate={onUpdate} />;
        case "contact":
            return <ContactSettings config={config as any} onUpdate={onUpdate} />;
        case "social":
            return <SocialSettings config={config as any} onUpdate={onUpdate} />;
        case "video":
            return <VideoSettings config={config as any} onUpdate={onUpdate} />;
        case "testimonial":
            return <TestimonialSettings config={config as any} onUpdate={onUpdate} />;
        case "spacer":
            return <SpacerSettings config={config as any} onUpdate={onUpdate} />;
        case "image":
            return <ImageSettings config={config as any} onUpdate={onUpdate} />;
        case "text":
            return <TextSettings config={config as any} onUpdate={onUpdate} />;
        default:
            return (
                <div className="text-sm text-muted-foreground">
                    No settings available for this block type
                </div>
            );
    }
}

// Bio Block Settings
function BioSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="bio-title">Name</Label>
                <Input
                    id="bio-title"
                    value={config.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Your Name"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio-subtitle">Job Title</Label>
                <Input
                    id="bio-subtitle"
                    value={config.subtitle || ""}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                    placeholder="Real Estate Professional"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio-description">Bio</Label>
                <Textarea
                    id="bio-description"
                    value={config.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="Tell visitors about yourself..."
                    rows={4}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio-avatar">Avatar URL</Label>
                <Input
                    id="bio-avatar"
                    value={config.avatarUrl || ""}
                    onChange={(e) => onUpdate({ avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                    Leave empty to use your profile photo
                </p>
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="bio-social">Show Social Links</Label>
                <Switch
                    id="bio-social"
                    checked={config.showSocialLinks}
                    onCheckedChange={(checked) =>
                        onUpdate({ showSocialLinks: checked })
                    }
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="bio-contact">Show Contact Button</Label>
                <Switch
                    id="bio-contact"
                    checked={config.showContactButton}
                    onCheckedChange={(checked) =>
                        onUpdate({ showContactButton: checked })
                    }
                />
            </div>
        </div>
    );
}

// Link Block Settings
function LinkSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="link-title">Button Text</Label>
                <Input
                    id="link-title"
                    value={config.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Click Here"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                    id="link-url"
                    type="url"
                    value={config.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    placeholder="https://example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="link-style">Style</Label>
                <Select
                    value={config.style}
                    onValueChange={(value) => onUpdate({ style: value })}
                >
                    <SelectTrigger id="link-style">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="button">Button</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="link-newtab">Open in New Tab</Label>
                <Switch
                    id="link-newtab"
                    checked={config.openInNewTab}
                    onCheckedChange={(checked) =>
                        onUpdate({ openInNewTab: checked })
                    }
                />
            </div>
        </div>
    );
}

// Listings Block Settings
function ListingsSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="listings-title">Section Title</Label>
                <Input
                    id="listings-title"
                    value={config.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Featured Properties"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="listings-layout">Layout</Label>
                <Select
                    value={config.layout}
                    onValueChange={(value) => onUpdate({ layout: value })}
                >
                    <SelectTrigger id="listings-layout">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="listings-filter">Show</Label>
                <Select
                    value={config.filter}
                    onValueChange={(value) => onUpdate({ filter: value })}
                >
                    <SelectTrigger id="listings-filter">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Listings</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="featured">Featured Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="listings-max">Max Items</Label>
                <Input
                    id="listings-max"
                    type="number"
                    min="1"
                    max="20"
                    value={config.maxItems || 6}
                    onChange={(e) =>
                        onUpdate({ maxItems: parseInt(e.target.value) || 6 })
                    }
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="listings-prices">Show Prices</Label>
                <Switch
                    id="listings-prices"
                    checked={config.showPrices}
                    onCheckedChange={(checked) =>
                        onUpdate({ showPrices: checked })
                    }
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="listings-status">Show Status</Label>
                <Switch
                    id="listings-status"
                    checked={config.showStatus}
                    onCheckedChange={(checked) =>
                        onUpdate({ showStatus: checked })
                    }
                />
            </div>
        </div>
    );
}

// Contact Block Settings
function ContactSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="contact-title">Form Title</Label>
                <Input
                    id="contact-title"
                    value={config.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Get In Touch"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-button">Submit Button Text</Label>
                <Input
                    id="contact-button"
                    value={config.submitButtonText}
                    onChange={(e) =>
                        onUpdate({ submitButtonText: e.target.value })
                    }
                    placeholder="Send Message"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-success">Success Message</Label>
                <Textarea
                    id="contact-success"
                    value={config.successMessage}
                    onChange={(e) =>
                        onUpdate({ successMessage: e.target.value })
                    }
                    placeholder="Thank you! I'll get back to you soon."
                    rows={2}
                />
            </div>

            <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                    Form fields (name, email, message) are automatically included
                </p>
            </div>
        </div>
    );
}

// Social Block Settings
function SocialSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="social-title">Section Title (Optional)</Label>
                <Input
                    id="social-title"
                    value={config.title || ""}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Follow Me"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="social-layout">Layout</Label>
                <Select
                    value={config.layout}
                    onValueChange={(value) => onUpdate({ layout: value })}
                >
                    <SelectTrigger id="social-layout">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="social-size">Icon Size</Label>
                <Select
                    value={config.iconSize}
                    onValueChange={(value) => onUpdate({ iconSize: value })}
                >
                    <SelectTrigger id="social-size">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                    Social links are pulled from your profile settings
                </p>
            </div>
        </div>
    );
}

// Video Block Settings
function VideoSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="video-title">Section Title (Optional)</Label>
                <Input
                    id="video-title"
                    value={config.title || ""}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Watch My Introduction"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                    id="video-url"
                    type="url"
                    value={config.videoUrl}
                    onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, and direct video URLs
                </p>
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="video-autoplay">Autoplay</Label>
                <Switch
                    id="video-autoplay"
                    checked={config.autoplay}
                    onCheckedChange={(checked) =>
                        onUpdate({ autoplay: checked })
                    }
                />
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="video-muted">Start Muted</Label>
                <Switch
                    id="video-muted"
                    checked={config.muted}
                    onCheckedChange={(checked) => onUpdate({ muted: checked })}
                />
            </div>
        </div>
    );
}

// Testimonial Block Settings
function TestimonialSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="testimonial-title">Section Title (Optional)</Label>
                <Input
                    id="testimonial-title"
                    value={config.title || ""}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="What Clients Say"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="testimonial-layout">Layout</Label>
                <Select
                    value={config.layout}
                    onValueChange={(value) => onUpdate({ layout: value })}
                >
                    <SelectTrigger id="testimonial-layout">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="slider">Slider</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                    Testimonials are pulled from your testimonials library
                </p>
            </div>
        </div>
    );
}

// Spacer Block Settings
function SpacerSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="spacer-height">Height (pixels)</Label>
                <div className="flex items-center gap-4">
                    <input
                        id="spacer-height"
                        type="range"
                        min={10}
                        max={200}
                        step={10}
                        value={config.height}
                        onChange={(e) =>
                            onUpdate({ height: parseInt(e.target.value) })
                        }
                        className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                        {config.height}px
                    </span>
                </div>
            </div>

            <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                    Use spacers to add vertical spacing between blocks
                </p>
            </div>
        </div>
    );
}

// Image Block Settings
function ImageSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                    id="image-url"
                    type="url"
                    value={config.imageUrl}
                    onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                    id="image-alt"
                    value={config.alt}
                    onChange={(e) => onUpdate({ alt: e.target.value })}
                    placeholder="Describe the image"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image-caption">Caption (Optional)</Label>
                <Input
                    id="image-caption"
                    value={config.caption || ""}
                    onChange={(e) => onUpdate({ caption: e.target.value })}
                    placeholder="Image caption"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image-link">Link (Optional)</Label>
                <Input
                    id="image-link"
                    type="url"
                    value={config.link || ""}
                    onChange={(e) => onUpdate({ link: e.target.value })}
                    placeholder="https://example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image-size">Size</Label>
                <Select
                    value={config.size}
                    onValueChange={(value) => onUpdate({ size: value })}
                >
                    <SelectTrigger id="image-size">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Text Block Settings
function TextSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                    id="text-content"
                    value={config.content}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    placeholder="Enter your text here..."
                    rows={6}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="text-align">Text Alignment</Label>
                <Select
                    value={config.align}
                    onValueChange={(value) => onUpdate({ align: value })}
                >
                    <SelectTrigger id="text-align">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="text-size">Font Size</Label>
                <Select
                    value={config.fontSize}
                    onValueChange={(value) => onUpdate({ fontSize: value })}
                >
                    <SelectTrigger id="text-size">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
