/**
 * US-266: the Workflows list says when it failed to load (with a retry)
 * instead of claiming there are none; Duplicate and Delete do something, and
 * Delete asks first; each card is a real link with a named actions button.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import type { Workflow } from '@/types/workflow';

const { state, deleteMutate, duplicateMutate, refetch } = vi.hoisted(() => ({
  state: {
    workflows: [] as unknown[],
    isLoading: false,
    error: null as Error | null,
  },
  deleteMutate: vi.fn(),
  duplicateMutate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@/hooks/useWorkflows', () => ({
  useWorkflows: () => ({
    workflows: state.workflows,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    isRefetching: false,
    deleteWorkflow: { mutate: deleteMutate, isPending: false },
    duplicateWorkflow: { mutate: duplicateMutate, isPending: false },
  }),
}));

vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));

import WorkflowsListPage from './WorkflowsListPage';

function workflow(overrides: Partial<Workflow>): Workflow {
  return {
    id: 'wf-1',
    userId: 'user-1',
    name: 'New buyer follow-up',
    description: '',
    category: 'lead_management',
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    isPublished: false,
    isActive: false,
    version: 1,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    tags: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('WorkflowsListPage', () => {
  beforeEach(() => {
    state.workflows = [];
    state.isLoading = false;
    state.error = null;
    deleteMutate.mockClear();
    duplicateMutate.mockClear();
    refetch.mockClear();
  });

  it('shows a retryable error, not the empty state, when the list fails to load', async () => {
    state.error = new Error('network down');
    renderWithProviders(<WorkflowsListPage />);

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Your workflows did not load')).toBeInTheDocument();
    expect(screen.queryByText('No workflows yet')).not.toBeInTheDocument();

    await userEvent.click(within(alert).getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the empty state when there really are no workflows', () => {
    renderWithProviders(<WorkflowsListPage />);
    expect(screen.getByText('No workflows yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders each workflow as a link to its builder with a named actions button', () => {
    state.workflows = [workflow({ id: 'wf-9', name: 'Seller check-in' })];
    renderWithProviders(<WorkflowsListPage />);

    expect(screen.getByRole('link', { name: 'Seller check-in' })).toHaveAttribute(
      'href',
      '/dashboard/workflows/wf-9'
    );
    expect(screen.getByRole('button', { name: 'Actions for Seller check-in' })).toBeInTheDocument();
  });

  it('duplicates from the actions menu', async () => {
    state.workflows = [workflow({ id: 'wf-2', name: 'Open house thank-you' })];
    renderWithProviders(<WorkflowsListPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Open house thank-you' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /duplicate/i }));
    expect(duplicateMutate).toHaveBeenCalledWith('wf-2');
  });

  it('asks before deleting, and deletes only on confirm', async () => {
    state.workflows = [workflow({ id: 'wf-3', name: 'Past client touch', isActive: true })];
    renderWithProviders(<WorkflowsListPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Past client touch' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/this workflow is active/i)).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete workflow' }));
    expect(deleteMutate).toHaveBeenCalledWith('wf-3');
  });

  it('cancelling the confirmation deletes nothing', async () => {
    state.workflows = [workflow({ id: 'wf-4', name: 'Draft idea' })];
    renderWithProviders(<WorkflowsListPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Draft idea' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
