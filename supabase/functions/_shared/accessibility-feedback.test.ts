import { describe, it, expect } from 'vitest';
import { validateFeedback, buildFeedbackEmail } from './accessibility-feedback';

describe('validateFeedback (US-239)', () => {
  it('needs a message; name, email, page and AT are optional', () => {
    expect(validateFeedback({ message: 'short' })).toEqual({ ok: false, errors: { message: expect.any(String) } });
    const ok = validateFeedback({ message: 'The sort menu does not open with a keyboard.' });
    expect(ok.ok).toBe(true);
  });

  it('rejects a malformed email but accepts none', () => {
    const bad = validateFeedback({ message: 'The sort menu does not open.', email: 'nope' });
    expect(bad.ok).toBe(false);
    expect(validateFeedback({ message: 'The sort menu does not open.', email: '' }).ok).toBe(true);
  });

  it('trims and caps every field, and ignores non-strings', () => {
    const r = validateFeedback({ message: '  ' + 'x'.repeat(6000), name: 42, pageUrl: ' /demo ' });
    expect(r.ok && r.value.message.length).toBe(5000);
    expect(r.ok && r.value.name).toBe('');
    expect(r.ok && r.value.pageUrl).toBe('/demo');
  });
});

describe('buildFeedbackEmail', () => {
  const input = {
    name: 'Sam <b>',
    email: 'sam@example.com',
    pageUrl: '/demo',
    assistiveTech: 'NVDA',
    message: 'Button unlabeled. Visit https://evil.example to see <script>',
  };

  it('escapes and de-links the visitor text in the HTML, with lang set', () => {
    const mail = buildFeedbackEmail(input, 'accessibility@agentbio.net');
    expect(mail.html).toContain('<html lang="en">');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('https://evil.example');
    expect(mail.html).toContain('Sam &lt;b&gt;');
  });

  it('goes to the inbox with the reporter as Reply-To', () => {
    const mail = buildFeedbackEmail(input, 'a11y@test');
    expect(mail.to).toBe('a11y@test');
    expect(mail.replyTo).toBe('sam@example.com');
    expect(buildFeedbackEmail({ ...input, email: '' }, 'a11y@test').replyTo).toBeUndefined();
  });
});
