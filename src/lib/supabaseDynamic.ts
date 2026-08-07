/**
 * The one sanctioned escape hatch for modules that address tables dynamically.
 *
 * `src/integrations/supabase/types.ts` is now generated from the applied schema
 * and covers all 134 tables, which is what we want almost everywhere: a typo in
 * a table or column name is a compile error. But a handful of modules are
 * *inherently* dynamic — they take a table name as a parameter and cannot know
 * it at compile time:
 *
 *   - src/lib/security/ownership.ts   generic IDOR-prevention helpers
 *   - src/lib/security/secureQuery.ts generic owner-scoped query builder
 *   - src/stores/useWorkflowBuilderStore.ts  user-configured workflow steps
 *
 * `supabase.from(someString)` does not type-check against a precise schema, so
 * before US-056 these produced ~43 of the repo's tsc errors.
 *
 * Two ways out were considered (see US-056):
 *
 *  1. Narrow the parameters to `keyof Database['public']['Tables']`. Correct in
 *     principle, but `from()` over a 134-member union makes the compiler expand
 *     every overload against every member — ownership.ts was already emitting
 *     TS2589 "type instantiation is excessively deep" at one such site before
 *     any narrowing. It also does not help useWorkflowBuilderStore, whose table
 *     names come from user-authored workflow config at run time and are
 *     genuinely not known to the type system.
 *
 *  2. One narrow, documented, *shared* hatch. That is this file.
 *
 * The type parameter still buys something: `PublicTable` is the real union, so
 * callers that do know their table statically get checked, and the widening to
 * `string` happens in exactly one place that is easy to grep for. What is
 * deliberately NOT provided is a way to get an `any`-typed row back — callers
 * declare the shape they expect, so the lie is confined to the table name
 * rather than spreading into the result.
 *
 * Do not scatter `as any` at the call sites instead; CLAUDE.md forbids it, and
 * the point of a single hatch is that there is one thing to remove if
 * supabase-js ever types `from(string)` usefully.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
 * The `any`s below are the entire point of this file: they are the schema
 * generics of a deliberately loosened client, confined here so that no call
 * site needs its own cast. See the header. */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Every table in the public schema, per the generated types. */
export type PublicTable = keyof Database['public']['Tables'];

/**
 * The same client with its schema generics widened. Widening at the *client*
 * rather than wrapping the builder matters: `from()` returns a builder whose
 * `insert`/`update` argument types are derived from the schema, so a builder
 * obtained from the strict client resolves those to `never` for a table it
 * cannot identify. Loosening only the table name would leave every write still
 * failing to type-check.
 */
type LooseClient = SupabaseClient<any, 'public', any>;

/**
 * `supabase.from()` for a run-time table name.
 *
 * Prefer plain `supabase.from('leads')` wherever the table is a literal — that
 * path is fully typed and this one is not.
 */
export function fromDynamic(table: PublicTable | (string & {})) {
  return (supabase as unknown as LooseClient).from(table);
}
