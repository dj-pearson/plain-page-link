# Coolify Self-Hosted Supabase Migration Guide

## Prerequisites

1. **Get your Coolify Supabase database credentials:**
   - In Coolify dashboard, navigate to your Supabase service
   - Go to "Configuration" or "Environment Variables"
   - Look for PostgreSQL connection details:
     - Host/IP
     - Port (usually 5432)
     - Database name (usually "postgres")
     - Username (usually "postgres")
     - Password

2. **Install PostgreSQL client** (if not already installed):
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **Linux/Coolify**: Usually pre-installed
   - **macOS**: `brew install postgresql`

## Migration Methods

### Method 1: Direct PowerShell Script (Recommended for Windows)

1. **Update connection details** in `migrate-to-coolify.ps1`:
   ```powershell
   $DB_HOST = "your-coolify-host"      # e.g., "192.168.1.100" or "supabase.yourdomain.com"
   $DB_PORT = "5432"
   $DB_NAME = "postgres"
   $DB_USER = "postgres"
   $DB_PASSWORD = "your-password"
   ```

2. **Run the migration script**:
   ```powershell
   .\migrate-to-coolify.ps1
   ```

### Method 2: Manual Migration via psql

If you prefer manual control:

```powershell
# Set connection string
$CONN = "postgresql://postgres:your-password@your-host:5432/postgres"

# Test connection
psql $CONN -c "SELECT version();"

# Apply migrations one by one
Get-ChildItem .\supabase\migrations\*.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Applying $($_.Name)..."
    psql $CONN -f $_.FullName
}
```

### Method 3: Using Coolify's Terminal (Direct on Server)

1. **Connect to your Supabase container** in Coolify terminal (as shown in your screenshot)

2. **Inside the container**, run:
   ```bash
   # Navigate to your app directory (if mounted)
   cd /path/to/your/app

   # Apply migrations
   for file in supabase/migrations/*.sql; do
       echo "Applying $file..."
       psql "postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres" -f "$file"
   done
   ```

## Post-Migration Steps

### 1. Verify Migration Success

```sql
-- Check tables were created
\dt

-- Check specific critical tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify migration tracking
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY inserted_at DESC
LIMIT 10;
```

### 2. Enable Row Level Security (RLS)

All migrations should have RLS enabled, but verify:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3. Update Application Environment Variables

Update your app's `.env` or Coolify environment variables:

```env
# Self-Hosted Supabase Configuration
# API subdomain (Kong gateway) - for REST API, Auth, Storage
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge Functions subdomain
VITE_FUNCTIONS_URL=https://functions.agentbio.net

# Service role key (for edge functions and backend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database connection (for backend/functions)
DATABASE_URL=postgresql://postgres:password@db.agentbio.net:5432/postgres
```

### 4. Deploy Edge Functions

Your Edge Functions need to be deployed to your Coolify Supabase instance:

1. **Option A**: If Coolify supports Deno Deploy
   - Configure each function in Coolify
   - Point to your `supabase/functions` directory

2. **Option B**: Convert to Docker containers
   - Package each function as a microservice
   - Deploy via Coolify's Docker support

### 5. Migrate Existing Data (if applicable)

If you have data in a managed Supabase that needs migration:

```bash
# Export data only (exclude auth/system tables)
pg_dump \
  --data-only \
  --exclude-table-data='auth.*' \
  --exclude-table-data='storage.*' \
  "postgresql://postgres:[password]@[old-db-host]:5432/postgres" \
  > data-export.sql

# Import to self-hosted
psql "postgresql://postgres:password@db.agentbio.net:5432/postgres" < data-export.sql
```

## Troubleshooting

### Connection Issues

```powershell
# Test if port is open
Test-NetConnection -ComputerName your-host -Port 5432

# Check if PostgreSQL is accepting connections
psql "postgresql://postgres:password@host:5432/postgres" -c "SELECT 1;"
```

### Permission Issues

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Migration Conflicts

If migrations fail, check for:
- Existing tables with same names
- Missing extensions
- Version conflicts

```sql
-- Drop and retry specific migration
DROP TABLE IF EXISTS problematic_table CASCADE;
-- Then re-run migration
```

## What Gets Migrated

✅ **Included:**
- All database schemas and tables (59 migrations)
- Functions and triggers
- Row Level Security policies
- Indexes and constraints
- Extensions (pg_graphql, pgcrypto, uuid-ossp, etc.)
- Custom types and enums

❌ **Not Included (requires separate setup):**
- Auth users (need to be recreated or imported)
- Storage buckets and files
- Edge Function deployments
- Realtime configurations
- API keys (will be different on self-hosted)

## Security Checklist

After migration:

- [ ] Update all API keys in your applications
- [ ] Review and test all RLS policies
- [ ] Enable SSL/TLS for database connections
- [ ] Set up regular backups in Coolify
- [ ] Configure firewall rules (only allow necessary IPs)
- [ ] Enable audit logging
- [ ] Test authentication flows
- [ ] Verify CORS settings for your domain

## Next Steps

1. Run the migration script
2. Verify all tables exist
3. Test a simple query
4. Update your frontend app's environment variables
5. Deploy and test your application
6. Set up monitoring and backups

Need help with any specific step? Let me know!
