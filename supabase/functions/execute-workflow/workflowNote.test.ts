import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { workflowNoteRow, WORKFLOW_NOTE_MAX } from './workflowNote';
import { AGENT_AUTHORED_ACTIVITY_TYPES } from '../../../src/lib/leadActivityTypes';

const base = { leadId: 'lead-1', ownerId: 'agent-1', workflowId: 'wf-1', nodeId: 'node-1' };

describe('workflowNoteRow (US-452)', () => {
  it('is a timeline note owned by the lead owner, marked as from the workflow', () => {
    expect(workflowNoteRow({ ...base, content: '  Called back, wants a Saturday showing  ' })).toEqual({
      lead_id: 'lead-1',
      user_id: 'agent-1',
      activity_type: 'note',
      title: 'Workflow note',
      content: 'Called back, wants a Saturday showing',
      is_internal: true,
      metadata: { source: 'workflow', workflow_id: 'wf-1', node_id: 'node-1' },
    });
  });

  it('writes an agent-authored type, so the owner may delete it like any note', () => {
    const row = workflowNoteRow({ ...base, content: 'x' });
    expect((AGENT_AUTHORED_ACTIVITY_TYPES as readonly string[]).includes(row!.activity_type)).toBe(true);
  });

  it('writes nothing for an empty, blank or non-text note', () => {
    expect(workflowNoteRow({ ...base, content: '' })).toBeNull();
    expect(workflowNoteRow({ ...base, content: '   \n ' })).toBeNull();
    expect(workflowNoteRow({ ...base, content: null })).toBeNull();
    expect(workflowNoteRow({ ...base, content: 42 })).toBeNull();
  });

  it('caps a runaway note', () => {
    const row = workflowNoteRow({ ...base, content: 'a'.repeat(WORKFLOW_NOTE_MAX + 50) });
    expect(row!.content).toHaveLength(WORKFLOW_NOTE_MAX);
  });

  it('records a missing workflow id as null', () => {
    expect(workflowNoteRow({ ...base, workflowId: undefined, content: 'x' })!.metadata.workflow_id).toBeNull();
  });
});

describe('leads.notes is gone (US-452)', () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  it('update_lead puts its note on the timeline, not in leads.notes', () => {
    const src = strip(readFileSync(join(__dirname, 'index.ts'), 'utf8'));
    expect(src).not.toMatch(/updates\.notes/);
    expect(src).toMatch(/workflowNoteRow\(/);
  });

  it('a migration copies the notes onto the timeline before dropping the column', () => {
    const dir = join(__dirname, '../../migrations');
    const file = readdirSync(dir).find((f) => /_lead_notes_into_timeline\.sql$/.test(f));
    expect(file).toBeTruthy();
    const sql = readFileSync(join(dir, file!), 'utf8');
    const copy = sql.indexOf('INSERT INTO public.lead_activities');
    const drop = sql.indexOf('ALTER TABLE public.leads DROP COLUMN IF EXISTS notes');
    expect(copy).toBeGreaterThan(-1);
    expect(drop).toBeGreaterThan(copy);
  });
});
