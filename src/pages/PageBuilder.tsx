/**
 * Page Builder Editor
 * Main interface for building and editing link-in-bio pages
 * Features: categorized block library, theme customizer, per-block styling, improved UX
 */

import { useEffect, useState } from "react";
import { usePageBuilderStore } from "@/stores/pageBuilderStore";
import { createNewPage, getBlockTemplates } from "@/lib/pageBuilder";
import { useAuthStore } from "@/stores/useAuthStore";
import { PageList } from "@/components/pageBuilder/PageList";
import { BlockRenderer } from "@/components/pageBuilder/BlockRenderer";
import { BlockSettings } from "@/components/pageBuilder/BlockSettings";
import { BlockStyleSettings } from "@/components/pageBuilder/BlockStyleSettings";
import { ThemeCustomizer } from "@/components/pageBuilder/ThemeCustomizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Undo,
    Redo,
    Eye,
    Save,
    Globe,
    Plus,
    Settings,
    Trash2,
    Copy,
    EyeOff,
    GripVertical,
    ArrowLeft,
    Monitor,
    Smartphone,
    Palette,
    Layers,
    Layout,
    Sparkles,
    Type,
    Image,
    BarChart3,
    MessageSquare,
    Share2,
    Video,
    Mail,
    Link,
    Home,
    MoveVertical,
    Megaphone,
    Minus,
    Images,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getThemedStyles, preloadThemeFonts } from "@/lib/themeUtils";
import type { BlockStyle } from "@/types/pageBuilder";

const blockIcons: Record<string, React.ReactNode> = {
    bio: <Layers className="w-4 h-4" />,
    hero: <Sparkles className="w-4 h-4" />,
    listings: <Home className="w-4 h-4" />,
    stats: <BarChart3 className="w-4 h-4" />,
    text: <Type className="w-4 h-4" />,
    image: <Image className="w-4 h-4" />,
    gallery: <Images className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    link: <Link className="w-4 h-4" />,
    contact: <Mail className="w-4 h-4" />,
    social: <Share2 className="w-4 h-4" />,
    testimonial: <MessageSquare className="w-4 h-4" />,
    cta: <Megaphone className="w-4 h-4" />,
    spacer: <MoveVertical className="w-4 h-4" />,
    divider: <Minus className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
    content: "Content",
    media: "Media",
    engagement: "Engagement",
    layout: "Layout",
};

