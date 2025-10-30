import axios, { AxiosError, AxiosInstance } from "axios";
import { API_URL } from "../constants";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            window.location.href = "/auth/login";
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.error("Permission denied");
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
            console.error("Resource not found");
        }

        // Handle 500 Server Error
        if (error.response?.status && error.response.status >= 500) {
            console.error("Server error occurred");
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// Helper function to handle API errors
export function handleApiError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        return message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred";
}

// Helper function to upload files
export async function uploadFile(
    endpoint: string,
    file: File,
    fieldName: string = "file"
): Promise<any> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await apiClient.post(endpoint, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

// Helper function to upload multiple files
export async function uploadFiles(
    endpoint: string,
    files: File[],
    fieldName: string = "files[]"
): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append(fieldName, file);
    });

    const response = await apiClient.post(endpoint, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}
