import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AuditLogEntry } from '@/hooks/useAuditLog';

const base = {
  user_id: 'u1',
  actor_id: null,
  resource_type: null,
  resource_id: null,
  ip_address: null,
  user_agent: null,
  created_at: '2026-11-08T10:00:00Z',
  status: 'success',
  risk_level: 'low',
} as const;

const LOGS: AuditLogEntry[] = [
  { ...base, id: 'c', action: 'login', details: { client_reported: true } },
  { ...base, id: 's', action: 'mfa_enable', details: null },
];

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: () => ({
    logs: LOGS,
    totalLogs: LOGS.length,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    getActionLabel: (a: string) => (a === 'login' ? 'Signed in' : 'MFA enabled'),
    groupLogsByDate: (logs: AuditLogEntry[]) => ({ Today: logs }),
  }),
}));

import { AuditLogViewer } from './AuditLogViewer';

describe('AuditLogViewer source marker (US-675)', () => {
  it('marks only the browser-reported event', () => {
    render(<AuditLogViewer />);
    const markers = screen.getAllByText('Reported by browser');
    expect(markers).toHaveLength(1);
    expect(markers[0].parentElement?.textContent).toContain('Signed in');
    expect(screen.getByText('MFA enabled').textContent).toBe('MFA enabled');
  });

  it('explains what a browser report means in the details', () => {
    render(<AuditLogViewer />);
    fireEvent.click(screen.getByText('Signed in'));
    expect(screen.getByText(/could not verify the event happened/)).toBeInTheDocument();
  });
});
