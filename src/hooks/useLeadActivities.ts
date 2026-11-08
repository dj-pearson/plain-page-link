/**
 * Lead Activities Hook
 * Manages lead timeline activities for CRM
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';
import type { ActivityType, AgentAuthoredActivityType } from '@/lib/leadActivityTypes';

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

export interface CreateTaskParams {
  leadId: string;
  title: string;
  /** ISO date. */
  dueDate: string;
  priority?: TaskPriority;
  notes?: string;
}

export type { ActivityType, AgentAuthoredActivityType } from '@/lib/leadActivityTypes';

/**
 * 'initiated' covers the case the UI can actually observe: the agent tapped a
 * tel: link and the dialer opened. Whether anyone picked up is not knowable
 * from the browser, and recording 'answered' for it would put a fact in the
 * timeline that nobody established (US-101). The other four are outcomes an
 * agent reports afterwards. There is no CHECK constraint on
 * lead_activities.call_outcome, so this stores as-is.
 */
export type CallOutcome = 'initiated' | 'answered' | 'voicemail' | 'no_answer' | 'busy';
export type MeetingType = 'in_person' | 'video' | 'phone';
export type TaskPriority = 'low' | 'medium' | 'high';

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
  /**
   * log_lead_activity refuses status_change and form_submission (US-349):
   * those rows are written only by the lead triggers.
   */
  activityType: AgentAuthoredActivityType;
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

/** Activity types that log_lead_activity treats as contact (sets leads.contacted_at). */
const CONTACT_ACTIVITY_TYPES = new Set<string>(['call', 'email', 'sms', 'meeting']);

