import { useState, useMemo, useEffect, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Search,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Zap,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  TrendingUp,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  Home,
  DoorOpen,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLeads, fetchAllLeads } from '@/hooks/useLeads';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  buildLeadStatusPatch,
  LEAD_STATUSES,
  LEAD_STATUS_GROUPS,
  leadStatusLabel,
  normalizeStatusFilter,
  summarizeLeadStatuses,
  type LeadStatus,
} from '@/lib/leadStatus';
import { cn } from '@/lib/utils';
import { useLeadContactAction } from '@/hooks/useLeadContactAction';
import { useLeadsActivitySummaries } from '@/hooks/useLeadActivities';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { PlanLimitNotice } from '@/components/PlanLimitNotice';
import { LockedLeadDetails } from '@/components/leads/LockedLeadDetails';
import { LazyModal } from '@/components/profile/LazyModal';
import { useMountOnFirstOpen } from '@/hooks/useMountOnFirstOpen';
import { leadAddressLabel } from '@/lib/leadAddressLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead } from '@/types/lead';
import { useMLLeadScoring } from '@/hooks/useMLLeadScoring';
import type { LeadScore } from '@/hooks/useMLLeadScoring';
import { logger } from '@/lib/logger';
import { describeLeadOrigin } from '@/lib/leadAttribution';
import { timeAgo } from '@/lib/timeAgo';
import { useLeadStats } from '@/hooks/useLeadStats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import {
  describeAssignee,
  isNotTeammateError,
  normalizeAssigneeFilter,
  planBulkAssign,
  summarizeBulkAssign,
} from '@/lib/leadAssignee';
import { planBulkDelete, summarizeBulkDelete, summarizeBulkStatus } from '@/lib/leadBulkActions';

/*
 * Every dialog on this page is closed on first render, so none of them ships
 * with the route (US-476). The lead detail alone brought useContacts, the
 * activity timeline, the listing card and key dates; Zapier brought useProfile
 * and the webhook validator; the upgrade dialog brought the pricing table.
 * Hovering or focusing a lead warms the detail chunk before the click.
 */
const loadLeadDetailModal = () => import('@/components/leads/LeadDetailModal');
const LeadDetailModal = lazy(() =>
  loadLeadDetailModal().then((m) => ({ default: m.LeadDetailModal }))
);
const ZapierIntegrationModal = lazy(() =>
  import('@/components/integrations/ZapierIntegrationModal').then((m) => ({
    default: m.ZapierIntegrationModal,
  }))
);
const UpgradeModal = lazy(() =>
  import('@/components/UpgradeModal').then((m) => ({ default: m.UpgradeModal }))
);

/** A failed prefetch is retried by the click that needs the chunk. */
const preloadLeadDetail = () => void loadLeadDetailModal().catch(() => undefined);

/** The bulk assign select's value for "nobody"; a Radix Select item cannot hold ''. */
const BULK_UNASSIGNED = '__unassigned';

