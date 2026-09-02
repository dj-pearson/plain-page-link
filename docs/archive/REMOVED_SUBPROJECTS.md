# Subprojects removed from this repository (US-122, 2026-09-02)

Two directories were deleted here. Neither was built, tested, deployed or
imported by anything in the main application; both are recoverable from git
history, and this note records what they were and where to look.

## `mobile-native-js/` — a React Native app

32 files. A separate application with its own dependency tree, sharing no code
with `src/`. Nothing in `package.json`, the CI workflows or the build referenced
it, so it was never compiled and its dependencies were never installed or
audited alongside the rest of the project.

`docs/setup/MOBILE_BUILD_GUIDE.md` describes it. Treat that document as a record
of an intention, not of something that runs.

To recover it:

```bash
git log --diff-filter=D --oneline -- mobile-native-js | head -1   # the deleting commit
git checkout <commit>^ -- mobile-native-js
```

If it is picked up again it belongs in its own repository: a React Native app
and a Vite web app do not share a lockfile, a tsconfig, a linter configuration
or a CI pipeline usefully.

## `tools/automated-testing/` — a Playwright site crawler

39 files. A crawler that walked the deployed site and wrote a report. Its only
output was `test-reports/` — 13 MB of JSON and screenshots that had been
committed to the repository (removed in US-121), and it was not wired into
`npm run test:e2e`, `test:a11y` or `test:security`, all of which are Playwright
suites that CI actually runs.

Recover it the same way. What it did that the real suites do not — crawling the
deployed site rather than a local dev server — is worth having, but as a
scheduled job against a URL, not as a directory of test scripts that nothing
invokes.

## Why deleted rather than moved

Creating the two repositories is not something this change can do; it needs an
account decision and a place to put them. Deleting with this note is the honest
half: the working tree stops claiming they are part of the product, and git
history keeps them intact until someone decides otherwise.
