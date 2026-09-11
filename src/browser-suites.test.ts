import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Every Playwright config in the repository root. */
const configs = readdirSync(ROOT).filter((f) => /^playwright.*\.config\.ts$/.test(f));

const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>;
};

interface Job {
  name: string;
  body: string;
}

/**
 * Split every workflow into its jobs, by indentation.
 *
 * Deliberately not js-yaml: it is only present here as somebody else's
 * transitive dependency, and a guard that breaks when an unrelated package is
 * hoisted away is not a guard. A job starts at two-space indentation under
 * `jobs:` and runs to the next one, which is all this needs to know.
 */
function readJobs(): Job[] {
  const dir = join(ROOT, '.github/workflows');
  const jobs: Job[] = [];

  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    const lines = readFileSync(join(dir, file), 'utf-8').split('\n');
    let inJobs = false;
    let current: Job | null = null;

    for (const line of lines) {
      if (/^jobs:\s*$/.test(line)) {
        inJobs = true;
        continue;
      }
      if (!inJobs) continue;
      // A new top-level key ends the jobs block.
      if (/^\S/.test(line) && line.trim() !== '') {
        if (current) jobs.push(current);
        current = null;
        inJobs = false;
        continue;
      }
      const jobStart = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (jobStart) {
        if (current) jobs.push(current);
        current = { name: `${file}:${jobStart[1]}`, body: '' };
        continue;
      }
      if (current) current.body += line + '\n';
    }
    if (current) jobs.push(current);
  }
  return jobs;
}

const JOBS = readJobs();
const ALL_WORKFLOW_TEXT = JOBS.map((j) => j.body).join('\n');

/** The npm scripts that run a Playwright suite, excluding the :ui variants. */
function suiteScripts(): string[] {
  return Object.entries(packageJson.scripts)
    .filter(([name, cmd]) => configs.some((c) => cmd.includes(c)) && !name.endsWith(':ui'))
    .map(([name]) => name);
}

describe('browser test suites (US-205)', () => {
  it('found the configs and the workflows at all', () => {
    expect(configs.length).toBeGreaterThanOrEqual(3);
    expect(JOBS.length).toBeGreaterThan(5);
    expect(JOBS.map((j) => j.name)).toContain('ci.yml:typecheck');
  });

  it('runs every Playwright config from an npm script', () => {
    const unscripted = configs.filter(
      (config) => !Object.values(packageJson.scripts).some((cmd) => cmd.includes(config))
    );
    expect(unscripted).toEqual([]);
  });

  it('runs every one of those scripts in CI', () => {
    // A suite nobody runs is not a safety net, it is a file. tests/e2e and
    // tests/security were exactly that.
    const missing: string[] = [];
    for (const config of configs) {
      const scripts = Object.entries(packageJson.scripts)
        .filter(([name, cmd]) => cmd.includes(config) && !name.endsWith(':ui'))
        .map(([name]) => name);

      const runInCi = scripts.some((script) => ALL_WORKFLOW_TEXT.includes(`npm run ${script}`));
      if (!runInCi) missing.push(`${config} (scripts: ${scripts.join(', ') || 'none'})`);
    }
    expect(missing).toEqual([]);
  });

  it('lets those jobs fail', () => {
    // continue-on-error on a passing suite is indistinguishable from not having
    // the suite. The a11y job carried it for long enough that its 6 tests were
    // reported as "warn-only initially" while passing 6/6 against an explicit
    // baseline.
    const scripts = suiteScripts().map((name) => `npm run ${name}`);

    const warnOnly = JOBS.filter(
      (job) =>
        /continue-on-error:\s*true/.test(job.body) &&
        scripts.some((script) => job.body.includes(script))
    ).map((job) => job.name);

    expect(warnOnly).toEqual([]);
  });

  it('covers every static public route with the a11y suite', () => {
    // US-208: the a11y suite listed five pages while App.tsx declares
    // twenty-four static public routes, and 12 of the 19 it could not see had
    // critical or serious violations. A sampled suite measures the sample.
    //
    // Parameterised routes (/:username, /blog/:slug, /for/:slug) are excluded:
    // there is no generic value to visit them with. The public profile is
    // covered separately in the spec, against a mocked profile.
    const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf-8');
    const declared = [...app.matchAll(/<Route\s+path="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((path) => path.startsWith('/') && !path.includes(':') && !path.includes('*'));
    // US-209 removed the /admin exclusion that stood here. The suite signs in
    // and is granted a user_roles row now, and assertAppRendered checks the
    // page it landed on is the page it asked for — so every route in App.tsx is
    // measured, and measured for real.

    expect(declared.length, 'should have found the routes in App.tsx').toBeGreaterThan(20);

    const spec = readFileSync(join(ROOT, 'tests/a11y/accessibility.spec.ts'), 'utf-8');
    const covered = new Set([...spec.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]));

    const uncovered = declared.filter((path) => !covered.has(path));
    expect(uncovered).toEqual([]);
  });

  it('each suite has specs to run', () => {
    // The mirror of the above: a job that runs a config whose testDir is empty
    // is green for the wrong reason.
    for (const config of configs) {
      const testDir = /testDir:\s*'\.\/([^']+)'/.exec(readFileSync(join(ROOT, config), 'utf-8'));
      expect(testDir, `${config} should declare a testDir`).not.toBeNull();
      const dir = join(ROOT, testDir![1]);
      expect(existsSync(dir), `${testDir![1]} should exist`).toBe(true);
      expect(
        readdirSync(dir).filter((f) => f.endsWith('.spec.ts')).length,
        `${testDir![1]} should hold specs`
      ).toBeGreaterThan(0);
    }
  });
});
