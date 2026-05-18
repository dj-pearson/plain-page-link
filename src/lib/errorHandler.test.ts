import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  clearUser: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
}));

import { errorHandler, withErrorHandling, handleApiError } from './errorHandler';

describe('errorHandler - captureException', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the error and stores a sanitized entry in localStorage', () => {
    errorHandler.captureException(new Error('boom'), {
      action: 'test_action',
      component: 'TestComponent',
      user: { id: '11111111-2222-3333-4444-555555555555' },
    });

    expect(console.error).toHaveBeenCalled();
    const stored = JSON.parse(localStorage.getItem('error_logs') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].message).toBe('boom');
    expect(stored[0].context.action).toBe('test_action');
    // user id is truncated for privacy
    expect(stored[0].context.userId).toBe('11111111...');
  });

  it('keeps only the last 10 stored errors', () => {
    for (let i = 0; i < 15; i++) {
      errorHandler.captureException(new Error(`err-${i}`));
    }
    const stored = JSON.parse(localStorage.getItem('error_logs') || '[]');
    expect(stored).toHaveLength(10);
    expect(stored[stored.length - 1].message).toBe('err-14');
  });
});

describe('errorHandler - captureMessage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('routes to the correct log level', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    errorHandler.captureMessage('an error', 'error');
    errorHandler.captureMessage('a warning', 'warning');
    errorHandler.captureMessage('some info', 'info');

    expect(errSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
  });
});

describe('withErrorHandling', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the operation result on success', async () => {
    const result = await withErrorHandling(async () => 42);
    expect(result).toBe(42);
  });

  it('returns null and captures the error on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await withErrorHandling(async () => {
      throw new Error('failed op');
    });
    expect(result).toBeNull();
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('extracts message from an Error', () => {
    expect(handleApiError(new Error('network down'))).toBe('network down');
  });

  it('extracts message from an object with message/error', () => {
    expect(handleApiError({ message: 'bad request' })).toBe('bad request');
    expect(handleApiError({ error: 'unauthorized' })).toBe('unauthorized');
  });

  it('handles string errors', () => {
    expect(handleApiError('plain string error')).toBe('plain string error');
  });

  it('falls back to a default message for unknown shapes', () => {
    expect(handleApiError(undefined)).toBe('An unexpected error occurred');
  });
});
