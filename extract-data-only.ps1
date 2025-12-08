# Extract and import data from backup file
# This extracts COPY statements and imports them to the new database

$remoteHost = "209.145.59.219"
$remoteUser = "root"
$remotePassword = "Foot5ballCloser08!"
$dbContainer = "supabase-db-rwwccs4k8o8kog4s0w4ggggg"
$dbPassword = "C2o2aHEhDjLf5R6Q5mKnD7O1FTSR0s24"
$backupFile = "/tmp/backup.sql"

Write-Host "Extracting table list from backup..." -ForegroundColor Cyan

# Get list of tables with data
$sshCommand = @"
grep -n '^COPY public\.' $backupFile | head -20
"@

# Save to file for plink execution
$sshCommand | Out-File -FilePath "temp-extract-cmd.sh" -Encoding ASCII -NoNewline

Write-Host "Connecting to server to list tables with data..." -ForegroundColor Yellow
& "C:\Program Files\PuTTY\plink.exe" -batch -pw $remotePassword "$remoteUser@$remoteHost" -m temp-extract-cmd.sh

Remove-Item "temp-extract-cmd.sh" -ErrorAction SilentlyContinue
