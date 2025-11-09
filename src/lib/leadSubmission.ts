/**
 * Lead Submission Utilities
 * Handles form submissions to Supabase with retries and error handling
 */

import { supabase } from "@/integrations/supabase/client";

export interface LeadSubmissionData {
    agentId: string;
    leadType: "buyer" | "seller" | "valuation" | "contact";
    name: string;
    email: string;
    phone?: string;
    data: Record<string, any>;
    source?: string;
    referrer?: string;
}

export interface LeadSubmissionResponse {
    success: boolean;
    leadId?: string;
    error?: string;
}

/**
 * Submit a lead with automatic retries
 */
export async function submitLead(
    leadData: LeadSubmissionData,
    retries = 3
): Promise<LeadSubmissionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Insert lead directly into Supabase
            const { data, error } = await supabase
                .from("leads")
                .insert({
                    agent_id: leadData.agentId,
                    name: leadData.name,
                    email: leadData.email,
                    phone: leadData.phone || null,
                    type: leadData.leadType,
                    data: leadData.data,
                    source: leadData.source || "website",
                    referrer: leadData.referrer || document.referrer || null,
                    status: "new",
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Trigger edge function for email notifications (fire and forget)
            supabase.functions
                .invoke("submit-contact", {
                    body: {
                        leadId: data.id,
                        agentId: leadData.agentId,
                        name: leadData.name,
                        email: leadData.email,
                        phone: leadData.phone,
                        type: leadData.leadType,
                        data: leadData.data,
                    },
                })
                .catch((err) => {
                    console.error("Failed to send email notification:", err);
                    // Don't fail the whole submission if email fails
                });

            return {
                success: true,
                leadId: data.id,
            };
        } catch (error) {
            lastError = error as Error;
            console.error(
                `Lead submission attempt ${attempt + 1} failed:`,
                error
            );

            // Only retry on network errors, not validation errors
            if (
                error instanceof Error &&
                (error.message.includes("network") ||
                    error.message.includes("timeout"))
            ) {
                // Wait before retrying (exponential backoff)
                if (attempt < retries - 1) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, Math.pow(2, attempt) * 1000)
                    );
                    continue;
                }
            } else {
                // Don't retry on validation errors
                break;
            }
        }
    }

    return {
        success: false,
        error:
            lastError?.message ||
            "Failed to submit lead. Please try again later.",
    };
}

/**
 * Track form submission analytics
 */
export function trackFormSubmission(formType: string, success: boolean) {
    try {
        // Track with visitor analytics if available
        if (typeof window !== "undefined" && (window as any).analytics) {
            (window as any).analytics.track("form_submit", {
                formType,
                success,
                timestamp: new Date().toISOString(),
            });
        }

        // Also track in localStorage for local analytics
        const storageKey = `analytics_form_submissions`;
        const existing = localStorage.getItem(storageKey);
        const submissions = existing ? JSON.parse(existing) : [];
        submissions.push({
            formType,
            success,
            timestamp: Date.now(),
        });
        localStorage.setItem(storageKey, JSON.stringify(submissions));
    } catch (error) {
        console.error("Failed to track form submission:", error);
        // Don't fail the submission if analytics fails
    }
}
