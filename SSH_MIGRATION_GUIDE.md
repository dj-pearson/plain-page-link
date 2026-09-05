# Quick SSH Migration Guide

## Prerequisites

1. **SSH Access to your Coolify server**
   - Host: `209.145.59.219`
   - Username: Usually `root` or your server username
   - SSH key or password

2. **OpenSSH Client** (Check with `ssh -V`)
   - Already installed on Windows 10/11
   - If not: `Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0`

## Quick Start

### Option 1: Automated Script (Recommended)

**Update the script first:**

Edit `deploy-migrations-ssh.ps1` and set:
```powershell
$SSH_USER = "root"  # or your username
```

**Run the script:**
```powershell
.\deploy-migrations-ssh.ps1
```

The script will:
1. Test SSH connection
2. Upload all 59 migration files
3. Create and execute migration script on server
4. Apply migrations to your Supabase database
5. Show verification results

### Option 2: Manual Steps

If you prefer to do it step-by-step:

**1. Connect to server:**
```powershell
ssh root@209.145.59.219
```

**2. Create temp directory:**
```bash
mkdir -p /tmp/supabase-migrations
```

**3. Upload migrations (from your local machine):**
```powershell
scp -r .\supabase\migrations\*.sql root@209.145.59.219:/tmp/supabase-migrations/
```

**4. Back on the server, run migrations:**
```bash
cd /tmp/supabase-migrations

# Set variables
DB_CONN="postgresql://postgres:C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24@localhost:5432/postgres"
CONTAINER="supabase-db-rwwccs4k8o8kog4s0w4ggggg"

# Setup tracking
docker exec $CONTAINER psql "$DB_CONN" <<'EOF'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz DEFAULT now()
);
EOF

# Apply each migration
for file in $(ls -1 *.sql | sort); do
    version="${file%.sql}"
    echo "Applying $file..."
    docker cp "$file" ${CONTAINER}:/tmp/
    docker exec $CONTAINER psql "$DB_CONN" -f "/tmp/$file"
    docker exec $CONTAINER psql "$DB_CONN" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$file') ON CONFLICT DO NOTHING;"
done

# Verify
docker exec $CONTAINER psql "$DB_CONN" -c "\dt"
```

## Troubleshooting

### SSH Key Issues
```powershell
# Use password authentication
ssh -o PreferredAuthentications=password root@209.145.59.219

# Or specify SSH key
ssh -i C:\path\to\your\key.pem root@209.145.59.219
```

### Different SSH Port
If Coolify uses a different SSH port:
```powershell
ssh -p 2222 root@209.145.59.219  # Replace 2222 with actual port
```

### Container Name Issues
Find the exact container name:
```bash
docker ps | grep supabase
```

### Permission Denied
```bash
# If using non-root user
sudo docker exec $CONTAINER psql "$DB_CONN" ...
```

## Verification Commands

After migration, verify on the server:

```bash
# Check tables exist
docker exec supabase-db-rwwccs4k8o8kog4s0w4ggggg psql \
  "postgresql://postgres:C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24@localhost:5432/postgres" \
  -c "\dt"

# Check migration history
docker exec supabase-db-rwwccs4k8o8kog4s0w4ggggg psql \
  "postgresql://postgres:C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24@localhost:5432/postgres" \
  -c "SELECT * FROM supabase_migrations.schema_migrations ORDER BY inserted_at DESC LIMIT 10;"

# Count total tables
docker exec supabase-db-rwwccs4k8o8kog4s0w4ggggg psql \
  "postgresql://postgres:C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24@localhost:5432/postgres" \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## What Gets Migrated

✅ All database schemas
✅ All tables with constraints
✅ All functions and triggers
✅ Row Level Security policies
✅ Indexes and sequences
✅ Extensions (pgcrypto, uuid-ossp, etc.)

## Next Steps After Migration

1. **Update application environment variables** - Point to new Supabase URL
2. **Deploy Edge Functions** - Set up in Coolify
3. **Migrate data** - If you have existing data from managed Supabase
4. **Test authentication** - Verify auth flows work
5. **Set up backups** - Configure Coolify backup schedule
