# Security Notes

This document tracks known dependency vulnerabilities surfaced by
`npm audit --audit-level=high` and their remediation status. The CI
`security` job runs this audit on every push/PR and fails on high or
critical findings.

**Last reviewed:** 2026-05-17
**Audit baseline:** 23 vulnerabilities (1 low, 6 moderate, 14 high, 2 critical)

## High / Critical Findings

| Package | Severity | Fix | Notes |
| --- | --- | --- | --- |
| `@babel/plugin-transform-modules-systemjs` | high | non-breaking | Transitive (build toolchain). Resolvable via `npm audit fix`. |
| `@remix-run/router` / `react-router` / `react-router-dom` | high | non-breaking | App dependency. Resolvable via `npm audit fix` (stays within v6). |
| `axios` | high | non-breaking | App dependency. Resolvable via `npm audit fix`. |
| `flatted` | high | non-breaking | Transitive (eslint cache). Resolvable via `npm audit fix`. |
| `glob` / `minimatch` / `picomatch` | high | non-breaking | Transitive (build/lint toolchain). Resolvable via `npm audit fix`. |
| `jws` | high | non-breaking | Transitive via `jsonwebtoken`. Resolvable via `npm audit fix`. |
| `lodash` | high | non-breaking | Transitive. Resolvable via `npm audit fix`. |
| `rollup` / `vite` | high | non-breaking | Build tooling, dev-server-only path-traversal advisories. Resolvable via `npm audit fix`. |
| `protobufjs` | critical | non-breaking | Transitive via `firebase`. Resolvable via `npm audit fix`. |
| `jspdf` | critical | **breaking** | App dependency (PDF export). Fix requires a major version bump and API migration. Tracked separately. |
| `jspdf-autotable` | high | **breaking** | Pairs with `jspdf`; upgrade together when `jspdf` is migrated. |

## Remediation Plan

1. **Non-breaking fixes** — the majority of findings resolve cleanly with
   `npm audit fix`. This is intentionally deferred to a dedicated dependency
   bump PR (not bundled into a feature story) so the diff and regression
   surface can be reviewed in isolation. Dependabot is configured to open
   grouped patch PRs daily, with `dependabot-auto-merge.yml` fast-tracking
   patch-level updates after CI passes.

2. **`jspdf` / `jspdf-autotable` (breaking)** — the only findings requiring a
   major version upgrade and code changes. These power PDF export features and
   need a dedicated migration story (verify export output, table rendering,
   and fonts after the upgrade). Until then they are accepted, documented risk:
   `jspdf` is used server-of-trust-free for client-side PDF generation of
   user-owned data only, limiting the practical exploit surface.

## Why CI may report failures

The `security` job is intentionally strict (`--audit-level=high`). Until the
remediation PRs above land it will report the known findings in this file.
This is by design — it keeps the vulnerability count visible and prevents new
high/critical dependencies from silently entering the tree. Findings already
catalogued here are accepted, time-boxed risk; net-new findings are signal.
