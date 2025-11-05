import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";

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
    const { user } = useAuthStore();
    const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(
        getCurrentTheme()
    );
    const [customColors, setCustomColors] = useState(selectedTheme.colors);
    const [customFonts, setCustomFonts] = useState(selectedTheme.fonts);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { subscription } = useSubscriptionLimits();

    // Load saved theme from database
    useEffect(() => {
        loadSavedTheme();
    }, [user]);

    const loadSavedTheme = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data?.theme) {
                let savedTheme: ThemeConfig;
                
                // Handle different theme formats
                if (typeof data.theme === 'string') {
                    // Check if it's JSON or just a preset name
                    if (data.theme.startsWith('{')) {
                        savedTheme = JSON.parse(data.theme);
                    } else {
                        // It's a preset name, find the matching theme
                        const matchingTheme = DEFAULT_THEMES.find(t => t.id === data.theme);
                        savedTheme = matchingTheme || DEFAULT_THEMES[0];
                    }
                } else {
                    savedTheme = data.theme as ThemeConfig;
                }
                
                setSelectedTheme(savedTheme);
                setCustomColors(savedTheme.colors);
                setCustomFonts(savedTheme.fonts);
                applyTheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load saved theme:', error);
            // Load default theme on error
            const defaultTheme = DEFAULT_THEMES[0];
            setSelectedTheme(defaultTheme);
            setCustomColors(defaultTheme.colors);
            setCustomFonts(defaultTheme.fonts);
        }
    };

    const handleThemeSelect = async (theme: ThemeConfig) => {
        // Check if theme is premium and user doesn't have access
        if (theme.isPremium && subscription?.plan_name === 'free') {
            setShowUpgradeModal(true);
            return;
        }

        setSelectedTheme(theme);
        setCustomColors(theme.colors);
        setCustomFonts(theme.fonts);
        setIsCustomizing(false);
        
        // Auto-apply theme for instant preview
        applyTheme(theme);
    };

    const handleSaveTheme = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to save themes",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        
        try {
            const themeToApply: ThemeConfig = {
                ...selectedTheme,
                colors: customColors,
                fonts: customFonts,
            };

            // Save to database
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    theme: JSON.stringify(themeToApply)
                })
                .eq('id', user.id);

            if (error) throw error;

            // Apply locally
            applyTheme(themeToApply);

            toast({
                title: "Theme saved!",
                description: "Your profile theme has been updated successfully.",
            });
            
            setIsCustomizing(false);
        } catch (error) {
            console.error('Failed to save theme:', error);
            toast({
                title: "Error",
                description: "Failed to save theme. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreviewTheme = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to preview",
                variant: "destructive",
            });
            return;
        }

        try {
            // Get user's username
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data?.username) {
                // Open profile in new tab
                window.open(`/${data.username}`, '_blank');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to open preview",
                variant: "destructive",
            });
        }
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
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Mobile optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Theme Customization</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                        Customize your profile's look and feel
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewTheme}
                        title="Open your public profile in a new tab to see your theme"
                        className="flex-1 sm:flex-none"
                    >
                        <Eye className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Preview Live</span>
                    </Button>
                    {isCustomizing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetToDefault}
                            className="flex-1 sm:flex-none"
                        >
                            <RotateCcw className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Reset</span>
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSaveTheme} disabled={isSaving} className="flex-1 sm:flex-none">
                        {isSaving ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-xs sm:text-sm">Save Theme</span>
                    </Button>
                </div>
            </div>

            {/* Info Banner - Mobile optimized */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl flex-shrink-0">✨</div>
                    <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            How to see your theme changes:
                        </p>
                        <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-0.5 sm:space-y-1 list-decimal list-inside">
                            <li>Select a theme below and click <strong>"Save Theme"</strong></li>
                            <li>Click <strong>"Preview Live"</strong> button above to open your public profile in a new tab</li>
                            <li>Premium themes with 3D effects will show animated backgrounds on your public page!</li>
                        </ol>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 sm:mt-2">
                            💡 Note: Theme effects only appear on your <strong>public profile page</strong>, not in this dashboard.
                        </p>
                    </div>
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

                {/* Theme Presets Tab - Mobile optimized */}
                <TabsContent value="presets" className="space-y-4 sm:space-y-6">
                    {/* Free Themes */}
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                            Free Themes
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {freeThemes.map((theme) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={selectedTheme.id === theme.id}
                                    onSelect={handleThemeSelect}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Premium Themes */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-semibold">
                                Premium Themes
                            </h3>
                            <Badge>Pro</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {premiumThemes.map((theme) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={selectedTheme.id === theme.id}
                                    onSelect={handleThemeSelect}
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Customize Tab - Mobile optimized */}
                <TabsContent value="customize" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Colors */}
                        <Card>
                            <CardHeader className="pb-3 sm:pb-4">
                                <CardTitle className="text-base sm:text-lg">Colors</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Customize the color scheme of your profile
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4">
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
                            <CardHeader className="pb-3 sm:pb-4">
                                <CardTitle className="text-base sm:text-lg">Typography</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Select fonts for headings and body text
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4">
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

                    {/* Live Preview - Mobile optimized */}
                    <Card>
                        <CardHeader className="pb-3 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">Live Preview</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                See how your theme will look on your profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="rounded-lg p-4 sm:p-8 space-y-3 sm:space-y-4"
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

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium min-h-[44px]"
                                        style={{
                                            backgroundColor:
                                                customColors.primary,
                                        }}
                                    >
                                        Primary
                                    </button>
                                    <button
                                        className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
                                        style={{
                                            backgroundColor:
                                                customColors.secondary,
                                            color: "white",
                                        }}
                                    >
                                        Secondary
                                    </button>
                                    <button
                                        className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
                                        style={{
                                            backgroundColor:
                                                customColors.accent,
                                            color: "white",
                                        }}
                                    >
                                        Accent
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

            {/* Upgrade Modal */}
            <UpgradeModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                feature="premium_themes"
                currentPlan={subscription?.plan_name || "Free"}
                requiredPlan="Professional"
            />
        </div>
    );
}
