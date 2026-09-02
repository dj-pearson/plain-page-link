# URGENT FIX: Coolify Not Loading Repository Files

## The Real Problem

Your build is failing with:
```
#4 [internal] load build context
#4 transferring context: 2B done
```

This means **only 2 bytes** (basically nothing) is being transferred to the build context. Your repository files aren't being copied to Coolify's build directory.

## Root Cause

Coolify is building the Dockerfile in an **empty directory** without your Git repository files. The Dockerfile exists, but `supabase/functions/`, `supabase/config.toml`, and `edge-functions-server.ts` are not in the build context.

---

## SOLUTION 1: Fix Git Source Connection (Recommended)

### Step 1: Check Source Configuration

In Coolify Dashboard → Your Edge Functions Service:

1. Click on **"Source"** tab (this is CRITICAL)
2. Verify these settings:
   - **Repository**: Should be `github.com/your-username/plain-page-link` (or your repo)
   - **Branch**: `main`
   - **Commit SHA**: Should show latest commit
   
If ANY of these are missing or empty, **your repo isn't connected**.

### Step 2: Reconnect Your Repository

If Source tab is not configured:

1. **Delete the current service** (backup your environment variables first!)
2. Create a **new service**:
   - Type: **"Application"** 
   - Choose: **"Public Repository"** or **"GitHub App"**
   - Repository: `https://github.com/dj-pearson/plain-page-link.git`
   - Branch: `main`
   - Build Pack: **Dockerfile**
   - Dockerfile Location: `Dockerfile` (or leave blank)
   - Base Directory: `/` (or leave blank)

3. Add your environment variables back:
   ```
   SUPABASE_URL=https://api.agentbio.net
   SUPABASE_ANON_KEY=<your-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-key>
   ```

4. Set Ports Exposes: `8000`

5. Deploy

This should properly clone your repo and build it.

---

## SOLUTION 2: Use Docker Compose (Alternative)

If the Git integration is problematic, use docker-compose:

### Step 1: Commit docker-compose file

```bash
git add docker-compose.edge-functions.yml
git commit -m "Add docker-compose for edge functions"
git push
```

### Step 2: Create New Service in Coolify

1. In Coolify, add a **new service**
2. Choose **"Docker Compose"**
3. Repository: Connect your GitHub repo
4. Branch: `main`
5. Docker Compose Location: `docker-compose.edge-functions.yml`
6. Add environment variables (same as before)
7. Deploy

---

## SOLUTION 3: Quick Test - Manual Docker Build on Server

To verify this is a Coolify issue and not a Dockerfile issue, SSH into your Coolify server and test manually:

```bash
# SSH to your server
ssh user@209.145.59.219

# Clone your repo manually
cd /tmp
git clone https://github.com/dj-pearson/plain-page-link.git
cd plain-page-link

# Try building manually
docker build -t edge-functions-test -f Dockerfile .
```

**If this works**, the Dockerfile is fine - it's definitely a Coolify source configuration issue.

**If this fails**, there might be permission issues on the server.

---

## SOLUTION 4: Dockerfile with Git Clone (Workaround)

If you can't get Coolify to sync your repo, make the Dockerfile clone it itself:

```dockerfile
# Edge Functions Server - Self-Cloning Version
FROM denoland/deno:1.42.0

# Set working directory
WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Clone the repository
ARG GIT_REPO=https://github.com/dj-pearson/plain-page-link.git
ARG GIT_BRANCH=main
RUN git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPO} /tmp/repo

# Copy required files from cloned repo
RUN cp -r /tmp/repo/supabase/functions ./functions && \
    cp /tmp/repo/supabase/config.toml ./config.toml && \
    cp /tmp/repo/edge-functions-server.ts ./server.ts

# Clean up
RUN rm -rf /tmp/repo

# Cache dependencies
RUN deno cache server.ts

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))"

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server.ts"]
```

This is a **workaround** - the Dockerfile will clone the repo itself during build. It's not ideal but it works when Coolify can't sync your repo.

To use this:
1. Save as `Dockerfile.gitclone`
2. In Coolify, set Dockerfile Location to: `Dockerfile.gitclone`
3. Deploy

---

## Debugging Steps

### Check 1: What Files Are in Coolify's Build Context?

Look at your build logs again. Find this section:
```
cd /artifacts/fccscwgwswswow8gc0scc8gs && ... docker build ...
```

The build is happening in `/artifacts/fccscwgwswswow8gc0scc8gs`. If you can SSH to your Coolify server, check what's in that directory during/after a build:

```bash
# On Coolify server
sudo docker exec fccscwgwswswow8gc0scc8gs ls -la /artifacts/fccscwgwswswow8gc0scc8gs/
```

You should see your repo files. If you only see the Dockerfile, then Coolify isn't syncing your repo.

### Check 2: Verify .dockerignore isn't too aggressive

The `.dockerignore` we created might be excluding too much. Try this minimal version:

```
node_modules
.git
dist
```

### Check 3: Check Coolify's "Source" Tab

This is the most likely issue. If the Source tab doesn't show your connected repository, that's the problem.

---

## The Real Fix (Most Likely)

Based on the logs, I strongly believe your Coolify service is **NOT connected to your Git repository at all**. 

**Coolify has two types of services:**

1. **Application (with Git)**: Clones your repo, then builds
2. **Dockerfile (standalone)**: Expects you to manually provide files

You likely created a "Dockerfile (standalone)" service, which doesn't auto-sync your Git repo.

**Solution**: Create an **"Application"** type service instead, connect it to your GitHub repo, and it will automatically clone your code before building.

---

## Quick Action Plan

**DO THIS NOW:**

1. ✅ Commit all the files we created:
   ```bash
   git add Dockerfile .dockerignore docker-compose.edge-functions.yml
   git commit -m "Add Dockerfile and compose config"
   git push origin main
   ```

2. ✅ In Coolify, **DELETE** your current edge functions service (save env vars first)

3. ✅ Create a **NEW** service:
   - Type: **Application**
   - Source: **GitHub** (connect your repo)
   - Repository: `dj-pearson/plain-page-link`
   - Branch: `main`
   - Build Pack: **Dockerfile**
   - Dockerfile: `Dockerfile`
   - Ports: `8000`

4. ✅ Add environment variables back

5. ✅ Deploy

This should work because Coolify will properly clone your repository before building.

---

## Still Not Working?

If none of these work, the issue might be:

1. **Private repo without SSH key**: Coolify can't access your repo
2. **Coolify bug**: Try updating Coolify
3. **File permissions**: The Coolify server can't read certain directories

Let me know which solution you want to try first, or if you need help with any of these steps!

