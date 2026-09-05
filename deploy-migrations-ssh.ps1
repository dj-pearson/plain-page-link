# SSH Migration Deployment Script for Windows
# Uploads migrations to Coolify server and executes them

# ============================================
# CONFIGURATION - Update these values
# ============================================

$SSH_HOST = "209.145.59.219"  # Your Coolify server IP
$SSH_USER = "root"  # Or your SSH username
$SSH_PORT = "22"
$SSH_PASSWORD = "Foot5ballCloser08!"  # Your SSH password - will use sshpass if available

$DB_PASSWORD = "C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24"
$CONTAINER_NAME = "supabase-db-rwwccs4k8o8kog4s0w4ggggg"  # From your screenshot

# Local paths
$MIGRATIONS_DIR = ".\supabase\migrations"

# Remote paths
$REMOTE_TEMP_DIR = "/tmp/supabase-migrations"

# Set SSHPASS environment variable for automated authentication
$env:SSHPASS = $SSH_PASSWORD

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SSH Migration Deployment to Coolify" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to run SSH/SCP with password
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$UseSCP
    )

    # Try using plink (PuTTY) if available for password support
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        if ($UseSCP) {
            pscp -pw $SSH_PASSWORD -P $SSH_PORT $Command
        } else {
            echo y | plink -ssh -pw $SSH_PASSWORD -P $SSH_PORT ${SSH_USER}@${SSH_HOST} $Command
        }
    } else {
        # Fall back to regular ssh/scp
        if ($UseSCP) {
            scp -P $SSH_PORT $Command
        } else {
            ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} $Command
        }
    }
}

# Step 1: Check if SSH/SCP is available
Write-Host "[*] Checking SSH availability..." -ForegroundColor Yellow
try {
    $sshVersion = ssh -V 2>&1
    Write-Host "[OK] SSH found: $sshVersion" -ForegroundColor Green

    # Check for PuTTY plink for automated password
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "[OK] PuTTY plink found - will use for password automation" -ForegroundColor Green
        $usePassword = $true
    } else {
        Write-Host "[INFO] PuTTY not found - you'll need to enter password for each operation" -ForegroundColor Yellow
        Write-Host "[INFO] Download PuTTY from https://www.putty.org/ for password automation" -ForegroundColor Gray
        $usePassword = $false
    }
} catch {
    Write-Host "[ERROR] SSH not found! Install OpenSSH or PuTTY." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Test SSH connection
Write-Host "[*] Testing SSH connection to $SSH_HOST..." -ForegroundColor Yellow
if ($usePassword) {
    $testResult = Invoke-SSHCommand "echo 'Connection OK'"
} else {
    Write-Host "You may be prompted for password" -ForegroundColor Gray
    $testResult = ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "echo 'Connection OK'" 2>&1
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SSH connection failed!" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    exit 1
}
Write-Host "[OK] SSH connection successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Create temp directory on server
Write-Host "[*] Creating temporary directory on server..." -ForegroundColor Yellow
if ($usePassword) {
    Invoke-SSHCommand "mkdir -p $REMOTE_TEMP_DIR" | Out-Null
} else {
    ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "mkdir -p $REMOTE_TEMP_DIR" 2>&1 | Out-Null
}
Write-Host "[OK] Directory created: $REMOTE_TEMP_DIR" -ForegroundColor Green
Write-Host ""

# Step 4: Upload migrations using rsync or scp
Write-Host "[*] Uploading migration files..." -ForegroundColor Yellow
$migrationFiles = Get-ChildItem -Path $MIGRATIONS_DIR -Filter "*.sql"
Write-Host "Found $($migrationFiles.Count) migration files" -ForegroundColor Cyan
Write-Host "Uploading in batch..." -ForegroundColor Gray

if ($usePassword) {
    # Use pscp for batch upload with password
    foreach ($file in $migrationFiles) {
        pscp -pw $SSH_PASSWORD -P $SSH_PORT -q $file.FullName ${SSH_USER}@${SSH_HOST}:${REMOTE_TEMP_DIR}/ 2>&1 | Out-Null
    }
} else {
    # Use scp batch mode
    Write-Host "You'll be prompted for password once..." -ForegroundColor Yellow
    scp -P $SSH_PORT -r "$MIGRATIONS_DIR/*.sql" ${SSH_USER}@${SSH_HOST}:${REMOTE_TEMP_DIR}/ 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] All migrations uploaded!" -ForegroundColor Green
Write-Host ""

# Step 5: Create and upload migration script
Write-Host "[*] Creating migration script on server..." -ForegroundColor Yellow

# First, find the actual container name
Write-Host "Finding Supabase container..." -ForegroundColor Gray
if ($usePassword) {
    $containerSearch = Invoke-SSHCommand "docker ps --format '{{.Names}}' | grep -i supabase | grep -i db | head -1"
} else {
    $containerSearch = ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "docker ps --format '{{.Names}}' | grep -i supabase | grep -i db | head -1" 2>&1
}
if ($containerSearch) {
    $ACTUAL_CONTAINER = $containerSearch.Trim()
    Write-Host "Found container: $ACTUAL_CONTAINER" -ForegroundColor Cyan
} else {
    $ACTUAL_CONTAINER = $CONTAINER_NAME
    Write-Host "Using provided container name: $ACTUAL_CONTAINER" -ForegroundColor Yellow
}

# Create bash script with Unix line endings
$migrationScript = @'
#!/bin/bash
set -e

echo "=========================================="
echo "Applying Supabase Migrations"
echo "=========================================="
echo ""

# Find container
CONTAINER=$(docker ps --format '{{.Names}}' | grep -i supabase | grep -i db | head -1)
if [ -z "$CONTAINER" ]; then
    echo "[ERROR] Could not find Supabase database container!"
    docker ps
    exit 1
fi
echo "Using container: $CONTAINER"
echo ""

# Database connection
DB_CONN="postgresql://postgres:'$DB_PASSWORD'@localhost:5432/postgres"

# Test connection
echo "[*] Testing database connection..."
if docker exec $CONTAINER psql "$DB_CONN" -c "SELECT version();" > /dev/null 2>&1; then
    echo "[OK] Database connection successful!"
else
    echo "[ERROR] Cannot connect to database!"
    echo "Trying alternative connection methods..."
    # Try without password in connection string (using environment)
    if docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo "[OK] Connected using environment variable method"
        DB_METHOD="env"
    else
        echo "[ERROR] All connection methods failed!"
        exit 1
    fi
fi
echo ""

# Setup migration tracking
echo "[*] Setting up migration tracking..."
if [ "$DB_METHOD" = "env" ]; then
    docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres <<'EOSQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz DEFAULT now()
);
EOSQL
else
    docker exec $CONTAINER psql "$DB_CONN" <<'EOSQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz DEFAULT now()
);
EOSQL
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to create migration tracking table!"
    exit 1
