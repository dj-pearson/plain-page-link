/**
 * Theme Engine
 * Predefined themes and customization options
 */

import { PageTheme } from "@/types/pageBuilder";

// ThemeConfig interface for theme cards
export interface ThemeConfig {
    id: string;
    name: string;
    description: string;
    isPremium: boolean;
    has3D?: boolean;
    threeDEffect?: '3d-particles' | '3d-mesh' | '3d-floating';
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        foreground: string;
        muted: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

// Default themes for selection
export const DEFAULT_THEMES: ThemeConfig[] = [
    {
        id: "modern",
        name: "Modern",
        description: "Clean and contemporary design with blue accents",
        isPremium: false,
        colors: {
            primary: "#2563eb",
            secondary: "#10b981",
            accent: "#f59e0b",
            background: "#ffffff",
            foreground: "#1f2937",
            muted: "#9ca3af",
        },
        fonts: {
            heading: "Inter",
            body: "Inter",
        },
    },
    {
        id: "classic",
        name: "Classic",
        description: "Traditional and timeless styling",
        isPremium: false,
        colors: {
            primary: "#1e40af",
            secondary: "#059669",
            accent: "#dc2626",
            background: "#f9fafb",
            foreground: "#111827",
            muted: "#6b7280",
        },
        fonts: {
            heading: "Georgia",
            body: "Georgia",
        },
    },
    {
        id: "minimal",
        name: "Minimal",
        description: "Simple and elegant monochrome design",
        isPremium: false,
        colors: {
            primary: "#000000",
            secondary: "#6b7280",
            accent: "#000000",
            background: "#ffffff",
            foreground: "#374151",
            muted: "#9ca3af",
        },
        fonts: {
            heading: "Helvetica",
            body: "Helvetica",
        },
    },
    {
        id: "bold",
        name: "Bold",
        description: "Vibrant and energetic color scheme",
        isPremium: true,
        colors: {
            primary: "#dc2626",
            secondary: "#f59e0b",
            accent: "#7c2d12",
            background: "#fef2f2",
            foreground: "#1f2937",
            muted: "#f87171",
        },
        fonts: {
            heading: "Montserrat",
            body: "Open Sans",
        },
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "Sophisticated purple and violet tones",
        isPremium: true,
        colors: {
            primary: "#6366f1",
            secondary: "#8b5cf6",
            accent: "#c026d3",
            background: "#faf5ff",
            foreground: "#1e1b4b",
            muted: "#a78bfa",
        },
        fonts: {
            heading: "Playfair Display",
            body: "Lora",
        },
    },
    {
        id: "ocean",
        name: "Ocean",
        description: "Calming blue and cyan palette",
        isPremium: true,
        colors: {
            primary: "#0891b2",
            secondary: "#06b6d4",
            accent: "#0e7490",
            background: "#ecfeff",
            foreground: "#164e63",
            muted: "#67e8f9",
        },
        fonts: {
            heading: "Roboto",
            body: "Roboto",
        },
    },
    {
        id: "cosmic",
        name: "Cosmic",
        description: "Futuristic theme with 3D particle effects",
        isPremium: true,
        has3D: true,
        threeDEffect: "3d-particles",
        colors: {
            primary: "#8b5cf6",
            secondary: "#a78bfa",
            accent: "#c084fc",
            background: "#0f172a",
            foreground: "#e2e8f0",
            muted: "#6366f1",
        },
        fonts: {
            heading: "Orbitron",
            body: "Rajdhani",
        },
    },
    {
        id: "luxe",
        name: "Luxe",
        description: "Premium gradient mesh with 3D sphere animation",
        isPremium: true,
        has3D: true,
        threeDEffect: "3d-mesh",
        colors: {
            primary: "#fbbf24",
            secondary: "#f59e0b",
            accent: "#d97706",
            background: "#1e1b4b",
            foreground: "#fef3c7",
            muted: "#fde68a",
        },
        fonts: {
            heading: "Playfair Display",
            body: "Crimson Pro",
        },
    },
    {
        id: "neon",
        name: "Neon",
        description: "Vibrant theme with floating 3D geometry",
        isPremium: true,
        has3D: true,
        threeDEffect: "3d-floating",
        colors: {
            primary: "#ec4899",
            secondary: "#f472b6",
            accent: "#fb7185",
            background: "#18181b",
            foreground: "#fce7f3",
            muted: "#f9a8d4",
        },
        fonts: {
            heading: "Bungee",
            body: "Exo 2",
        },
    },
    {
        id: "royal",
        name: "Royal",
        description: "Regal purple and gold with animated particles",
        isPremium: true,
        has3D: true,
        threeDEffect: "3d-particles",
        colors: {
            primary: "#7c3aed",
            secondary: "#a855f7",
            accent: "#fbbf24",
            background: "#1e1b4b",
            foreground: "#f3e8ff",
            muted: "#c4b5fd",
        },
        fonts: {
            heading: "Cinzel",
            body: "Cormorant Garamond",
        },
    },
    {
        id: "aurora",
        name: "Aurora",
        description: "Northern lights inspired with gradient mesh",
        isPremium: true,
        has3D: true,
        threeDEffect: "3d-mesh",
        colors: {
            primary: "#10b981",
            secondary: "#34d399",
            accent: "#6ee7b7",
            background: "#0c4a6e",
            foreground: "#ecfdf5",
            muted: "#6ee7b7",
        },
        fonts: {
            heading: "Quicksand",
            body: "Nunito",
        },
    },
];

// Theme Presets
export const themePresets: Record<string, PageTheme> = {
    modern: {
        name: "Modern",
        preset: "modern",
        colors: {
            primary: "#2563eb",
            secondary: "#10b981",
            background: "#ffffff",
            text: "#1f2937",
            accent: "#f59e0b",
        },
        fonts: {
            heading: "Inter",
            body: "Inter",
        },
        borderRadius: "medium",
        spacing: "normal",
    },
    classic: {
        name: "Classic",
        preset: "classic",
        colors: {
            primary: "#1e40af",
            secondary: "#059669",
            background: "#f9fafb",
            text: "#111827",
            accent: "#dc2626",
        },
        fonts: {
            heading: "Georgia",
            body: "Georgia",
        },
        borderRadius: "small",
        spacing: "normal",
    },
    minimal: {
        name: "Minimal",
        preset: "minimal",
        colors: {
            primary: "#000000",
            secondary: "#6b7280",
            background: "#ffffff",
            text: "#374151",
            accent: "#000000",
        },
        fonts: {
            heading: "Helvetica",
            body: "Helvetica",
        },
        borderRadius: "none",
        spacing: "spacious",
    },
    bold: {
        name: "Bold",
        preset: "bold",
        colors: {
            primary: "#dc2626",
            secondary: "#f59e0b",
            background: "#fef2f2",
            text: "#1f2937",
            accent: "#7c2d12",
        },
        fonts: {
            heading: "Montserrat",
            body: "Open Sans",
        },
        borderRadius: "large",
        spacing: "compact",
    },
    elegant: {
        name: "Elegant",
        preset: "elegant",
        colors: {
            primary: "#6366f1",
            secondary: "#8b5cf6",
            background: "#faf5ff",
            text: "#1e1b4b",
            accent: "#c026d3",
        },
        fonts: {
            heading: "Playfair Display",
            body: "Lora",
        },
        borderRadius: "medium",
        spacing: "spacious",
    },
    ocean: {
        name: "Ocean",
        preset: "ocean",
        colors: {
            primary: "#0891b2",
            secondary: "#06b6d4",
            background: "#ecfeff",
            text: "#164e63",
            accent: "#0e7490",
        },
        fonts: {
            heading: "Roboto",
            body: "Roboto",
        },
        borderRadius: "medium",
        spacing: "normal",
    },
    sunset: {
        name: "Sunset",
        preset: "sunset",
        colors: {
            primary: "#f97316",
            secondary: "#fb923c",
            background: "#fff7ed",
            text: "#7c2d12",
            accent: "#ea580c",
        },
        fonts: {
            heading: "Poppins",
            body: "Poppins",
        },
        borderRadius: "large",
        spacing: "normal",
    },
    forest: {
        name: "Forest",
        preset: "forest",
        colors: {
            primary: "#059669",
            secondary: "#10b981",
            background: "#f0fdf4",
            text: "#14532d",
            accent: "#065f46",
        },
        fonts: {
            heading: "Merriweather",
            body: "Source Sans Pro",
        },
        borderRadius: "small",
        spacing: "normal",
    },
    dark: {
        name: "Dark",
        preset: "dark",
        colors: {
            primary: "#60a5fa",
            secondary: "#34d399",
            background: "#111827",
            text: "#f9fafb",
            accent: "#fbbf24",
        },
        fonts: {
            heading: "Inter",
            body: "Inter",
        },
        borderRadius: "medium",
        spacing: "normal",
    },
};

// Available fonts
export const availableFonts = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Raleway",
    "Nunito",
    "Ubuntu",
    "Playfair Display",
    "Merriweather",
    "Georgia",
    "Times New Roman",
    "Helvetica",
    "Arial",
    "Verdana",
    "Source Sans Pro",
    "Lora",
];

