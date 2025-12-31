# Backend Deployment Fix - Switch from Bun to Node.js Runtime

## Problem Summary
The current setup uses Bun to bundle the application, which causes environment variables to be inlined at build time instead of being read at runtime. This prevents production environment variables from being loaded correctly.

## Solution
Use Bun as package manager only, and Node.js as the runtime. TypeScript will compile (not bundle) the code, allowing `dotenv` to work correctly.

---

## Changes Required

### 1. Delete Test File
Delete the root `index.ts` file (it's just a test file):

```bash
rm /Users/mchamouda/Documents/builds/headshotprorecording/backend/index.ts
```

Or on server:
```bash
cd /home/deploy/backend/_work/headshotpro-backend/headshotpro-backend
rm index.ts
```

---

### 2. Update `package.json`

**File:** `backend/package.json`

Change these lines:

```json
{
  "name": "backend",
  "module": "src/server.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/server.ts",
    "build": "tsc",
    "start:prod": "node dist/server.js"
  }
}
```

**What changed:**
- `"module": "src/server.ts"` (was `"index.ts"`)
- `"build": "tsc"` (was `"tsc && bun build..."`)
- `"start:prod": "node dist/server.js"` (was `"bun dist/server.js"`)

---

### 3. Update `tsconfig.json`

**File:** `backend/tsconfig.json`

Update the config to:

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    },
    "rootDir": "./src",
    "outDir": "./dist",
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": false,

    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**What changed:**
- Added `"rootDir": "./src"`
- Changed `"noEmit": false` (was `true`)
- Added `"include": ["src/**/*"]`
- Added `"exclude": ["node_modules", "dist"]`

---

### 4. Restore `dotenv.config()` in Config

**File:** `backend/src/config/index.ts`

**Uncomment the dotenv lines** (lines 1-3):

```typescript
import dotenv from "dotenv";

dotenv.config();

export const config = {
  // ... rest of your config
};
```

**Remove any debug console.log statements if present.**

---

### 5. Update GitHub Actions Workflow

**File:** `backend/.github/workflows/node.js.yml`

Update the **"🚀 Restart Application"** step (around line 63-71):

```yaml
# Step 6: Restart the application
- name: 🚀 Restart Application
  run: |
    cd ${{ github.workspace }}
    pm2 delete backend || true
    pm2 start dist/server.js --name backend --interpreter node
    pm2 save
    echo "✅ Backend deployment completed successfully!"
```

**What changed:**
- `pm2 start dist/server.js` (was `dist/index.js`)
- `--interpreter node` (was `--interpreter bun`)
- Removed ecosystem.config.cjs reference
- Removed env export commands

---

### 6. Delete Ecosystem Config (Optional)

**File:** `backend/ecosystem.config.cjs`

This file is no longer needed. You can delete it:

```bash
rm /Users/mchamouda/Documents/builds/headshotprorecording/backend/ecosystem.config.cjs
```

Or keep it for reference.

---

## Testing Locally

Before pushing, test the build locally:

```bash
cd /Users/mchamouda/Documents/builds/headshotprorecording/backend

# Install dependencies
bun install

# Build
bun run build

# Check output
ls -la dist/

# You should see dist/server.js (not dist/src/server.js)
# Test run
node dist/server.js
```

---

## Deployment Steps

1. Make all the changes above
2. Commit and push:
   ```bash
   git add .
   git commit -m "Fix: Switch to Node.js runtime with TypeScript compilation"
   git push origin main
   ```
3. GitHub Actions will automatically:
   - Pull the code
   - Create `.env` from secrets
   - Install dependencies with Bun
   - Build with TypeScript
   - Restart PM2 with Node.js
4. Check logs on server:
   ```bash
   pm2 logs backend --lines 50
   ```

You should now see:
- ✅ `Connecting to production database`
- ✅ All environment variables loaded correctly
- ✅ No "Hello via Bun!" messages

---

## Manual Server Test (If Needed)

SSH to server and run:

```bash
cd /home/deploy/backend/_work/headshotpro-backend/headshotpro-backend

# Check Node.js is available
node --version

# Rebuild
export PATH="$HOME/.bun/bin:$PATH"
bun install
bun run build

# Check output
ls -la dist/
cat dist/server.js | head -10

# Restart PM2
pm2 delete backend || true
pm2 start dist/server.js --name backend --interpreter node
pm2 save

# Check logs
pm2 logs backend --lines 30
```

---

## Why This Works

1. **TypeScript compilation** preserves the code structure without bundling
2. **dotenv.config()** reads `.env` file at runtime (not build time)
3. **Node.js interpreter** handles ES modules properly
4. **Bun still used** for fast package installation
5. **No bundling issues** with environment variables

---

## Verification Checklist

After deployment, verify:

- [ ] `pm2 list` shows backend running with Node.js
- [ ] Logs show "Connecting to production database"
- [ ] API endpoints respond correctly
- [ ] Environment variables are loaded (check logs for NODE_ENV)
- [ ] No "Hello via Bun!" in logs

---

## Rollback Plan

If something goes wrong, you can manually restart with the old approach on the server:

```bash
cd /home/deploy/backend/_work/headshotpro-backend/headshotpro-backend
pm2 delete backend
pm2 start dist/index.js --name backend --interpreter bun
pm2 save
```

---

## Notes

- Keep Bun for development (`bun --watch src/server.ts` still works)
- Production uses Node.js for stability and proper env var handling
- TypeScript compilation is faster than bundling
- `.env` file must exist in the same directory as the running script

