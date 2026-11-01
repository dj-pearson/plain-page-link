/**
 * US-259: lead and visitor email addresses were written to function logs in
 * plaintext — "[email] sent to jane@…" on every send, "Error sending email to
 * <capture.email>" in the drip senders, the agent's address on a failed lead
 * notification, the invitee's on a failed team invite — along with an OAuth
 * token-exchange response and a raw request body.
 *
 * maskEmail is tested directly. The second half reads every edge function's
 * source (these are Deno modules importing from esm.sh, which vitest cannot
 * load — see client-ip.test.ts) and fails on any console call whose arguments
 * still reference an email address, a token response or a raw request body
 * outside maskEmail()/maskEmails().
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { maskEmail, maskEmails } from './log-redaction.ts';

describe('maskEmail', () => {
  it('keeps the first character of each part and the TLD only', () => {
    expect(maskEmail('jane.doe@gmail.com')).toBe('j***@g***.com');
    expect(maskEmail('  Bob@Example.co.uk ')).toBe('B***@E***.uk');
    expect(maskEmail('a@localhost')).toBe('a***@l***');
  });

  it('never returns the address it was given', () => {
    for (const e of ['jane.doe@gmail.com', 'x@y.z', 'very.long.name+tag@sub.domain.example']) {
      const masked = maskEmail(e);
      expect(masked).not.toContain(e);
      const rest = e.split('@')[0].slice(1);
      if (rest) expect(masked).not.toContain(rest);
    }
  });

  it('fully masks anything that is not a single address', () => {
    expect(maskEmail('')).toBe('***');
    expect(maskEmail('not-an-email')).toBe('***');
    expect(maskEmail('@example.com')).toBe('***');
    expect(maskEmail('jane@')).toBe('***');
    expect(maskEmail('a@b.com, c@d.com')).toBe('***');
    expect(maskEmail('Jane <jane@example.com>')).toBe('***');
    expect(maskEmail(undefined)).toBe('[no email]');
    expect(maskEmail(null)).toBe('[no email]');
    expect(maskEmail(42)).toBe('[no email]');
  });

  it('maskEmails masks each entry of a list', () => {
    expect(maskEmails(['jane@gmail.com', 'bob@outlook.com'])).toBe('j***@g***.com, b***@o***.com');
    expect(maskEmails('jane@gmail.com')).toBe('j***@g***.com');
  });
});

// ---------------------------------------------------------------------------
// Source scan
// ---------------------------------------------------------------------------

const root = join(__dirname, '..');

/** Every non-test .ts file under supabase/functions. */
function functionSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts') && !p.endsWith('.test.ts') && !p.endsWith('.d.ts')) out.push(p);
    }
  };
  walk(root);
  return out;
}

