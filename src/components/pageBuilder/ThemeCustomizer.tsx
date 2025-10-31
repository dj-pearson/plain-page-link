/**
 * Theme Customizer Component
 * UI for selecting and customizing page themes
 */

import { useState } from "react";
import { PageTheme } from "@/types/pageBuilder";
import {
    themePresets,
    availableFonts,
    colorPalettes,
    isValidHexColor,
} from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Palette } from "lucide-react";

interface ThemeCustomizerProps {
    theme: PageTheme;
    onThemeChange: (theme: PageTheme) => void;
}

export function ThemeCustomizer({
    theme,
    onThemeChange,
}: ThemeCustomizerProps) {
    const [customColors, setCustomColors] = useState(theme.colors);

    const handlePresetSelect = (presetName: string) => {
        const preset = themePresets[presetName];
        if (preset) {
            onThemeChange(preset);
            setCustomColors(preset.colors);
        }
    };

    const handleColorChange = (colorKey: string, value: string) => {
        if (isValidHexColor(value)) {
            const newColors = { ...customColors, [colorKey]: value };
            setCustomColors(newColors);
            onThemeChange({
                ...theme,
                colors: newColors,
            });
        }
    };

    const handleFontChange = (fontType: "heading" | "body", font: string) => {
        onThemeChange({
            ...theme,
            fonts: {
                ...theme.fonts,
                [fontType]: font,
            },
        });
    };

    const handleBorderRadiusChange = (
        radius: "none" | "small" | "medium" | "large" | "full"
    ) => {
        onThemeChange({
            ...theme,
            borderRadius: radius,
        });
    };

    const handleSpacingChange = (
        spacing: "compact" | "normal" | "spacious"
    ) => {
        onThemeChange({
            ...theme,
            spacing,
        });
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="typography">Typography</TabsTrigger>
                </TabsList>

                {/* Presets Tab */}
                <TabsContent value="presets" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(themePresets).map(([key, preset]) => (
                            <button
                                key={key}
                                onClick={() => handlePresetSelect(key)}
                                className={`
                                        relative p-4 rounded-lg border-2 text-left
                                        transition-all hover:shadow-md
                                        ${
                                            theme.preset === key
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-gray-200"
                                        }
                                    `}
                            >
                                {/* Color Preview */}
                                <div className="flex gap-1 mb-2">
                                    <div
                                        className="w-6 h-6 rounded"
                                        style={{
                                            backgroundColor:
                                                preset.colors.primary,
                                        }}
                                    />
                                    <div
                                        className="w-6 h-6 rounded"
                                        style={{
                                            backgroundColor:
                                                preset.colors.secondary,
                                        }}
                                    />
                                    <div
                                        className="w-6 h-6 rounded"
                                        style={{
                                            backgroundColor:
                                                preset.colors.accent,
                                        }}
                                    />
                                </div>

                                {/* Name */}
                                <p className="font-semibold text-sm">
                                    {preset.name}
                                </p>

                                {/* Selected Indicator */}
                                {theme.preset === key && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                    <div className="space-y-4">
                        {/* Primary Color */}
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColors.primary}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "primary",
                                            e.target.value
                                        )
                                    }
                                    className="w-16 h-10"
                                />
                                <Input
                                    type="text"
                                    value={customColors.primary}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "primary",
                                            e.target.value
                                        )
                                    }
                                    placeholder="#2563eb"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColors.secondary}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "secondary",
                                            e.target.value
                                        )
                                    }
                                    className="w-16 h-10"
                                />
                                <Input
                                    type="text"
                                    value={customColors.secondary}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "secondary",
                                            e.target.value
                                        )
                                    }
                                    placeholder="#10b981"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColors.background}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "background",
                                            e.target.value
                                        )
                                    }
                                    className="w-16 h-10"
                                />
                                <Input
                                    type="text"
                                    value={customColors.background}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "background",
                                            e.target.value
                                        )
                                    }
                                    placeholder="#ffffff"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColors.text}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "text",
                                            e.target.value
                                        )
                                    }
                                    className="w-16 h-10"
                                />
                                <Input
                                    type="text"
                                    value={customColors.text}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "text",
                                            e.target.value
                                        )
                                    }
                                    placeholder="#1f2937"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColors.accent}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "accent",
                                            e.target.value
                                        )
                                    }
                                    className="w-16 h-10"
                                />
                                <Input
                                    type="text"
                                    value={customColors.accent}
                                    onChange={(e) =>
                                        handleColorChange(
                                            "accent",
                                            e.target.value
                                        )
                                    }
                                    placeholder="#f59e0b"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Palettes */}
                    <div className="space-y-2 pt-4 border-t">
                        <Label className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Quick Palettes
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(colorPalettes).map(
                                ([name, colors]) => (
                                    <button
                                        key={name}
                                        className="flex gap-0.5 p-1 rounded border hover:border-primary"
                                        title={name}
                                    >
                                        {colors.slice(0, 3).map((color) => (
                                            <div
                                                key={color}
                                                className="w-8 h-8 rounded"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        ))}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-4">
                    {/* Heading Font */}
                    <div className="space-y-2">
                        <Label>Heading Font</Label>
                        <Select
                            value={theme.fonts.heading}
                            onValueChange={(value) =>
                                handleFontChange("heading", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFonts.map((font) => (
                                    <SelectItem key={font} value={font}>
                                        {font}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Body Font */}
                    <div className="space-y-2">
                        <Label>Body Font</Label>
                        <Select
                            value={theme.fonts.body}
                            onValueChange={(value) =>
                                handleFontChange("body", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFonts.map((font) => (
                                    <SelectItem key={font} value={font}>
                                        {font}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Border Radius */}
                    <div className="space-y-2">
                        <Label>Border Radius</Label>
                        <div className="grid grid-cols-5 gap-2">
                            {(
                                [
                                    "none",
                                    "small",
                                    "medium",
                                    "large",
                                    "full",
                                ] as const
                            ).map((radius) => (
                                <Button
                                    key={radius}
                                    variant={
                                        theme.borderRadius === radius
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        handleBorderRadiusChange(radius)
                                    }
                                    className="capitalize"
                                >
                                    {radius}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Spacing */}
                    <div className="space-y-2">
                        <Label>Spacing</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["compact", "normal", "spacious"] as const).map(
                                (spacing) => (
                                    <Button
                                        key={spacing}
                                        variant={
                                            theme.spacing === spacing
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            handleSpacingChange(spacing)
                                        }
                                        className="capitalize"
                                    >
                                        {spacing}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
