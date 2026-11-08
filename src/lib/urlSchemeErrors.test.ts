import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { urlSchemeErrorFrom } from './urlSchemeErrors';

const MIGRATION = readFileSync(
  join(__dirname, '../../supabase/migrations/20261108000456_agent_url_scheme_checks.sql'),
  'utf8'
);

describe('urlSchemeErrorFrom', () => {
  it('names the profile field a check_violation refused', () => {
    const err = {
      code: '23514',
      message:
        'new row for relation "profiles" violates check constraint "profiles_instagram_url_scheme"',
    };
    expect(urlSchemeErrorFrom(err)).toEqual({
      field: 'profiles_instagram_url',
      message: 'Your Instagram link must be a full web address starting with https://.',
    });
  });

  it('allows mailto and tel in the message for links', () => {
    const err = {
      message: 'new row for relation "links" violates check constraint "links_url_scheme"',
    };
    expect(urlSchemeErrorFrom(err)?.message).toMatch(/mailto:.*tel:/);
  });

  it('ignores other errors', () => {
    expect(urlSchemeErrorFrom(null)).toBeNull();
    expect(urlSchemeErrorFrom(new Error('network down'))).toBeNull();
    expect(
      urlSchemeErrorFrom({ message: 'violates check constraint "listings_year_built_check"' })
    ).toBeNull();
    expect(
      urlSchemeErrorFrom({ message: 'violates check constraint "other_thing_scheme"' })
    ).toBeNull();
  });

  it('has a label for every constraint the migration adds, and the migration adds every labelled one', () => {
    const constraints = [...MIGRATION.matchAll(/ADD CONSTRAINT ([a-z_]+)_scheme/g)].map(
      (m) => m[1]
    );
    expect(constraints.length).toBe(11);
    for (const field of constraints) {
      const err = { message: `violates check constraint "${field}_scheme"` };
      expect(urlSchemeErrorFrom(err)?.field).toBe(field);
    }
  });
});
