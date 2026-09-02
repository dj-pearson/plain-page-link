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
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import type { Lead } from '@/types/lead';
import { useLeadScore } from '@/hooks/useMLLeadScoring';
import { useLeadContactAction, type ContactChannel } from '@/hooks/useLeadContactAction';
import { useLeadActivities, type LeadActivity } from '@/hooks/useLeadActivities';
import { getLeadNextStep } from '@/lib/leadNextStep';
import { buildLeadStatusPatch } from '@/lib/leadStatus';
import { logger } from '@/lib/logger';

/**
 * Lead plus the one field the modal shows that is not a column.
 *
 * `property_address` used to be redeclared here as an "extra"; it is a real
 * column on `leads` and is inherited, so restating it only risked disagreeing
 * with the schema. `budget` genuinely is not a column — it is read out of
 * form_data — so it stays.
 */
interface LeadWithExtras extends Lead {
  budget?: string | null;
}

interface LeadDetailModalProps {
  lead: LeadWithExtras | null;
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

/** The line an agent reads. Falls back to the stored title, then the type. */
function activityHeadline(a: LeadActivity): string {
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

const QUICK_RESPONSES = [
  {
    id: 'intro',
    title: 'Introduction',
    template:
      "Hi {name}, thank you for reaching out! I'd love to help you {lead_type}. When would be a good time to chat?",
  },
  {
    id: 'buyer_followup',
    title: 'Buyer Follow-up',
    template:
      "Hi {name}, I have some great properties that match what you're looking for. Are you available for a showing this week?",
  },
  {
    id: 'seller_followup',
    title: 'Seller Follow-up',
    template:
      "Hi {name}, I'd like to schedule a time to visit your property and discuss your goals. What days work best for you?",
  },
  {
    id: 'valuation',
    title: 'Home Valuation',
    template:
      "Hi {name}, I've prepared a comparative market analysis for your property. Can we schedule a call to discuss the current market value?",
  },
];

export function LeadDetailModal({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailModalProps) {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string>('');
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
  } = useLeadActivities(lead?.id);

  // The next step. getRecommendedActions() has produced advice like "Send
  // personalized message within 5 minutes" since it was written and no
  // component ever rendered it — a paragraph an agent has to interpret is not
  // guidance (US-103). This narrows it to one action with a button behind it.
  const nextStep = lead ? getLeadNextStep(lead, leadScore?.score ?? null) : null;

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

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
      const inAWeek = new Date();
      inAWeek.setDate(inAWeek.getDate() + (nextStep.urgency === 'today' ? 0 : 7));
      setTaskDue(inAWeek.toISOString().slice(0, 10));
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
    if (!lead || !taskTitle.trim() || !taskDue) return;
    createTask({
      leadId: lead.id,
      title: taskTitle.trim(),
      dueDate: new Date(taskDue).toISOString(),
    });
    setTaskTitle('');
    setTaskDue('');
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

  const fillTemplate = (template: string) => {
    return template
      .replace('{name}', lead?.name || 'there')
      .replace(
        '{lead_type}',
        lead?.lead_type === 'buyer' ? 'find your dream home' : 'sell your property'
      );
  };

  const handleSelectResponse = (responseId: string) => {
    const response = QUICK_RESPONSES.find((r) => r.id === responseId);
    if (response) {
      setNote(fillTemplate(response.template));
      setSelectedResponse('');
    }
  };

  if (!lead) return null;

  const timeAgo = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : '';

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
                    {lead.lead_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </DialogDescription>
              </div>
            </div>
          </div>

          {nextStep && (
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
            <div className="space-y-2">
              <a
                href={`mailto:${lead.email}`}
                onClick={() => void handleContactAction('email')}
                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <span className="flex-1 text-sm">{lead.email}</span>
                <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  onClick={() => void handleContactAction('call')}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
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
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  <span className="flex-1 text-sm">Send SMS</span>
                  <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
            </div>
          </div>

          {/* Message */}
          {lead.message && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Message
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
              </div>
            </div>
          )}

          {/* Lead Source & Details */}
          {(lead.source || lead.property_address || lead.budget) && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Additional Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {lead.source && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{lead.source}</span>
                  </div>
                )}
                {lead.property_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Property:</span>
                    <span className="font-medium">{lead.property_address}</span>
                  </div>
                )}
                {lead.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{lead.budget}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                <Button
                  onClick={handleAddTask}
                  disabled={!taskTitle.trim() || !taskDue || isCreatingTask}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

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
                        {a.content && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">
                            {a.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {a.activity_type === 'task' && a.task_due_date
                            ? `${a.task_completed_at ? 'Completed' : 'Due'} ${formatDistanceToNow(
                                new Date(a.task_completed_at ?? a.task_due_date),
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
