# Edge Functions Migration Script
# This PowerShell script will help migrate all supabase.functions.invoke() calls to use the new edge functions

Write-Host "Edge Functions Migration Tool" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$files = @(
    "src/hooks/useSSO.ts",
    "src/hooks/useSessions.ts",
    "src/hooks/useLoginSecurity.ts",
    "src/hooks/useMFA.ts",
    "src/hooks/useGDPR.ts",
    "src/hooks/useAuditLog.ts",
    "src/hooks/useSocialMedia.ts",
    "src/hooks/useSearchAnalytics.ts",
    "src/hooks/useContentSuggestions.ts",
    "src/hooks/useArticleWebhooks.ts",
    "src/hooks/useArticles.ts",
    "src/hooks/useAIConfiguration.ts",
    "src/components/pageBuilder/blocks/ContactBlock.tsx",
    "src/components/admin/seo/KeywordsTracker.tsx",
    "src/components/admin/SEOManager.tsx",
    "src/pages/tools/ListingDescriptionGenerator.tsx",
    "src/pages/tools/InstagramBioAnalyzer.tsx",
    "src/pages/onboarding/OnboardingWizardPage.tsx",
    "src/pages/Pricing.tsx",
    "src/lib/visitorAnalytics.ts",
    "src/lib/usageTracking.ts"
)

Write-Host "Files to migrate: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Migration Steps:" -ForegroundColor Cyan
Write-Host "1. Add import: import { edgeFunctions } from '@/lib/edgeFunctions';" -ForegroundColor White
Write-Host "2. Replace: supabase.functions.invoke -> edgeFunctions.invoke" -ForegroundColor White
Write-Host "3. Or use typed helpers like EdgeFunctions.checkUsername()" -ForegroundColor White
Write-Host ""
Write-Host "Note: Manual review required for each file to ensure correct migration" -ForegroundColor Yellow

