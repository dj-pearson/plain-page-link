/**
 * US-424: the immediate download must not close a queued export.
 *
 * The GET used to set the subject's newest pending export request to
 * 'completed' with no file and no email, so the settings screen showed
 * 'Completed' with no link and the queue never built the export the subject
 * had asked for. index.ts runs under Deno and is not importable here, so this
 * reads its source.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

function getBranch(): string {
  const start = source.indexOf("} else if (req.method === 'GET') {");
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('} else {', start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('gdpr-export GET', () => {
  it('never writes to gdpr_data_requests', () => {
    expect(getBranch()).not.toMatch(/gdpr_data_requests/);
  });

  it('still records the download in the audit log', () => {
    expect(getBranch()).toMatch(/p_action: 'gdpr_data_export'/);
  });
});
