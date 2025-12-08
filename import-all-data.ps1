# Import all table data from backup file
$remoteHost = "209.145.59.219"
$dbContainer = "supabase-db-rwwccs4k8o8kog4s0w4ggggg"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "BULK DATA IMPORT FROM BACKUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Step 1: Extracting data sections from backup..." -ForegroundColor Green
ssh root@$remoteHost "awk '/^COPY / {print; copying=1; next} copying && /^\\\\./ {print; copying=0; next} copying {print}' /tmp/backup.sql > /tmp/data-only.sql && ls -lh /tmp/data-only.sql"

Write-Host "`nStep 2: Importing data into database..." -ForegroundColor Green
Write-Host "(This may take 2-3 minutes, please wait...)`n" -ForegroundColor Yellow
ssh root@$remoteHost "docker exec -i $dbContainer psql -U postgres -d postgres -f /tmp/data-only.sql 2>&1 | grep -E '(COPY|ERROR|INSERT)' | tail -30"

Write-Host "`nStep 3: Checking table row counts..." -ForegroundColor Green
ssh root@$remoteHost "docker exec $dbContainer psql -U postgres -d postgres -t -c `"SELECT schemaname || '.' || tablename AS table_name, n_live_tup AS total_rows FROM pg_stat_user_tables WHERE schemaname IN ('public', 'auth') AND n_live_tup > 0 ORDER BY n_live_tup DESC LIMIT 20`""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
