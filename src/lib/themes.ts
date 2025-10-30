// Theme definitions for AgentBio.net

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
}

export interface ThemeFonts {
    heading: string;
    body: string;
}

export interface ThemeConfig {
    id: string;
    name: string;
    description: string;
    category: "light" | "dark" | "colorful";
    isPremium: boolean;
    previewImage?: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
}

export const DEFAULT_THEMES: ThemeConfig[] = [
    {
        id: "modern-clean",
        name: "Modern Clean",
        description: "Minimalist design with clean lines and professional feel",
        category: "light",
        isPremium: false,
        colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#F59E0B",
            background: "#FFFFFF",
            foreground: "#1F2937",
            card: "#F9FAFB",
            cardForeground: "#1F2937",
            muted: "#F3F4F6",
            mutedForeground: "#6B7280",
        },
        fonts: {
            heading: "Inter",
            body: "Inter",
        },
    },
    {
        id: "luxury-dark",
        name: "Luxury Dark",
        description: "Elegant dark theme perfect for high-end properties",
        category: "dark",
        isPremium: true,
        colors: {
            primary: "#C084FC",
            secondary: "#FDE047",
            accent: "#F472B6",
            background: "#0F172A",
            foreground: "#F8FAFC",
            card: "#1E293B",
            cardForeground: "#F8FAFC",
            muted: "#334155",
            mutedForeground: "#CBD5E1",
        },
        fonts: {
            heading: "Playfair Display",
            body: "Lato",
        },
    },
    {
        id: "coastal-breeze",
        name: "Coastal Breeze",
        description: "Fresh and airy design inspired by beachfront properties",
        category: "light",
        isPremium: false,
        colors: {
            primary: "#06B6D4",
            secondary: "#0EA5E9",
            accent: "#F59E0B",
            background: "#FFFFFF",
            foreground: "#0F172A",
            card: "#F0F9FF",
            cardForeground: "#0F172A",
            muted: "#E0F2FE",
            mutedForeground: "#475569",
        },
        fonts: {
            heading: "Montserrat",
            body: "Open Sans",
        },
    },
    {
        id: "urban-pro",
        name: "Urban Professional",
        description: "Bold and confident for city real estate experts",
        category: "light",
        isPremium: true,
        colors: {
            primary: "#1E293B",
            secondary: "#DC2626",
            accent: "#FACC15",
            background: "#FFFFFF",
            foreground: "#1F2937",
            card: "#F8FAFC",
            cardForeground: "#1F2937",
            muted: "#E2E8F0",
            mutedForeground: "#64748B",
        },
        fonts: {
            heading: "Bebas Neue",
            body: "Roboto",
        },
    },
    {
        id: "warm-welcome",
        name: "Warm Welcome",
        description: "Inviting and friendly design for first-time buyers",
        category: "colorful",
        isPremium: false,
        colors: {
            primary: "#F97316",
            secondary: "#EAB308",
            accent: "#EC4899",
            background: "#FFFBEB",
            foreground: "#78350F",
            card: "#FFF7ED",
            cardForeground: "#78350F",
            muted: "#FED7AA",
            mutedForeground: "#9A3412",
        },
        fonts: {
            heading: "Poppins",
            body: "Poppins",
        },
    },
    {
        id: "forest-green",
        name: "Forest Green",
        description:
            "Natural and eco-friendly theme for sustainable properties",
        category: "light",
        isPremium: true,
        colors: {
            primary: "#059669",
            secondary: "#10B981",
            accent: "#FBBF24",
            background: "#F9FAFB",
            foreground: "#064E3B",
            card: "#ECFDF5",
            cardForeground: "#064E3B",
            muted: "#D1FAE5",
            mutedForeground: "#065F46",
        },
        fonts: {
            heading: "Merriweather",
            body: "Source Sans Pro",
        },
    },
];

export function applyTheme(theme: ThemeConfig) {
    const root = document.documentElement;

    // Apply colors as CSS variables
    root.style.setProperty("--color-primary", theme.colors.primary);
    root.style.setProperty("--color-secondary", theme.colors.secondary);
    root.style.setProperty("--color-accent", theme.colors.accent);
    root.style.setProperty("--color-background", theme.colors.background);
    root.style.setProperty("--color-foreground", theme.colors.foreground);
    root.style.setProperty("--color-card", theme.colors.card);
    root.style.setProperty(
        "--color-card-foreground",
        theme.colors.cardForeground
    );
    root.style.setProperty("--color-muted", theme.colors.muted);
    root.style.setProperty(
        "--color-muted-foreground",
        theme.colors.mutedForeground
    );

    // Apply fonts
    root.style.setProperty("--font-heading", theme.fonts.heading);
    root.style.setProperty("--font-body", theme.fonts.body);

    // Store theme ID in localStorage
    localStorage.setItem("agentbio-theme", theme.id);
}

export function getThemeById(id: string): ThemeConfig | undefined {
    return DEFAULT_THEMES.find((theme) => theme.id === id);
}

export function getCurrentTheme(): ThemeConfig {
    const savedThemeId = localStorage.getItem("agentbio-theme");
    return getThemeById(savedThemeId || "modern-clean") || DEFAULT_THEMES[0];
}

export function hexToRgb(
    hex: string
): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
