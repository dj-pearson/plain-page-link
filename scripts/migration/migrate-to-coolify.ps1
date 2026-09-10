# ============================================
# Migration Script for Coolify Self-Hosted Supabase (PowerShell)
# ============================================

# CONFIGURATION - Update these with your Coolify Supabase details
$DB_HOST = "supabasekong-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24"

$CONNECTION_STRING = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Supabase Migration to Coolify" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if psql is available
Write-Host "[*] Checking for PostgreSQL client..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "[OK] Found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] psql not found! Please install PostgreSQL client." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Test connection
Write-Host "[*] Testing database connection..." -ForegroundColor Yellow
$testQuery = "SELECT version();"
$result = psql $CONNECTION_STRING -c $testQuery 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Connection failed! Please check your credentials." -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Connection successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Create migration tracking
Write-Host "[*] Setting up migration tracking..." -ForegroundColor Yellow

# Create schema
psql $CONNECTION_STRING -c "CREATE SCHEMA IF NOT EXISTS supabase_migrations;" 2>&1 | Out-Null

# Create table
$createTableSQL = "CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, name text, inserted_at timestamptz DEFAULT now());"
psql $CONNECTION_STRING -c $createTableSQL 2>&1 | Out-Null

Write-Host "[OK] Migration tracking ready!" -ForegroundColor Green
Write-Host ""

# Step 4: Apply migrations
Write-Host "[*] Applying migrations..." -ForegroundColor Yellow
$migrationDir = ".\supabase\migrations"

if (-not (Test-Path $migrationDir)) {
    Write-Host "[ERROR] Migration directory not found: $migrationDir" -ForegroundColor Red
    exit 1
}

$migrations = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name

Write-Host "Found $($migrations.Count) migration files" -ForegroundColor Cyan
Write-Host ""

foreach ($migration in $migrations) {
    $filename = $migration.Name
    $version = $migration.BaseName

    # Check if already applied
    $checkQuery = "SELECT version FROM supabase_migrations.schema_migrations WHERE version='$version';"
    $applied = psql $CONNECTION_STRING -tAc $checkQuery 2>&1

    if ($applied -and $applied.Trim() -eq $version) {
        Write-Host "[SKIP] $filename (already applied)" -ForegroundColor Gray
    } else {
        Write-Host "[APPLYING] $filename..." -ForegroundColor Yellow

        # Apply migration
        $applyResult = psql $CONNECTION_STRING -f $migration.FullName 2>&1

        if ($LASTEXITCODE -eq 0) {
            # Record successful migration
            $recordQuery = "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$filename') ON CONFLICT (version) DO NOTHING;"
            psql $CONNECTION_STRING -c $recordQuery 2>&1 | Out-Null
            Write-Host "[OK] Applied $filename" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to apply $filename" -ForegroundColor Red
            Write-Host $applyResult -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify tables: psql `"$CONNECTION_STRING`" -c `"\dt`"" -ForegroundColor White
Write-Host "2. Check migration status: psql `"$CONNECTION_STRING`" -c `"SELECT * FROM supabase_migrations.schema_migrations ORDER BY inserted_at;`"" -ForegroundColor White
Write-Host "3. Deploy Edge Functions to Coolify" -ForegroundColor White
Write-Host "4. Update your app's environment variables" -ForegroundColor White
Write-Host ""
