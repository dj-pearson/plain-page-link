/**
 * US-414 (US-403): the subject can queue an emailed export and see each
 * request's status. Before this no screen called gdpr-export's POST.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { ExportRequestRow } from '@/lib/dataExportRequests';

const { gdprState, queueExportMock } = vi.hoisted(() => ({
  gdprState: { current: {} as Record<string, unknown> },
  queueExportMock: vi.fn(),
}));

vi.mock('@/hooks/useGDPR', () => ({ useGDPR: () => gdprState.current }));

import { GDPRSettings } from './GDPRSettings';

const row = (over: Partial<ExportRequestRow>): ExportRequestRow => ({
  id: 'r1',
  status: 'pending',
  created_at: '2026-11-01T10:00:00Z',
  processed_at: null,
  completed_at: null,
  failed_reason: null,
  file_expires_at: null,
  ...over,
});

function setState(over: Record<string, unknown> = {}) {
  gdprState.current = {
    exportData: vi.fn(),
    isExporting: false,
    queueExport: queueExportMock,
    isQueueingExport: false,
    offerQueuedExport: false,
    exportRequests: [],
    exportRequestsError: undefined,
    hasExportInFlight: false,
    isDeletionStatusLoading: false,
    isAccountDeletionScheduled: false,
    daysUntilDeletion: undefined,
    deletionScheduledFor: undefined,
    requestDeletion: vi.fn(),
    cancelDeletion: vi.fn(),
    isRequestingDeletion: false,
    isCancellingDeletion: false,
    formatDaysRemaining: (d: number) => `In ${d} days`,
    ...over,
  };
}

beforeEach(() => {
  queueExportMock.mockReset();
  setState();
});

describe('GDPRSettings export', () => {
  it('queues an emailed export in one tap', async () => {
    renderWithProviders(<GDPRSettings />);
    await userEvent.click(screen.getByRole('button', { name: /Email me a download link/ }));
    expect(queueExportMock).toHaveBeenCalledTimes(1);
  });

  it('does not offer a second queued export while one is on its way', () => {
    setState({ exportRequests: [row({ status: 'processing' })], hasExportInFlight: true });
    renderWithProviders(<GDPRSettings />);
    expect(screen.getByRole('button', { name: /Email me a download link/ })).toBeDisabled();
    expect(screen.getByText('Being prepared')).toBeInTheDocument();
  });

  it("lists each request's status, and a failed one's reason in plain words", () => {
    setState({
      exportRequests: [
        row({ id: 'a', status: 'failed', failed_reason: 'StorageApiError: upload failed' }),
        row({ id: 'b', status: 'completed', file_expires_at: '2999-01-01T00:00:00Z' }),
      ],
    });
    renderWithProviders(<GDPRSettings />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText(/We could not build this export/)).toBeInTheDocument();
    expect(screen.queryByText(/StorageApiError/)).not.toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('offers the queued path after the immediate download did not finish', async () => {
    setState({ offerQueuedExport: true });
    renderWithProviders(<GDPRSettings />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/email you a link instead/);
    await userEvent.click(screen.getByRole('button', { name: /Email it to me/ }));
    expect(queueExportMock).toHaveBeenCalledTimes(1);
  });

  it('shows no request list when there are none', () => {
    renderWithProviders(<GDPRSettings />);
    expect(screen.queryByText('Your export requests')).not.toBeInTheDocument();
  });
});
