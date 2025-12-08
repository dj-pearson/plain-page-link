# GitHub Self-Hosted Runner Setup Guide

## Overview

This guide will help you set up a self-hosted GitHub Actions runner on your Coolify server (or any Linux server) to run CI/CD pipelines.

## Benefits of Self-Hosted Runners

✅ **Faster Builds** - Direct access to your infrastructure  
✅ **Cost Savings** - No GitHub Actions minutes consumed  
✅ **Better Security** - Runs in your private network  
✅ **Custom Environment** - Pre-installed tools and dependencies  
✅ **Direct Database Access** - Can run migrations directly

---

## Prerequisites

-   Linux server (your Coolify server at `209.145.59.219`)
-   Root or sudo access
-   GitHub repository admin access
-   At least 2GB RAM and 10GB disk space

---

## Installation Steps

### Step 1: Access Your Server

```bash
# SSH into your Coolify server
ssh user@209.145.59.219
```

### Step 2: Create Runner Directory

```bash
# Create a directory for the runner
mkdir -p ~/actions-runner
cd ~/actions-runner
```

### Step 3: Download GitHub Actions Runner

```bash
# Download the latest runner package (Linux x64)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### Step 4: Get Registration Token

1. Go to your GitHub repository: `https://github.com/dj-pearson/plain-page-link`
2. Click **Settings** → **Actions** → **Runners**
3. Click **"New self-hosted runner"**
4. Select **Linux** and **x64**
5. Copy the registration token (looks like: `ABCDEFGHIJ...`)

### Step 5: Configure the Runner

```bash
# Configure the runner (interactive)
./config.sh --url https://github.com/dj-pearson/plain-page-link --token YOUR_REGISTRATION_TOKEN

# When prompted:
# - Runner name: coolify-runner-1 (or any name you want)
# - Runner group: Default
# - Labels: self-hosted,Linux,X64 (default is fine)
# - Work folder: _work (default is fine)
```

### Step 6: Install as a Service (Recommended)

```bash
# Install the runner as a systemd service
sudo ./svc.sh install

# Start the runner service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### Alternative: Run Manually (Not Recommended)

```bash
# If you don't want to run as a service
./run.sh
```

---

## Configuration for AgentBio

### Install Required Dependencies

Your runner needs Node.js, npm, and Docker:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add runner user to docker group
sudo usermod -aG docker $(whoami)

# Install additional tools
sudo apt install -y git curl wget build-essential
```

### Set Up Environment Variables

Create a `.env` file for the runner:

```bash
# In your runner directory
cat > ~/actions-runner/.env << 'EOF'
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_EDGE_FUNCTIONS_URL=https://functions.agentbio.net
VITE_APP_URL=https://agentbio.net
DATABASE_URL=your-database-url
EOF

# Secure the file
chmod 600 ~/actions-runner/.env
```

---

## Update Workflows to Use Self-Hosted Runner

### Option 1: Update All Workflows

In each workflow file (`.github/workflows/*.yml`), change:

```yaml
# FROM:
runs-on: ubuntu-latest

# TO:
runs-on: self-hosted
```

### Option 2: Use Matrix Strategy (Recommended)

```yaml
jobs:
    build:
        runs-on: ${{ matrix.runner }}
        strategy:
            matrix:
                runner: [self-hosted] # or [self-hosted, ubuntu-latest] for hybrid
```

This is already set up in your new workflows!

---

## Testing Your Runner

### Test 1: Check Runner Status

1. Go to GitHub repository → Settings → Actions → Runners
2. You should see your runner listed as **"Idle"** (green dot)

### Test 2: Trigger a Workflow

```bash
# Push a small change to trigger CI
git commit --allow-empty -m "Test self-hosted runner"
git push
```

Go to **Actions** tab in GitHub to watch it run on your self-hosted runner.

---

## Managing the Runner

### Check Status

```bash
sudo ./svc.sh status
```

### View Logs

```bash
# Real-time logs
sudo journalctl -u actions.runner.* -f

# Recent logs
sudo journalctl -u actions.runner.* -n 100
```

### Stop Runner

```bash
sudo ./svc.sh stop
```

### Start Runner

```bash
sudo ./svc.sh start
```

### Restart Runner

```bash
sudo ./svc.sh stop
sudo ./svc.sh start
```

### Remove Runner