export function useLeadActivities(leadId?: string) {
  const queryClient = useQueryClient();

  /**
   * Refreshes the timeline of the lead a write was FOR, which is not always
   * the lead this hook instance was opened with (US-392).
   *
   * useLeadContactAction calls useLeadActivities(undefined), because it serves
   * both the Leads list and the detail modal. Its call/email/text logs used to
   * invalidate ['lead-activities', undefined], so tapping Call or sending a
   * quick response from an open lead never showed up on that lead's timeline,
   * and the list card's last-activity line went stale too.
   */
  const invalidateTimeline = (targetLeadId: string | undefined) => {
    const id = targetLeadId ?? leadId;
    queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
    queryClient.invalidateQueries({ queryKey: ['lead-activity-summary', id] });
    queryClient.invalidateQueries({ queryKey: ['lead-activity-summaries'] });
  };

  // Fetch activities for a specific lead
  const activitiesQuery = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId,
  });

  // Fetch activity summary for a lead
  const summaryQuery = useQuery({
    queryKey: ['lead-activity-summary', leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from('lead_activity_summary')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data as LeadActivitySummary | null;
    },
    enabled: !!leadId,
  });

  // Log a generic activity
  const logActivityMutation = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      const { data, error } = await supabase.rpc('log_lead_activity', {
        _lead_id: params.leadId,
        _activity_type: params.activityType,
        _content: params.content ?? undefined,
        _title: params.title ?? undefined,
        _metadata: (params.metadata ?? {}) as Json,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      // sms (and call/email/meeting) set contacted_at server-side.
      if (CONTACT_ACTIVITY_TYPES.has(params.activityType)) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
    },
    onError: (error) => {
      logger.error('Failed to log activity', error as Error);
      toast.error('Failed to log activity');
    },
  });

  // Log a note
  const logNoteMutation = useMutation({
    mutationFn: async (params: { leadId: string; content: string }) => {
      const { data, error } = await supabase.rpc('log_lead_activity', {
        _lead_id: params.leadId,
        _activity_type: 'note',
        _content: params.content,
        _title: 'Note added',
        _metadata: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      toast.success('Note added');
    },
    onError: (error) => {
      logger.error('Failed to add note', error as Error);
      toast.error('Failed to add note');
    },
  });

  // Log an email
  const logEmailMutation = useMutation({
    mutationFn: async (params: LogEmailParams) => {
      const { data, error } = await supabase.rpc('log_lead_email', {
        _lead_id: params.leadId,
        _subject: params.subject,
        _recipient: params.recipient,
        _body: params.body ?? undefined,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Update last_contacted_at
      toast.success('Email logged');
    },
    onError: (error) => {
      logger.error('Failed to log email', error as Error);
      toast.error('Failed to log email');
    },
  });

  // Log a call
  const logCallMutation = useMutation({
    mutationFn: async (params: LogCallParams) => {
      const { data, error } = await supabase.rpc('log_lead_call', {
        _lead_id: params.leadId,
        _outcome: params.outcome,
        _duration_seconds: params.durationSeconds ?? undefined,
        _notes: params.notes ?? undefined,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Update last_contacted_at
      toast.success('Call logged');
    },
    onError: (error) => {
      logger.error('Failed to log call', error as Error);
      toast.error('Failed to log call');
    },
  });

  // Log a meeting. Through log_lead_meeting, like calls and emails, so a
  // meeting sets leads.contacted_at (first contact) once (US-373). The direct
  // insert this replaced wrote the row and left the lead "never contacted".
  const logMeetingMutation = useMutation({
    mutationFn: async (params: LogMeetingParams) => {
      const { data, error } = await supabase.rpc('log_lead_meeting', {
        _lead_id: params.leadId,
        _meeting_type: params.meetingType,
        _location: params.location ?? undefined,
        _scheduled_at: params.scheduledAt?.toISOString(),
        _notes: params.notes ?? undefined,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Update contacted_at
      toast.success('Meeting logged');
    },
    onError: (error) => {
      logger.error('Failed to log meeting', error as Error);
      toast.error('Failed to log meeting');
    },
  });

  /**
   * A follow-up task on a lead.
   *
   * lead_activities has carried task_due_date, task_priority and
   * task_completed_at since it was created, and nothing ever inserted a task
   * or listed the due ones (US-103). This is what makes "nothing pulls them
   * back to an unanswered lead" untrue.
   */
  const createTaskMutation = useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: params.leadId,
          user_id: userData.user.id,
          activity_type: 'task',
          title: params.title,
          content: params.notes,
          task_due_date: params.dueDate,
          task_priority: params.priority ?? 'medium',
          is_internal: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, params) => {
      invalidateTimeline(params.leadId);
      queryClient.invalidateQueries({ queryKey: ['lead-tasks'] });
      toast.success('Follow-up added');
    },
    onError: (error) => {
      logger.error('Failed to create task', error as Error);
      toast.error('Failed to add the follow-up');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('lead_activities')
        .update({ task_completed_at: new Date().toISOString() })
        .eq('id', activityId)
        .eq('activity_type', 'task');

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTimeline(leadId);
      queryClient.invalidateQueries({ queryKey: ['lead-tasks'] });
      toast.success('Follow-up completed');
    },
    onError: (error) => {
      logger.error('Failed to complete task', error as Error);
      toast.error('Failed to complete the follow-up');
    },
  });

  // Delete an activity
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('lead_activities').delete().eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTimeline(leadId);
      toast.success('Activity deleted');
    },
    onError: (error) => {
      logger.error('Failed to delete activity', error as Error);
      toast.error('Failed to delete activity');
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
    createTask: createTaskMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    deleteActivity: deleteActivityMutation.mutate,

    // Loading states
    isLoggingActivity: logActivityMutation.isPending,
    isLoggingNote: logNoteMutation.isPending,
    isLoggingEmail: logEmailMutation.isPending,
    isLoggingCall: logCallMutation.isPending,
    isLoggingMeeting: logMeetingMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
    isCompletingTask: completeTaskMutation.isPending,
    // Which task is being completed, so a list can disable just that row.
    completingTaskId: completeTaskMutation.isPending ? completeTaskMutation.variables : undefined,
    isDeletingActivity: deleteActivityMutation.isPending,

    // Refetch
    refetch: activitiesQuery.refetch,
    refetchSummary: summaryQuery.refetch,
  };
}

// Hook to fetch activities for multiple leads (for list views)
export function useLeadsActivitySummaries(leadIds: string[]) {
  return useQuery({
    queryKey: ['lead-activity-summaries', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return [];

      const { data, error } = await supabase
        .from('lead_activity_summary')
        .select('*')
        .in('lead_id', leadIds);

      if (error) throw error;
      return data as LeadActivitySummary[];
    },
    enabled: leadIds.length > 0,
  });
}

/**
 * Open follow-up tasks across every lead, for the Overview "Due today" block.
 *
 * Overdue tasks are included deliberately: a reminder that has already slipped
 * is the one the agent most needs to see, and hiding it once its date passes is
 * how a follow-up gets lost (US-103).
 */
export function useDueLeadTasks(dueBefore?: Date) {
  const cutoff = (dueBefore ?? endOfToday()).toISOString();
  // US-256: keyed by agent, so one agent's cached tasks are never served to
  // the next one to sign in on the same device.
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: ['lead-tasks', 'due', userId, cutoff.slice(0, 10)],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('id, lead_id, title, content, task_due_date, task_priority, leads(name)')
        .eq('activity_type', 'task')
        .is('task_completed_at', null)
        .lte('task_due_date', cutoff)
        .order('task_due_date', { ascending: true })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as unknown as DueLeadTask[];
    },
  });
}

export interface DueLeadTask {
  id: string;
  lead_id: string;
  title: string | null;
  content: string | null;
  task_due_date: string | null;
  task_priority: TaskPriority | null;
  leads: { name: string } | null;
}

/** End of the current day, local time. */
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
