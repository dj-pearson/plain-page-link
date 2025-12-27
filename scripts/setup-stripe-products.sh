#!/bin/bash
# ============================================================================
# AgentBio Stripe Products Setup Script (Bash version)
# ============================================================================
# This script creates all required Stripe products, prices, and payment links
# for the AgentBio platform using Stripe CLI.
#
# Prerequisites:
# 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Login to Stripe: stripe login
#
# Usage:
#   ./setup-stripe-products.sh              # Test mode (default)
#   ./setup-stripe-products.sh --live       # Production mode
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Parse arguments
LIVE_MODE=""
if [[ "$1" == "--live" || "$1" == "-l" ]]; then
    LIVE_MODE="--live"
    echo -e "${RED}WARNING: Running in LIVE/PRODUCTION mode!${NC}"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo ""
echo -e "${MAGENTA}============================================${NC}"
echo -e "${MAGENTA}  AgentBio Stripe Products Setup Script${NC}"
echo -e "${MAGENTA}============================================${NC}"
echo ""

# Check prerequisites
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}Stripe CLI not found. Please install it from: https://stripe.com/docs/stripe-cli${NC}"
    exit 1
fi

if ! stripe config --list &> /dev/null; then
    echo -e "${RED}Not logged in to Stripe. Run: stripe login${NC}"
    exit 1
fi

echo -e "${CYAN}Stripe CLI found. Creating products...${NC}"
echo ""

# Arrays to store results
declare -A PRODUCTS
declare -A PRICES
declare -A PAYMENT_LINKS

