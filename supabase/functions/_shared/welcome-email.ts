/**
 * The welcome email an agent gets when they finish onboarding (US-616).
 *
 * It used to live inline in send-welcome-email, where nothing checked it. An
 * audit found, in the one email every new agent receives:
 *
 *   - "Check out our video tutorials", linked to /blog. There are no video
 *     tutorials; the blog is SEO articles about real estate marketing.
 *   - "Join our agent community". There is no community, and no link.
 *   - "Upload Your Sold Properties ... with before/after photos and success
 *     stories". There is no before/after view (src/features-claims.test.ts
 *     already bans that claim on the site).
 *   - "Your professional real estate portfolio is now live" whatever
 *     profiles.is_published said. RLS hides an unpublished page from
 *     visitors, so an agent who had switched it off was told to share a link
 *     that showed nothing.
 *   - The plain-text part and the HTML part listing different fifth steps
 *     ("Set Up Lead Capture" vs "Monitor Your Analytics"), and none of the
 *     five steps linking to the screen that does it.
 *   - The agent's own full_name interpolated into the HTML unescaped.
 *   - A purple gradient header and a 4px coloured border-left callout.
 *
 * Every step now names a real dashboard route, the same ones
 * src/lib/profileCompletion.ts sends agents to, and the copy says only what
 * the product does. src/marketing-claims.test.ts scans this file.
 *
 * This is a transactional message (it confirms an account the recipient just
 * created), so it carries no List-Unsubscribe header; the footer says why it
 * was sent.
 */
import { escapeHtml } from './email.ts';

export interface WelcomeEmailInput {
  /** full_name, or the username when there is none. Agent-written: escaped here. */
  displayName: string;
  username: string;
  siteUrl: string;
  /** profiles.is_published. Only `true` is visible to visitors. */
  isPublished: boolean | null | undefined;
}

export interface WelcomeEmail {
  subject: string;
  text: string;
  html: string;
}

export interface WelcomeStep {
  title: string;
  detail: string;
  /** A route in src/App.tsx, or null for the page itself. */
  path: string | null;
}

/** What to do next. Each path is a route in src/App.tsx under /dashboard. */
export function welcomeSteps(isLive: boolean): WelcomeStep[] {
  const steps: WelcomeStep[] = [
    {
      title: 'Put your page in your Instagram bio',
      detail: 'Use your AgentBio address as the one link on Instagram, Facebook and anywhere else you post.',
      path: null,
    },
    {
      title: 'Add your listings',
      detail: 'Active, pending and sold properties, with photos, price and details.',
      path: '/dashboard/listings',
    },
    {
      title: 'Choose a theme',
      detail: 'Pick the colours and fonts that match your brand.',
      path: '/dashboard/theme',
    },
    {
      title: 'Watch for leads',
      detail: 'Buyer, seller and home valuation enquiries from your page arrive in Leads.',
      path: '/dashboard/leads',
    },
  ];
  if (!isLive) {
    steps.unshift({
      title: 'Publish your page',
      detail: 'Your page is switched off, so visitors see nothing yet. Turn it on in Settings when you are ready.',
      path: '/dashboard/settings#publish',
    });
  }
  return steps;
}

export function buildWelcomeEmail(input: WelcomeEmailInput): WelcomeEmail {
  const site = input.siteUrl.replace(/\/+$/, '');
  const isLive = input.isPublished === true;
  const profileUrl = `${site}/${encodeURIComponent(input.username)}`;
  const dashboardUrl = `${site}/dashboard`;
  const steps = welcomeSteps(isLive);
  const hrefOf = (step: WelcomeStep) => (step.path ? `${site}${step.path}` : profileUrl);

  const subject = isLive ? 'Welcome to AgentBio: your page is live' : 'Welcome to AgentBio';
  const intro = isLive
    ? 'Your AgentBio page is live and ready to share.'
    : 'Your AgentBio account is set up. Your page is not public yet.';

  const text = [
    `Hi ${input.displayName},`,
    '',
    intro,
    '',
    `Your page: ${profileUrl}`,
    '',
    'What to do next:',
    '',
    ...steps.flatMap((s, i) => [`${i + 1}. ${s.title}`, `   ${s.detail}`, `   ${hrefOf(s)}`, '']),
    `Your dashboard: ${dashboardUrl}`,
    '',
    'Questions? Email support@agentbio.net.',
    '',
    'The AgentBio team',
    '',
    '--',
    'You are getting this email because you created an AgentBio account.',
  ].join('\n');

  const e = escapeHtml;
  const stepRows = steps
    .map(
      (s, i) =>
        `<tr><td style="padding:0 12px 18px 0;vertical-align:top;font-weight:700;font-size:15px;color:#1f2933;">${i + 1}.</td>` +
        `<td style="padding:0 0 18px;vertical-align:top;"><a href="${e(hrefOf(s))}" style="font-size:15px;font-weight:700;color:#1d4ed8;text-decoration:none;">${e(s.title)}</a>` +
        `<div style="margin-top:2px;font-size:14px;line-height:1.55;color:#3e4c59;">${e(s.detail)}</div></td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f6f5f2;font-family:Georgia,'Times New Roman',serif;color:#1f2933;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px 28px;">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;font-weight:700;">Welcome to AgentBio</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${e(input.displayName)},</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;">${e(intro)}</p>
<p style="margin:0 0 4px;font-size:13px;color:#52606d;">Your page</p>
<p style="margin:0 0 28px;font-size:17px;font-weight:700;word-break:break-all;"><a href="${e(profileUrl)}" style="color:#1d4ed8;text-decoration:none;">${e(profileUrl)}</a></p>
<h2 style="margin:0 0 14px;font-size:17px;">What to do next</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">${stepRows}</table>
<p style="margin:12px 0 28px;"><a href="${e(dashboardUrl)}" style="display:inline-block;background:#1f2933;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">Open your dashboard</a></p>
<p style="margin:0 0 6px;font-size:15px;line-height:1.6;">Questions? Email <a href="mailto:support@agentbio.net" style="color:#1d4ed8;">support@agentbio.net</a>.</p>
<p style="margin:0;font-size:15px;line-height:1.6;">The AgentBio team</p>
<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#52606d;">You are getting this email because you created an AgentBio account.</p>
</div>
</body></html>`;

  return { subject, text, html };
}
