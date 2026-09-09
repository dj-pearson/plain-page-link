/**
 * US-165: the repository is public, and on 2026-09-04 ten files landed in its
 * root carrying live production credentials.
 *
 *   - `SUPABASE_KEYS_GUIDE.md` published this deployment's `anon` and
 *     `service_role` JWTs under the heading "These are valid and working!".
 *     The `service_role` key bypasses every RLS policy in the database and its
 *     `exp` is the year 2125.
 *   - Four PowerShell scripts hardcoded the Postgres superuser password, and
 *     one of them also hardcoded the root SSH password for the production host.
 *
 * `src/repo-hygiene.test.ts` noticed — it had said since US-121 that the root
 * holds six documents and no loose scripts, and it went red the day these
 * arrived. It stayed red for five days, because a guard that fails is only
 * worth what someone's attention to it is worth, and because "the root is
 * untidy" reads like a lint nit rather than the incident it was.
 *
 * So this is the guard that names the actual stake. It looks for credential
 * VALUES anywhere in the tracked tree, not for files in the wrong folder, and
 * it fails loudly enough that nobody merges past it twice.
 *
 * The rule it enforces is the one from CLAUDE.md: secrets are references, never
 * values. Name where a value is stored; never write the value down. Adding a
 * real credential to this repository is not a thing that needs doing, so there
 * is no escape hatch here — only an allowlist of documented non-secrets.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();

/** Only text files worth scanning. Anything else is skipped wholesale. */
const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.json',
  '.md',
  '.sql',
  '.sh',
  '.ps1',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '.example',
  '.txt',
  '.html',
  '.css',
]);

/**
 * Paths exempt from scanning, each with the reason it is not a secret.
 * This list is for FALSE POSITIVES ONLY. A real credential is never allowlisted
 * — it is rotated and removed.
 */
const ALLOWED_PATHS = new Map<string, string>([
  ['src/secret-scan.test.ts', 'this file — it carries the patterns themselves'],
  ['package-lock.json', 'integrity hashes are base64 and long, but are not secrets'],
  [
    'src/lib/logger.test.ts',
    'fixture passwords that exist to prove the logger redacts them; they authenticate nothing',
  ],
  [
    'tests/e2e/auth.spec.ts',
    'the password of the E2E fixture account, which exists only on a throwaway test database',
  ],
]);

/**
 * Substrings that mark a matched value as a deliberate placeholder rather than
 * a credential. Matching is case-insensitive.
 */
const PLACEHOLDER_MARKERS = [
  'your-',
  'your_',
  'yourpassword',
  'placeholder',
  'example',
  'changeme',
  'change-me',
  'redacted',
  'xxxx',
  '<',
  '${',
  '$env:',
  '$pgpassword',
  '$db_password',
  '$ssh_password',
  'process.env',
  'deno.env',
  '...',
  '***',
  'password-here',
  'secret-here',
  'signature_here',
  'test-',
  'dummy',
  'fake',
  'sample',
  'anon-key',
  'insert-',
  'add-your',
  'not-a-real',
];

interface Rule {
  name: string;
  /** Must be a global regex; the matched text is checked against the placeholders. */
  pattern: RegExp;
  /** Why this particular shape is dangerous, printed on failure. */
  why: string;
  /** Which capture group holds the value to judge. Defaults to 1, then 0. */
  valueGroup?: number;
  /** Rule-specific exemption, given the whole match. */
  exempt?: (match: RegExpMatchArray) => boolean;
}