# Function to create a product with prices
create_product() {
    local name="$1"
    local internal_name="$2"
    local description="$3"
    local monthly_price="$4"
    local yearly_price="$5"
    local plan_metadata="$6"

    echo -e "${CYAN}Creating product: $name${NC}"

    # Create product
    product_result=$(stripe products create \
        --name="$name" \
        --description="$description" \
        -d "metadata[plan_name]=$internal_name" \
        $LIVE_MODE \
        --format=json 2>/dev/null)

    product_id=$(echo "$product_result" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$product_id" ]]; then
        echo -e "${RED}  Failed to create product${NC}"
        return 1
    fi

    PRODUCTS[$internal_name]=$product_id
    echo -e "${GREEN}  Product created: $product_id${NC}"

    # Create monthly price
    echo -e "${CYAN}  Creating monthly price...${NC}"
    monthly_result=$(stripe prices create \
        --product="$product_id" \
        --currency=usd \
        --unit-amount="$monthly_price" \
        --recurring[interval]=month \
        -d "metadata[plan_name]=$internal_name" \
        -d "metadata[interval]=monthly" \
        $LIVE_MODE \
        --format=json 2>/dev/null)

    monthly_id=$(echo "$monthly_result" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -n "$monthly_id" ]]; then
        PRICES["${internal_name}_monthly"]=$monthly_id
        echo -e "${GREEN}    Monthly price: $monthly_id (\$$(echo "scale=2; $monthly_price/100" | bc)/month)${NC}"

        # Create payment link
        link_result=$(stripe payment_links create \
            --line-items[0][price]="$monthly_id" \
            --line-items[0][quantity]=1 \
            $LIVE_MODE \
            --format=json 2>/dev/null)

        link_url=$(echo "$link_result" | grep -o '"url": "[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ -n "$link_url" ]]; then
            PAYMENT_LINKS["${internal_name}_monthly"]=$link_url
            echo -e "${GREEN}    Payment link: $link_url${NC}"
        fi
    fi

    # Create yearly price
    echo -e "${CYAN}  Creating yearly price...${NC}"
    yearly_result=$(stripe prices create \
        --product="$product_id" \
        --currency=usd \
        --unit-amount="$yearly_price" \
        --recurring[interval]=year \
        -d "metadata[plan_name]=$internal_name" \
        -d "metadata[interval]=yearly" \
        $LIVE_MODE \
        --format=json 2>/dev/null)

    yearly_id=$(echo "$yearly_result" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -n "$yearly_id" ]]; then
        PRICES["${internal_name}_yearly"]=$yearly_id
        echo -e "${GREEN}    Yearly price: $yearly_id (\$$(echo "scale=2; $yearly_price/100" | bc)/year)${NC}"

        # Create payment link
        link_result=$(stripe payment_links create \
            --line-items[0][price]="$yearly_id" \
            --line-items[0][quantity]=1 \
            $LIVE_MODE \
            --format=json 2>/dev/null)

        link_url=$(echo "$link_result" | grep -o '"url": "[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ -n "$link_url" ]]; then
            PAYMENT_LINKS["${internal_name}_yearly"]=$link_url
            echo -e "${GREEN}    Payment link: $link_url${NC}"
        fi
    fi

    echo ""
}

# Create all products
create_product \
    "AgentBio Starter" \
    "starter" \
    "Perfect for new agents. 10 listings, 15 links, 90-day analytics." \
    1900 \
    18900

create_product \
    "AgentBio Professional" \
    "professional" \
    "For growing agents. 25 listings, unlimited links, custom domain, 1-year analytics." \
    3900 \
    38900

create_product \
    "AgentBio Team" \
    "team" \
    "For teams and brokerages. Unlimited everything, priority support. Per agent pricing." \
    2900 \
    28900

create_product \
    "AgentBio Enterprise" \
    "enterprise" \
    "For large brokerages. Custom solutions, dedicated support, API access." \
    9900 \
    98900

# Output results
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${CYAN}PRODUCTS CREATED:${NC}"
for key in "${!PRODUCTS[@]}"; do
    echo "  $key: ${PRODUCTS[$key]}"
done

echo ""
echo -e "${CYAN}PRICES CREATED:${NC}"
for key in "${!PRICES[@]}"; do
    echo "  $key: ${PRICES[$key]}"
done

echo ""
echo -e "${CYAN}PAYMENT LINKS CREATED:${NC}"
for key in "${!PAYMENT_LINKS[@]}"; do
    echo "  $key: ${PAYMENT_LINKS[$key]}"
done

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  Environment Variables to Set${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "# Add these to Supabase Edge Function Secrets:"
echo "# Dashboard -> Settings -> Edge Functions -> Secrets"
echo ""
echo "STRIPE_PRICE_STARTER_MONTHLY=${PRICES[starter_monthly]}"
echo "STRIPE_PRICE_STARTER_YEARLY=${PRICES[starter_yearly]}"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=${PRICES[professional_monthly]}"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=${PRICES[professional_yearly]}"
echo "STRIPE_PRICE_TEAM_MONTHLY=${PRICES[team_monthly]}"
echo "STRIPE_PRICE_TEAM_YEARLY=${PRICES[team_yearly]}"
echo "STRIPE_PRICE_ENTERPRISE_MONTHLY=${PRICES[enterprise_monthly]}"
echo "STRIPE_PRICE_ENTERPRISE_YEARLY=${PRICES[enterprise_yearly]}"
echo ""
echo "# Payment Links:"
for key in "${!PAYMENT_LINKS[@]}"; do
    upper_key=$(echo "$key" | tr '[:lower:]' '[:upper:]')
    echo "STRIPE_PAYMENT_LINK_${upper_key}=${PAYMENT_LINKS[$key]}"
done

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  Next Steps${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "1. Add the STRIPE_PRICE_* variables to Supabase Edge Function Secrets"
echo "2. Update your subscription_plans table with the new price IDs"
echo "3. Configure your Stripe webhook endpoint"
echo "4. Add STRIPE_WEBHOOK_SECRET to Supabase Edge Function Secrets"
echo ""

# Save results to file
output_file="stripe-setup-results-$(date +%Y%m%d-%H%M%S).json"
cat > "$output_file" << EOF
{
  "products": {
$(for key in "${!PRODUCTS[@]}"; do echo "    \"$key\": \"${PRODUCTS[$key]}\","; done | sed '$ s/,$//')
  },
  "prices": {
$(for key in "${!PRICES[@]}"; do echo "    \"$key\": \"${PRICES[$key]}\","; done | sed '$ s/,$//')
  },
  "paymentLinks": {
$(for key in "${!PAYMENT_LINKS[@]}"; do echo "    \"$key\": \"${PAYMENT_LINKS[$key]}\","; done | sed '$ s/,$//')
  }
}
EOF

echo -e "${GREEN}Results saved to: $output_file${NC}"
echo ""
echo -e "${GREEN}Done! Your Stripe products are ready.${NC}"
