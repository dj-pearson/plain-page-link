# ============================================================================
# AgentBio Stripe Products Setup Script
# ============================================================================
# This script creates all required Stripe products, prices, and payment links
# for the AgentBio platform using Stripe CLI.
#
# Prerequisites:
# 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Login to Stripe: stripe login
# 3. Make sure you're in the correct mode (test/live)
#
# Usage:
#   .\setup-stripe-products.ps1              # Interactive mode
#   .\setup-stripe-products.ps1 -Live        # Production mode
#   .\setup-stripe-products.ps1 -TestOnly    # Test mode only
#
# ============================================================================

param(
    [switch]$Live,
    [switch]$TestOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host @"

AgentBio Stripe Products Setup Script
=====================================

This script creates the following Stripe resources:
- 4 Products (Starter, Professional, Team, Enterprise)
- 8 Prices (monthly and yearly for each product)
- 8 Payment Links (for easy checkout)

Prerequisites:
  1. Stripe CLI installed (https://stripe.com/docs/stripe-cli)
  2. Logged in to Stripe CLI: stripe login

Usage:
  .\setup-stripe-products.ps1              # Interactive mode (asks for confirmation)
  .\setup-stripe-products.ps1 -Live        # Production mode
  .\setup-stripe-products.ps1 -TestOnly    # Test mode only

After running, the script outputs environment variables to add to:
  - Supabase Edge Function Secrets (for STRIPE_PRICE_* variables)
  - Frontend .env.local (for VITE_STRIPE_* variables)

"@
    exit 0
}

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

# Check if Stripe CLI is installed
function Test-StripeCLI {
    try {
        $version = stripe --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Stripe CLI found: $version"
            return $true
        }
    } catch {
        Write-Error "Stripe CLI not found. Please install it from: https://stripe.com/docs/stripe-cli"
        return $false
    }
    return $false
}

# Check Stripe login status
function Test-StripeLogin {
    try {
        $result = stripe config --list 2>&1
        if ($result -match "test_mode" -or $result -match "live_mode") {
            return $true
        }
    } catch {
        Write-Error "Not logged in to Stripe. Run: stripe login"
        return $false
    }
    return $false
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  AgentBio Stripe Products Setup Script" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# Check prerequisites
if (-not (Test-StripeCLI)) { exit 1 }
if (-not (Test-StripeLogin)) { exit 1 }

# Determine mode
$mode = if ($Live) { "--live" } else { "" }
$modeLabel = if ($Live) { "LIVE/PRODUCTION" } else { "TEST" }

Write-Warning "Mode: $modeLabel"
Write-Host ""

if (-not $TestOnly -and -not $Live) {
    Write-Warning "Running in TEST mode. Use -Live flag for production."
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Aborted."
        exit 0
    }
}

if ($Live) {
    Write-Warning "WARNING: You are about to create products in LIVE mode!"
    Write-Warning "This will affect your production Stripe account."
    $confirm = Read-Host "Are you sure? Type 'yes' to continue"
    if ($confirm -ne "yes") {
        Write-Info "Aborted."
        exit 0
    }
}

Write-Host ""
Write-Info "Creating products and prices..."
Write-Host ""

# Store created IDs
$results = @{
    products = @{}
    prices = @{}
    paymentLinks = @{}
}

# ============================================================================
# PRODUCT DEFINITIONS
# ============================================================================

