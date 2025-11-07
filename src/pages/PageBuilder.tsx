/**
 * Page Builder Editor
 * Main interface for building and editing link-in-bio pages
 */

import { useEffect, useState } from "react";
import { usePageBuilderStore } from "@/stores/pageBuilderStore";
import { createNewPage, getBlockTemplates } from "@/lib/pageBuilder";
import { useAuthStore } from "@/stores/useAuthStore";
import { PageList } from "@/components/pageBuilder/PageList";
import { BlockRenderer } from "@/components/pageBuilder/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";

export default function PageBuilderEditor() {
    const { user, profile } = useAuthStore();
    const [showPageList, setShowPageList] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
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
        duplicatePageBlock,
        toggleBlockVisible,
        undo,
        redo,
        togglePreviewMode,
        savePage,
        publishPage,
        updatePageMeta,
    } = usePageBuilderStore();

    // Show page list if no page is loaded
    useEffect(() => {
        setShowPageList(!page);
    }, [page]);

    // Auto-save functionality - saves 3 seconds after last change
    useEffect(() => {
        if (!page || isSaving) return;

        const autoSaveTimer = setTimeout(async () => {
            try {
                await savePage();
                const savedTime = new Date();
                setLastSaved(savedTime);
                // Silent save - no toast notification to avoid spam
                console.log("Auto-saved at", savedTime.toLocaleTimeString());
            } catch (error) {
                console.error("Auto-save failed:", error);
                // Only show error if auto-save fails
                toast.error("Auto-save failed - please save manually");
            }
        }, 3000); // 3 second debounce

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

    const selectedBlock = page?.blocks.find((b) => b.id === selectedBlockId);

    const blockTemplates = getBlockTemplates();

    // Show page list if no page is loaded
    if (showPageList || !page) {
        return (
            <div className="container mx-auto py-8">
                <PageList />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Sidebar - Block Library */}
            {!isPreviewMode && (
                <div className="w-64 bg-white border-r flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg">Add Blocks</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {blockTemplates.map((template) => (
                            <button
                                key={template.type}
                                onClick={() => addBlockToPage(template.type)}
                                className="w-full p-3 text-left rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                    <div>
                                        <p className="font-medium text-sm">
                                            {template.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="bg-white border-b p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setPage(null);
                                setShowPageList(true);
                            }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Pages
                        </Button>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={undo}
                            disabled={!canUndo()}
                        >
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={redo}
                            disabled={!canRedo()}
                        >
                            <Redo className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-6 bg-gray-300 mx-2" />

                        <Input
                            type="text"
                            value={page.title}
                            onChange={(e) =>
                                updatePageMeta({ title: e.target.value })
                            }
                            className="w-64"
                            placeholder="Page Title"
                        />

                        <Badge
                            variant={page.published ? "default" : "secondary"}
                        >
                            {page.published ? "Published" : "Draft"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePreviewMode}
                        >
                            {isPreviewMode ? (
                                <>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Edit
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </>
                            )}
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            {lastSaved && !isSaving && (
                                <span className="text-xs text-gray-500">
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                        </div>

                        <Button
                            size="sm"
                            onClick={handlePublish}
                            disabled={isSaving}
                        >
                            <Globe className="w-4 h-4 mr-2" />
                            Publish
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg min-h-full">
                        <div className="p-8 space-y-6">
                            {page.blocks.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">
                                        Your page is empty
                                    </p>
                                    <p className="text-sm mt-1">
                                        Add blocks from the left sidebar to get
                                        started
                                    </p>
                                </div>
                            ) : (
                                page.blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="relative group"
                                    >
                                        {/* Block Actions (Edit Mode Only) */}
                                        {!isPreviewMode && (
                                            <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                                <button
                                                    className="p-1 bg-white border rounded hover:bg-gray-50"
                                                    title="Drag to reorder"
                                                >
                                                    <GripVertical className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        duplicatePageBlock(
                                                            block.id
                                                        )
                                                    }
                                                    className="p-1 bg-white border rounded hover:bg-gray-50"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        toggleBlockVisible(
                                                            block.id
                                                        )
                                                    }
                                                    className="p-1 bg-white border rounded hover:bg-gray-50"
                                                    title={
                                                        block.visible
                                                            ? "Hide"
                                                            : "Show"
                                                    }
                                                >
                                                    {block.visible ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        removeBlockFromPage(
                                                            block.id
                                                        )
                                                    }
                                                    className="p-1 bg-white border rounded hover:bg-red-50 text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Block Content */}
                                        <BlockRenderer
                                            block={block}
                                            isEditing={!isPreviewMode}
                                            isSelected={
                                                selectedBlockId === block.id
                                            }
                                            onSelect={() =>
                                                selectBlock(block.id)
                                            }
                                            userId={page.userId}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Block Settings */}
            {!isPreviewMode && selectedBlock && (
                <div className="w-80 bg-white border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg">
                            Block Settings
                        </h2>
                        <p className="text-sm text-gray-600">
                            {selectedBlock.type}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <Tabs defaultValue="content" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="content">
                                    Content
                                </TabsTrigger>
                                <TabsTrigger value="style">Style</TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="content"
                                className="space-y-4 mt-4"
                            >
                                <div className="space-y-2">
                                    <Label>Block Type</Label>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {selectedBlock.type}
                                    </p>
                                </div>

                                {/* TODO: Add specific settings for each block type */}
                                <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
                                    Block-specific settings will appear here
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="style"
                                className="space-y-4 mt-4"
                            >
                                <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
                                    Style settings coming soon
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                                removeBlockFromPage(selectedBlock.id)
                            }
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Block
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
