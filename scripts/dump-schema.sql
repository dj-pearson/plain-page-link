-- Dumps the public schema as a single JSON document for gen-supabase-types.mjs.
-- Kept as SQL (rather than inline in the generator) so it can be run by hand
-- against any database to inspect what the generator will see.
-- Run with: psql -tAq -f scripts/dump-schema.sql
SELECT json_build_object(
  'tables', (
    SELECT coalesce(json_agg(t ORDER BY t->>'name'), '[]'::json)
    FROM (
      SELECT json_build_object(
        'name', c.relname,
        'kind', CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'table'
                               WHEN 'v' THEN 'view'  WHEN 'm' THEN 'view' END,
        'columns', (
          SELECT coalesce(json_agg(json_build_object(
            'name', a.attname,
            'type', format_type(a.atttypid, a.atttypmod),
            'udt', bt.typname,
            'category', bt.typcategory,
            'isArray', (bt.typcategory = 'A'),
            'elemUdt', et.typname,
            'elemCategory', et.typcategory,
            'enumName', CASE WHEN bt.typtype = 'e' THEN bt.typname
                             WHEN et.typtype = 'e' THEN et.typname END,
            'notNull', a.attnotnull,
            'hasDefault', (a.atthasdef OR a.attidentity <> ''),
            'isGenerated', (a.attgenerated <> '')
          ) ORDER BY a.attname), '[]'::json)
          FROM pg_attribute a
          JOIN pg_type bt ON bt.oid = a.atttypid
          LEFT JOIN pg_type et ON et.oid = bt.typelem
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        ),
        'foreignKeys', (
          SELECT coalesce(json_agg(json_build_object(
            'name', con.conname,
            'columns', (
              SELECT json_agg(a2.attname ORDER BY x.ord)
              FROM unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord)
              JOIN pg_attribute a2 ON a2.attrelid = con.conrelid AND a2.attnum = x.attnum
            ),
            'referencedRelation', rc.relname,
            'referencedColumns', (
              SELECT json_agg(a3.attname ORDER BY y.ord)
              FROM unnest(con.confkey) WITH ORDINALITY AS y(attnum, ord)
              JOIN pg_attribute a3 ON a3.attrelid = con.confrelid AND a3.attnum = y.attnum
            ),
            -- One-to-one when the referencing columns are themselves unique.
            'isOneToOne', EXISTS (
              SELECT 1 FROM pg_constraint u
              WHERE u.conrelid = con.conrelid
                AND u.contype IN ('p', 'u')
                AND u.conkey @> con.conkey AND con.conkey @> u.conkey
            )
          ) ORDER BY con.conname), '[]'::json)
          FROM pg_constraint con
          JOIN pg_class rc ON rc.oid = con.confrelid
          WHERE con.conrelid = c.oid AND con.contype = 'f'
        )
      ) AS t
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm')
    ) s
  ),
  'enums', (
    SELECT coalesce(json_agg(e ORDER BY e->>'name'), '[]'::json)
    FROM (
      SELECT json_build_object(
        'name', t.typname,
        'values', (
          SELECT json_agg(en.enumlabel ORDER BY en.enumsortorder)
          FROM pg_enum en WHERE en.enumtypid = t.oid
        )
      ) AS e
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    ) s
  ),
  'functions', (
    SELECT coalesce(json_agg(f ORDER BY f->>'name'), '[]'::json)
    FROM (
      SELECT json_build_object(
        'name', p.proname,
        'args', (
          SELECT coalesce(json_agg(json_build_object(
            'name', COALESCE(argname, ''),
            'type', format_type(argtype, NULL),
            'udt', at.typname,
            'category', at.typcategory,
            'isArray', (at.typcategory = 'A'),
            'elemUdt', aet.typname,
            'elemCategory', aet.typcategory,
            'enumName', CASE WHEN at.typtype = 'e' THEN at.typname
                             WHEN aet.typtype = 'e' THEN aet.typname END,
            'hasDefault', (ord > (p.pronargs - COALESCE(p.pronargdefaults, 0)))
          ) ORDER BY COALESCE(argname, '')), '[]'::json)
          FROM unnest(
                 p.proargtypes,
                 COALESCE(p.proargnames[1:array_length(p.proargtypes, 1)],
                          array_fill(NULL::text, ARRAY[array_length(p.proargtypes, 1)]))
               ) WITH ORDINALITY AS u(argtype, argname, ord)
          JOIN pg_type at ON at.oid = u.argtype
          LEFT JOIN pg_type aet ON aet.oid = at.typelem
        ),
        'returns', json_build_object(
          'type', format_type(p.prorettype, NULL),
          'udt', rt.typname,
          'category', rt.typcategory,
          'isArray', (rt.typcategory = 'A'),
          'elemUdt', ret.typname,
          'elemCategory', ret.typcategory,
          'enumName', CASE WHEN rt.typtype = 'e' THEN rt.typname
                           WHEN ret.typtype = 'e' THEN ret.typname END,
          'returnsSet', p.proretset,
          'isComposite', (rt.typtype = 'c'),
          'compositeColumns', (
            SELECT coalesce(json_agg(json_build_object(
              'name', ca.attname,
              'type', format_type(ca.atttypid, ca.atttypmod),
              'udt', ct.typname,
              'category', ct.typcategory,
              'isArray', (ct.typcategory = 'A'),
              'elemUdt', cet.typname,
              'elemCategory', cet.typcategory,
              'enumName', CASE WHEN ct.typtype = 'e' THEN ct.typname
                               WHEN cet.typtype = 'e' THEN cet.typname END
            ) ORDER BY ca.attname), '[]'::json)
            FROM pg_attribute ca
            JOIN pg_type ct ON ct.oid = ca.atttypid
            LEFT JOIN pg_type cet ON cet.oid = ct.typelem
            WHERE ca.attrelid = rt.typrelid AND ca.attnum > 0 AND NOT ca.attisdropped
          )
        )
      ) AS f
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_type rt ON rt.oid = p.prorettype
      LEFT JOIN pg_type ret ON ret.oid = rt.typelem
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        -- Trigger functions are not callable over RPC.
        AND rt.typname <> 'trigger'
    ) s
  )
);