$products = @(
    @{
        name = "AgentBio Starter"
        internal_name = "starter"
        description = "Perfect for new agents. 10 listings, 15 links, 90-day analytics."
        monthly_price = 1900  # $19.00 in cents
        yearly_price = 18900  # $189.00 in cents (17% off)
        metadata = @{
            plan_name = "starter"
            listings = "10"
            links = "15"
            testimonials = "10"
            analytics_days = "90"
        }
    },
    @{
        name = "AgentBio Professional"
        internal_name = "professional"
        description = "For growing agents. 25 listings, unlimited links, custom domain, 1-year analytics."
        monthly_price = 3900  # $39.00 in cents
        yearly_price = 38900  # $389.00 in cents (17% off)
        metadata = @{
            plan_name = "professional"
            listings = "25"
            links = "unlimited"
            testimonials = "25"
            analytics_days = "365"
            custom_domain = "true"
            remove_branding = "true"
        }
    },
    @{
        name = "AgentBio Team"
        internal_name = "team"
        description = "For teams and brokerages. Unlimited everything, priority support. Per agent pricing (5 minimum)."
        monthly_price = 2900  # $29.00 per agent in cents
        yearly_price = 28900  # $289.00 per agent in cents (17% off)
        metadata = @{
            plan_name = "team"
            listings = "unlimited"
            links = "unlimited"
            testimonials = "unlimited"
            analytics_days = "730"
            custom_domain = "true"
            remove_branding = "true"
            priority_support = "true"
            per_agent = "true"
        }
    },
    @{
        name = "AgentBio Enterprise"
        internal_name = "enterprise"
        description = "For large brokerages. Custom solutions, dedicated support, API access."
        monthly_price = 9900  # $99.00 in cents
        yearly_price = 98900  # $989.00 in cents (17% off)
        metadata = @{
            plan_name = "enterprise"
            listings = "unlimited"
            links = "unlimited"
            testimonials = "unlimited"
            analytics_days = "unlimited"
            custom_domain = "true"
            remove_branding = "true"
            priority_support = "true"
            api_access = "true"
            dedicated_support = "true"
        }
    }
)

# ============================================================================
# CREATE PRODUCTS AND PRICES
# ============================================================================

foreach ($product in $products) {
    Write-Info "Creating product: $($product.name)"

    # Build metadata string
    $metadataArgs = @()
    foreach ($key in $product.metadata.Keys) {
        $metadataArgs += "-d"
        $metadataArgs += "metadata[$key]=$($product.metadata[$key])"
    }

    # Create product
    $productResult = stripe products create `
        --name="$($product.name)" `
        --description="$($product.description)" `
        $mode `
        $metadataArgs `
        --format=json 2>&1 | ConvertFrom-Json

    if ($productResult.id) {
        $productId = $productResult.id
        $results.products[$product.internal_name] = $productId
        Write-Success "  Product created: $productId"

        # Create monthly price
        Write-Info "  Creating monthly price..."
        $monthlyPriceResult = stripe prices create `
            --product="$productId" `
            --currency=usd `
            --unit-amount=$($product.monthly_price) `
            --recurring.interval=month `
            -d "metadata[plan_name]=$($product.internal_name)" `
            -d "metadata[interval]=monthly" `
            $mode `
            --format=json 2>&1 | ConvertFrom-Json

        if ($monthlyPriceResult.id) {
            $monthlyPriceId = $monthlyPriceResult.id
            $results.prices["$($product.internal_name)_monthly"] = $monthlyPriceId
            Write-Success "    Monthly price: $monthlyPriceId (`$$($product.monthly_price / 100)/month)"

            # Create payment link for monthly
            Write-Info "    Creating monthly payment link..."
            $monthlyLinkResult = stripe payment_links create `
                --line-items[0][price]="$monthlyPriceId" `
                --line-items[0][quantity]=1 `
                $mode `
                --format=json 2>&1 | ConvertFrom-Json

            if ($monthlyLinkResult.url) {
                $results.paymentLinks["$($product.internal_name)_monthly"] = $monthlyLinkResult.url
                Write-Success "    Payment link: $($monthlyLinkResult.url)"
            }
        }

        # Create yearly price
        Write-Info "  Creating yearly price..."
        $yearlyPriceResult = stripe prices create `
            --product="$productId" `
            --currency=usd `
            --unit-amount=$($product.yearly_price) `
            --recurring.interval=year `
            -d "metadata[plan_name]=$($product.internal_name)" `
            -d "metadata[interval]=yearly" `
            $mode `
            --format=json 2>&1 | ConvertFrom-Json

        if ($yearlyPriceResult.id) {
            $yearlyPriceId = $yearlyPriceResult.id
            $results.prices["$($product.internal_name)_yearly"] = $yearlyPriceId
            Write-Success "    Yearly price: $yearlyPriceId (`$$($product.yearly_price / 100)/year)"

            # Create payment link for yearly
            Write-Info "    Creating yearly payment link..."
            $yearlyLinkResult = stripe payment_links create `
                --line-items[0][price]="$yearlyPriceId" `
                --line-items[0][quantity]=1 `
                $mode `
                --format=json 2>&1 | ConvertFrom-Json

            if ($yearlyLinkResult.url) {
                $results.paymentLinks["$($product.internal_name)_yearly"] = $yearlyLinkResult.url
                Write-Success "    Payment link: $($yearlyLinkResult.url)"
            }
        }
    } else {
        Write-Error "  Failed to create product: $($product.name)"
    }

    Write-Host ""
}

