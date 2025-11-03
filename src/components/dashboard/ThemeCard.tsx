import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/lib/themes";

interface ThemeCardProps {
    theme: ThemeConfig;
    isSelected: boolean;
    onSelect: (theme: ThemeConfig) => void;
    onPreview?: (theme: ThemeConfig) => void;
}

export function ThemeCard({
    theme,
    isSelected,
    onSelect,
    onPreview,
}: ThemeCardProps) {
    return (
        <Card
            className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(theme)}
        >
            {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                </div>
            )}

            <CardContent className="p-0">
                {/* Theme Preview */}
                <div
                    className="h-32 p-4 rounded-t-lg"
                    style={{ backgroundColor: theme.colors.background }}
                >
                    <div className="flex items-start gap-2 mb-3">
                        <div
                            className="w-16 h-16 rounded-full"
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div className="flex-1 space-y-2">
                            <div
                                className="h-3 rounded"
                                style={{
                                    backgroundColor: theme.colors.foreground,
                                    opacity: 0.8,
                                    width: "70%",
                                }}
                            />
                            <div
                                className="h-2 rounded"
                                style={{
                                    backgroundColor: theme.colors.muted,
                                    width: "90%",
                                }}
                            />
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex gap-2">
                        <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: theme.colors.primary }}
                            title="Primary"
                        />
                        <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: theme.colors.secondary }}
                            title="Secondary"
                        />
                        <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: theme.colors.accent }}
                            title="Accent"
                        />
                    </div>
                </div>

                {/* Theme Info */}
                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                                {theme.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {theme.description}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            {theme.isPremium && (
                                <Badge variant="secondary" className="text-xs">
                                    Pro
                                </Badge>
                            )}
                            {theme.has3D && (
                                <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                    3D
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Font Info */}
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Fonts:</span>{" "}
                        {theme.fonts.heading}
                        {theme.fonts.heading !== theme.fonts.body &&
                            ` / ${theme.fonts.body}`}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(theme);
                            }}
                        >
                            {isSelected ? "Selected" : "Apply"}
                        </Button>
                        {onPreview && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(theme);
                                }}
                            >
                                Preview
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
