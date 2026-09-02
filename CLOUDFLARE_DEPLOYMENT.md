# Cloudflare Pages Deployment Guide

## Prerequisites
- Cloudflare account with Pages access
- Repository connected to Cloudflare Pages

## Build Configuration

### Framework preset: 
Select "Vite" or "None" in Cloudflare Pages dashboard

### Build settings:
```
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 18
```

### Environment Variables (if needed):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Files Structure

### Essential files for deployment:
- ✅ `index.html` - Main HTML entry point
- ✅ `public/_redirects` - SPA routing configuration
- ✅ `public/_headers` - Security headers and caching
- ✅ `public/robots.txt` - SEO and crawler configuration
- ✅ `public/sitemap.xml` - Sitemap for search engines
- ✅ `public/manifest.json` - PWA manifest
- ✅ `wrangler.toml` - Cloudflare configuration (optional)

### Static assets:
- `public/Cover.png` - Open Graph image
- `public/Icon.png` - Favicon and app icon
- `public/logo.png` - Brand logo
- `public/icons/*` - PWA icons (need to be generated)

## Deployment Steps

1. **Push to repository**
   ```bash
   git add .
   git commit -m "Prepare for Cloudflare Pages deployment"
   git push origin main
   ```

2. **Cloudflare Pages will automatically**:
   - Detect the push
   - Run `npm install`
   - Run `npm run build`
   - Deploy the `dist` folder

3. **Verify deployment**:
   - Check build logs in Cloudflare dashboard
   - Test the deployed URL
   - Check that routing works (e.g., `/pricing`, `/blog`)
   - Verify images and assets load correctly

## PWA Icons Setup

The PWA icons are referenced in `manifest.json` but need to be generated:

1. Use your `Icon.png` or `logo.png` as the source
2. Generate icons at: https://www.pwabuilder.com/imageGenerator
3. Download and place in `public/icons/` directory
4. Required sizes: 72, 96, 128, 144, 152, 192, 384, 512

## Troubleshooting

### Build fails:
- Check Node version (should be 18)
- Verify all dependencies in package.json
- Check TypeScript errors: `npm run build:check`

### Routing issues (404s):
- Verify `_redirects` file is in `public/` folder
- Check that `/*  /index.html  200` rule exists

### Assets not loading:
- Check `_headers` file for proper content types
- Verify assets are in `public/` folder or built into `dist/`
- Check browser console for CORS or loading errors

### Environment variables:
- Set in Cloudflare Pages dashboard under Settings > Environment variables
- Prefix all variables with `VITE_` for Vite to expose them
- Redeploy after adding environment variables

## Pages Functions: social unfurls for `/:username`

`functions/[username].ts` runs on Cloudflare's edge, ahead of the static asset
server. It exists because `public/_redirects` is `/* /index.html 200` and
nothing prerenders: every crawler that fetched `agentbio.net/jane` was served
`index.html`'s marketing tags and `Cover.png`, because `SEOHead` sets the real
ones in React and iMessage, Facebook, Slack and LinkedIn do not run JavaScript.

Behaviour:

- A **person** gets `next()` — the SPA, byte for byte, with no database call.
- A **crawler** (matched on User-Agent) gets the same document with the head
  replaced: the agent's name, bio, avatar and JSON-LD, or the property's
  address, price and photo when the URL carries `?listing=<id>`.
- Anything that fails — no binding, unreachable database, unknown username,
  4 s timeout — falls through to `next()`. The card is never worth the page.

**It needs the Supabase values at runtime, not only at build time.** Vite
inlines `VITE_*` into the bundle during the build; a Pages Function reads them
from `context.env` when the request arrives. In Settings > Environment
variables, make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
for the Production (and Preview) environments — the same values the build uses.
`SUPABASE_URL` / `SUPABASE_ANON_KEY` are accepted as aliases. Without them the
function logs and falls through, so unfurls quietly revert to the generic card;
`curl -sI -A facebookexternalhit https://agentbio.net/<username>` should show
`x-agentbio-prerender: profile`.

Only the anon key belongs here. The function reads published profiles and
listings, which is exactly what the public page already reads.

To inspect the output without deploying:

```bash
npx tsx scripts/preview-social-meta.mjs &
curl -sA facebookexternalhit http://127.0.0.1:8791/jane | grep 'og:'
curl -sA facebookexternalhit 'http://127.0.0.1:8791/jane?listing=abc-123' | grep 'og:'
```

## Custom Domain

To use custom domain (e.g., agentbio.net):
1. Go to Cloudflare Pages > Custom domains
2. Add your domain
3. Update DNS records as instructed
4. Update `sitemap.xml` URLs to use your domain

## Production Checklist

- [ ] All environment variables set
- [ ] PWA icons generated and uploaded
- [ ] Sitemap URLs updated with production domain
- [ ] robots.txt configured correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL/TLS enabled (automatic with Cloudflare)
- [ ] Test all routes work
- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` available to Pages Functions
- [ ] `curl -sI -A facebookexternalhit https://<domain>/<username>` returns `x-agentbio-prerender`
- [ ] Verify SEO meta tags
- [ ] Check mobile responsiveness
- [ ] Test PWA installation