export default function PageBuilderEditor() {
    const { user, profile } = useAuthStore();
    const [showPageList, setShowPageList] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isMobilePreview, setIsMobilePreview] = useState(false);
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [leftTab, setLeftTab] = useState<"blocks" | "theme">("blocks");
    const [rightTab, setRightTab] = useState<"content" | "style">("content");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        content: true,
        media: true,
        engagement: true,
        layout: false,
    });
    const {
        page,
        selectedBlockId,
        isPreviewMode,
        isSaving,
        canUndo,
        canRedo,
        setPage,
        selectBlock,
        addBlockToPage,
        removeBlockFromPage,
        updateBlockConfig,
        reorderPageBlocks,
        duplicatePageBlock,
        toggleBlockVisible,
        undo,
        redo,
        togglePreviewMode,
        savePage,
        publishPage,
        updatePageMeta,
    } = usePageBuilderStore();

    useEffect(() => {
        setShowPageList(!page);
    }, [page]);

    useEffect(() => {
        if (page?.theme) {
            preloadThemeFonts(page.theme);
        }
    }, [page?.theme]);

    // Auto-save functionality
    useEffect(() => {
        if (!page || isSaving) return;
        const autoSaveTimer = setTimeout(async () => {
            try {
                await savePage();
                setLastSaved(new Date());
            } catch (error) {
                console.error("Auto-save failed:", error);
                toast.error("Auto-save failed - please save manually");
            }
        }, 3000);
        return () => clearTimeout(autoSaveTimer);
    }, [page, isSaving, savePage]);

    const handleSave = async () => {
        try {
            await savePage();
            setLastSaved(new Date());
            toast.success("Page saved successfully!");
        } catch (error) {
            toast.error("Failed to save page");
        }
    };

    const handlePublish = async () => {
        try {
            await publishPage();
            toast.success("Page published successfully!");
        } catch (error) {
            toast.error("Failed to publish page");
        }
    };

    const handleUpdateBlockStyle = (blockId: string, style: BlockStyle) => {
        if (!page) return;
        const updatedBlocks = page.blocks.map((b) =>
            b.id === blockId ? { ...b, style } : b
        );
        updatePageMeta({ blocks: updatedBlocks } as any);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedBlockIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "0.5";
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedBlockIndex(null);
        setDragOverIndex(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "1";
        }
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedBlockIndex !== null && draggedBlockIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedBlockIndex !== null && draggedBlockIndex !== dropIndex) {
            reorderPageBlocks(draggedBlockIndex, dropIndex);
        }
        setDraggedBlockIndex(null);
        setDragOverIndex(null);
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    const selectedBlock = page?.blocks.find((b) => b.id === selectedBlockId);
    const blockTemplates = getBlockTemplates();

    // Group templates by category
    const templatesByCategory = blockTemplates.reduce((acc, t) => {
        const cat = t.category || "content";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {} as Record<string, typeof blockTemplates>);

    if (showPageList || !page) {
        return (
            <div className="container mx-auto py-8">
                <PageList />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar - Block Library & Theme */}
            {!isPreviewMode && (
                <div className="w-72 bg-white border-r flex flex-col shadow-sm">
                    {/* Sidebar Tabs */}
                    <div className="border-b">
                        <div className="flex">
                            <button
                                onClick={() => setLeftTab("blocks")}
                                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    leftTab === "blocks"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <Layout className="w-4 h-4" />
                                Blocks
                            </button>
                            <button
                                onClick={() => setLeftTab("theme")}
                                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    leftTab === "theme"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <Palette className="w-4 h-4" />
                                Theme
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {leftTab === "blocks" ? (
                            <div className="p-3 space-y-1">
                                {Object.entries(templatesByCategory).map(([category, templates]) => (
                                    <div key={category}>
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between py-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                                        >
                                            {categoryLabels[category] || category}
                                            {expandedCategories[category] ? (
                                                <ChevronDown className="w-3 h-3" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3" />
                                            )}
                                        </button>

                                        {expandedCategories[category] && (
                                            <div className="space-y-1 pb-2">
                                                {templates.map((template) => (
                                                    <button
                                                        key={template.type}
                                                        onClick={() => addBlockToPage(template.type)}
                                                        className="w-full p-2.5 text-left rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center gap-3"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors flex-shrink-0">
                                                            {blockIcons[template.type] || <Plus className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm text-gray-800 truncate">
                                                                {template.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {template.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                <ThemeCustomizer
                                    theme={page.theme}
                                    onThemeChange={(theme) => updatePageMeta({ theme })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Toolbar */}
                <div className="bg-white border-b px-4 py-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setPage(null);
                                setShowPageList(true);
                            }}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Pages
                        </Button>

                        <div className="w-px h-5 bg-gray-200 mx-1" />

                        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} className="px-2">
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} className="px-2">
                            <Redo className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-5 bg-gray-200 mx-1" />

                        <Input
                            type="text"
                            value={page.title}
                            onChange={(e) => updatePageMeta({ title: e.target.value })}
                            className="w-52 h-8 text-sm"
                            placeholder="Page Title"
                        />

                        <Badge
                            variant={page.published ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {page.published ? "Published" : "Draft"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preview Toggle */}
                        <Button
                            variant={isPreviewMode ? "default" : "outline"}
                            size="sm"
                            onClick={togglePreviewMode}
                            className="gap-1.5"
                        >
                            {isPreviewMode ? (
                                <>
                                    <Settings className="w-3.5 h-3.5" />
                                    Edit
                                </>
                            ) : (
                                <>
                                    <Eye className="w-3.5 h-3.5" />
                                    Preview
                                </>
                            )}
                        </Button>

                        {/* Device Toggle */}
                        <div className="flex border rounded-md">
                            <Button
                                variant={!isMobilePreview ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setIsMobilePreview(false)}
                                className="rounded-r-none px-2.5"
                            >
                                <Monitor className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant={isMobilePreview ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setIsMobilePreview(true)}
                                className="rounded-l-none px-2.5"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        <div className="w-px h-5 bg-gray-200 mx-1" />

                        {/* Save */}
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                                <Save className="w-3.5 h-3.5" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            {lastSaved && !isSaving && (
                                <span className="text-xs text-gray-400">
                                    {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            )}
                        </div>

                        {/* Publish */}
                        <Button size="sm" onClick={handlePublish} disabled={isSaving} className="gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Publish
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div
                        className="mx-auto rounded-xl shadow-xl min-h-full transition-all duration-300 overflow-hidden"
                        style={{
                            ...getThemedStyles(page.theme),
                            backgroundColor: page.theme.colors.background,
                            color: page.theme.colors.text,
                            fontFamily: `'${page.theme.fonts.body}', sans-serif`,
                            maxWidth: isMobilePreview ? "375px" : "672px",
                        }}
                    >
                        <div
                            className="p-6 md:p-8"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: page.theme.spacing === "compact" ? "0.75rem" :
                                     page.theme.spacing === "spacious" ? "2.5rem" : "1.5rem",
                            }}
                        >
                            {page.blocks.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Plus className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-semibold text-gray-500 text-lg">
                                        Start building your page
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                        Add blocks from the sidebar to create your professional agent page
                                    </p>
                                </div>
                            ) : (
                                page.blocks.map((block, index) => (
                                    <div
                                        key={block.id}
                                        draggable={!isPreviewMode}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className={`relative group transition-all duration-200 ${
                                            draggedBlockIndex === index ? "opacity-40 scale-[0.98]" : ""
                                        }`}
                                    >
                                        {/* Drop indicator */}
                                        {dragOverIndex === index && draggedBlockIndex !== index && (
                                            <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
                                        )}

                                        {/* Block Actions */}
                                        {!isPreviewMode && (
                                            <div className="absolute -left-11 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-0.5 z-10">
                                                <div
                                                    className="p-1 bg-white border rounded shadow-sm hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                                                    title="Drag to reorder"
                                                >
                                                    <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <button
                                                    onClick={() => duplicatePageBlock(block.id)}
                                                    className="p-1 bg-white border rounded shadow-sm hover:bg-gray-50"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => toggleBlockVisible(block.id)}
                                                    className="p-1 bg-white border rounded shadow-sm hover:bg-gray-50"
                                                    title={block.visible ? "Hide" : "Show"}
                                                >
                                                    {block.visible ? (
                                                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                                                    ) : (
                                                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => removeBlockFromPage(block.id)}
                                                    className="p-1 bg-white border rounded shadow-sm hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Block Type Label */}
                                        {!isPreviewMode && (
                                            <div className="absolute -top-2.5 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded">
                                                    {block.type}
                                                </span>
                                            </div>
                                        )}

                                        <BlockRenderer
                                            block={block}
                                            isEditing={!isPreviewMode}
                                            isSelected={selectedBlockId === block.id}
                                            onSelect={() => selectBlock(block.id)}
                                            userId={page.userId}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Block Settings & Style */}
            {!isPreviewMode && selectedBlock && (
                <div className="w-80 bg-white border-l flex flex-col shadow-sm">
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {blockIcons[selectedBlock.type] || <Settings className="w-4 h-4" />}
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">{selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block</h2>
                                <p className="text-xs text-gray-400">Configure this block</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <Tabs
                            value={rightTab}
                            onValueChange={(v) => setRightTab(v as "content" | "style")}
                            className="w-full"
                        >
                            <div className="px-4 pt-3">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                                    <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="content" className="px-4 pb-4 pt-3 space-y-4">
                                <BlockSettings
                                    block={selectedBlock}
                                    onUpdate={(config) => updateBlockConfig(selectedBlock.id, config)}
                                />
                            </TabsContent>

                            <TabsContent value="style" className="px-4 pb-4 pt-3">
                                <BlockStyleSettings
                                    style={selectedBlock.style || {}}
                                    onStyleChange={(style) => handleUpdateBlockStyle(selectedBlock.id, style)}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="p-3 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeBlockFromPage(selectedBlock.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete Block
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