// Color palette suggestions
export const colorPalettes = {
    professional: [
        "#2563eb", // Blue
        "#1e40af", // Dark Blue
        "#059669", // Green
        "#dc2626", // Red
        "#7c3aed", // Purple
    ],
    vibrant: [
        "#f59e0b", // Amber
        "#ec4899", // Pink
        "#8b5cf6", // Violet
        "#f97316", // Orange
        "#06b6d4", // Cyan
    ],
    neutral: [
        "#000000", // Black
        "#374151", // Gray-700
        "#6b7280", // Gray-500
        "#9ca3af", // Gray-400
        "#d1d5db", // Gray-300
    ],
    nature: [
        "#059669", // Green
        "#0891b2", // Cyan
        "#7c2d12", // Brown
        "#854d0e", // Amber-800
        "#166534", // Green-800
    ],
};

// Generate CSS variables from theme
export const generateThemeCSS = (theme: PageTheme): string => {
    const borderRadiusMap = {
        none: "0",
        small: "0.25rem",
        medium: "0.5rem",
        large: "1rem",
        full: "9999px",
    };

    const spacingMap = {
        compact: "0.5rem",
        normal: "1rem",
        spacious: "2rem",
    };

    return `
        :root {
            --theme-primary: ${theme.colors.primary};
            --theme-secondary: ${theme.colors.secondary};
            --theme-background: ${theme.colors.background};
            --theme-text: ${theme.colors.text};
            --theme-accent: ${theme.colors.accent};
            --theme-border-radius: ${borderRadiusMap[theme.borderRadius]};
            --theme-spacing: ${spacingMap[theme.spacing]};
            --theme-font-heading: ${theme.fonts.heading}, sans-serif;
            --theme-font-body: ${theme.fonts.body}, sans-serif;
        }
    `;
};