/** Index of the parenthesis that closes the one at `open`, skipping strings. */
function closingParen(src: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  const templateDepth: number[] = [];
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') {
        i++;
      } else if (quote === '`' && c === '$' && src[i + 1] === '{') {
        templateDepth.push(depth);
        quote = null;
        i++;
        depth++;
      } else if (c === quote) {
        quote = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      depth--;
      if (c === '}' && templateDepth.length && templateDepth[templateDepth.length - 1] === depth) {
        templateDepth.pop();
        quote = '`';
        continue;
      }
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * The code in a console call's arguments with every string's literal text
 * removed (template `${}` expressions are kept), so prose such as
 * 'Error sending email:' is not mistaken for a reference to an address.
 */
function codeOnly(args: string): string {
  let out = '';
  let quote: string | null = null;
  const templateDepth: number[] = [];
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (quote) {
      if (c === '\\') {
        i++;
      } else if (quote === '`' && c === '$' && args[i + 1] === '{') {
        templateDepth.push(depth);
        quote = null;
        out += ' ';
        i++;
        depth++;
      } else if (c === quote) {
        quote = null;
        out += "''";
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      continue;
    }
    if (c === '{' || c === '(' || c === '[') depth++;
    if (c === '}' || c === ')' || c === ']') {
      depth--;
      if (c === '}' && templateDepth.length && templateDepth[templateDepth.length - 1] === depth) {
        templateDepth.pop();
        quote = '`';
        out += ' ';
        continue;
      }
    }
    out += c;
  }
  return out;
}

/** Drops maskEmail(...)/maskEmails(...) calls — their output is safe to log. */
function withoutMasked(code: string): string {
  let out = code;
  for (;;) {
    const m = /\bmaskEmails?\s*\(/.exec(out);
    if (!m) return out;
    const open = m.index + m[0].length - 1;
    const close = closingParen(out, open);
    if (close === -1) return out;
    out = out.slice(0, m.index) + "''" + out.slice(close + 1);
  }
}

const FORBIDDEN: Array<[string, RegExp]> = [
  // Any identifier or property naming an email address: capture.email,
  // agentEmail, inviteEmail, lead.email, user.email ...
  ['an email address', /[A-Za-z0-9_$]*email(?![A-Za-z0-9_$]*(?:Sent|_sent|Count|_count|Enabled|_enabled|ed)\b)[A-Za-z0-9_$]*/i],
  // A message's recipient: options.to, resolvedTo, recipients.
  ['an email recipient', /(?:\.to\b|\b[a-z][A-Za-z0-9_$]*To\b|\brecipients?\b)/],
  // An OAuth token-exchange response, or a token itself.
  ['a token response', /\b(?:tokenData|tokenResponse|tokenJson|tokens|access_token|refresh_token|id_token)\b/],
  // A raw request body (its length is fine).
  ['a raw request body', /\b(?:bodyText|rawBody|requestBody|reqBody)\b(?!\s*\.\s*length)|\breq\.(?:text|json)\s*\(/],
];

interface Offence {
  file: string;
  line: number;
  what: string;
  text: string;
}

function scan(file: string, src: string): Offence[] {
  const found: Offence[] = [];
  const re = /\bconsole\s*\.\s*(?:log|error|warn|info|debug)\s*\(/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const open = m.index + m[0].length - 1;
    const close = closingParen(src, open);
    if (close === -1) continue;
    const code = withoutMasked(codeOnly(src.slice(open + 1, close)));
    for (const [what, pattern] of FORBIDDEN) {
      if (pattern.test(code)) {
        found.push({
          file: file.slice(root.length + 1),
          line: src.slice(0, m.index).split('\n').length,
          what,
          text: src.slice(m.index, Math.min(close + 1, m.index + 140)).replace(/\s+/g, ' '),
        });
      }
    }
  }
  return found;
}

describe('edge-function logs', () => {
  it('the scanner catches the shapes it is meant to', () => {
    const bad = [
      'console.log(`[email] sent to ${options.to}`)',
      'console.error(`Failed to send email ${n} to ${capture.email}:`, error)',
      "console.error('Token exchange error:', tokenData)",
      "console.log('[x] Request body:', bodyText)",
      'console.log(`[execute-workflow] skipped: ${resolvedTo}`)',
      "console.log('Email notification:', {\n  to: recipients || [alert.user_id],\n})",
      'console.error(`[notify-lead] email to ${agentEmail} failed`)',
    ];
    for (const b of bad) expect(scan(join(root, 'x.ts'), b), b).not.toEqual([]);

    const ok = [
      'console.log(`[email] sent to ${maskEmail(options.to)} (${id})`)',
      "console.error('Error sending listing generator email:', error)",
      'console.log(`[x] Request body length: ${bodyText.length} chars`)',
      'console.error(`[teams] invite email to ${maskEmail(inviteEmail)} failed: ${sent.error}`)',
      'console.error(`No account email for agent ${lead.user_id}`)',
    ];
    for (const o of ok) expect(scan(join(root, 'x.ts'), o), o).toEqual([]);
  });

  it('no console call prints an email address, a token response or a raw request body', () => {
    const offences = functionSources().flatMap((f) => scan(f, readFileSync(f, 'utf8')));
    expect(offences.map((o) => `${o.file}:${o.line} logs ${o.what}: ${o.text}`)).toEqual([]);
  });
});
