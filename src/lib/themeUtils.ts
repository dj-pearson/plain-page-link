/**
 * Theme Application Utilities
 * Converts PageTheme configuration to actual CSS styling
 */

import { PageTheme } from "@/types/pageBuilder";

/**
 * Get border radius CSS value from theme setting
 */
export function getBorderRadiusValue(radius: PageTheme["borderRadius"]): string {
    const values = {
        none: "0",
        small: "0.25rem",
        medium: "0.5rem",
        large: "1rem",
        full: "9999px",
    };
    return values[radius];
}

/**
 * Get spacing value from theme setting (for gaps between blocks)
 */
export function getSpacingValue(spacing: PageTheme["spacing"]): string {
    const values = {
        compact: "1rem",
        normal: "2rem",
        spacious: "3rem",
    };
    return values[spacing];
}

/**
 * Generate CSS custom properties (CSS variables) from theme
 */
export function themeToCSSVariables(theme: PageTheme): Record<string, string> {
    return {
        "--theme-primary": theme.colors.primary,
        "--theme-secondary": theme.colors.secondary,
        "--theme-background": theme.colors.background,
        "--theme-text": theme.colors.text,
        "--theme-accent": theme.colors.accent,
        "--theme-font-heading": theme.fonts.heading,
        "--theme-font-body": theme.fonts.body,
        "--theme-border-radius": getBorderRadiusValue(theme.borderRadius),
        "--theme-spacing": getSpacingValue(theme.spacing),
    };
}

/**
 * Apply theme to a container element via inline styles
 */
export function applyThemeToElement(element: HTMLElement | null, theme: PageTheme) {
    if (!element) return;

    const cssVars = themeToCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
        element.style.setProperty(key, value);
    });

    // Also set font families directly
    element.style.setProperty("--font-heading", `'${theme.fonts.heading}', sans-serif`);
    element.style.setProperty("--font-body", `'${theme.fonts.body}', sans-serif`);
}

/**
 * Get inline style object for themed components
 * Use this for React components that need theme styling
 */
export function getThemedStyles(theme: PageTheme) {
    return {
        "--theme-primary": theme.colors.primary,
        "--theme-secondary": theme.colors.secondary,
        "--theme-background": theme.colors.background,
        "--theme-text": theme.colors.text,
        "--theme-accent": theme.colors.accent,
        "--theme-font-heading": `'${theme.fonts.heading}', sans-serif`,
        "--theme-font-body": `'${theme.fonts.body}', sans-serif`,
        "--theme-border-radius": getBorderRadiusValue(theme.borderRadius),
        "--theme-spacing": getSpacingValue(theme.spacing),
    } as React.CSSProperties;
}

/**
 * Generate Tailwind-compatible classes from theme
 * Used for dynamic styling with Tailwind
 */
export function getThemeTailwindClasses(theme: PageTheme) {
    const radiusClasses = {
        none: "rounded-none",
        small: "rounded-sm",
        medium: "rounded-md",
        large: "rounded-lg",
        full: "rounded-full",
    };

    const spacingClasses = {
        compact: "space-y-4",
        normal: "space-y-8",
        spacious: "space-y-12",
    };

    return {
        borderRadius: radiusClasses[theme.borderRadius],
        spacing: spacingClasses[theme.spacing],
    };
}

/**
 * Load Google Fonts dynamically
 * Ensures fonts are available when theme is applied
 */
export function loadGoogleFont(fontFamily: string) {
    // Check if font is already loaded
    const existingLink = document.querySelector(
        `link[href*="${fontFamily.replace(/\s+/g, "+")}"]`
    );
    if (existingLink) return;

    // Create and append link element
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
        /\s+/g,
        "+"
    )}:wght@400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
}

/**
 * Preload all fonts used in theme
 */
export function preloadThemeFonts(theme: PageTheme) {
    loadGoogleFont(theme.fonts.heading);
    if (theme.fonts.body !== theme.fonts.heading) {
        loadGoogleFont(theme.fonts.body);
    }
}