// Get theme by preset name
export const getThemePreset = (presetName: string): PageTheme | null => {
    return themePresets[presetName] || null;
};

// Get all theme preset names
export const getThemePresetNames = (): string[] => {
    return Object.keys(themePresets);
};

// Validate color hex code
export const isValidHexColor = (color: string): boolean => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

// Generate contrasting text color for a background
export const getContrastingColor = (
    hexColor: string
): "#000000" | "#ffffff" => {
    // Remove # if present
    const color = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Lighten or darken a color
export const adjustColorBrightness = (
    hexColor: string,
    percent: number
): string => {
    const color = hexColor.replace("#", "");
    const num = parseInt(color, 16);

    const r = Math.max(
        0,
        Math.min(255, (num >> 16) + Math.round(2.55 * percent))
    );
    const g = Math.max(
        0,
        Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent))
    );
    const b = Math.max(
        0,
        Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent))
    );

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

// Convert hex to HSL for CSS variables
export const hexToHSL = (hex: string): string => {
    const color = hex.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16) / 255;
    const g = parseInt(color.substring(2, 4), 16) / 255;
    const b = parseInt(color.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Apply theme to document
export const applyTheme = (themeData: string | ThemeConfig | null) => {
    if (!themeData) return;

    try {
        let theme: any;
        
        // Handle different input types
        if (typeof themeData === 'string') {
            theme = JSON.parse(themeData);
        } else {
            theme = themeData;
        }

        const root = document.documentElement;

        // Apply colors as CSS variables
        if (theme.colors) {
            // Support both old PageTheme format and new ThemeConfig format
            const primaryColor = theme.colors.primary;
            const secondaryColor = theme.colors.secondary;
            const bgColor = theme.colors.background;
            const textColor = theme.colors.text || theme.colors.foreground;
            const accentColor = theme.colors.accent;

            if (primaryColor) root.style.setProperty("--theme-primary", hexToHSL(primaryColor));
            if (secondaryColor) root.style.setProperty("--theme-secondary", hexToHSL(secondaryColor));
            if (bgColor) root.style.setProperty("--theme-background", hexToHSL(bgColor));
            if (textColor) root.style.setProperty("--theme-text", hexToHSL(textColor));
            if (accentColor) root.style.setProperty("--theme-accent", hexToHSL(accentColor));
        }

        // Apply fonts
        if (theme.fonts) {
            root.style.setProperty("--theme-font-heading", theme.fonts.heading);
            root.style.setProperty("--theme-font-body", theme.fonts.body);
            
            // Also apply to body for immediate effect
            document.body.style.fontFamily = `${theme.fonts.body}, sans-serif`;
        }

        // Apply border radius if present
        if (theme.borderRadius) {
            const borderRadiusMap: Record<string, string> = {
                none: "0",
                small: "0.25rem",
                medium: "0.5rem",
                large: "1rem",
                full: "9999px",
            };
            root.style.setProperty(
                "--theme-border-radius",
                borderRadiusMap[theme.borderRadius] || "0.5rem"
            );
        }

        // Apply spacing if present
        if (theme.spacing) {
            const spacingMap: Record<string, string> = {
                compact: "0.5rem",
                normal: "1rem",
                spacious: "2rem",
            };
            root.style.setProperty(
                "--theme-spacing",
                spacingMap[theme.spacing] || "1rem"
            );
        }
    } catch (error) {
        console.error("Failed to apply theme:", error);
    }
};

// Get current theme from preset or default
export const getCurrentTheme = (presetName?: string): ThemeConfig => {
    const modern = DEFAULT_THEMES.find(t => t.id === 'modern') || DEFAULT_THEMES[0];
    if (presetName) {
        const theme = DEFAULT_THEMES.find(t => t.id === presetName);
        if (theme) return theme;
    }
    return modern;
};
