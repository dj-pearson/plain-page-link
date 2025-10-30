export type ThemeId =
    | "luxury"
    | "modern-clean"
    | "classic"
    | "coastal"
    | "urban"
    | "farmhouse";
export type HeaderStyle = "centered" | "left" | "banner";
export type ButtonShape = "rounded" | "square" | "pill";
export type CardStyle = "shadow" | "border" | "flat";
export type SpacingDensity = "compact" | "comfortable" | "spacious";

export interface ThemeSettings {
    id: number;
    profile_id: number;

    // Theme Selection
    theme_id: ThemeId;

    // Colors (hex)
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    accent_color: string;

    // Typography
    heading_font: string;
    body_font: string;
    font_size_scale: number;

    // Layout
    header_style: HeaderStyle;
    button_shape: ButtonShape;
    card_style: CardStyle;
    spacing_density: SpacingDensity;

    // Advanced
    custom_css: string | null;
    show_branding: boolean;

    // Banner/Hero
    hero_image: string | null;
    hero_overlay_opacity: number;

    created_at: string;
    updated_at: string;
}

export interface ThemeUpdateData {
    theme_id?: ThemeId;
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    text_color?: string;
    accent_color?: string;
    heading_font?: string;
    body_font?: string;
    font_size_scale?: number;
    header_style?: HeaderStyle;
    button_shape?: ButtonShape;
    card_style?: CardStyle;
    spacing_density?: SpacingDensity;
    custom_css?: string;
    show_branding?: boolean;
    hero_image?: string;
    hero_overlay_opacity?: number;
}

export interface ThemePreset {
    id: ThemeId;
    name: string;
    description: string;
    preview_image: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
    };
    typography: {
        heading: string;
        body: string;
    };
}
