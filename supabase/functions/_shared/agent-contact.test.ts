import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  readAgentContacts,
  AGENT_CONTACTS_BATCH,
  type AgentContactsRpc,
  type AgentSummary,
} from './agent-contact.ts';

type RpcResult = { data: unknown; error: { message: string; code?: string | null } | null };

function fakeRpc(answer: (ids: string[]) => RpcResult) {
  const calls: string[][] = [];
  const client: AgentContactsRpc = {
    rpc(fn, args) {
      expect(fn).toBe('get_agent_contacts');
      calls.push(args.p_user_ids);
      return Promise.resolve(answer(args.p_user_ids));
    },
  };
  return { client, calls };
}

const row = (id: string) => ({
  id,
  email: `${id}@example.com`,
  full_name: `Agent ${id}`,
  notification_preferences: { leads: 'instant' },
});

const noFallback = async (): Promise<AgentSummary | null> => {
  throw new Error('fallback must not be called');
};

describe('readAgentContacts (US-378)', () => {
  it('maps rows to summaries in one call', async () => {
    const { client, calls } = fakeRpc((ids) => ({ data: ids.map(row), error: null }));
    const found = await readAgentContacts(client, ['a', 'b'], noFallback);
    expect(calls).toEqual([['a', 'b']]);
    expect(found.get('a')).toEqual({
      email: 'a@example.com',
      fullName: 'Agent a',
      notificationPreferences: { leads: 'instant' },
    });
    expect(found.size).toBe(2);
  });

  it('batches past AGENT_CONTACTS_BATCH ids and de-duplicates', async () => {
    const ids = Array.from({ length: AGENT_CONTACTS_BATCH + 7 }, (_, i) => `u${i}`);
    const { client, calls } = fakeRpc((part) => ({ data: part.map(row), error: null }));
    const found = await readAgentContacts(client, [...ids, 'u0', 'u1'], noFallback);
    expect(calls.map((c) => c.length)).toEqual([AGENT_CONTACTS_BATCH, 7]);
    expect(found.size).toBe(ids.length);
  });

  it('leaves an id with no profile out of the map', async () => {
    const { client } = fakeRpc(() => ({ data: [row('a')], error: null }));
    const found = await readAgentContacts(client, ['a', 'ghost'], noFallback);
    expect(found.has('ghost')).toBe(false);
  });

  it('keeps a null email and drops preferences that are not an object', async () => {
    const { client } = fakeRpc(() => ({
      data: [{ id: 'a', email: null, full_name: null, notification_preferences: ['x'] }],
      error: null,
    }));
    const found = await readAgentContacts(client, ['a'], noFallback);
    expect(found.get('a')).toEqual({ email: null, fullName: null, notificationPreferences: null });
  });

  it('throws on a failed read instead of reporting no agents', async () => {
    const { client } = fakeRpc(() => ({ data: null, error: { message: 'timeout', code: '57014' } }));
    await expect(readAgentContacts(client, ['a'], noFallback)).rejects.toThrow(
      'reading agent contacts: timeout'
    );
  });

  it('falls back per agent until the migration is applied', async () => {
    const { client } = fakeRpc(() => ({
      data: null,
      error: { message: 'Could not find the function', code: 'PGRST202' },
    }));
    const asked: string[] = [];
    const found = await readAgentContacts(client, ['a', 'b'], async (id) => {
      asked.push(id);
      return id === 'a' ? { email: 'a@x.test', fullName: 'A', notificationPreferences: null } : null;
    });
    expect(asked).toEqual(['a', 'b']);
    expect([...found.keys()]).toEqual(['a']);
  });
});

describe('get_agent_contacts migration', () => {
  const sql = readFileSync(
    resolve(__dirname, '../../migrations/20261107000378_get_agent_contacts.sql'),
    'utf8'
  );

  it('is service role only, with a pinned search_path', () => {
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public, extensions, pg_temp/);
    expect(sql).toMatch(
      /REVOKE EXECUTE ON FUNCTION public\.get_agent_contacts\(uuid\[\]\) FROM PUBLIC, anon, authenticated;/
    );
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_agent_contacts\(uuid\[\]\) TO service_role;/);
  });
});
