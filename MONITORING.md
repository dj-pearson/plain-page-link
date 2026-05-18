# Monitoring & Observability

How AgentBio is monitored in production, what triggers alerts, and how to
respond. Owned by Engineering.

**Last updated:** 2026-05-17

## Stack

| Concern | Tool | Source |
| --- | --- | --- |
| Errors & performance | Sentry (`@sentry/react`) | `src/lib/sentry.ts` |
| Core Web Vitals | `web-vitals` → Google Analytics | `src/lib/web-vitals.ts` |
| Audit trail | `audit_logs` table + triggers | `supabase/migrations/*audit*` |
| Dependency CVEs | `npm audit` in CI | `.github/workflows/ci.yml` |

## Sentry Configuration

Initialized in `src/lib/sentry.ts` (`initSentry()`), called from
`src/main.tsx`. Disabled unless `VITE_SENTRY_DSN` is set; enabled in
production or when `VITE_SENTRY_ENABLED=true`.

- **Environment**: `production` / `development` (also set as a tag).
- **Release**: `VITE_APP_VERSION` (falls back to `1.0.0`, matching
  `package.json`); set as a tag.
- **Deployment region tag**: `VITE_DEPLOYMENT_REGION` (`unknown` if unset).
- **Performance sampling**: `tracesSampleRate` = 0.10 in production
  (100% in dev).
- **Session replay**: 1% of sessions, 10% of errored sessions in prod.
- **Breadcrumbs**: navigation, console, fetch/xhr, DOM, history
  (explicit `breadcrumbsIntegration`); capped at 50; sensitive data
  scrubbed in `beforeSend`.

### Business events

`src/lib/sentry.ts` exposes message helpers so revenue/lead signals are
visible alongside errors:

- `trackSubscriptionCreated(plan, userId)` — info
- `trackSubscriptionCancelled(plan, userId)` — warning
- `trackHighValueLead(score, userId)` — info, only when score > 90

Wire these into the Stripe lifecycle (US-036/037) and lead scoring flows
as those land.

## Alert Thresholds

| Signal | Threshold | Severity | Action |
| --- | --- | --- | --- |
| Error rate | > 1% of sessions over 5 min | High | Page on-call |
| New error (unhandled) | First occurrence in prod | Medium | Triage within 1 business day |
| LCP (p75) | > 2.5 s | Medium | Performance review |
| CLS (p75) | > 0.1 | Medium | Performance review |
| INP (p75) | > 200 ms | Medium | Performance review |
| `subscription_cancelled` spike | > 3× 7-day avg / day | High | Notify product + revenue |
| `npm audit` high/critical | Any new (not in SECURITY_NOTES.md) | High | Block release, patch |

Web Vitals budgets are also enforced as console warnings in development
(`src/lib/web-vitals.ts`).

## Escalation

1. **Detection** — Sentry alert (email/Slack) or CI failure.
2. **Triage** — on-call engineer assesses severity using the table above.
3. **High severity** — acknowledge in Sentry, open an incident channel,
   identify the offending release; roll back via the deployment runbook
   if release-correlated.
4. **Communicate** — post status in the incident channel; notify product
   for revenue-impacting events.
5. **Post-incident** — file a follow-up issue and add a regression test.

## Dashboards

Configure these URLs for your Sentry org/project (placeholders):

- Sentry Issues: `https://sentry.io/organizations/<org>/issues/`
- Sentry Performance: `https://sentry.io/organizations/<org>/performance/`
- Sentry Releases: `https://sentry.io/organizations/<org>/releases/`
- Google Analytics (Web Vitals events): GA4 property → Reports →
  Engagement → Events (`LCP`, `CLS`, `INP`, `FID`, `TTFB`).

## Routine Checks

- **Daily**: Sentry unresolved issues triaged.
- **Per release**: Sentry "Releases" regression check; Web Vitals trend.
- **Weekly**: dependency audit review; `SECURITY_NOTES.md` reconciled.
