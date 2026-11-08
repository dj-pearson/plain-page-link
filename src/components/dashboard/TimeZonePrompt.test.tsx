import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mutate = vi.fn();
let hookState: {
  timeZone: string | null;
  detected: string | null;
  isKnown: boolean;
  isPending?: boolean;
};

vi.mock('@/hooks/useAgentTimeZone', () => ({
  useAgentTimeZone: () => ({
    timeZone: hookState.timeZone,
    detected: hookState.detected,
    isKnown: hookState.isKnown,
    isLoading: !hookState.isKnown,
    update: { mutate, isPending: hookState.isPending ?? false },
  }),
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) => sel({ user: { id: 'u1' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { TimeZonePrompt, timeZonePromptDismissKey } from './TimeZonePrompt';

const renderPrompt = () =>
  render(
    <MemoryRouter>
      <TimeZonePrompt />
    </MemoryRouter>
  );

describe('TimeZonePrompt (US-560)', () => {
  beforeEach(() => {
    mutate.mockClear();
    window.localStorage.clear();
  });

  it('offers the device zone when none is saved and saves it with one tap', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isKnown: true };
    renderPrompt();
    expect(screen.getByText('Your morning email follows UTC time')).toBeInTheDocument();
    expect(screen.getByText(/America \/ Chicago/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /choose another in settings/i })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Use this time zone' }));
    expect(mutate).toHaveBeenCalledWith('America/Chicago', expect.any(Object));
  });

  it('stays hidden once a zone is saved', () => {
    hookState = { timeZone: 'Europe/London', detected: 'America/Chicago', isKnown: true };
    const { container } = renderPrompt();
    expect(container).toBeEmptyDOMElement();
  });

  it('stays hidden until the stored value has been read', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isKnown: false };
    const { container } = renderPrompt();
    expect(container).toBeEmptyDOMElement();
  });

  it('does not offer UTC, or a zone the device will not report', () => {
    hookState = { timeZone: null, detected: 'UTC', isKnown: true };
    const first = renderPrompt();
    expect(first.container).toBeEmptyDOMElement();
    first.unmount();

    hookState = { timeZone: null, detected: null, isKnown: true };
    const second = renderPrompt();
    expect(second.container).toBeEmptyDOMElement();
  });

  it('"Not now" hides it and remembers that for this agent', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isKnown: true };
    const first = renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(first.container).toBeEmptyDOMElement();
    expect(mutate).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(timeZonePromptDismissKey('u1'))).toBe('1');
    first.unmount();

    const second = renderPrompt();
    expect(second.container).toBeEmptyDOMElement();
  });

  it('still renders when storage throws', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isKnown: true };
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      const { container } = renderPrompt();
      expect(screen.getByRole('button', { name: 'Use this time zone' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
      expect(container).toBeEmptyDOMElement();
    } finally {
      spy.mockRestore();
      setSpy.mockRestore();
    }
  });
});
