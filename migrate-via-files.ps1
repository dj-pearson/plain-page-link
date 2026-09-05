# Migration via Individual psql Commands
# This sends each migration file content directly to the database

$DB_HOST = "supabasekong-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24"

# Set environment variable for password
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Supabase Migration to Coolify" -ForegroundColor Cyan
Write-Host "Testing all connection methods..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Try different connection methods
$connectionMethods = @(
    @{Name="SSL Disable"; Params="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'sslmode=disable'"},
    @{Name="SSL Prefer"; Params="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"},
    @{Name="IP Direct SSL Disable"; Params="-h 209.145.59.219 -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'sslmode=disable'"},
    @{Name="IP Direct"; Params="-h 209.145.59.219 -p $DB_PORT -U $DB_USER -d $DB_NAME"}
)

$workingConnection = $null

foreach ($method in $connectionMethods) {
    Write-Host "[TEST] Trying: $($method.Name)..." -ForegroundColor Yellow
    $testCmd = "psql $($method.Params) -c 'SELECT 1;' 2>&1"
    $result = Invoke-Expression $testCmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] SUCCESS with $($method.Name)!" -ForegroundColor Green
        $workingConnection = $method.Params
        break
    } else {
        Write-Host "[FAIL] $($method.Name) failed" -ForegroundColor Red
    }
}

if (-not $workingConnection) {
    Write-Host ""
    Write-Host "[ERROR] Could not connect with any method!" -ForegroundColor Red
    Write-Host ""
    Write-Host "The database may not allow external connections." -ForegroundColor Yellow
    Write-Host "Please use the Coolify terminal method instead:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to Coolify dashboard" -ForegroundColor White
    Write-Host "2. Open terminal for the Supabase DB container" -ForegroundColor White
    Write-Host "3. Run: cd /tmp" -ForegroundColor White
    Write-Host "4. Upload migrations folder to /tmp" -ForegroundColor White
    Write-Host "5. Run the migrate-from-container.sh script" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[*] Using working connection method for migrations..." -ForegroundColor Cyan
Write-Host ""

# Setup migration tracking
Write-Host "[*] Setting up migration tracking..." -ForegroundColor Yellow
psql $workingConnection -c "CREATE SCHEMA IF NOT EXISTS supabase_migrations;" 2>&1 | Out-Null
psql $workingConnection -c "CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, name text, inserted_at timestamptz DEFAULT now());" 2>&1 | Out-Null
Write-Host "[OK] Migration tracking ready!" -ForegroundColor Green
Write-Host ""

# Apply migrations
$migrationDir = ".\supabase\migrations"
$migrations = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name

Write-Host "[*] Found $($migrations.Count) migration files" -ForegroundColor Cyan
Write-Host ""

foreach ($migration in $migrations) {
    $filename = $migration.Name
    $version = $migration.BaseName

    # Check if already applied
    $checkResult = psql $workingConnection -tAc "SELECT version FROM supabase_migrations.schema_migrations WHERE version='$version';" 2>&1

    if ($checkResult -and $checkResult.Trim() -eq $version) {
        Write-Host "[SKIP] $filename (already applied)" -ForegroundColor Gray
    } else {
        Write-Host "[APPLYING] $filename..." -ForegroundColor Yellow

        # Apply migration by reading file and piping to psql
        $content = Get-Content -Path $migration.FullName -Raw
        $content | psql $workingConnection 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            # Record successful migration
            psql $workingConnection -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$filename') ON CONFLICT (version) DO NOTHING;" 2>&1 | Out-Null
            Write-Host "[OK] Applied $filename" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to apply $filename" -ForegroundColor Red
            Write-Host "Check the file for syntax errors or run manually" -ForegroundColor Yellow
            # Continue with next migration instead of exiting
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Migration Process Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify with:" -ForegroundColor Yellow
Write-Host "psql $workingConnection -c `"\dt`"" -ForegroundColor White
