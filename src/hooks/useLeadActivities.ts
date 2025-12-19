/**
 * Lead Activities Hook
 * Manages lead timeline activities for CRM
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: ActivityType;
  title?: string;
  content?: string;
  previous_status?: string;
  new_status?: string;
  email_subject?: string;
  email_recipient?: string;
  call_duration_seconds?: number;
  call_outcome?: CallOutcome;
  meeting_type?: MeetingType;
  meeting_location?: string;
  meeting_scheduled_at?: string;
  task_due_date?: string;
  task_completed_at?: string;
  task_priority?: TaskPriority;
  metadata?: Record<string, unknown>;
  is_internal?: boolean;
  activity_at: string;
  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | "note"
  | "email"
  | "call"
  | "meeting"
  | "status_change"
  | "task"
  | "sms"
  | "form_submission";

export type CallOutcome = "answered" | "voicemail" | "no_answer" | "busy";
export type MeetingType = "in_person" | "video" | "phone";
export type TaskPriority = "low" | "medium" | "high";

export interface LeadActivitySummary {
  lead_id: string;
  total_activities: number;
  notes_count: number;
  emails_count: number;
  calls_count: number;
  meetings_count: number;
  status_changes_count: number;
  last_activity_at: string | null;
  last_email_at: string | null;
  last_call_at: string | null;
  first_activity_at: string | null;
}

interface LogActivityParams {
  leadId: string;
  activityType: ActivityType;
  content?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

interface LogEmailParams {
  leadId: string;
  subject: string;
  recipient: string;
  body?: string;
}

interface LogCallParams {
  leadId: string;
  outcome: CallOutcome;
  durationSeconds?: number;
  notes?: string;
}

interface LogMeetingParams {
  leadId: string;
  meetingType: MeetingType;
  location?: string;
  scheduledAt?: Date;
  notes?: string;
}

export function useLeadActivities(leadId?: string) {
  const queryClient = useQueryClient();

  // Fetch activities for a specific lead
  const activitiesQuery = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("activity_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId,
  });

  // Fetch activity summary for a lead
  const summaryQuery = useQuery({
    queryKey: ["lead-activity-summary", leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from("lead_activity_summary")
        .select("*")
        .eq("lead_id", leadId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // Ignore not found
      return data as LeadActivitySummary | null;
    },
    enabled: !!leadId,
  });

  // Log a generic activity
  const logActivityMutation = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      const { data, error } = await supabase.rpc("log_lead_activity", {
        _lead_id: params.leadId,
        _activity_type: params.activityType,
        _content: params.content || null,
        _title: params.title || null,
        _metadata: params.metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
    },
    onError: (error) => {
      console.error("Failed to log activity:", error);
      toast.error("Failed to log activity");
    },
  });

  // Log a note
  const logNoteMutation = useMutation({
    mutationFn: async (params: { leadId: string; content: string }) => {
      const { data, error } = await supabase.rpc("log_lead_activity", {
        _lead_id: params.leadId,
        _activity_type: "note",
        _content: params.content,
        _title: "Note added",
        _metadata: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
      toast.success("Note added");
    },
    onError: (error) => {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    },
  });

  // Log an email
  const logEmailMutation = useMutation({
    mutationFn: async (params: LogEmailParams) => {
      const { data, error } = await supabase.rpc("log_lead_email", {
        _lead_id: params.leadId,
        _subject: params.subject,
        _recipient: params.recipient,
        _body: params.body || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] }); // Update last_contacted_at
      toast.success("Email logged");
    },
    onError: (error) => {
      console.error("Failed to log email:", error);
      toast.error("Failed to log email");
    },
  });

  // Log a call
  const logCallMutation = useMutation({
    mutationFn: async (params: LogCallParams) => {
      const { data, error } = await supabase.rpc("log_lead_call", {
        _lead_id: params.leadId,
        _outcome: params.outcome,
        _duration_seconds: params.durationSeconds || null,
        _notes: params.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] }); // Update last_contacted_at
      toast.success("Call logged");
    },
    onError: (error) => {
      console.error("Failed to log call:", error);
      toast.error("Failed to log call");
    },
  });

  // Log a meeting
  const logMeetingMutation = useMutation({
    mutationFn: async (params: LogMeetingParams) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          lead_id: params.leadId,
          user_id: userData.user?.id,
          activity_type: "meeting",
          title: `${params.meetingType === "in_person" ? "In-person" : params.meetingType === "video" ? "Video" : "Phone"} meeting`,
          content: params.notes,
          meeting_type: params.meetingType,
          meeting_location: params.location,
          meeting_scheduled_at: params.scheduledAt?.toISOString(),
          is_internal: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Meeting logged");
    },
    onError: (error) => {
      console.error("Failed to log meeting:", error);
      toast.error("Failed to log meeting");
    },
  });

  // Delete an activity
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("lead_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity-summary", leadId] });
      toast.success("Activity deleted");
    },
    onError: (error) => {
      console.error("Failed to delete activity:", error);
      toast.error("Failed to delete activity");
    },
  });

  return {
    // Data
    activities: activitiesQuery.data || [],
    summary: summaryQuery.data,
    isLoading: activitiesQuery.isLoading,
    isSummaryLoading: summaryQuery.isLoading,

    // Mutations
    logActivity: logActivityMutation.mutate,
    logNote: logNoteMutation.mutate,
    logEmail: logEmailMutation.mutate,
    logCall: logCallMutation.mutate,
    logMeeting: logMeetingMutation.mutate,
    deleteActivity: deleteActivityMutation.mutate,

    // Loading states
    isLoggingActivity: logActivityMutation.isPending,
    isLoggingNote: logNoteMutation.isPending,
    isLoggingEmail: logEmailMutation.isPending,
    isLoggingCall: logCallMutation.isPending,
    isLoggingMeeting: logMeetingMutation.isPending,
    isDeletingActivity: deleteActivityMutation.isPending,

    // Refetch
    refetch: activitiesQuery.refetch,
    refetchSummary: summaryQuery.refetch,
  };
}

// Hook to fetch activities for multiple leads (for list views)
export function useLeadsActivitySummaries(leadIds: string[]) {
  return useQuery({
    queryKey: ["lead-activity-summaries", leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return [];

      const { data, error } = await supabase
        .from("lead_activity_summary")
        .select("*")
        .in("lead_id", leadIds);

      if (error) throw error;
      return data as LeadActivitySummary[];
    },
    enabled: leadIds.length > 0,
  });
}