# ============================================================================
# OUTPUT RESULTS
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "PRODUCTS CREATED:" -ForegroundColor Cyan
foreach ($key in $results.products.Keys) {
    Write-Host "  $key`: $($results.products[$key])"
}

Write-Host ""
Write-Host "PRICES CREATED:" -ForegroundColor Cyan
foreach ($key in $results.prices.Keys) {
    Write-Host "  $key`: $($results.prices[$key])"
}

Write-Host ""
Write-Host "PAYMENT LINKS CREATED:" -ForegroundColor Cyan
foreach ($key in $results.paymentLinks.Keys) {
    Write-Host "  $key`: $($results.paymentLinks[$key])"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  Environment Variables to Set" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "# Add these to Supabase Edge Function Secrets:" -ForegroundColor Cyan
Write-Host "# Dashboard -> Settings -> Edge Functions -> Secrets" -ForegroundColor Gray
Write-Host ""
Write-Host "STRIPE_PRICE_STARTER_MONTHLY=$($results.prices['starter_monthly'])"
Write-Host "STRIPE_PRICE_STARTER_YEARLY=$($results.prices['starter_yearly'])"
Write-Host "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$($results.prices['professional_monthly'])"
Write-Host "STRIPE_PRICE_PROFESSIONAL_YEARLY=$($results.prices['professional_yearly'])"
Write-Host "STRIPE_PRICE_TEAM_MONTHLY=$($results.prices['team_monthly'])"
Write-Host "STRIPE_PRICE_TEAM_YEARLY=$($results.prices['team_yearly'])"
Write-Host "STRIPE_PRICE_ENTERPRISE_MONTHLY=$($results.prices['enterprise_monthly'])"
Write-Host "STRIPE_PRICE_ENTERPRISE_YEARLY=$($results.prices['enterprise_yearly'])"

Write-Host ""
Write-Host "# Payment Links (for direct checkout - add to your marketing materials):" -ForegroundColor Cyan
Write-Host ""
foreach ($key in $results.paymentLinks.Keys) {
    $envKey = $key.ToUpper() -replace "_", "_"
    Write-Host "STRIPE_PAYMENT_LINK_$envKey=$($results.paymentLinks[$key])"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  Next Steps" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add the STRIPE_PRICE_* variables to Supabase Edge Function Secrets"
Write-Host "2. Update your subscription_plans table with the new price IDs"
Write-Host "3. Configure your Stripe webhook endpoint:"
Write-Host "   URL: https://your-project.supabase.co/functions/v1/stripe-webhook"
Write-Host "   Events: checkout.session.completed, customer.subscription.*, invoice.*"
Write-Host "4. Add STRIPE_WEBHOOK_SECRET to Supabase Edge Function Secrets"
Write-Host ""

# Save results to file
$outputFile = "stripe-setup-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$results | ConvertTo-Json -Depth 10 | Out-File $outputFile
Write-Success "Results saved to: $outputFile"

Write-Host ""
Write-Success "Done! Your Stripe products are ready."
