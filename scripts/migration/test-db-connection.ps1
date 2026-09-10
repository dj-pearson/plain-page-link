# Database Connection Diagnostics
# Test various connection methods to Coolify Supabase

$DB_HOST = "supabasekong-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24"

Write-Host "=== PostgreSQL Connection Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if port is open
Write-Host "[TEST 1] Checking if port 5432 is reachable..." -ForegroundColor Yellow
try {
    $tcpTest = Test-NetConnection -ComputerName "209.145.59.219" -Port 5432 -WarningAction SilentlyContinue
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "[OK] Port 5432 is open and reachable" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Port 5432 is not reachable" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Network test failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Try connection with SSL mode disable
Write-Host "[TEST 2] Trying connection with sslmode=disable..." -ForegroundColor Yellow
$conn1 = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
$result1 = psql $conn1 -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connected with sslmode=disable" -ForegroundColor Green
    Write-Host "Use this connection string!" -ForegroundColor Cyan
} else {
    Write-Host "[FAIL] $result1" -ForegroundColor Red
}
Write-Host ""

# Test 3: Try connection with SSL mode prefer
Write-Host "[TEST 3] Trying connection with sslmode=prefer..." -ForegroundColor Yellow
$conn2 = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=prefer"
$result2 = psql $conn2 -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connected with sslmode=prefer" -ForegroundColor Green
} else {
    Write-Host "[FAIL] $result2" -ForegroundColor Red
}
Write-Host ""

# Test 4: Try connection with SSL mode require
Write-Host "[TEST 4] Trying connection with sslmode=require..." -ForegroundColor Yellow
$conn3 = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
$result3 = psql $conn3 -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connected with sslmode=require" -ForegroundColor Green
} else {
    Write-Host "[FAIL] $result3" -ForegroundColor Red
}
Write-Host ""

# Test 5: Try using IP directly
Write-Host "[TEST 5] Trying connection with IP address directly..." -ForegroundColor Yellow
$conn4 = "postgresql://${DB_USER}:${DB_PASSWORD}@209.145.59.219:${DB_PORT}/${DB_NAME}?sslmode=disable"
$result4 = psql $conn4 -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connected using IP address" -ForegroundColor Green
} else {
    Write-Host "[FAIL] $result4" -ForegroundColor Red
}
Write-Host ""

# Test 6: Try with alternative authentication
Write-Host "[TEST 6] Trying connection with trust authentication..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD
$result5 = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connected using environment variable method" -ForegroundColor Green
} else {
    Write-Host "[FAIL] $result5" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Diagnostics Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If none worked, the issue might be:" -ForegroundColor Yellow
Write-Host "1. Coolify firewall blocking external connections" -ForegroundColor White
Write-Host "2. PostgreSQL pg_hba.conf not allowing your IP" -ForegroundColor White
Write-Host "3. Database not fully initialized yet" -ForegroundColor White
Write-Host "4. Need to use connection pooler (PgBouncer) instead" -ForegroundColor White
