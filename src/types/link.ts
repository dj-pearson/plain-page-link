export type ButtonStyle = "filled" | "outlined" | "text";

export interface Link {
    id: number;
    profile_id: number;

    // Link Details
    title: string;
    url: string;
    description: string | null;

    // Display
    icon: string | null;
    button_style: ButtonStyle;
    custom_color: string | null;

    // Scheduling
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;

    // Sorting
    sort_order: number;

    // Analytics
    click_count: number;

    created_at: string;
    updated_at: string;
}

export interface LinkCreateData {
    title: string;
    url: string;
    description?: string;
    icon?: string;
    button_style?: ButtonStyle;
    custom_color?: string;
    start_date?: string;
    end_date?: string;
}

export interface LinkUpdateData extends Partial<LinkCreateData> {
    is_active?: boolean;
}
