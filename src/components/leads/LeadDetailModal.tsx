/**
 * Lead Detail Modal
 * Full lead information with status management, notes, and quick actions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  MessageSquare,
  User,
  MapPin,
  DollarSign,
  Home,
  FileText,
  Send,
  Flame,
  TrendingUp,
  Brain,
  StickyNote,
  CalendarClock,
  CheckSquare,
  ArrowRightLeft,
  Inbox,
  Megaphone,
  Link2,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import type { Lead } from '@/types/lead';
import { useLeadScore } from '@/hooks/useMLLeadScoring';
import { useLeadContactAction, type ContactChannel } from '@/hooks/useLeadContactAction';
import {
  useLeadActivities,
  type LeadActivity,
  type MeetingType,
  type TaskPriority,
} from '@/hooks/useLeadActivities';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  QUICK_RESPONSES,
  fillQuickResponse,
  quickResponseHref,
  type QuickResponseChannel,
} from '@/lib/leadQuickResponses';
import { getLeadNextStep } from '@/lib/leadNextStep';
import { buildLeadStatusPatch } from '@/lib/leadStatus';
import { logger } from '@/lib/logger';
import { calendarDateInDays, dueDateToIso, taskDueAt } from '@/lib/localDate';
import { describeLeadOrigin } from '@/lib/leadAttribution';
import { AddLeadToClientsButton } from '@/components/leads/AddLeadToClientsButton';
import { LockedLeadDetails } from '@/components/leads/LockedLeadDetails';
import { LeadListingCard } from '@/components/leads/LeadListingCard';
import { describeLeadAnswers } from '@/lib/leadFormSchema';
import { isAgentAuthoredActivityType } from '@/lib/leadActivityTypes';

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

/**
 * How each kind of timeline entry is drawn. The timeline mixes what the agent
 * did (note, call, email, sms, meeting, task) with what the system recorded
 * (status_change from the trigger, form_submission when the lead arrived), so
 * the icon is what tells them apart at a glance.
 */
const ACTIVITY_ICONS: Record<string, typeof StickyNote> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  meeting: CalendarClock,
  task: CheckSquare,
  status_change: ArrowRightLeft,
  form_submission: Inbox,
};

/**
 * Timeline rows the agent wrote, and so may remove. status_change and
 * form_submission are the system's record of what happened to the lead. This
 * mirrors the lead_activities DELETE policy (author only, agent-authored types
 * only, migration 20261107000349), so the button never offers a delete the
 * database would refuse.
 */
export function canDeleteActivity(a: LeadActivity, currentUserId: string | null): boolean {
  return (
    !!currentUserId && a.user_id === currentUserId && isAgentAuthoredActivityType(a.activity_type)
  );
}

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  in_person: 'In person',
  video: 'Video call',
  phone: 'Phone',
};

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** The line an agent reads. Falls back to the stored title, then the type. */
function activityHeadline(a: LeadActivity): string {
  if (a.activity_type === 'meeting' && a.meeting_scheduled_at) {
    const when = new Date(a.meeting_scheduled_at);
    const base = a.title || 'Meeting';
    return Number.isNaN(when.getTime()) ? base : `${base} · ${format(when, 'MMM d, h:mm a')}`;
  }
  if (a.activity_type === 'task' && a.task_priority === 'high') {
    return `${a.title || 'Follow-up'} (high priority)`;
  }
  if (a.activity_type === 'status_change' && a.new_status) {
    return a.previous_status
      ? `Status: ${a.previous_status} → ${a.new_status}`
      : `Status set to ${a.new_status}`;
  }
  if (a.activity_type === 'call' && a.call_outcome) {
    const mins = a.call_duration_seconds ? ` · ${Math.round(a.call_duration_seconds / 60)}m` : '';
    return `Call (${a.call_outcome.replace(/_/g, ' ')})${mins}`;
  }
  if (a.activity_type === 'email' && a.email_subject) {
    return `Email: ${a.email_subject}`;
  }
  return a.title || a.activity_type.replace(/_/g, ' ');
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-green-100 text-green-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-800' },
];

