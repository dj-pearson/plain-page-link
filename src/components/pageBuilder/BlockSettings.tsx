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
        case "hero":
            return <HeroSettings config={config as any} onUpdate={onUpdate} />;
        case "stats":
            return <StatsSettings config={config as any} onUpdate={onUpdate} />;
        case "gallery":
            return <GallerySettings config={config as any} onUpdate={onUpdate} />;
        case "cta":
            return <CTASettings config={config as any} onUpdate={onUpdate} />;
        case "divider":
            return <DividerSettings config={config as any} onUpdate={onUpdate} />;
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
                    onCheckedChange={(checked) => onUpdate({ showSocialLinks: checked })}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="bio-contact">Show Contact Button</Label>
                <Switch
                    id="bio-contact"
                    checked={config.showContactButton}
                    onCheckedChange={(checked) => onUpdate({ showContactButton: checked })}
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
                <Select value={config.style} onValueChange={(value) => onUpdate({ style: value })}>
                    <SelectTrigger id="link-style"><SelectValue /></SelectTrigger>
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
                    onCheckedChange={(checked) => onUpdate({ openInNewTab: checked })}
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
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="listings-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="listings-filter">Show</Label>
                <Select value={config.filter} onValueChange={(value) => onUpdate({ filter: value })}>
                    <SelectTrigger id="listings-filter"><SelectValue /></SelectTrigger>
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
                    onChange={(e) => onUpdate({ maxItems: parseInt(e.target.value) || 6 })}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="listings-prices">Show Prices</Label>
                <Switch
                    id="listings-prices"
                    checked={config.showPrices}
                    onCheckedChange={(checked) => onUpdate({ showPrices: checked })}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="listings-status">Show Status</Label>
                <Switch
                    id="listings-status"
                    checked={config.showStatus}
                    onCheckedChange={(checked) => onUpdate({ showStatus: checked })}
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
                    onChange={(e) => onUpdate({ submitButtonText: e.target.value })}
                    placeholder="Send Message"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact-success">Success Message</Label>
                <Textarea
                    id="contact-success"
                    value={config.successMessage}
                    onChange={(e) => onUpdate({ successMessage: e.target.value })}
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
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="social-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="social-size">Icon Size</Label>
                <Select value={config.iconSize} onValueChange={(value) => onUpdate({ iconSize: value })}>
                    <SelectTrigger id="social-size"><SelectValue /></SelectTrigger>
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
                    onCheckedChange={(checked) => onUpdate({ autoplay: checked })}
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
    const addTestimonial = () => {
        const newTestimonial = {
            id: `t_${Date.now()}`,
            name: "Client Name",
            role: "Home Buyer",
            content: "Working with this agent was an amazing experience...",
            rating: 5,
        };
        onUpdate({ testimonials: [...(config.testimonials || []), newTestimonial] });
    };

    const removeTestimonial = (id: string) => {
        onUpdate({ testimonials: config.testimonials.filter((t: any) => t.id !== id) });
    };

    const updateTestimonial = (id: string, field: string, value: any) => {
        onUpdate({
            testimonials: config.testimonials.map((t: any) =>
                t.id === id ? { ...t, [field]: value } : t
            ),
        });
    };

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
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="testimonial-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="slider">Slider</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="stacked">Stacked</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Testimonial entries */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <Label>Testimonials ({config.testimonials?.length || 0})</Label>
                    <Button size="sm" variant="outline" onClick={addTestimonial} className="gap-1">
                        <Plus className="w-3 h-3" /> Add
                    </Button>
                </div>

                {(config.testimonials || []).map((t: any) => (
                    <div key={t.id} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase">Testimonial</span>
                            <button
                                onClick={() => removeTestimonial(t.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <Input
                            value={t.name}
                            onChange={(e) => updateTestimonial(t.id, "name", e.target.value)}
                            placeholder="Client name"
                            className="h-8 text-sm"
                        />
                        <Input
                            value={t.role || ""}
                            onChange={(e) => updateTestimonial(t.id, "role", e.target.value)}
                            placeholder="e.g., Home Buyer"
                            className="h-8 text-sm"
                        />
                        <Textarea
                            value={t.content}
                            onChange={(e) => updateTestimonial(t.id, "content", e.target.value)}
                            placeholder="Their testimonial..."
                            rows={2}
                            className="text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Rating</Label>
                            <Select
                                value={String(t.rating || 5)}
                                onValueChange={(v) => updateTestimonial(t.id, "rating", parseInt(v))}
                            >
                                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[5, 4, 3, 2, 1].map((r) => (
                                        <SelectItem key={r} value={String(r)}>{r} stars</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
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
                        onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
                        className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{config.height}px</span>
                </div>
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
                <Select value={config.size} onValueChange={(value) => onUpdate({ size: value })}>
                    <SelectTrigger id="image-size"><SelectValue /></SelectTrigger>
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
                <Select value={config.align} onValueChange={(value) => onUpdate({ align: value })}>
                    <SelectTrigger id="text-align"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="text-size">Font Size</Label>
                <Select value={config.fontSize} onValueChange={(value) => onUpdate({ fontSize: value })}>
                    <SelectTrigger id="text-size"><SelectValue /></SelectTrigger>
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

// Hero Block Settings
function HeroSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="hero-headline">Headline</Label>
                <Input
                    id="hero-headline"
                    value={config.headline}
                    onChange={(e) => onUpdate({ headline: e.target.value })}
                    placeholder="Your Dream Home Awaits"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-subheadline">Subheadline (Optional)</Label>
                <Textarea
                    id="hero-subheadline"
                    value={config.subheadline || ""}
                    onChange={(e) => onUpdate({ subheadline: e.target.value })}
                    placeholder="Expert guidance for your real estate journey"
                    rows={2}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-bg">Background Image URL (Optional)</Label>
                <Input
                    id="hero-bg"
                    type="url"
                    value={config.backgroundImageUrl || ""}
                    onChange={(e) => onUpdate({ backgroundImageUrl: e.target.value })}
                    placeholder="https://example.com/hero.jpg"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-overlay">Overlay</Label>
                <Select
                    value={config.backgroundOverlay || "gradient"}
                    onValueChange={(value) => onUpdate({ backgroundOverlay: value })}
                >
                    <SelectTrigger id="hero-overlay"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-layout">Layout</Label>
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="hero-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="centered">Centered</SelectItem>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-height">Height</Label>
                <Select value={config.height} onValueChange={(value) => onUpdate({ height: value })}>
                    <SelectTrigger id="hero-height"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-cta-text">CTA Button Text (Optional)</Label>
                <Input
                    id="hero-cta-text"
                    value={config.ctaText || ""}
                    onChange={(e) => onUpdate({ ctaText: e.target.value })}
                    placeholder="Get Started"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="hero-cta-url">CTA Button URL</Label>
                <Input
                    id="hero-cta-url"
                    type="url"
                    value={config.ctaUrl || ""}
                    onChange={(e) => onUpdate({ ctaUrl: e.target.value })}
                    placeholder="https://example.com"
                />
            </div>
        </div>
    );
}

// Stats Block Settings
function StatsSettings({ config, onUpdate }: any) {
    const addStat = () => {
        const newStat = {
            id: `stat_${Date.now()}`,
            value: "0",
            label: "New Stat",
            icon: "star",
        };
        onUpdate({ stats: [...(config.stats || []), newStat] });
    };

    const removeStat = (id: string) => {
        onUpdate({ stats: config.stats.filter((s: any) => s.id !== id) });
    };

    const updateStat = (id: string, field: string, value: any) => {
        onUpdate({
            stats: config.stats.map((s: any) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="stats-title">Section Title (Optional)</Label>
                <Input
                    id="stats-title"
                    value={config.title || ""}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="By The Numbers"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="stats-layout">Layout</Label>
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="stats-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="row">Row</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="cards">Cards</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <Label>Stats ({config.stats?.length || 0})</Label>
                    <Button size="sm" variant="outline" onClick={addStat} className="gap-1">
                        <Plus className="w-3 h-3" /> Add
                    </Button>
                </div>

                {(config.stats || []).map((s: any) => (
                    <div key={s.id} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase">Stat</span>
                            <button
                                onClick={() => removeStat(s.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                value={s.prefix || ""}
                                onChange={(e) => updateStat(s.id, "prefix", e.target.value)}
                                placeholder="Prefix ($)"
                                className="h-8 text-sm"
                            />
                            <Input
                                value={s.value}
                                onChange={(e) => updateStat(s.id, "value", e.target.value)}
                                placeholder="Value"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                value={s.suffix || ""}
                                onChange={(e) => updateStat(s.id, "suffix", e.target.value)}
                                placeholder="Suffix (+, %)"
                                className="h-8 text-sm"
                            />
                            <Select
                                value={s.icon || "star"}
                                onValueChange={(v) => updateStat(s.id, "icon", v)}
                            >
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="star">Star</SelectItem>
                                    <SelectItem value="award">Award</SelectItem>
                                    <SelectItem value="dollar">Dollar</SelectItem>
                                    <SelectItem value="users">Users</SelectItem>
                                    <SelectItem value="trending">Trending</SelectItem>
                                    <SelectItem value="clock">Clock</SelectItem>
                                    <SelectItem value="target">Target</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            value={s.label}
                            onChange={(e) => updateStat(s.id, "label", e.target.value)}
                            placeholder="Label"
                            className="h-8 text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Gallery Block Settings
function GallerySettings({ config, onUpdate }: any) {
    const addImage = () => {
        const newImage = {
            id: `img_${Date.now()}`,
            url: "",
            alt: "Gallery image",
            caption: "",
        };
        onUpdate({ images: [...(config.images || []), newImage] });
    };

    const removeImage = (id: string) => {
        onUpdate({ images: config.images.filter((i: any) => i.id !== id) });
    };

    const updateImage = (id: string, field: string, value: string) => {
        onUpdate({
            images: config.images.map((i: any) =>
                i.id === id ? { ...i, [field]: value } : i
            ),
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="gallery-title">Section Title (Optional)</Label>
                <Input
                    id="gallery-title"
                    value={config.title || ""}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Gallery"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="gallery-layout">Layout</Label>
                <Select value={config.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                    <SelectTrigger id="gallery-layout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="gallery-columns">Columns</Label>
                <Select
                    value={String(config.columns || 3)}
                    onValueChange={(value) => onUpdate({ columns: parseInt(value) })}
                >
                    <SelectTrigger id="gallery-columns"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <Label>Images ({config.images?.length || 0})</Label>
                    <Button size="sm" variant="outline" onClick={addImage} className="gap-1">
                        <Plus className="w-3 h-3" /> Add
                    </Button>
                </div>

                {(config.images || []).map((img: any) => (
                    <div key={img.id} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase">Image</span>
                            <button
                                onClick={() => removeImage(img.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <Input
                            value={img.url}
                            onChange={(e) => updateImage(img.id, "url", e.target.value)}
                            placeholder="Image URL"
                            className="h-8 text-sm"
                        />
                        <Input
                            value={img.alt}
                            onChange={(e) => updateImage(img.id, "alt", e.target.value)}
                            placeholder="Alt text"
                            className="h-8 text-sm"
                        />
                        <Input
                            value={img.caption || ""}
                            onChange={(e) => updateImage(img.id, "caption", e.target.value)}
                            placeholder="Caption (optional)"
                            className="h-8 text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// CTA Block Settings
function CTASettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cta-headline">Headline</Label>
                <Input
                    id="cta-headline"
                    value={config.headline}
                    onChange={(e) => onUpdate({ headline: e.target.value })}
                    placeholder="Ready to Get Started?"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cta-description">Description (Optional)</Label>
                <Textarea
                    id="cta-description"
                    value={config.description || ""}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="A brief supporting message..."
                    rows={2}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cta-button-text">Button Text</Label>
                <Input
                    id="cta-button-text"
                    value={config.buttonText}
                    onChange={(e) => onUpdate({ buttonText: e.target.value })}
                    placeholder="Get Started"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cta-button-url">Button URL</Label>
                <Input
                    id="cta-button-url"
                    type="url"
                    value={config.buttonUrl}
                    onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                    placeholder="https://example.com"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cta-variant">Style</Label>
                <Select value={config.variant} onValueChange={(value) => onUpdate({ variant: value })}>
                    <SelectTrigger id="cta-variant"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="cta-newtab">Open in New Tab</Label>
                <Switch
                    id="cta-newtab"
                    checked={config.openInNewTab}
                    onCheckedChange={(checked) => onUpdate({ openInNewTab: checked })}
                />
            </div>
        </div>
    );
}

// Divider Block Settings
function DividerSettings({ config, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="divider-style">Style</Label>
                <Select value={config.style} onValueChange={(value) => onUpdate({ style: value })}>
                    <SelectTrigger id="divider-style"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="divider-color">Color (Optional)</Label>
                <div className="flex gap-2">
                    <Input
                        id="divider-color"
                        type="color"
                        value={config.color || "#e5e7eb"}
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        className="w-16 h-10"
                    />
                    <Input
                        type="text"
                        value={config.color || ""}
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        placeholder="Uses theme color"
                        className="flex-1"
                    />
                </div>
            </div>
        </div>
    );
}
