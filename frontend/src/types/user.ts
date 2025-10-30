export interface User {
    id: number;
    email: string;
    role: "agent" | "team_lead" | "brokerage_admin";
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
    expires_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    password_confirmation: string;
}
