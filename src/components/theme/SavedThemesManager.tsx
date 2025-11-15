/**
 * Saved Themes Manager
 * Allows users to save, manage, and quickly switch between custom theme variations
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Check, Plus, Palette } from "lucide-react";
import { toast } from "sonner";
import type { ThemeConfig } from "@/lib/themes";

interface SavedTheme {
    id: string;
    name: string;
    theme: ThemeConfig;
    createdAt: Date;
}

interface SavedThemesManagerProps {
    currentTheme: ThemeConfig;
    onApplyTheme: (theme: ThemeConfig) => void;
}

export function SavedThemesManager({ currentTheme, onApplyTheme }: SavedThemesManagerProps) {
    const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newThemeName, setNewThemeName] = useState("");
    const [activatedThemeId, setActivatedThemeId] = useState<string | null>(null);

    // Load saved themes from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("agentbio_saved_themes");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSavedThemes(parsed.map((t: any) => ({
                    ...t,
                    createdAt: new Date(t.createdAt),
                })));
            } catch (error) {
                console.error("Failed to load saved themes:", error);
            }
        }
    }, []);

    // Save themes to localStorage whenever they change
    const persistThemes = (themes: SavedTheme[]) => {
        localStorage.setItem("agentbio_saved_themes", JSON.stringify(themes));
    };

    const handleSaveTheme = () => {
        if (!newThemeName.trim()) {
            toast.error("Please enter a theme name");
            return;
        }

        const newTheme: SavedTheme = {
            id: `theme_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: newThemeName,
            theme: currentTheme,
            createdAt: new Date(),
        };

        const updated = [...savedThemes, newTheme];
        setSavedThemes(updated);
        persistThemes(updated);

        toast.success(`Theme "${newThemeName}" saved!`);
        setNewThemeName("");
        setShowSaveDialog(false);
    };

    const handleApplyTheme = (savedTheme: SavedTheme) => {
        onApplyTheme(savedTheme.theme);
        setActivatedThemeId(savedTheme.id);
        toast.success(`Applied theme "${savedTheme.name}"`);
    };

    const handleDeleteTheme = (id: string, name: string) => {
        if (!confirm(`Delete theme "${name}"?`)) return;

        const updated = savedThemes.filter((t) => t.id !== id);
        setSavedThemes(updated);
        persistThemes(updated);

        if (activatedThemeId === id) {
            setActivatedThemeId(null);
        }

        toast.success(`Theme "${name}" deleted`);
    };

    const getPreviewColors = (theme: ThemeConfig) => {
        return [
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.accent,
        ];
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            My Saved Themes
                        </CardTitle>
                        <CardDescription>
                            Save and quickly switch between your custom theme variations
                        </CardDescription>
                    </div>
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Save Current
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save Current Theme</DialogTitle>
                                <DialogDescription>
                                    Give your theme a name to save it for later use
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="theme-name">Theme Name</Label>
                                    <Input
                                        id="theme-name"
                                        value={newThemeName}
                                        onChange={(e) => setNewThemeName(e.target.value)}
                                        placeholder="e.g., Dark Professional, Ocean Blue..."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSaveTheme();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveTheme} className="flex-1">
                                        Save Theme
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowSaveDialog(false);
                                            setNewThemeName("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {savedThemes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No saved themes yet</p>
                        <p className="text-xs mt-1">
                            Customize a theme and click "Save Current" to create your first saved theme
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedThemes.map((savedTheme) => (
                            <Card
                                key={savedTheme.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                    activatedThemeId === savedTheme.id
                                        ? "ring-2 ring-primary"
                                        : ""
                                }`}
                                onClick={() => handleApplyTheme(savedTheme)}
                            >
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        {/* Theme preview colors */}
                                        <div className="flex gap-2 h-12 rounded-lg overflow-hidden">
                                            {getPreviewColors(savedTheme.theme).map(
                                                (color, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )
                                            )}
                                        </div>

                                        {/* Theme info */}
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-sm truncate flex-1">
                                                    {savedTheme.name}
                                                </h4>
                                                {activatedThemeId === savedTheme.id && (
                                                    <Badge
                                                        variant="default"
                                                        className="flex-shrink-0"
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Saved {savedTheme.createdAt.toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {savedTheme.theme.fonts.heading} •{" "}
                                                {savedTheme.theme.name}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApplyTheme(savedTheme);
                                                }}
                                                className="flex-1"
                                            >
                                                Apply
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTheme(
                                                        savedTheme.id,
                                                        savedTheme.name
                                                    );
                                                }}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
