import {
    format as dateFnsFormat,
    formatDistance,
    formatRelative,
} from "date-fns";

/**
 * Format currency (USD)
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Parse flexible price inputs like "$1,234,567" or "1234567" to a number
export function parsePrice(value: unknown): number {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (value == null) return 0;
    const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
    return isNaN(numeric) ? 0 : numeric;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format phone number (US)
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
            6
        )}`;
    }

    if (cleaned.length === 11 && cleaned[0] === "1") {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(
            4,
            7
        )}-${cleaned.slice(7)}`;
    }

    return phone;
}

/**
 * Format date
 */
export function formatDate(
    date: string | Date,
    formatStr: string = "MMM d, yyyy"
): string {
    return dateFnsFormat(new Date(date), formatStr);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format address
 */
export function formatAddress(
    street: string,
    city: string,
    state: string,
    zip: string,
    hideStreet?: boolean
): string {
    if (hideStreet) {
        return `${city}, ${state} ${zip}`;
    }
    return `${street}, ${city}, ${state} ${zip}`;
}

/**
 * Format property stats (e.g., "3 bd | 2 ba | 1,500 sq ft")
 */
export function formatPropertyStats(
    bedrooms?: number | null,
    bathrooms?: number | null,
    squareFeet?: number | null
): string {
    const parts: string[] = [];

    if (bedrooms) parts.push(`${bedrooms} bd`);
    if (bathrooms) parts.push(`${bathrooms} ba`);
    if (squareFeet) parts.push(`${formatNumber(squareFeet)} sq ft`);

    return parts.join(" | ");
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}