const RULES: Rule[] = [
  {
    name: 'complete JWT',
    // Three base64url segments with a real signature. A truncated illustration
    // ("eyJhbGci...") has no third segment and does not match, which is what
    // lets documentation keep showing the shape of a token.
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
    why: 'a signed JWT. A Supabase service_role token bypasses every RLS policy and cannot be revoked without rotating JWT_SECRET.',
  },
  {
    name: 'password assigned to a literal',
    pattern:
      /(?:^|[^A-Za-z0-9_])(?:[A-Za-z_]*(?:PASSWORD|PASSWD|PASS_?PHRASE))\s*[=:]\s*["'`]([^"'`\n]{6,})["'`]/gim,
    why: 'a password written as a literal. Read it from the environment instead.',
  },
  {
    name: 'connection string with an inline password',
    // Captures user and password separately so that the canonical throwaway
    // `postgres:postgres@localhost` — what CI runs against — is recognised.
    pattern:
      /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/([^:\s/]+):([^@\s/]{6,})@/gi,
    why: 'a database URL carrying its own password. Keep the credential in the environment and compose the URL at runtime.',
    valueGroup: 2,
    // `postgres:postgres@` is the throwaway every local and CI Postgres uses;
    // it grants nothing anywhere real.
    exempt: (match) => match[1]?.toLowerCase() === match[2]?.toLowerCase(),
  },
  {
    name: 'private key block',
    // The header must be followed by an actual base64 body. Without this,
    // supabase/functions/google-indexing/index.ts matches — it strips these
    // headers with .replace() to parse a key it is handed at runtime, which is
    // the correct handling of a key, not a leak of one.
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----[\r\n\s]+[A-Za-z0-9+/=]{40}/g,
    why: 'a private key. These belong on the machine that uses them and nowhere else.',
  },
  {
    name: 'provider secret key',
    // Stripe live/test secrets, Supabase personal access tokens, GitHub tokens,
    // OpenAI and Anthropic keys, AWS access key ids, Slack tokens.
    pattern:
      /\b(?:sk_live_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|sbp_[a-f0-9]{40}|gh[pousr]_[A-Za-z0-9]{36}|sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
    why: 'a live API credential for a third-party provider.',
  },
];

/**
 * Values that are the word for a password rather than a password. Documentation
 * and seeded demo accounts use these; matched exactly, so `password` is exempt
 * while `password_Xk92mQ` is not.
 */
const WEAK_EXAMPLE_VALUES = new Set([
  'password',
  'passwd',
  'password123',
  'anything',
  'secret',
  'changeme',
  'postgres',
  'admin',
  'root',
  '123456',
  'letmein',
  'hunter2',
]);

/** A value opening with one of these is a variable or a fill-in-the-blank. */
const PLACEHOLDER_SIGILS = ['$', '[', '{', '<', '%', '(', '"', "'"];

const isPlaceholder = (value: string): boolean => {
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();

  if (WEAK_EXAMPLE_VALUES.has(lowered)) return true;
  if (PLACEHOLDER_SIGILS.some((sigil) => trimmed.startsWith(sigil))) return true;

  return PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker));
};

/** Never print the matched value — that would put it right back in the logs. */
const describeFinding = (file: string, line: number, rule: Rule): string =>
  `${file}:${line} — ${rule.name}: ${rule.why}`;

export const scanText = (file: string, contents: string): string[] => {
  const findings: string[] = [];

  for (const rule of RULES) {
    for (const match of contents.matchAll(rule.pattern)) {
      if (rule.exempt?.(match)) continue;

      // Prefer the captured group (the value alone) over the whole match, so
      // that `DB_PASSWORD = "$PGPASSWORD"` is judged on `$PGPASSWORD`.
      const value = match[rule.valueGroup ?? 1] ?? match[0];
      if (isPlaceholder(value)) continue;

      const line = contents.slice(0, match.index).split('\n').length;
      findings.push(describeFinding(file, line, rule));
    }
  }

  return findings;
};

const trackedFiles = (): string[] =>
  execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);

describe('no credential values in the tracked tree (US-165)', () => {
  const files = trackedFiles().filter((file) => {
    if (ALLOWED_PATHS.has(file)) return false;
    const ext = extname(file).toLowerCase();
    if (!SCANNED_EXTENSIONS.has(ext)) return false;
    // A file larger than a megabyte is data, not source.
    try {
      return statSync(join(ROOT, file)).size <= 1024 * 1024;
    } catch {
      return false;
    }
  });

  it('has files to scan, so a silent no-op cannot pass for a clean result', () => {
    expect(files.length).toBeGreaterThan(500);
  });

  it('contains no secret that should have stayed in the environment', () => {
    const findings = files.flatMap((file) =>
      scanText(file, readFileSync(join(ROOT, file), 'utf8'))
    );

    expect(
      findings,
      'This repository is PUBLIC. Anything committed here is permanently public — ' +
        'removing it from the tree does not remove it from history, clones or forks. ' +
        'Do not simply delete the line: rotate the credential, then keep the ' +
        'reference and drop the value. See docs/setup/supabase-keys.md.'
    ).toEqual([]);
  });

  it('detects each shape it claims to detect', () => {
    // The guard has to be shown able to fail. These are the four shapes that
    // were actually committed on 2026-09-04, reconstructed from non-secret
    // parts so that this assertion carries no credential of its own.
    const jwt = ['eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9', 'e'.repeat(40), 'S'.repeat(43)].join('.');

    expect(scanText('f.md', jwt)).toHaveLength(1);
    expect(scanText('f.ps1', '$DB_PASSWORD = "Nq7' + 'r4Wc2Kd9Lm5Tz"')).toHaveLength(1);
    expect(scanText('f.ps1', '$SSH_PASSWORD = "Hunter2' + 'IsNotIt!"')).toHaveLength(1);
    expect(
      scanText('f.md', 'postgresql://postgres:Nq7' + 'r4Wc2Kd9Lm5Tz@db.host:5432/postgres')
    ).toHaveLength(1);
    expect(
      scanText(
        'f.ts',
        '-----BEGIN OPENSSH PRIVATE KEY-----\n' +
          'b3BlbnNzaC1rZXktdjEAAAAABG5vbmU' +
          'AAAAEbm9uZQAA'
      )
    ).toHaveLength(1);
    expect(scanText('f.ts', 'const k = "sk_live_' + '4eC39HqLyjWDarjtT1zdp7dc"')).toHaveLength(1);
  });

  it('does not flag the placeholders documentation is written with', () => {
    expect(scanText('f.md', 'DB_PASSWORD="your-password"')).toEqual([]);
    expect(scanText('f.md', 'postgresql://postgres:$PGPASSWORD@localhost:5432/postgres')).toEqual(
      []
    );
    expect(scanText('f.ts', 'const password = process.env.DB_PASSWORD')).toEqual([]);
    expect(scanText('f.md', 'SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...')).toEqual(
      []
    );
    expect(scanText('f.yml', 'VITE_SUPABASE_ANON_KEY: placeholder-anon-key-ci-build-only')).toEqual(
      []
    );
  });

  it('does not flag the four exemptions this repository actually relies on', () => {
    // Each of these was a finding on the first run of this guard, and each was
    // judged a false positive for the reason given. They are pinned so that
    // widening an exemption to smuggle a real secret past would fail here.

    // 1. The throwaway Postgres that .github/workflows/verify-backend.yml runs.
    expect(
      scanText('ci.yml', 'DB_URL: postgresql://postgres:postgres@localhost:5432/agentbio')
    ).toEqual([]);
    // ...but only because user and password match. A real password does not pass.
    expect(
      scanText('ci.yml', 'postgresql://postgres:Nq7' + 'r4Wc2Kd9Lm5Tz@localhost:5432/agentbio')
    ).toHaveLength(1);

    // 2. Seeded demo accounts in docs/setup/QUICK_START.md.
    expect(scanText('f.md', 'Password: `anything`')).toEqual([]);
    expect(scanText('f.md', 'Password: `password`')).toEqual([]);

    // 3. Variable references, whatever the variable is called.
    expect(
      scanText('f.md', 'psql "postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres"')
    ).toEqual([]);
    expect(
      scanText('f.md', 'psql "postgresql://postgres:[password]@[old-db-host]:5432/postgres"')
    ).toEqual([]);

    // 4. supabase/functions/google-indexing/index.ts strips PEM headers from a
    // key handed to it at runtime. Handling a key is not leaking one.
    expect(scanText('f.ts', ".replace(/-----BEGIN PRIVATE KEY-----/g, '')")).toEqual([]);
  });
});
