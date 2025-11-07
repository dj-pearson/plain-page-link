import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageBuilderStore } from "@/stores/pageBuilderStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Globe,
    CheckCircle2,
    ExternalLink,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createNewPage } from "@/lib/pageBuilder";
import { pageTemplates, applyTemplate } from "@/lib/pageTemplates";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PageConfig } from "@/types/pageBuilder";

export function PageList() {
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();
    const { setPage, loadUserPages, setAsActivePage } = usePageBuilderStore();
    const [pages, setPages] = useState<PageConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            const userPages = await loadUserPages();
            setPages(userPages);
        } catch (error) {
            console.error("Failed to load pages:", error);
            toast.error("Failed to load pages");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        if (!user || !profile) {
            toast.error("Please log in to create a page");
            return;
        }

        setShowTemplates(true);
    };

    const handleSelectTemplate = (templateId: string | null) => {
        if (!user || !profile) {
            toast.error("Please log in to create a page");
            return;
        }

        const newPage = createNewPage(user.id, profile.username || "my-page");

        // Apply template if selected
        if (templateId) {
            const template = pageTemplates.find((t) => t.id === templateId);
            if (template) {
                newPage.blocks = applyTemplate(
                    template,
                    user.id,
                    newPage.slug
                );
                toast.success(`Created page from "${template.name}" template!`);
            }
        }

        setPage(newPage);
        setShowTemplates(false);
        navigate("/dashboard/page-builder");
    };

    const handleEdit = (page: PageConfig) => {
        setPage(page);
        navigate("/dashboard/page-builder");
    };

    const handleSetActive = async (pageId: string) => {
        setActivating(pageId);
        try {
            await setAsActivePage(pageId);
            await loadPages(); // Reload to show updated active status
        } catch (error) {
            console.error("Failed to set active page:", error);
        } finally {
            setActivating(null);
        }
    };

    const handleDelete = async (pageId: string) => {
        if (!confirm("Are you sure you want to delete this page?")) return;

        try {
            const { error } = await supabase
                .from("custom_pages")
                .delete()
                .eq("id", pageId);

            if (error) throw error;

            toast.success("Page deleted successfully");
            await loadPages();
        } catch (error) {
            console.error("Failed to delete page:", error);
            toast.error("Failed to delete page");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading pages...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Your Pages</h2>
                    <p className="text-muted-foreground">
                        Create custom link-in-bio pages
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Page
                </Button>
            </div>

            {pages.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                            No pages yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first custom page to get started
                        </p>
                        <Button onClick={handleCreateNew} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Your First Page
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map((page) => {
                        const isActive =
                            (page as any).is_active || false;
                        return (
                            <Card key={page.id} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg truncate">
                                                {page.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                /{page.slug}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <Badge
                                                variant="default"
                                                className="gap-1"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Active
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Badge
                                            variant={
                                                page.published
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {page.published
                                                ? "Published"
                                                : "Draft"}
                                        </Badge>
                                        <Badge variant="outline">
                                            {page.blocks.length} blocks
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(page)}
                                        className="gap-2 w-full"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>

                                    {page.published && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="gap-2 w-full"
                                            >
                                                <a
                                                    href={`/p/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Preview
                                                    <ExternalLink className="h-3 w-3 ml-auto" />
                                                </a>
                                            </Button>

                                            {!isActive && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSetActive(page.id)
                                                    }
                                                    disabled={
                                                        activating === page.id
                                                    }
                                                    className="gap-2 w-full"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    {activating === page.id
                                                        ? "Setting..."
                                                        : "Set as Active"}
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(page.id)}
                                        className="gap-2 w-full text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>

                                {page.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {page.description}
                                    </p>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Template Selector Dialog */}
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Choose a Template</DialogTitle>
                        <DialogDescription>
                            Start with a pre-built template or create a blank page
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {/* Blank Page Option */}
                        <Card
                            className="p-6 cursor-pointer hover:border-primary transition-colors"
                            onClick={() => handleSelectTemplate(null)}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gray-100 rounded">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">
                                            Blank Page
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Start from scratch
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground flex-1">
                                    Create a completely custom page by adding
                                    blocks one at a time.
                                </p>
                            </div>
                        </Card>

                        {/* Template Options */}
                        {pageTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="p-6 cursor-pointer hover:border-primary transition-colors"
                                onClick={() =>
                                    handleSelectTemplate(template.id)
                                }
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-primary/10 rounded">
                                            <Sparkles className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">
                                                {template.name}
                                            </h3>
                                            <Badge variant="outline" className="mt-1">
                                                {template.blocks.length} blocks
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex-1">
                                        {template.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
