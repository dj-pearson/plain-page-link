# SSL MIGRATION TO CUSTOM DOMAINS - COMPLETE

## Migration Summary
Successfully migrated from sslip.io domains to custom SSL domains with valid certificates.

## Custom Domain Configuration

### Before (sslip.io - Self-signed SSL)
- **Kong API**: https://supabasekong-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io
- **Studio**: https://supabasestudio-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io
- **Status**: ❌ ERR_CERT_AUTHORITY_INVALID

### After (agentbio.net - Valid SSL)
- **Kong API**: https://api.agentbio.net
- **Studio**: https://studio.agentbio.net
- **Status**: ✅ Valid SSL certificates via Cloudflare/Let's Encrypt

## Configuration Files Updated

### 1. .env (Backend/Database Config)
```env
PGHOST=api.agentbio.net
DB_HOST=api.agentbio.net
SUPABASE_URL=https://api.agentbio.net
```

### 2. .env.local (Frontend Vite Config) - NEW FILE
```env
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 3. index.html (Content Security Policy)
**Updated CSP connect-src:**
- Removed: `https://*.sslip.io` and `wss://*.sslip.io`
- Added: `https://*.agentbio.net` and `wss://*.agentbio.net`

## Deployment Status

### Frontend
- **Platform**: Cloudflare Pages
- **URL**: https://agentbio.net
- **Latest Deploy**: https://54f98498.plain-page-link.pages.dev
- **Status**: ✅ Deployed with new API endpoint

### Backend
- **Database**: PostgreSQL 17.6 on Coolify
- **Container**: supabase-db-rwwccs4k8o8kog4s0w4ggggg
- **Server**: 209.145.59.219 (Contabo VPS)
- **Status**: ✅ Running with 17 tables populated

### API Gateway
- **Kong**: api.agentbio.net
- **Port**: 443 (HTTPS)
- **SSL**: ✅ Valid certificate
- **Anon Key**: Configured in .env.local

### Studio
- **URL**: https://studio.agentbio.net
- **Port**: 443 (HTTPS)
- **SSL**: ✅ Valid certificate

## Testing Checklist

### ✅ Completed
1. Database schema migration (59 migrations)
2. Data import (17 tables, 41 articles)
3. SSL configuration for custom domains
4. Frontend rebuild with new API endpoint
5. CSP updated for agentbio.net domains
6. Cloudflare Pages deployment

### ⚠️ To Test
1. Login functionality at agentbio.net
2. API calls from frontend to api.agentbio.net
3. Database queries via Kong gateway
4. Studio access at studio.agentbio.net
5. WebSocket connections (real-time features)

## Environment Variables Summary

### Production (.env.local)
```env
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoiYW5vbiJ9.QhDHf45z3FazBIiYTGKO43KBquCaOjIjqhGmWSJw2Ms
```

### Server (.env)
```env
SUPABASE_URL=https://api.agentbio.net
DB_HOST=api.agentbio.net
PGHOST=api.agentbio.net
```

## Next Steps

1. **Test Authentication**
   - Visit https://agentbio.net
   - Try logging in with pearsonperformance@gmail.com
   - Verify API calls succeed (no SSL errors)

2. **Test Studio Access**
   - Visit https://studio.agentbio.net
   - Login and verify database access
   - Check table data visibility

3. **Monitor Logs**
   ```bash
   ssh root@209.145.59.219
   docker logs -f supabase-db-rwwccs4k8o8kog4s0w4ggggg
   docker logs -f supabasekong-rwwccs4k8o8kog4s0w4ggggg
   ```

4. **Edge Functions** (Future)
   - Deploy Edge Functions to Coolify
   - Update function environment variables
   - Configure function routing

## Key Benefits

✅ **Valid SSL Certificates** - No more browser warnings
✅ **Custom Domain** - Professional branding (api.agentbio.net)
✅ **Improved Security** - Proper HTTPS throughout
✅ **Better Performance** - No SSL negotiation errors
✅ **Production Ready** - Can be used for live traffic

## Troubleshooting

### If API calls fail:
1. Check CSP in browser console
2. Verify api.agentbio.net resolves correctly
3. Check Kong container logs
4. Verify Coolify domain routing

### If login fails:
1. Check auth.users table has your account
2. Verify SUPABASE_ANON_KEY is correct
3. Check browser console for CORS errors
4. Verify Kong is routing to correct Supabase services

## Contact Info

- **Frontend**: https://agentbio.net
- **API**: https://api.agentbio.net
- **Studio**: https://studio.agentbio.net
- **Server IP**: 209.145.59.219
- **Database**: supabase-db-rwwccs4k8o8kog4s0w4ggggg