export function LeadDetailModal({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailModalProps) {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  // The quick response being previewed: filled for this lead and editable
  // before it goes out.
  const [draftResponse, setDraftResponse] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const leadScore = useLeadScore(lead);
  const recordContact = useLeadContactAction(setStatus);

  // The timeline. This used to read public.lead_notes while every trigger
  // wrote public.lead_activities, so the agent saw none of: the lead being
  // created, a status change with its previous value, a logged call or email,
  // or a notification send. Two stores, one displayed (US-102). lead_notes was
  // migrated into lead_activities and dropped in 20260902000005.
  const {
    activities,
    isLoading: loadingActivities,
    logNote,
    isLoggingNote,
    createTask,
    completeTask,
    isCreatingTask,
    logMeeting,
    isLoggingMeeting,
    deleteActivity,
  } = useLeadActivities(lead?.id);

  // The next step. getRecommendedActions() has produced advice like "Send
  // personalized message within 5 minutes" since it was written and no
  // component ever rendered it — a paragraph an agent has to interpret is not
  // guidance (US-103). This narrows it to one action with a button behind it.
  const nextStep = lead ? getLeadNextStep(lead, leadScore?.score ?? null) : null;

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('in_person');
  const [meetingAt, setMeetingAt] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const [pendingDelete, setPendingDelete] = useState<LeadActivity | null>(null);

  // Re-initialise per-lead state whenever the lead changes.
  //
  // Leads.tsx keeps ONE instance of this modal mounted and swaps the `lead`
  // prop, but useState only reads its initial value on mount. Opening a
  // 'converted' lead and then a 'new' one showed the second lead as Converted,
  // with the first lead's half-typed note still in the box — and saving from
  // there wrote one lead's note onto another (US-101). Only loadNotes() ever
  // re-ran. This is keyed on lead.id rather than on the object so a refetch
  // that returns an equal-but-new row does not wipe what the agent is typing.
  useEffect(() => {
    setStatus(lead?.status || 'new');
    setNote('');
    setSelectedResponse('');
    setTaskTitle('');
    setTaskDue('');
    setTaskPriority('medium');
    setDraftResponse(null);
    resetMeetingForm();
    setPendingDelete(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;

    setIsSaving(true);
    try {
      // A status change is more than the status: converted/lost record
      // closed_at, the first move into contact records contacted_at, and a
      // reset to 'new' clears both plus first_responded_at. This used to write
      // `{ status }` alone, so none of those columns were ever maintained from
      // the UI, and a lead put back to 'new' kept a first_responded_at the
      // trigger could never set again (US-101).
      const { error } = await supabase
        .from('leads')
        .update(buildLeadStatusPatch(newStatus, lead))
        .eq('id', lead.id)
        .select('id')
        .single();

      if (error) throw error;

      setStatus(newStatus);
      toast.success('Lead status updated');
      onLeadUpdated?.();
      // No note is written here any more. auto_log_lead_status_change already
      // records a 'status_change' activity for exactly this event, and carries
      // the PREVIOUS status, which the hand-written note never did — so this
      // was a worse duplicate of a row the database had already stored.
    } catch (error) {
      logger.error('Failed to update lead status', error as Error);
      toast.error('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * The agent tapping call, email or text IS the response. Shared with the
   * Leads page card through useLeadContactAction so both record it the same
   * way; the href still fires and the dialer still opens (US-101).
   */
  const handleContactAction = async (channel: ContactChannel) => {
    if (!lead) return;
    await recordContact(lead, channel);
    onLeadUpdated?.();
  };

  /** Performs the recommended next step, and records it. */
  const handleNextStep = async () => {
    if (!lead || !nextStep) return;
    if (nextStep.action === 'task') {
      // Prefill the follow-up form rather than inventing a due date.
      setTaskTitle(nextStep.label);
      setTaskDue(calendarDateInDays(nextStep.urgency === 'today' ? 0 : 7));
      return;
    }
    // call / email / sms all open the relevant app and record the response.
    const target =
      nextStep.action === 'call'
        ? `tel:${lead.phone}`
        : nextStep.action === 'sms'
          ? `sms:${lead.phone}`
          : `mailto:${lead.email}`;
    window.location.href = target;
    await handleContactAction(nextStep.action);
  };

  const handleAddTask = () => {
    const dueDate = dueDateToIso(taskDue);
    if (!lead || !taskTitle.trim() || !dueDate) return;
    createTask({
      leadId: lead.id,
      title: taskTitle.trim(),
      dueDate,
      priority: taskPriority,
    });
    setTaskTitle('');
    setTaskDue('');
    setTaskPriority('medium');
  };

  function resetMeetingForm() {
    setMeetingOpen(false);
    setMeetingType('in_person');
    setMeetingAt('');
    setMeetingLocation('');
    setMeetingNotes('');
  }

  const handleLogMeeting = () => {
    if (!lead || !meetingAt) return;
    // datetime-local has no zone; new Date() reads it as the agent's local
    // time, which is what they typed.
    const scheduledAt = new Date(meetingAt);
    if (Number.isNaN(scheduledAt.getTime())) return;
    logMeeting({
      leadId: lead.id,
      meetingType,
      scheduledAt,
      location: meetingLocation.trim() || undefined,
      notes: meetingNotes.trim() || undefined,
    });
    resetMeetingForm();
  };

  const handleConfirmDelete = () => {
    if (pendingDelete) deleteActivity(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleAddNote = () => {
    if (!lead || !note.trim()) return;
    logNote({ leadId: lead.id, content: note.trim() });
    setNote('');
  };

  const getLeadTypeIcon = () => {
    switch (lead?.lead_type) {
      case 'buyer':
        return <User className="h-5 w-5" />;
      case 'seller':
        return <Home className="h-5 w-5" />;
      case 'valuation':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const handleSelectResponse = (responseId: string) => {
    const response = QUICK_RESPONSES.find((r) => r.id === responseId);
    if (response && lead) {
      setDraftResponse({
        subject: response.subject,
        body: fillQuickResponse(response.template, lead),
      });
    }
    setSelectedResponse('');
  };

  /**
   * Hands the reply to the agent's mail or messages app and records what was
   * sent. Same status/contacted_at handling as tapping the address, but the
   * timeline carries the text rather than a placeholder (US-130 slice 2).
   */
  const handleSendResponse = async (channel: QuickResponseChannel) => {
    if (!lead || !draftResponse || !draftResponse.body.trim()) return;
    const body = draftResponse.body.trim();
    const href = quickResponseHref(channel, lead, body, draftResponse.subject);
    if (!href) return;
    window.location.href = href;
    setDraftResponse(null);
    await recordContact(lead, channel, {
      subject: channel === 'email' ? draftResponse.subject : undefined,
      body,
    });
    onLeadUpdated?.();
  };

  /** The old behaviour, kept for an agent who only wants it on file. */
  const handleResponseAsNote = () => {
    if (!draftResponse) return;
    setNote(draftResponse.body);
    setDraftResponse(null);
  };

  if (!lead) return null;

  const timeAgo = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

  const origin = describeLeadOrigin(lead);
  // Shown for a locked lead too: the allowance withholds contact details
  // (pii-crypto), not the qualifying answers — and "cash buyer, ASAP" behind
  // a lock is the clearest reason to upgrade.
  const answers = describeLeadAnswers(lead);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">{getLeadTypeIcon()}</div>
              <div>
                <DialogTitle className="text-xl">{lead.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">
                    {lead.lead_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="mr-6 flex-shrink-0">
              <AddLeadToClientsButton lead={lead} />
            </div>
          </div>

          {nextStep && !lead.contact_locked && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Next step
                </p>
                <p className="text-sm font-medium text-foreground">{nextStep.label}</p>
                <p className="text-xs text-muted-foreground">{nextStep.rationale}</p>
              </div>
              <Button size="sm" onClick={() => void handleNextStep()} className="flex-shrink-0">
                {nextStep.label}
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Selector */}
          <div className="space-y-2">
            <Label>Lead Status</Label>
            <Select value={status} onValueChange={handleStatusChange} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Lead Score */}
          {leadScore && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Lead Score
              </h3>
              <div className="p-4 rounded-lg border bg-gradient-to-r from-background to-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {leadScore.priority === 'hot' && <Flame className="h-5 w-5 text-red-500" />}
                    {leadScore.priority === 'warm' && (
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                    )}
                    <span
                      className={`text-lg font-bold ${
                        leadScore.priority === 'hot'
                          ? 'text-red-600'
                          : leadScore.priority === 'warm'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {leadScore.priority === 'hot'
                        ? 'Hot Lead'
                        : leadScore.priority === 'warm'
                          ? 'Warm Lead'
                          : 'Cold Lead'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{leadScore.score}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      leadScore.priority === 'hot'
                        ? 'bg-red-500'
                        : leadScore.priority === 'warm'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(leadScore.score, 100)}%` }}
                  />
                </div>
                {leadScore.featureImportance && leadScore.featureImportance.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {leadScore.featureImportance.slice(0, 3).map((f) => (
                      <span
                        key={f.feature}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                      >
                        {f.feature}: {f.contribution > 0 ? '+' : ''}
                        {f.contribution.toFixed(1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            {lead.contact_locked ? (
              <LockedLeadDetails />
            ) : (
              <div className="space-y-2">
                {/* US-246: no envelope row with an empty mailto: for a
                    phone-only lead. */}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={() => void handleContactAction('email')}
                    className="flex items-center gap-3 p-3 min-h-[44px] rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span className="flex-1 text-sm break-all">{lead.email}</span>
                    <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={() => void handleContactAction('call')}
                    className="flex items-center gap-3 p-3 min-h-[44px] rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span className="flex-1 text-sm">{lead.phone}</span>
                    <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`sms:${lead.phone}`}
                    onClick={() => void handleContactAction('sms')}
                    className="flex items-center gap-3 p-3 min-h-[44px] rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span className="flex-1 text-sm">Send SMS</span>
                    <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          {lead.message && !lead.contact_locked && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Message
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
              </div>
            </div>
          )}

          {/* The property they asked about (US-264). listing_id has been
              written since US-096 and was never shown. */}
          {lead.listing_id && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Asked about
              </h3>
              <LeadListingCard
                listingId={lead.listing_id}
                fallbackAddress={lead.property_address}
              />
            </div>
          )}

          {/* What they told you (US-264). Every answer the form collected,
              columns and form_data alike; this used to show source, address
              and a budget key no form writes. */}
          {answers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                What they told you
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {answers.map((answer) => (
                  <div key={answer.key} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{answer.label}</dt>
                    <dd className="font-medium break-words">{answer.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Lead Source & Details */}
          {(lead.source || (lead.property_address && !lead.listing_id)) && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Additional Details
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {lead.source && (
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium truncate">{lead.source}</span>
                  </div>
                )}
                {lead.property_address && !lead.listing_id && (
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Property:</span>
                    <span className="font-medium break-words">{lead.property_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Where this lead came from (US-189).
              `source` above says which button the visitor pressed. This says
              how they found the page at all — the question an agent has when
              deciding whether an ad was worth its spend. Leads captured before
              US-188 recorded nothing, and this says so rather than calling
              them Direct. */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Where this lead came from
            </h3>
            {origin.confidence === 'unrecorded' ? (
              <p className="text-sm text-muted-foreground">
                Captured before campaign tracking was added, so this lead carries no attribution.
                Leads from now on record the campaign that brought them.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{origin.label}</span>
                  {origin.confidence === 'referral' && (
                    <Badge variant="outline" className="text-xs">
                      inferred
                    </Badge>
                  )}
                </div>
                {origin.campaign && (
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Campaign:</span>
                    <span className="font-medium">{origin.campaign}</span>
                  </div>
                )}
                {origin.medium && (
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Medium:</span>
                    <span className="font-medium">{origin.medium}</span>
                  </div>
                )}
                {origin.referrerHost && (
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Referred by:</span>
                    <span className="font-medium">{origin.referrerHost}</span>
                  </div>
                )}
                {origin.device && (
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Device:</span>
                    <span className="font-medium">{origin.device}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Response Templates */}
          <div className="space-y-2">
            <Label>Quick Response Templates</Label>
            <Select value={selectedResponse} onValueChange={handleSelectResponse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {QUICK_RESPONSES.map((response) => (
                  <SelectItem key={response.id} value={response.id}>
                    {response.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {draftResponse && (
              <div className="space-y-3 rounded-lg border p-3" data-testid="quick-response-preview">
                {lead.email && (
                  <div className="space-y-1">
                    <Label htmlFor="quick-response-subject" className="text-xs">
                      Email subject
                    </Label>
                    <input
                      id="quick-response-subject"
                      value={draftResponse.subject}
                      onChange={(e) =>
                        setDraftResponse({ ...draftResponse, subject: e.target.value })
                      }
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="quick-response-body" className="text-xs">
                    Message to {lead.name}
                  </Label>
                  <Textarea
                    id="quick-response-body"
                    value={draftResponse.body}
                    onChange={(e) => setDraftResponse({ ...draftResponse, body: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.email && (
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={!draftResponse.body.trim()}
                      onClick={() => void handleSendResponse('email')}
                    >
                      <Mail className="h-4 w-4" /> Send email
                    </Button>
                  )}
                  {lead.phone && (
                    <Button
                      size="sm"
                      variant={lead.email ? 'outline' : 'default'}
                      className="gap-2"
                      disabled={!draftResponse.body.trim()}
                      onClick={() => void handleSendResponse('sms')}
                    >
                      <MessageSquare className="h-4 w-4" /> Send text
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleResponseAsNote}>
                    Save as note
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraftResponse(null)}>
                    Discard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lead.email || lead.phone
                    ? 'Opens your own mail or messages app with this filled in, and logs it on the timeline.'
                    : 'This lead has no email or phone you can see, so the message can only be saved as a note.'}
                </p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Notes & Activity
            </h3>

            {/* Follow-up task */}
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="task-title" className="text-xs uppercase tracking-wide">
                Add a follow-up
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Call back about the Maple listing"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  aria-label="Follow-up due date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
                <select
                  aria-label="Follow-up priority"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]} priority
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAddTask}
                  disabled={!taskTitle.trim() || !taskDue || isCreatingTask}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Log a meeting: logMeeting has written meeting_type, time and
                place since the hook was written, with no way to reach it. */}
            {meetingOpen ? (
              <div className="space-y-2 rounded-lg border p-3">
                <Label className="text-xs uppercase tracking-wide">Log a meeting</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    aria-label="Meeting type"
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {(Object.keys(MEETING_TYPE_LABELS) as MeetingType[]).map((t) => (
                      <option key={t} value={t}>
                        {MEETING_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    aria-label="Meeting date and time"
                    value={meetingAt}
                    onChange={(e) => setMeetingAt(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <input
                  aria-label="Meeting location"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder={
                    meetingType === 'in_person'
                      ? '123 Main St, or the office'
                      : 'Link or number (optional)'
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <Textarea
                  aria-label="Meeting notes"
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="What you covered (optional)"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleLogMeeting}
                    disabled={!meetingAt || isLoggingMeeting}
                  >
                    Save meeting
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetMeetingForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setMeetingOpen(true)}
              >
                <CalendarClock className="h-4 w-4" /> Log a meeting
              </Button>
            )}

            {/* Add Note */}
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this lead..."
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={!note.trim() || isLoggingNote}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {/* Timeline: notes, calls, emails, status changes, the lot */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loadingActivities ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading activity...
                </p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nothing recorded yet. Add a note above, or call or email the lead.
                </p>
              ) : (
                activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.activity_type] ?? StickyNote;
                  return (
                    <div
                      key={a.id}
                      className={`flex gap-3 p-3 rounded-lg border ${
                        a.is_internal ? 'bg-muted/30 border-muted' : 'bg-background'
                      }`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{activityHeadline(a)}</p>
                        {a.activity_type === 'meeting' && a.meeting_location && (
                          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="break-words">{a.meeting_location}</span>
                          </p>
                        )}
                        {a.content && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">
                            {a.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {a.activity_type === 'task' && a.task_due_date
                            ? `${a.task_completed_at ? 'Completed' : 'Due'} ${formatDistanceToNow(
                                (a.task_completed_at
                                  ? new Date(a.task_completed_at)
                                  : taskDueAt(a.task_due_date)) ?? new Date(a.task_due_date),
                                { addSuffix: true }
                              )}`
                            : formatDistanceToNow(new Date(a.activity_at ?? a.created_at), {
                                addSuffix: true,
                              })}
                        </p>
                        {a.activity_type === 'task' && !a.task_completed_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 gap-1 text-xs"
                            onClick={() => completeTask(a.id)}
                          >
                            <CheckSquare className="h-3 w-3" /> Mark done
                          </Button>
                        )}
                      </div>
                      {canDeleteActivity(a, currentUserId) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${activityHeadline(a)}`}
                          onClick={() => setPendingDelete(a)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(next) => {
            if (!next) setPendingDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete ? `“${activityHeadline(pendingDelete)}” ` : ''}
                will be removed from {lead.name}’s timeline. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
