import { useState } from "react";
import { ThemeCard } from "@/components/dashboard/ThemeCard";
import { ColorPicker } from "@/components/dashboard/ColorPicker";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Save, RotateCcw, Eye, Palette } from "lucide-react";
import {
    DEFAULT_THEMES,
    getCurrentTheme,
    applyTheme,
    type ThemeConfig,
} from "@/lib/themes";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Playfair Display",
    "Merriweather",
    "Bebas Neue",
    "Source Sans Pro",
];

export default function Theme() {
    const { toast } = useToast();
    const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(
        getCurrentTheme()
    );
    const [customColors, setCustomColors] = useState(selectedTheme.colors);
    const [customFonts, setCustomFonts] = useState(selectedTheme.fonts);
    const [isCustomizing, setIsCustomizing] = useState(false);

    const handleThemeSelect = (theme: ThemeConfig) => {
        setSelectedTheme(theme);
        setCustomColors(theme.colors);
        setCustomFonts(theme.fonts);
        setIsCustomizing(false);
    };

    const handleSaveTheme = () => {
        const themeToApply: ThemeConfig = {
            ...selectedTheme,
            colors: customColors,
            fonts: customFonts,
        };

        applyTheme(themeToApply);

        toast({
            title: "Theme saved!",
            description: "Your profile theme has been updated successfully.",
        });
    };

    const handlePreviewTheme = (theme: ThemeConfig) => {
        // TODO: Open preview in new tab or modal
        toast({
            title: "Preview coming soon",
            description: `Preview for ${theme.name} will open in a new window.`,
        });
    };

    const handleResetToDefault = () => {
        setCustomColors(selectedTheme.colors);
        setCustomFonts(selectedTheme.fonts);
        setIsCustomizing(false);
        toast({
            title: "Reset to default",
            description: "Theme has been reset to its default settings.",
        });
    };

    const handleColorChange = (
        key: keyof typeof customColors,
        value: string
    ) => {
        setCustomColors((prev) => ({ ...prev, [key]: value }));
        setIsCustomizing(true);
    };

    const handleFontChange = (key: keyof typeof customFonts, value: string) => {
        setCustomFonts((prev) => ({ ...prev, [key]: value }));
        setIsCustomizing(true);
    };

    const freeThemes = DEFAULT_THEMES.filter((t) => !t.isPremium);
    const premiumThemes = DEFAULT_THEMES.filter((t) => t.isPremium);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Theme Customization</h1>
                    <p className="text-muted-foreground mt-1">
                        Customize your profile's look and feel
                    </p>
                </div>
                <div className="flex gap-2">
                    {isCustomizing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetToDefault}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSaveTheme}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Theme
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="presets" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="presets">
                        <Palette className="w-4 h-4 mr-2" />
                        Theme Presets
                    </TabsTrigger>
                    <TabsTrigger value="customize">
                        <Eye className="w-4 h-4 mr-2" />
                        Customize
                    </TabsTrigger>
                </TabsList>

                {/* Theme Presets Tab */}
                <TabsContent value="presets" className="space-y-6">
                    {/* Free Themes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            Free Themes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {freeThemes.map((theme) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={selectedTheme.id === theme.id}
                                    onSelect={handleThemeSelect}
                                    onPreview={handlePreviewTheme}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Premium Themes */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-semibold">
                                Premium Themes
                            </h3>
                            <Badge>Pro</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {premiumThemes.map((theme) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={selectedTheme.id === theme.id}
                                    onSelect={handleThemeSelect}
                                    onPreview={handlePreviewTheme}
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Customize Tab */}
                <TabsContent value="customize" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Colors */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Colors</CardTitle>
                                <CardDescription>
                                    Customize the color scheme of your profile
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ColorPicker
                                    label="Primary Color"
                                    value={customColors.primary}
                                    onChange={(value) =>
                                        handleColorChange("primary", value)
                                    }
                                    description="Main brand color (buttons, links)"
                                />
                                <ColorPicker
                                    label="Secondary Color"
                                    value={customColors.secondary}
                                    onChange={(value) =>
                                        handleColorChange("secondary", value)
                                    }
                                    description="Secondary accent color"
                                />
                                <ColorPicker
                                    label="Accent Color"
                                    value={customColors.accent}
                                    onChange={(value) =>
                                        handleColorChange("accent", value)
                                    }
                                    description="Highlights and CTAs"
                                />
                                <ColorPicker
                                    label="Background Color"
                                    value={customColors.background}
                                    onChange={(value) =>
                                        handleColorChange("background", value)
                                    }
                                    description="Page background"
                                />
                                <ColorPicker
                                    label="Text Color"
                                    value={customColors.foreground}
                                    onChange={(value) =>
                                        handleColorChange("foreground", value)
                                    }
                                    description="Primary text color"
                                />
                            </CardContent>
                        </Card>

                        {/* Fonts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Typography</CardTitle>
                                <CardDescription>
                                    Select fonts for headings and body text
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="heading-font">
                                        Heading Font
                                    </Label>
                                    <Select
                                        value={customFonts.heading}
                                        onValueChange={(value) =>
                                            handleFontChange("heading", value)
                                        }
                                    >
                                        <SelectTrigger id="heading-font">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_FONTS.map((font) => (
                                                <SelectItem
                                                    key={font}
                                                    value={font}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily: font,
                                                        }}
                                                    >
                                                        {font}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Font used for titles and headings
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="body-font">Body Font</Label>
                                    <Select
                                        value={customFonts.body}
                                        onValueChange={(value) =>
                                            handleFontChange("body", value)
                                        }
                                    >
                                        <SelectTrigger id="body-font">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_FONTS.map((font) => (
                                                <SelectItem
                                                    key={font}
                                                    value={font}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily: font,
                                                        }}
                                                    >
                                                        {font}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Font used for paragraphs and text
                                    </p>
                                </div>

                                {/* Preview Text */}
                                <div className="mt-6 p-4 border rounded-lg space-y-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground">
                                        Preview
                                    </h4>
                                    <h3
                                        className="text-2xl font-bold"
                                        style={{
                                            fontFamily: customFonts.heading,
                                            color: customColors.primary,
                                        }}
                                    >
                                        Your Profile Heading
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{
                                            fontFamily: customFonts.body,
                                            color: customColors.foreground,
                                        }}
                                    >
                                        This is how your body text will appear
                                        on your profile. It should be readable
                                        and professional.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Live Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>
                                See how your theme will look on your profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="rounded-lg p-8 space-y-4"
                                style={{
                                    backgroundColor: customColors.background,
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-20 h-20 rounded-full"
                                        style={{
                                            backgroundColor:
                                                customColors.primary,
                                        }}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <h3
                                            className="text-2xl font-bold"
                                            style={{
                                                fontFamily: customFonts.heading,
                                                color: customColors.foreground,
                                            }}
                                        >
                                            Agent Name
                                        </h3>
                                        <p
                                            className="text-sm"
                                            style={{
                                                fontFamily: customFonts.body,
                                                color: customColors.mutedForeground,
                                            }}
                                        >
                                            Realtor® | Luxury Home Specialist
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                        style={{
                                            backgroundColor:
                                                customColors.primary,
                                        }}
                                    >
                                        Primary Button
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{
                                            backgroundColor:
                                                customColors.secondary,
                                            color: "white",
                                        }}
                                    >
                                        Secondary Button
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{
                                            backgroundColor:
                                                customColors.accent,
                                            color: "white",
                                        }}
                                    >
                                        Accent Button
                                    </button>
                                </div>

                                <div
                                    className="p-4 rounded-lg"
                                    style={{
                                        backgroundColor: customColors.card,
                                    }}
                                >
                                    <h4
                                        className="font-semibold mb-2"
                                        style={{
                                            fontFamily: customFonts.heading,
                                            color: customColors.cardForeground,
                                        }}
                                    >
                                        Property Card
                                    </h4>
                                    <p
                                        className="text-sm"
                                        style={{
                                            fontFamily: customFonts.body,
                                            color: customColors.mutedForeground,
                                        }}
                                    >
                                        This is how property cards will appear
                                        with your selected theme.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
