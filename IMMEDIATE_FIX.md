# IMMEDIATE FIX: Use Self-Cloning Dockerfile

## The Problem in Simple Terms

Your Coolify service is NOT syncing your GitHub repository. It only has the Dockerfile but none of your code files (only 2 bytes transferred = empty directory).

## The Immediate Solution

Use `Dockerfile.gitclone` which clones your repository during the Docker build.

## Step-by-Step Instructions

### 1. Commit All New Files

```bash
git add Dockerfile Dockerfile.gitclone .dockerignore docker-compose.edge-functions.yml COOLIFY_SOURCE_FIX.md
git commit -m "Add multiple Dockerfile options for Coolify deployment"
git push origin main
```

### 2. Update Coolify Configuration

In Coolify → Your Edge Functions Service → General Tab:

**Change this one setting:**
```
Dockerfile Location: Dockerfile.gitclone
```

That's it! Just change from `Dockerfile` to `Dockerfile.gitclone`.

**Keep everything else the same:**
- Base Directory: `/`
- Ports Exposes: `8000`
- Environment variables: (keep as is)

### 3. Deploy

Click **"Deploy"** button.

### 4. What Will Happen

The `Dockerfile.gitclone` will:
1. ✅ Start with Deno base image
2. ✅ Install git in the container
3. ✅ Clone your GitHub repository
4. ✅ Copy the required files (`supabase/functions/`, `supabase/config.toml`, `edge-functions-server.ts`)
5. ✅ Delete the cloned repo to save space
6. ✅ Cache Deno dependencies
7. ✅ Start the edge functions server

### 5. Expected Result

Build logs should show:
```
✅ Cloning into '/tmp/repo'...
✅ Copying files...
✅ Caching dependencies...
✅ Successfully built
✅ Container started
```

Then test:
```bash
curl https://z4owkscok0o8c40c00co0k8k.209.145.59.219.sslip.io/health
```

Should return:
```json
{
  "status": "ok",
  "functions": 15,
  "available": [...]
}
```

---

## Why This Works

`Dockerfile.gitclone` doesn't rely on Coolify to sync your repo. Instead, it:
- Clones the repo itself during `docker build`
- Copies only what's needed
- Works even if Coolify's Git sync is broken

---

## After It Works

Once this is deployed successfully, you can:

1. **Keep using this approach** (it works fine, just rebuilds from git each time)
2. **OR** Fix the proper Git source integration (see `COOLIFY_SOURCE_FIX.md`)

---

## If It Still Fails

If `Dockerfile.gitclone` also fails with "not found" errors, then:

1. **Your GitHub repo is private** and Coolify can't access it
   - Solution: Make repo public temporarily, or configure SSH keys in Coolify

2. **Network issue** - Coolify server can't reach GitHub
   - Solution: Check firewall/network settings

3. **Different branch** - Code is not in `main` branch
   - Solution: Check which branch has your code, modify `GIT_BRANCH` arg

---

## Commands Summary

```bash
# 1. Commit files
git add Dockerfile Dockerfile.gitclone .dockerignore docker-compose.edge-functions.yml COOLIFY_SOURCE_FIX.md
git commit -m "Add self-cloning Dockerfile for Coolify"
git push origin main

# 2. In Coolify UI:
# - General tab → Dockerfile Location → Change to: Dockerfile.gitclone
# - Click Save
# - Click Deploy

# 3. Test (after deployment succeeds):
curl https://z4owkscok0o8c40c00co0k8k.209.145.59.219.sslip.io/health
```

---

## This Should Work Because:

✅ No dependency on Coolify's Git sync  
✅ Dockerfile handles the git clone itself  
✅ Same files, same build, just different source method  
✅ Public GitHub repo = no auth needed  
✅ Proven pattern used by many Docker deployments  

Try it now!

