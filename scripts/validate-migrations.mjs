#!/usr/bin/env node
/**
 * Basic SQL migration validator (dependency-free, no database required).
 *
 * This is intentionally a *structural* lint, not a full Postgres parse — a real
 * parse requires a live Supabase Postgres (auth/storage schemas, extensions like
 * pg_net, helper functions such as has_role()), which CI does not stand up here.
 * Instead it catches the breakage that structural mistakes actually produce:
 *
 *   - empty / unreadable migration files
 *   - unbalanced parentheses
 *   - unbalanced dollar-quoted blocks ($$ ... $$ and $tag$ ... $tag$)
 *   - unterminated single-quoted string literals
 *   - a file containing no statement terminator (`;`) at all
 *
 * String/line/block comments and dollar-quoted bodies are skipped so SQL inside
 * them (e.g. a `;` in a comment, or `(` in a function body literal) doesn't
 * cause false positives.
 *
 * Exit code 0 = all good, 1 = one or more files failed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

/**
 * Walk the SQL char-by-char, tracking lexical state, and return structural facts.
 */
function analyze(sql) {
  let paren = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingle = false;
  let dollarTag = null; // e.g. "$$" or "$func$"
  let sawSemicolon = false;
  let minParen = 0;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const next = sql[i + 1];
    const rest = sql.slice(i);

    // Inside a dollar-quoted block: only look for the matching closing tag.
    if (dollarTag) {
      if (rest.startsWith(dollarTag)) {
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inSingle) {
      if (c === "'" && next === "'") {
        i++; // escaped quote ''
      } else if (c === "'") {
        inSingle = false;
      }
      continue;
    }

    // Not in any special state — detect entries.
    if (c === '-' && next === '-') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === '$') {
      const m = rest.match(/^\$[A-Za-z_]*\$/);
      if (m) {
        dollarTag = m[0];
        i += m[0].length - 1;
        continue;
      }
    }
    if (c === '(') paren++;
    else if (c === ')') {
      paren--;
      if (paren < minParen) minParen = paren;
    } else if (c === ';') sawSemicolon = true;
  }

  return { paren, minParen, inSingle, dollarTag, inBlockComment, sawSemicolon };
}

function validate() {
  let files;
  try {
    files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (err) {
    console.error(`[migrations] Cannot read ${MIGRATIONS_DIR}: ${err.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('[migrations] No .sql migration files found.');
    process.exit(1);
  }

  const failures = [];
  for (const file of files) {
    const full = join(MIGRATIONS_DIR, file);
    let sql;
    try {
      sql = readFileSync(full, 'utf8');
    } catch (err) {
      failures.push(`${file}: unreadable (${err.message})`);
      continue;
    }
    if (sql.trim().length === 0) {
      failures.push(`${file}: empty file`);
      continue;
    }

    const r = analyze(sql);
    if (r.paren !== 0) failures.push(`${file}: unbalanced parentheses (net ${r.paren})`);
    if (r.minParen < 0) failures.push(`${file}: closing ')' before matching '(' `);
    if (r.dollarTag) failures.push(`${file}: unterminated dollar-quoted block (${r.dollarTag})`);
    if (r.inSingle) failures.push(`${file}: unterminated single-quoted string literal`);
    if (r.inBlockComment) failures.push(`${file}: unterminated /* block comment */`);
    if (!r.sawSemicolon) failures.push(`${file}: no statement terminator (;) found`);
  }

  if (failures.length > 0) {
    console.error(`[migrations] ${failures.length} issue(s) found:`);
    for (const f of failures) console.error(`  ✖ ${f}`);
    process.exit(1);
  }

  console.log(`[migrations] OK — ${files.length} migration files structurally valid.`);
}

validate();
