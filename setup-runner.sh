#!/bin/bash

# GitHub Actions Self-Hosted Runner Setup Script
# For AgentBio on Coolify Server

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GitHub Actions Runner Setup for AgentBio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run this script as root"
   echo "Run as: bash setup-runner.sh"
   exit 1
fi

# Variables
RUNNER_VERSION="2.311.0"
RUNNER_DIR="$HOME/actions-runner"
REPO_URL="https://github.com/dj-pearson/plain-page-link"

echo "📦 Step 1: Installing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update system
sudo apt update

# Install Node.js 20.x if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✓ Node.js already installed: $(node --version)"
fi

# Install build essentials
sudo apt install -y git curl wget build-essential

echo ""
echo "📁 Step 2: Setting up runner directory..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create runner directory
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download runner if not already downloaded
if [ ! -f "bin/Runner.Listener" ]; then
    echo "Downloading GitHub Actions Runner v$RUNNER_VERSION..."
    curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
        https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
    
    echo "Extracting..."
    tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
    rm actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
else
    echo "✓ Runner already downloaded"
fi

echo ""
echo "🔑 Step 3: Runner Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To get your registration token:"
echo "1. Go to: https://github.com/dj-pearson/plain-page-link/settings/actions/runners"
echo "2. Click 'New self-hosted runner'"
echo "3. Select 'Linux' and 'x64'"
echo "4. Copy the registration token"
echo ""
read -p "Enter your registration token: " RUNNER_TOKEN

if [ -z "$RUNNER_TOKEN" ]; then
    echo "❌ Token is required. Exiting."
    exit 1
fi

echo ""
echo "Configuring runner..."
./config.sh --url $REPO_URL --token $RUNNER_TOKEN --name "coolify-runner-1" --labels "self-hosted,Linux,X64,coolify"

echo ""
echo "🚀 Step 4: Installing as service..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install service
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Check status
echo ""
echo "Checking service status..."
sleep 2
sudo ./svc.sh status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Actions Runner Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Runner Status:"
echo "   - Name: coolify-runner-1"
echo "   - Status: Running"
echo "   - Location: $RUNNER_DIR"
echo ""
echo "📝 Useful Commands:"
echo "   sudo ./svc.sh status    # Check status"
echo "   sudo ./svc.sh stop      # Stop runner"
echo "   sudo ./svc.sh start     # Start runner"
echo "   sudo journalctl -u actions.runner.* -f  # View logs"
echo ""
echo "🔗 Check runner in GitHub:"
echo "   https://github.com/dj-pearson/plain-page-link/settings/actions/runners"
echo ""
echo "📚 Next Steps:"
echo "   1. Verify runner shows as 'Idle' (green) in GitHub"
echo "   2. Update workflows to use 'self-hosted'"
echo "   3. Push a commit to test"
echo ""

