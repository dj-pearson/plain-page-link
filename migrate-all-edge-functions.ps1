# Comprehensive Edge Functions Migration Script
# This will update all remaining files with supabase.functions.invoke calls

Write-Host "`n=== Edge Functions Migration Script ===" -ForegroundColor Cyan
Write-Host "This script will update all remaining edge function calls`n" -ForegroundColor White

$files = @(
    "src/hooks/useSSO.ts",
    "src/hooks/useSessions.ts",
    "src/hooks/useLoginSecurity.ts",
    "src/hooks/useGDPR.ts",
    "src/hooks/useAuditLog.ts",
    "src/hooks/useSocialMedia.ts",
    "src/hooks/useSearchAnalytics.ts",
    "src/hooks/useContentSuggestions.ts",
    "src/hooks/useArticleWebhooks.ts",
    "src/hooks/useAIConfiguration.ts",
    "src/components/admin/seo/KeywordsTracker.tsx",
    "src/components/admin/SEOManager.tsx",
    "src/pages/onboarding/OnboardingWizardPage.tsx",
    "src/pages/Pricing.tsx",
    "src/lib/visitorAnalytics.ts",
    "src/lib/usageTracking.ts"
)

$updatedCount = 0
$errorCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        try {
            # Read file content
            $content = Get-Content $file -Raw
            
            # Check if already updated
            if ($content -match 'edgeFunctions') {
                Write-Host "  ✓ Already updated" -ForegroundColor Green
                continue
            }
            
            # Check if it has supabase.functions.invoke
            if ($content -notmatch 'supabase\.functions\.invoke') {
                Write-Host "  ℹ No edge functions found" -ForegroundColor Gray
                continue
            }
            
            # Add import if not present
            if ($content -notmatch 'edgeFunctions') {
                # Find the line with supabase import
                if ($content -match 'import.*from.*@/integrations/supabase/client') {
                    $content = $content -replace '(import.*from.*@/integrations/supabase/client";)', "`$1`nimport { edgeFunctions } from `"@/lib/edgeFunctions`";"
                }
            }
            
            # Replace function calls
            $content = $content -replace 'supabase\.functions\.invoke', 'edgeFunctions.invoke'
            
            # Write back
            Set-Content $file -Value $content -NoNewline
            
            Write-Host "  ✅ Updated successfully" -ForegroundColor Green
            $updatedCount++
        }
        catch {
            Write-Host "  ❌ Error: $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "  ⚠ File not found: $file" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n=== Migration Complete ===" -ForegroundColor Cyan
Write-Host "Updated: $updatedCount files" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "Errors: $errorCount files" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run build:check" -ForegroundColor White
Write-Host "2. Test the application" -ForegroundColor White
Write-Host "3. Check for any TypeScript errors" -ForegroundColor White