export default function Leads() {
  // Search is local; status and type live in the URL so a filtered view is
  // linkable and a notification deep link can preselect one (US-104).
  // US-225: the comment here said search debounced; it did not — every
  // keystroke was a new query key, a database query and a pii-crypto call.
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput, 300);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const upgradeModal = useMountOnFirstOpen(showUpgradeModal);
  const zapierModal = useMountOnFirstOpen(showZapierModal);
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { subscription } = useSubscriptionLimits();
  const { scoreLeadObject } = useMLLeadScoring();

  // Persisted on the profile, not in component state: it has to survive a
  // reload and be readable by the overdue-leads job (US-103).
  const [searchParams, setSearchParams] = useSearchParams();
  // A single status or a group (US-439); an unknown value reads as 'all'.
  const statusFilter = normalizeStatusFilter(searchParams.get('status'));
  const typeFilter = searchParams.get('type') ?? 'all';
  const assignedToMe = searchParams.get('assigned') === 'me';
  // US-515: the owner's split of their team's leads ('unassigned' or a
  // teammate's id). A malformed value reads as everyone.
  const assigneeFilter = normalizeAssigneeFilter(searchParams.get('assignee'));

  const setFilter = (key: 'status' | 'type' | 'assigned' | 'assignee', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    // Both narrow assigned_to; together they would AND into an empty list.
    if (value !== 'all' && key === 'assigned') next.delete('assignee');
    if (value !== 'all' && key === 'assignee') next.delete('assigned');
    setSearchParams(next, { replace: true });
    setSelectedLeadIds(new Set());
  };

  const { slaHours, update: updatePreferences } = useNotificationPreferences();
  const setSlaHours = (hours: number) => updatePreferences.mutate({ sla_hours: hours });
  // US-534: the chips and the Needs-attention badge count what the list shows
  // under the assignee filters ("Assigned to me" is the same filter on my id).
  // US-557: and under the type filter and the name search. Status is not
  // passed: the chips are the status breakdown.
  const { stats: serverStats } = useLeadStats({
    slaHours,
    assignee: assignedToMe ? (user?.id ?? null) : assigneeFilter,
    leadType: typeFilter,
    search: searchQuery,
  });
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);

  // The one reader of `leads`. useLeads owns the query, the cache key and the
  // decryption of encrypted_email / encrypted_phone — the page used to run its
  // own query beside it, selecting the plaintext columns US-086 dropped, under
  // the same ['leads', userId] key. That select was rejected by PostgREST (the
  // page never loaded) and the duplicate key meant whichever of this page and
  // AnalyticsDashboard mounted first decided the row shape for both (US-094).
  const {
    leads,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    bulkUpdateStatus,
    bulkAssign,
    bulkDelete,
  } = useLeads({
    status: statusFilter,
    leadType: typeFilter,
    search: searchQuery,
    assignedToMe,
    assignee: assigneeFilter,
  });

  // Only teammates have leads assigned to them; the filter shows for them.
  const { data: assignedCount = 0 } = useQuery({
    queryKey: ['leads-assigned-count', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Who holds each lead (US-497). The roster is the owner's own team; a
  // teammate viewing leads assigned to them gets an empty one.
  const { teamId: ownedTeamId, assignees, refetch: refetchAssignees } = useLeadAssignees();
  const assigneeText = (lead: Lead): string | null => {
    const text = describeAssignee(lead, user?.id ?? null, assignees, !!ownedTeamId);
    // 'Unassigned' on every row of a team owner's list is noise; the detail
    // dialog says it, next to the control that changes it.
    return text === 'Unassigned' ? null : text;
  };
  // Shown to a team owner with someone to hand leads to, and kept while a
  // link's filter is applied so it can be cleared.
  const showAssigneeFilter = !!ownedTeamId && (assignees.length > 0 || !!assigneeFilter);
  const hasActiveFilters =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    assignedToMe ||
    !!assigneeFilter ||
    !!searchQuery.trim() ||
    needsAttentionOnly;
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    for (const key of ['status', 'type', 'assigned', 'assignee']) next.delete(key);
    setSearchParams(next, { replace: true });
    setSearchInput('');
    setNeedsAttentionOnly(false);
    setSelectedLeadIds(new Set());
  };

  // Tapping a lead's email or phone number on the card records the response,
  // the same way the detail modal does (US-101).
  const recordContact = useLeadContactAction();

  // Last-contacted per lead, from the lead_activity_summary view. The hook that
  // reads it had no importer at all, so the list showed nothing about whether
  // an agent had actually reached out — only whether the status had been
  // changed by hand (US-102).
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const { data: activitySummaries } = useLeadsActivitySummaries(leadIds);
  const lastContactByLead = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of activitySummaries ?? []) {
      // The most recent outbound touch, whichever channel it was.
      const latest = [s.last_call_at, s.last_email_at].filter(Boolean).sort().pop();
      if (latest) map.set(s.lead_id, latest);
    }
    return map;
  }, [activitySummaries]);

  // Score all leads and cache results
  const leadScores = useMemo(() => {
    if (!leads) return new Map<string, LeadScore>();
    const scores = new Map<string, LeadScore>();
    for (const lead of leads) {
      try {
        scores.set(lead.id, scoreLeadObject(lead));
      } catch {
        // If scoring fails for a lead, skip it
      }
    }
    return scores;
  }, [leads, scoreLeadObject]);

  const slaMs = slaHours * 60 * 60 * 1000;

  // Response time = first_responded_at - created_at (ms), or null if not yet responded.
  const responseMs = (lead: Lead): number | null =>
    lead.first_responded_at && lead.created_at
      ? new Date(lead.first_responded_at).getTime() - new Date(lead.created_at).getTime()
      : null;

  // A 'new' lead with no response past the SLA threshold needs attention.
  const isNeedsAttention = (lead: Lead): boolean =>
    lead.status === 'new' &&
    !!lead.created_at &&
    Date.now() - new Date(lead.created_at).getTime() > slaMs;

  const formatDuration = (ms: number): string => {
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Memoize lead stats to avoid N+1 filtering on every render
  const leadStats = useMemo(() => {
    if (!leads)
      return {
        total: 0,
        new: 0,
        inProgress: 0,
        won: 0,
        lost: 0,
        hot: 0,
        avgResponse: null as number | null,
        needsAttention: 0,
      };

    let respondedCount = 0;
    let respondedTotalMs = 0;
    const loadedByStatus: Record<string, number> = {};
    const acc = leads.reduce(
      (a, lead) => {
        a.total++;
        const st = lead.status ?? 'new';
        loadedByStatus[st] = (loadedByStatus[st] ?? 0) + 1;
        const score = leadScores.get(lead.id);
        if (score?.priority === 'hot') a.hot++;
        if (isNeedsAttention(lead)) a.needsAttention++;
        const rm = responseMs(lead);
        if (rm !== null) {
          respondedCount++;
          respondedTotalMs += rm;
        }
        return a;
      },
      { total: 0, hot: 0, needsAttention: 0 }
    );

    // US-439: the chips are status groups, so qualified, nurturing and closed
    // leads are counted — they used to fall out of every number on the page.
    const loaded = {
      ...acc,
      ...summarizeLeadStatuses(loadedByStatus),
      avgResponse: respondedCount > 0 ? respondedTotalMs / respondedCount : null,
    };
    // US-225: every count except "hot" comes from lead_stats(), over all of the
    // agent's leads. These used to be counted from the loaded, status-filtered
    // pages — so choosing "New" showed 0 contacted and 0 converted. "Hot" needs
    // the client-side score, so it is still counted over the loaded leads.
    if (!serverStats) return loaded;
    return {
      ...loaded,
      total: serverStats.total,
      ...summarizeLeadStatuses(serverStats.byStatus),
      needsAttention: serverStats.needsAttention,
      avgResponse: serverStats.avgResponseMs,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, leadScores, slaMs, serverStats]);

  // Deep link from a notification: /dashboard/leads?lead=<id> opens that lead.
  // The trigger has always written data.lead_id and nothing ever read it, so
  // an agent told about a lead was left to go find it (US-103). The param is
  // cleared once consumed so a later close does not reopen the modal.
  useEffect(() => {
    const wanted = searchParams.get('lead');
    if (!wanted || !leads.length) return;
    const match = leads.find((l) => l.id === wanted);
    if (!match) return;
    setSelectedLead(match);
    setShowLeadDetail(true);
    const next = new URLSearchParams(searchParams);
    next.delete('lead');
    setSearchParams(next, { replace: true });
  }, [searchParams, leads, setSearchParams]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  // Bulk selection handlers
  const toggleLeadSelection = (leadId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the detail modal
    setSelectedLeadIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads?.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads?.map((l) => l.id) || []));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedLeadIds.size === 0) return;

    setIsBulkActing(true);
    try {
      // Through useLeads, which invalidates ['leads'], ['analytics-leads'] and
      // ['conversion-funnel'] by prefix. This used to hit supabase directly and
      // refetch only ['leads'], so Overview kept contradicting this page for up
      // to five minutes (US-104).
      const updated = await bulkUpdateStatus.mutateAsync({
        ids: Array.from(selectedLeadIds),
        patch: { ...buildLeadStatusPatch(newStatus) },
      });

      // US-588: what the server changed, not the size of the selection.
      const summary = summarizeBulkStatus(
        selectedLeadIds.size,
        updated.length,
        leadStatusLabel(newStatus)
      );
      toast({
        title: summary.title,
        description: summary.description,
        variant: summary.partial ? 'destructive' : undefined,
      });
      setSelectedLeadIds(new Set());
    } catch (error) {
      logger.error('Bulk status update failed', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    } finally {
      setIsBulkActing(false);
    }
  };

  // US-573: hand the selected leads to a teammate (or to nobody) in one go.
  // Only the owner's own leads can move; the rest of the selection is
  // reported rather than silently skipped.
  const handleBulkAssign = async (value: string) => {
    if (selectedLeadIds.size === 0 || !user?.id) return;
    const next = value === BULK_UNASSIGNED ? null : value;
    const target =
      next === null
        ? null
        : next === user.id
          ? 'you'
          : (assignees.find((a) => a.userId === next)?.label ?? 'that teammate');
    const plan = planBulkAssign(selectedLeadIds, leads ?? [], user.id, next);

    setIsBulkActing(true);
    try {
      const updated = await bulkAssign.mutateAsync({ ids: plan.toUpdate, assignedTo: next });
      const summary = summarizeBulkAssign(plan, updated.length, target);
      toast({
        title: summary.title,
        description: summary.description,
        variant: summary.partial ? 'destructive' : undefined,
      });
      setSelectedLeadIds(new Set());
    } catch (error) {
      logger.error('Bulk assign failed', error as Error);
      const notTeammate = isNotTeammateError(error);
      toast({
        title: 'Leads not reassigned',
        description: notTeammate
          ? `${target ?? 'That person'} is no longer an accepted member of your team, so no lead was changed. Refresh and try again.`
          : 'Couldn’t change who holds the selected leads. Please try again.',
        variant: 'destructive',
      });
      if (notTeammate) void refetchAssignees();
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0 || !user?.id) return;
    // US-588: leads another agent assigned to the viewer are theirs to keep;
    // say so up front and in the result, instead of reporting them deleted.
    const plan = planBulkDelete(selectedLeadIds, leads ?? [], user.id);
    if (plan.toDelete.length === 0) {
      toast({
        title: 'No leads deleted',
        description: summarizeBulkDelete(plan, 0).description,
        variant: 'destructive',
      });
      return;
    }

    const kept =
      plan.notOwned > 0 ? ` ${plan.notOwned} assigned to you by another agent will be kept.` : '';
    if (
      !confirm(
        `Are you sure you want to delete ${plan.toDelete.length} lead(s)? This action cannot be undone.${kept}`
      )
    ) {
      return;
    }

    setIsBulkActing(true);
    try {
      const deleted = await bulkDelete.mutateAsync(plan.toDelete);

      const summary = summarizeBulkDelete(plan, deleted.length);
      toast({
        title: summary.title,
        description: summary.description,
        variant: summary.partial ? 'destructive' : undefined,
      });
      setSelectedLeadIds(new Set());
    } catch (error) {
      logger.error('Bulk delete failed', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to delete leads',
        variant: 'destructive',
      });
    } finally {
      setIsBulkActing(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportLeads = async () => {
    // Check if user has export feature
    if (subscription?.plan_name === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    if (!user?.id) return;

    // US-225: every matching lead, not the rows loaded on screen.
    setIsExporting(true);
    let exportLeads: Lead[];
    let truncated = false;
    let exportToCSV: (typeof import('@/lib/exportUtils'))['exportToCSV'];
    try {
      // The CSV writer is only needed here, so it loads with the leads it
      // writes rather than with the page (US-476).
      const [all, exportUtils] = await Promise.all([
        fetchAllLeads(user.id, {
          status: statusFilter,
          leadType: typeFilter,
          search: searchQuery,
          assignedToMe,
          assignee: assigneeFilter,
        }),
        import('@/lib/exportUtils'),
      ]);
      exportToCSV = exportUtils.exportToCSV;
      truncated = all.truncated;
      exportLeads = needsAttentionOnly ? all.leads.filter(isNeedsAttention) : all.leads;
    } catch (err) {
      logger.error('Lead export failed', err as Error);
      toast({
        title: 'Export failed',
        description: 'Could not load your leads. Please try again.',
        variant: 'destructive',
      });
      return;
    } finally {
      setIsExporting(false);
    }

    if (exportLeads.length === 0) {
      toast({
        title: 'No leads to export',
        description: 'Nothing matches the current filters.',
        variant: 'destructive',
      });
      return;
    }

    // exportToCSV quotes any cell containing a comma, quote or newline. The
    // hand-rolled version this replaced quoted only `message`, so a lead named
    // "Smith, John" split into two columns in Excel and shifted every field
    // after it. It also exported every lead rather than the filtered set
    // (US-104).
    exportToCSV({
      title: 'Leads',
      headers: [
        'Name',
        'Email',
        'Phone',
        'Type',
        'Status',
        'Source',
        // The form's own label ('contact_form') answers a different question
        // from the campaign that produced the lead, so both are exported
        // (US-189). An agent reconciling ad spend needs the campaign columns
        // in the same sheet as the leads.
        'Channel',
        'Campaign',
        'Medium',
        'Referred By',
        'Device',
        'Message',
        'Created At',
        'First Responded At',
      ],
      rows: exportLeads.map((lead) => {
        const origin = describeLeadOrigin(lead);
        return [
          lead.name,
          lead.email ?? '',
          lead.phone ?? '',
          lead.lead_type ?? '',
          lead.status ?? '',
          lead.source ?? '',
          origin.label,
          lead.utm_campaign ?? '',
          lead.utm_medium ?? '',
          origin.referrerHost ?? '',
          lead.device ?? '',
          lead.message ?? '',
          lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
          lead.first_responded_at ? new Date(lead.first_responded_at).toLocaleString() : '',
        ];
      }),
    });

    toast({
      title: 'Leads exported',
      description: truncated
        ? `Exported the newest ${exportLeads.length} leads — narrow the filters to export the rest.`
        : `Exported ${exportLeads.length} leads to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      contacted: 'secondary',
      qualified: 'outline',
      nurturing: 'secondary',
      converted: 'default',
      closed: 'default',
      lost: 'outline',
    };
    const variant = variants[status as LeadStatus] ?? 'outline';
    return <Badge variant={variant}>{leadStatusLabel(status)}</Badge>;
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'buyer':
        return <User className="h-4 w-4" />;
      case 'seller':
        return <Phone className="h-4 w-4" />;
      case 'valuation':
        return <Mail className="h-4 w-4" />;
      case 'open_house':
        return <DoorOpen className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getScoreBadge = (leadId: string) => {
    const score = leadScores.get(leadId);
    if (!score) return null;

    const config = {
      hot: {
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Hot',
        icon: <Flame className="h-3 w-3" />,
      },
      warm: {
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        label: 'Warm',
        icon: <TrendingUp className="h-3 w-3" />,
      },
      cold: {
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        label: 'Cold',
        icon: null,
      },
    }[score.priority];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
        title={`Priority ${config.label.toLowerCase()} (${score.score}/100) — from the lead's source, contact details, type and timing. Rules-based; no model has been trained.`}
      >
        {config.icon}
        {config.label}
        <span className="text-[10px] opacity-70">{score.score}</span>
      </span>
    );
  };

  const filteredLeads = useMemo(() => {
    let result = leads?.filter((lead) => {
      // The name search already ran in SQL (useLeads).
      return needsAttentionOnly ? isNeedsAttention(lead) : true;
    });

    if (sortBy === 'score' && result) {
      result = [...result].sort((a, b) => {
        const scoreA = leadScores.get(a.id)?.score ?? 0;
        const scoreB = leadScores.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, searchQuery, sortBy, leadScores, needsAttentionOnly, slaMs]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lead Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Track and follow up with your inquiries
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowZapierModal(true)}
            variant="outline"
            className="flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all"
          >
            <Zap className="h-4 w-4 mr-2 text-orange-500" />
            <span className="text-sm sm:text-base">Zapier</span>
          </Button>
          <Button
            onClick={handleExportLeads}
            variant="outline"
            disabled={!leads || leads.length === 0 || isExporting}
            className="flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </span>
            {subscription?.plan_name === 'free' && (
              <Badge variant="secondary" className="ml-2">
                Pro
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Leads are never refused; past the plan's monthly allowance this
          only nudges (20260923000002). */}
      <PlanLimitNotice limitKey="leads_per_month" />
      {/* Stats - Mobile optimized grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{leadStats.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-red-100">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-red-500" />
              <div className="text-xl sm:text-2xl font-bold text-red-600">{leadStats.hot}</div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Hot Leads</div>
          </CardContent>
        </Card>
        <button
          type="button"
          onClick={() => setFilter('status', statusFilter === 'new' ? 'all' : 'new')}
          aria-pressed={statusFilter === 'new'}
          className="text-left"
        >
          <Card
            className={cn(
              'hover:shadow-md transition-shadow h-full',
              statusFilter === 'new' && 'ring-2 ring-primary'
            )}
          >
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{leadStats.new}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">New</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() =>
            setFilter('status', statusFilter === 'in_progress' ? 'all' : 'in_progress')
          }
          aria-pressed={statusFilter === 'in_progress'}
          title="Contacted, qualified or nurturing"
          className="text-left"
        >
          <Card
            className={cn(
              'hover:shadow-md transition-shadow h-full',
              statusFilter === 'in_progress' && 'ring-2 ring-primary'
            )}
          >
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {leadStats.inProgress}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">In progress</div>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setFilter('status', statusFilter === 'won' ? 'all' : 'won')}
          aria-pressed={statusFilter === 'won'}
          title="Converted or closed"
          className="text-left"
        >
          <Card
            className={cn(
              'hover:shadow-md transition-shadow h-full',
              statusFilter === 'won' && 'ring-2 ring-primary'
            )}
          >
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-primary">{leadStats.won}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Won</div>
            </CardContent>
          </Card>
        </button>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {leadStats.avgResponse !== null ? formatDuration(leadStats.avgResponse) : '—'}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Avg Response</div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Sort & Bulk Actions - Mobile optimized */}
      <div className="space-y-3">
        {/* US-246: this was one nowrap row of seven controls (~600px wide), so
            at 360px it pushed the whole dashboard sideways. It wraps now, and
            below sm the search takes a row of its own with the filters under
            it; from sm up the search grows to fill whatever the row leaves. */}
        <div className="flex flex-wrap gap-2" data-testid="leads-toolbar">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              // US-225: email is ciphertext, so the server can only match names;
              // the old client-side email match only saw rows already loaded
              // whose NAME had matched, i.e. never.
              placeholder="Search leads by name…"
              aria-label="Search leads by name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[44px]"
            />
          </div>
          {/* US-439: the chips only reach new / in progress / won, so every
              status (qualified, nurturing, closed and lost among them) is
              filterable here. Same URL param as the chips. */}
          <Select value={statusFilter} onValueChange={(v) => setFilter('status', v)}>
            <SelectTrigger
              className="w-[150px] min-h-[44px] flex-shrink-0"
              aria-label="Filter by status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUS_GROUPS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Type filter — pushed into the query, not applied client-side. */}
          <Select value={typeFilter} onValueChange={(v) => setFilter('type', v)}>
            <SelectTrigger
              className="w-[130px] min-h-[44px] flex-shrink-0"
              aria-label="Filter by lead type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="valuation">Valuation</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="open_house">Open house</SelectItem>
            </SelectContent>
          </Select>
          {/* US-515: a team owner can see who holds what. Solo agents, and
              teammates (who see only their own and assigned leads), have
              nobody to filter by. */}
          {showAssigneeFilter && (
            <Select value={assigneeFilter ?? 'all'} onValueChange={(v) => setFilter('assignee', v)}>
              <SelectTrigger
                className="w-[170px] min-h-[44px] flex-shrink-0"
                aria-label="Filter by assignee"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.userId} value={a.userId}>
                    {a.label}
                  </SelectItem>
                ))}
                {/* A link to someone who has since left keeps working, and
                    the trigger says so instead of going blank. */}
                {assigneeFilter &&
                  assigneeFilter !== 'unassigned' &&
                  !assignees.some((a) => a.userId === assigneeFilter) && (
                    <SelectItem value={assigneeFilter}>
                      {assigneeFilter === user?.id ? 'Me' : 'Not on your team'}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          )}
          <Button
            variant={sortBy === 'score' ? 'default' : 'outline'}
            onClick={() => setSortBy(sortBy === 'date' ? 'score' : 'date')}
            className="min-h-[44px] gap-2 flex-shrink-0"
            // Icon-only below sm, so the name has to come from here.
            aria-label="Sort by priority"
            aria-pressed={sortBy === 'score'}
            title={
              sortBy === 'score'
                ? 'Sorted by priority — a rules-based score over source, contact details, lead type and timing'
                : 'Sort by priority'
            }
          >
            <ArrowUpDown className="h-4 w-4" />
            {/* Not "AI Score". Nothing has ever trained this model —
                trainingExamples is 0 and recordConversion has no caller — and
                the five behavioural features it leaned on were never measured
                (US-105). It is a rules-based priority, and it says so. */}
            <span className="hidden sm:inline">{sortBy === 'score' ? 'Priority' : 'Recent'}</span>
          </Button>
          {(assignedCount > 0 || assignedToMe) && (
            <Button
              variant={assignedToMe ? 'default' : 'outline'}
              onClick={() => setFilter('assigned', assignedToMe ? 'all' : 'me')}
              className="min-h-[44px] flex-shrink-0"
              aria-pressed={assignedToMe}
            >
              Assigned to me
            </Button>
          )}
          <Button
            variant={needsAttentionOnly ? 'default' : 'outline'}
            onClick={() => setNeedsAttentionOnly((v) => !v)}
            className="min-h-[44px] gap-2 flex-shrink-0"
            aria-label={`Needs attention${leadStats.needsAttention > 0 ? ` (${leadStats.needsAttention})` : ''}`}
            aria-pressed={needsAttentionOnly}
            title={`Show leads with no response after ${slaHours}h`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Needs Attention</span>
            {leadStats.needsAttention > 0 && (
              <Badge variant="secondary" className="ml-1">
                {leadStats.needsAttention}
              </Badge>
            )}
          </Button>
          <Select value={String(slaHours)} onValueChange={(v) => setSlaHours(Number(v))}>
            <SelectTrigger
              className="w-[110px] min-h-[44px] flex-shrink-0"
              title="SLA threshold"
              aria-label="SLA threshold"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">SLA: 1h</SelectItem>
              <SelectItem value="2">SLA: 2h</SelectItem>
              <SelectItem value="4">SLA: 4h</SelectItem>
              <SelectItem value="24">SLA: 24h</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedLeadIds.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select onValueChange={handleBulkStatusUpdate} disabled={isBulkActing}>
                    <SelectTrigger
                      className="w-[140px] sm:w-[160px] min-h-[44px] bg-white"
                      aria-label="Update status of selected leads"
                    >
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ownedTeamId && (
                    <Select
                      // Remounted after each use so the same choice can be made again.
                      key={isBulkActing ? 'assigning' : 'idle'}
                      onValueChange={handleBulkAssign}
                      disabled={isBulkActing}
                    >
                      <SelectTrigger
                        className="w-[140px] sm:w-[160px] min-h-[44px] bg-white"
                        aria-label="Assign selected leads to"
                      >
                        <SelectValue placeholder="Assign to…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BULK_UNASSIGNED}>Unassigned</SelectItem>
                        {user?.id && <SelectItem value={user.id}>Me</SelectItem>}
                        {assignees.map((a) => (
                          <SelectItem key={a.userId} value={a.userId}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkActing}
                    className="gap-2 min-h-[44px]"
                    aria-label={`Delete ${selectedLeadIds.size} selected lead${selectedLeadIds.size !== 1 ? 's' : ''}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLeadIds(new Set())}
                    disabled={isBulkActing}
                    className="min-h-[44px]"
                    aria-label="Clear selection"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leads List Header with Select All */}
      {filteredLeads && filteredLeads.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
          >
            {selectedLeadIds.size === filteredLeads.length ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            <span>Select all</span>
          </button>
        </div>
      )}

      {/* Leads List - Mobile optimized */}
      <div className="space-y-2 sm:space-y-3">
        {isError ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
                <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                Failed to load leads
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred. Please try again.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-2 sm:space-y-3" role="status" aria-label="Loading leads">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-32 bg-gray-200 rounded" />
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      </div>
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-36 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
            <span className="sr-only">Loading leads...</span>
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:shadow-md active:shadow-lg transition-all cursor-pointer"
              onClick={() => handleLeadClick(lead)}
              onPointerEnter={preloadLeadDetail}
              onFocus={preloadLeadDetail}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleLeadSelection(lead.id, e)}
                      className="flex-shrink-0 mt-1 hover:bg-gray-100 rounded p-1 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Select ${lead.name}`}
                      aria-pressed={selectedLeadIds.has(lead.id)}
                    >
                      {selectedLeadIds.has(lead.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getLeadTypeIcon(lead.lead_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          {lead.name}
                        </h3>
                        {getScoreBadge(lead.id)}
                        {getStatusBadge(lead.status ?? 'new')}
                        <Badge variant="outline" className="capitalize text-xs">
                          {lead.lead_type}
                        </Badge>
                        {assigneeText(lead) && (
                          <Badge variant="secondary" className="gap-1 text-xs font-normal">
                            <UserCheck className="h-3 w-3" aria-hidden="true" />
                            {assigneeText(lead)}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                        {lead.contact_locked ? (
                          <LockedLeadDetails withMessage={!!lead.message} />
                        ) : (
                          <>
                            {/* US-246: a phone-only lead (US-228) rendered an
                                envelope beside an empty mailto: link. The
                                links are the 44px targets, not the rows. */}
                            {lead.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <a
                                  href={`mailto:${lead.email}`}
                                  onClick={(e) => {
                                    // Without this the click also bubbles to the
                                    // card and opens the detail modal behind the
                                    // mail client.
                                    e.stopPropagation();
                                    void recordContact(lead, 'email').then(() => refetch());
                                  }}
                                  className="inline-flex items-center min-h-[44px] hover:text-primary active:text-primary-dark break-all"
                                >
                                  {lead.email}
                                </a>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void recordContact(lead, 'call').then(() => refetch());
                                  }}
                                  className="inline-flex items-center min-h-[44px] hover:text-primary active:text-primary-dark"
                                >
                                  {lead.phone}
                                </a>
                              </div>
                            )}
                          </>
                        )}
                        {lastContactByLead.has(lead.id) && (
                          <div className="flex items-center gap-2 min-h-[32px]">
                            <MessageSquare className="h-3 w-3 flex-shrink-0" />
                            <span>Last contacted {timeAgo(lastContactByLead.get(lead.id)!)}</span>
                          </div>
                        )}
                        {lead.property_address && (
                          <div className="flex items-center gap-2 min-h-[32px] min-w-0">
                            <Home className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {/* Whose address this is (US-264): the listing a
                                  buyer asked about, or a seller's own home. */}
                              {leadAddressLabel(lead) && (
                                <span className="text-muted-foreground">
                                  {leadAddressLabel(lead)}{' '}
                                </span>
                              )}
                              {lead.property_address}
                            </span>
                          </div>
                        )}
                        {lead.message && !lead.contact_locked && (
                          <p className="mt-2 text-foreground line-clamp-2 text-xs sm:text-sm leading-relaxed">
                            {lead.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date + response time - Mobile: below content, Desktop: right side */}
                  <div className="text-left sm:text-right flex-shrink-0 pl-12 sm:pl-0 space-y-1">
                    <div className="flex sm:justify-end items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    {(() => {
                      const rm = responseMs(lead);
                      if (rm !== null) {
                        return (
                          <div className="flex sm:justify-end items-center gap-1 text-xs text-green-600">
                            <Clock className="h-3 w-3" />
                            <span>Responded in {formatDuration(rm)}</span>
                          </div>
                        );
                      }
                      if (isNeedsAttention(lead)) {
                        return (
                          <div className="flex sm:justify-end items-center gap-1 text-xs font-medium text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>
                              No response ·{' '}
                              {formatDuration(
                                Date.now() - new Date(lead.created_at ?? 0).getTime()
                              )}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-full mb-3 sm:mb-4">
                <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              {/* A filtered view with no rows is not an account with no
                  leads: an owner filtering to a teammate holding nothing
                  used to read "No leads yet". */}
              {hasActiveFilters ? (
                <>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                    No leads match these filters
                  </h3>
                  <Button variant="outline" onClick={clearFilters} className="min-h-[44px] mt-2">
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                    No leads yet
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                    Leads will appear here when visitors contact you through your profile
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination. The page used to select every lead the agent had ever
          received in one query — and decrypt every one of them through
          pii-crypto on each visit (US-104). */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-h-[44px]"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more leads'}
          </Button>
        </div>
      )}

      {upgradeModal.mounted && (
        <LazyModal
          onClose={() => {
            setShowUpgradeModal(false);
            upgradeModal.unmount();
          }}
        >
          <UpgradeModal
            open={showUpgradeModal}
            onOpenChange={setShowUpgradeModal}
            feature="lead_export"
            currentPlan={subscription?.plan_name || 'Free'}
            requiredPlan="Starter"
          />
        </LazyModal>
      )}

      {zapierModal.mounted && (
        <LazyModal
          onClose={() => {
            setShowZapierModal(false);
            zapierModal.unmount();
          }}
        >
          <ZapierIntegrationModal open={showZapierModal} onOpenChange={setShowZapierModal} />
        </LazyModal>
      )}

      {selectedLead && (
        <LazyModal
          onClose={() => {
            setShowLeadDetail(false);
            setSelectedLead(null);
          }}
        >
          <LeadDetailModal
            lead={selectedLead}
            open={showLeadDetail}
            onOpenChange={setShowLeadDetail}
            onLeadUpdated={() => refetch()}
          />
        </LazyModal>
      )}
    </div>
  );
}
