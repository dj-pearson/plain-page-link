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
  // The method dispatch's own else, not one nested inside the branch.
  const end = source.indexOf('\n    } else {', start);
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

  it('writes the download a page at a time instead of holding every section (US-584)', () => {
    const branch = getBranch();
    expect(branch).not.toMatch(/collectSections|buildExportDocument|JSON\.stringify\(exportData/);
    expect(branch).toMatch(/exportDocumentChunks\([^)]*failFast: true/);
    expect(branch).toMatch(/startExportDownload\(/);
    expect(branch).toMatch(/exportDownloadStream\(/);
  });

  it('audits a streamed download the client cancelled part-way', () => {
    const branch = getBranch();
    expect(branch).toMatch(/'cancelled' in outcome/);
    expect(branch).toMatch(/p_details: \{ streamed: true, cancelled: true \}/);
  });

  it('still answers 503 when a section fails before anything was sent', () => {
    const branch = getBranch();
    expect(branch).toMatch(/start\.kind === 'failed'/);
    expect(branch).toMatch(/status: 503/);
  });
});