```bash
# Stop the service
sudo ./svc.sh stop

# Uninstall the service
sudo ./svc.sh uninstall

# Remove runner from GitHub
./config.sh remove --token YOUR_REMOVAL_TOKEN
```

---

## Security Best Practices

### 1. Limit Runner Permissions

```bash
# Create a dedicated user for the runner
sudo useradd -m -s /bin/bash github-runner
sudo su - github-runner

# Then install runner as this user
```

### 2. Use Runner Groups

In GitHub Settings → Actions → Runner groups:

-   Create a group for production runners
-   Limit which workflows can use the group

### 3. Network Security

```bash
# Configure firewall (if using UFW)
sudo ufw allow from 192.30.252.0/22  # GitHub IPs
sudo ufw allow from 185.199.108.0/22
sudo ufw allow from 140.82.112.0/20
sudo ufw allow from 143.55.64.0/20
```

### 4. Monitor Resource Usage

```bash
# Install monitoring
sudo apt install -y htop iotop

# Check resources
htop

# Monitor disk
df -h
```

---

## Troubleshooting

### Runner Not Connecting

```bash
# Check service status
sudo systemctl status actions.runner.*

# Check logs
sudo journalctl -u actions.runner.* --no-pager | tail -50

# Verify network
curl -I https://github.com
```

### Permission Errors

```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) ~/actions-runner
chmod -R 755 ~/actions-runner
```

### Out of Disk Space

```bash
# Clean up old builds
cd ~/actions-runner/_work
rm -rf */

# Clean Docker
docker system prune -a -f
```

### Runner Offline

```bash
# Restart the service
sudo ./svc.sh stop
sudo ./svc.sh start

# If still offline, reconfigure
./config.sh remove --token TOKEN
./config.sh --url https://github.com/dj-pearson/plain-page-link --token NEW_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## Advanced: Multiple Runners

Run multiple runners for parallel builds:

```bash
# Create directories for each runner
mkdir -p ~/actions-runner-1
mkdir -p ~/actions-runner-2

# Set up each runner with a unique name
cd ~/actions-runner-1
./config.sh --url URL --token TOKEN --name runner-1

cd ~/actions-runner-2
./config.sh --url URL --token TOKEN --name runner-2

# Install both as services
cd ~/actions-runner-1 && sudo ./svc.sh install
cd ~/actions-runner-2 && sudo ./svc.sh install

# Start both
cd ~/actions-runner-1 && sudo ./svc.sh start
cd ~/actions-runner-2 && sudo ./svc.sh start
```

---

## Quick Start Script

Save this as `setup-runner.sh`:

```bash
#!/bin/bash

echo "Setting up GitHub Actions Runner..."

# Download and extract
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

echo "Runner downloaded. Please run:"
echo "./config.sh --url https://github.com/dj-pearson/plain-page-link --token YOUR_TOKEN"
echo "sudo ./svc.sh install"
echo "sudo ./svc.sh start"
```

---

## Monitoring & Maintenance

### Set Up Monitoring

```bash
# Install monitoring script
cat > ~/monitor-runner.sh << 'EOF'
#!/bin/bash
STATUS=$(sudo systemctl is-active actions.runner.*)
if [ "$STATUS" != "active" ]; then
  echo "Runner is down! Restarting..."
  sudo ./svc.sh start
fi
EOF

chmod +x ~/monitor-runner.sh

# Add to crontab
crontab -e
# Add: */5 * * * * ~/monitor-runner.sh
```

### Regular Maintenance

```bash
# Weekly cleanup script
cat > ~/cleanup-runner.sh << 'EOF'
#!/bin/bash
echo "Cleaning up old builds..."
cd ~/actions-runner/_work
find . -type d -mtime +7 -exec rm -rf {} +

echo "Cleaning up Docker..."
docker system prune -af --volumes

echo "Cleanup complete!"
EOF

chmod +x ~/cleanup-runner.sh
```

---

## Next Steps

1. ✅ Set up the runner on your server
2. ✅ Test with a simple workflow
3. ✅ Update workflows to use `self-hosted`
4. ✅ Monitor runner performance
5. ✅ Set up monitoring and alerts

---

## Support

**Runner Status:** Check GitHub Settings → Actions → Runners  
**Logs Location:** `~/actions-runner/_diag/`  
**GitHub Docs:** https://docs.github.com/en/actions/hosting-your-own-runners

**Your Server:** `209.145.59.219`  
**Runner Location:** `~/actions-runner`  
**Service Name:** `actions.runner.*`
