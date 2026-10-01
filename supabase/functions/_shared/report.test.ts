import { describe, it, expect } from 'vitest';
import { buildEnvelope, reportError } from './report.ts';

describe('edge-function error envelope (US-222)', () => {
  const DSN = 'https://abc@o1.ingest.sentry.io/42';

  it('is three JSON lines: envelope header, item header, event', () => {
    const lines = buildEnvelope(DSN, new Error('boom'), { functionName: 'submit-lead', status: 500, path: '/submit-lead' },
      new Date('2026-09-30T00:00:00Z'), 'e1').split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0])).toMatchObject({ event_id: 'e1', dsn: DSN });
    expect(JSON.parse(lines[1])).toEqual({ type: 'event' });
    const event = JSON.parse(lines[2]);
    expect(event.exception.values[0]).toMatchObject({ type: 'Error', value: 'boom' });
    expect(event.tags).toMatchObject({ function: 'submit-lead', status: '500' });
    expect(event.request).toEqual({ url: '/submit-lead' });
  });

  it('accepts a non-Error', () => {
    const event = JSON.parse(buildEnvelope(DSN, 'plain string', {}).split('\n')[2]);
    expect(event.exception.values[0].value).toBe('plain string');
  });

  it('is a no-op without a DSN (and never throws)', async () => {
    await expect(reportError(new Error('x'))).resolves.toBeUndefined();
  });
});