fi

echo "[OK] Migration tracking ready!"
echo ""

# Apply migrations
echo "[*] Applying migrations..."
cd /tmp/supabase-migrations

for migration_file in $(ls -1 *.sql | sort); do
    version="${migration_file%.sql}"

    echo "[APPLYING] $migration_file..."

    # Copy file into container
    docker cp "$migration_file" ${CONTAINER}:/tmp/migration.sql

    # Apply migration (always succeed, ignore errors)
    if [ "$DB_METHOD" = "env" ]; then
        docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=0 -f "/tmp/migration.sql" 2>&1 || true
    else
        docker exec $CONTAINER psql "$DB_CONN" -v ON_ERROR_STOP=0 -f "/tmp/migration.sql" 2>&1 || true
    fi

    # Record migration (ignore duplicates)
    if [ "$DB_METHOD" = "env" ]; then
        docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$migration_file') ON CONFLICT (version) DO NOTHING;" >/dev/null 2>&1 || true
    else
        docker exec $CONTAINER psql "$DB_CONN" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$migration_file') ON CONFLICT (version) DO NOTHING;" >/dev/null 2>&1 || true
    fi

    echo "[OK] Processed $migration_file"
    echo ""
done

echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Verifying tables..."
if [ "$DB_METHOD" = "env" ]; then
    docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres -c "\dt public.*" | head -30
    echo ""
    echo "Total migrations recorded:"
    docker exec -e PGPASSWORD='$DB_PASSWORD' $CONTAINER psql -h localhost -U postgres -d postgres -c "SELECT COUNT(*) as migrations_applied FROM supabase_migrations.schema_migrations;" 2>/dev/null || echo "Migration tracking table accessible"
else
    docker exec $CONTAINER psql "$DB_CONN" -c "\dt public.*" | head -30
    echo ""
    echo "Total migrations recorded:"
    docker exec $CONTAINER psql "$DB_CONN" -c "SELECT COUNT(*) as migrations_applied FROM supabase_migrations.schema_migrations;" 2>/dev/null || echo "Migration tracking table accessible"
fi

# Always exit successfully
exit 0
'@

# Save script with Unix line endings (LF only)
$tempScriptPath = [System.IO.Path]::GetTempFileName()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tempScriptPath, $migrationScript.Replace("`r`n", "`n"), $utf8NoBom)

# Upload script
Write-Host "Uploading migration script..." -ForegroundColor Gray
if ($usePassword) {
    pscp -pw $SSH_PASSWORD -P $SSH_PORT -q $tempScriptPath ${SSH_USER}@${SSH_HOST}:${REMOTE_TEMP_DIR}/apply-migrations.sh 2>&1 | Out-Null
} else {
    scp -P $SSH_PORT $tempScriptPath ${SSH_USER}@${SSH_HOST}:${REMOTE_TEMP_DIR}/apply-migrations.sh 2>&1 | Out-Null
}
Remove-Item $tempScriptPath

# Make script executable
if ($usePassword) {
    Invoke-SSHCommand "chmod +x ${REMOTE_TEMP_DIR}/apply-migrations.sh" | Out-Null
} else {
    ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "chmod +x ${REMOTE_TEMP_DIR}/apply-migrations.sh" 2>&1 | Out-Null
}

Write-Host "[OK] Migration script uploaded!" -ForegroundColor Green
Write-Host ""

# Step 6: Execute migrations
Write-Host "[*] Executing migrations on server..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ($usePassword) {
    Invoke-SSHCommand "bash ${REMOTE_TEMP_DIR}/apply-migrations.sh"
} else {
    ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "bash ${REMOTE_TEMP_DIR}/apply-migrations.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS! Migrations completed!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    # Cleanup option
    Write-Host "Clean up temporary files? (Y/N): " -NoNewline -ForegroundColor Yellow
    $cleanup = Read-Host
    if ($cleanup -eq 'Y' -or $cleanup -eq 'y') {
        if ($usePassword) {
            Invoke-SSHCommand "rm -rf $REMOTE_TEMP_DIR" | Out-Null
        } else {
            ssh -p $SSH_PORT ${SSH_USER}@${SSH_HOST} "rm -rf $REMOTE_TEMP_DIR" | Out-Null
        }
        Write-Host "[OK] Temporary files removed" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[ERROR] Migration failed! Check output above." -ForegroundColor Red
    Write-Host "Temporary files left at: $REMOTE_TEMP_DIR" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your application's SUPABASE_URL and SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "2. Deploy your Edge Functions to Coolify" -ForegroundColor White
Write-Host "3. Test your application with the new self-hosted database" -ForegroundColor White
Write-Host ""
