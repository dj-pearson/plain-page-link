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
- [ ] Verify SEO meta tags
- [ ] Check mobile responsiveness
- [ ] Test PWA installation
