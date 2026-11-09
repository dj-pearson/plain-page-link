import { PlanLimitNotice } from '@/components/PlanLimitNotice';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkflows } from '@/hooks/useWorkflows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Workflow,
  Play,
  MoreVertical,
  Trash2,
  Copy,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Workflow as WorkflowType, WorkflowCategory } from '@/types/workflow';

const CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  lead_management: 'Lead Management',
  listing_automation: 'Listing Automation',
  marketing: 'Marketing',
  notifications: 'Notifications',
  integrations: 'Integrations',
  general: 'General',
};

export const WorkflowsListPage = () => {
  const navigate = useNavigate();
  const { workflows, isLoading, error, refetch, isRefetching, deleteWorkflow, duplicateWorkflow } =
    useWorkflows();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingDelete, setPendingDelete] = useState<WorkflowType | null>(null);

  const filteredWorkflows = workflows.filter((workflow) => {
    const query = searchQuery.toLowerCase();
    if (
      query &&
      !workflow.name.toLowerCase().includes(query) &&
      !workflow.description?.toLowerCase().includes(query)
    ) {
      return false;
    }

    if (categoryFilter !== 'all' && workflow.category !== categoryFilter) {
      return false;
    }

    if (statusFilter === 'active' && !workflow.isActive) return false;
    if (statusFilter === 'inactive' && workflow.isActive) return false;
    if (statusFilter === 'draft' && workflow.isPublished) return false;

    return true;
  });

  const handleCreateNew = () => {
    navigate('/dashboard/workflows/new');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const confirmDelete = () => {
    if (pendingDelete) deleteWorkflow.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20" role="status">
          <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading workflows</span>
        </div>
      );
    }

    // A failed load is not an empty list: "No workflows yet" here invites the
    // agent to rebuild sequences they already have.
    if (error) {
      return (
        <div role="alert" className="rounded-xl border bg-card px-6 py-16 text-center">
          <AlertCircle aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h2 className="mb-2 text-lg font-medium text-foreground">Your workflows did not load</h2>
          <p className="mx-auto mb-6 max-w-prose text-muted-foreground">
            Nothing has been lost. Check your connection and try again.
          </p>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw
              aria-hidden="true"
              className={isRefetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'}
            />
            Try again
          </Button>
        </div>
      );
    }

    if (filteredWorkflows.length === 0) {
      return (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <Workflow aria-hidden="true" className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-medium text-foreground">
            {workflows.length === 0 ? 'No workflows yet' : 'No matching workflows'}
          </h2>
          <p className="mx-auto mb-6 max-w-prose text-muted-foreground">
            {workflows.length === 0
              ? 'Lay out the follow-up steps you take with a new lead, ready for when automatic sending arrives.'
              : 'Try adjusting your filters.'}
          </p>
          {workflows.length === 0 && (
            <Button onClick={handleCreateNew}>
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              Create your first workflow
            </Button>
          )}
        </div>
      );
    }

    return (
      <ul className="grid gap-4" aria-label="Workflows">
        {filteredWorkflows.map((workflow) => (
          <li
            key={workflow.id}
            className="relative rounded-xl border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-semibold text-foreground">
                    {/* The whole card opens the builder through this link's
                        stretched hit area, so it is reachable by keyboard and
                        announced as a link, not a clickable div. */}
                    <Link
                      to={`/dashboard/workflows/${workflow.id}`}
                      className="break-words outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
                    >
                      {workflow.name}
                    </Link>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {workflow.isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-green-600"
                        />
                        Active
                      </span>
                    ) : workflow.isPublished ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Inactive
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                        Draft
                      </span>
                    )}
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                      {CATEGORY_LABELS[workflow.category] ?? CATEGORY_LABELS.general}
                    </span>
                  </div>
                </div>

                {workflow.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {workflow.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                    Updated {formatDate(workflow.updatedAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Play aria-hidden="true" className="h-3.5 w-3.5" />
                    {workflow.executionCount} {workflow.executionCount === 1 ? 'run' : 'runs'}
                  </div>
                  {workflow.executionCount > 0 && (
                    <>
                      <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <CheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
                        {workflow.successCount} succeeded
                      </div>
                      {workflow.failureCount > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                          {workflow.failureCount} failed
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sits above the stretched link so it keeps its own clicks. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative z-10 h-11 w-11 shrink-0"
                    aria-label={`Actions for ${workflow.name}`}
                  >
                    <MoreVertical aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="min-h-[44px]"
                    onSelect={() => navigate(`/dashboard/workflows/${workflow.id}`)}
                  >
                    <Settings aria-hidden="true" className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="min-h-[44px]"
                    disabled={duplicateWorkflow.isPending}
                    onSelect={() => duplicateWorkflow.mutate(workflow.id)}
                  >
                    <Copy aria-hidden="true" className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="min-h-[44px] text-destructive focus:text-destructive"
                    onSelect={() => setPendingDelete(workflow)}
                  >
                    <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Workflows{' '}
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
              Beta
            </span>
          </h1>
          {/* US-224: this said "Automate your real estate operations". Nothing
              starts a workflow when a lead arrives yet, and email steps do not
              send (US-136) — say so rather than let agents believe leads are
              being nurtured. */}
          <p className="mt-1 text-muted-foreground">
            Design follow-up steps. Workflows run only when you start them, and email steps
            don&apos;t send yet.
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-full sm:w-auto">
          <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Drafts are free; switching one on counts against the plan's
          active-workflow allowance (20260923000003). */}
      <PlanLimitNotice limitKey="workflows" className="mb-6" />

      {/* Filters: stacked on a phone (the two fixed-width selects overflowed
          a 375px screen), one row from sm up. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search workflows"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderList()}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.isActive
                ? 'This workflow is active. Deleting it stops it and removes its run history. '
                : 'Its steps and run history are removed. '}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkflowsListPage;
