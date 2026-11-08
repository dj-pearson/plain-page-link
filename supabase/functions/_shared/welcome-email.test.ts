import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWelcomeEmail, welcomeSteps } from './welcome-email';

const base = { displayName: 'Dana Reyes', username: 'dana', siteUrl: 'https://agentbio.net/' };

/** Every route the app serves under /dashboard (src/App.tsx), so a step cannot link to a 404. */
function dashboardRoutes(): Set<string> {
  const app = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');
  const routes = new Set<string>();
  for (const m of app.matchAll(/path="([a-z][a-z0-9/-]*)"/g)) routes.add(`/dashboard/${m[1]}`);
  return routes;
}

describe('welcome email (US-616)', () => {
  it('links every step to a real dashboard route, or to the page itself', () => {
    const routes = dashboardRoutes();
    for (const live of [true, false]) {
      for (const step of welcomeSteps(live)) {
        if (step.path === null) continue;
        expect(routes, step.path).toContain(step.path.split('#')[0]);
      }
    }
  });

  it('says the page is live only when it is published', () => {
    const live = buildWelcomeEmail({ ...base, isPublished: true });
    expect(live.subject).toMatch(/live/);
    expect(live.text).toContain('is live and ready to share');
    expect(live.text).not.toContain('Publish your page');

    for (const isPublished of [false, null, undefined]) {
      const off = buildWelcomeEmail({ ...base, isPublished });
      expect(off.subject).not.toMatch(/live/);
      expect(off.text).not.toMatch(/is live/);
      expect(off.text).toContain('1. Publish your page');
      expect(off.html).toContain('https://agentbio.net/dashboard/settings#publish');
    }
  });

  it('lists the same steps in the text and HTML parts', () => {
    const email = buildWelcomeEmail({ ...base, isPublished: true });
    for (const step of welcomeSteps(true)) {
      expect(email.text).toContain(step.title);
      expect(email.html).toContain(step.title);
    }
    expect(email.text).toContain('https://agentbio.net/dana');
    expect(email.html).toContain('href="https://agentbio.net/dana"');
  });

  it('escapes the agent-written name in the HTML', () => {
    const email = buildWelcomeEmail({
      ...base,
      displayName: '<a href="https://evil.example">Dana</a>',
      isPublished: true,
    });
    expect(email.html).not.toContain('<a href="https://evil.example">');
    expect(email.html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
  });

  it('makes none of the claims the old template made', () => {
    const { text, html } = buildWelcomeEmail({ ...base, isPublished: true });
    for (const part of [text, html]) {
      expect(part).not.toMatch(/tutorial/i);
      expect(part).not.toMatch(/community/i);
      expect(part).not.toMatch(/before\/after|success stor/i);
      expect(part).not.toMatch(/linear-gradient|border-left/);
    }
  });

  it('send-welcome-email builds its message here and checks the send result', () => {
    const fn = readFileSync(
      join(process.cwd(), 'supabase', 'functions', 'send-welcome-email', 'index.ts'),
      'utf8'
    );
    expect(fn).toContain('buildWelcomeEmail(');
    expect(fn).toMatch(/if \(!sent\.ok\)/);
    expect(fn).not.toMatch(/<html|linear-gradient/);
  });
});
