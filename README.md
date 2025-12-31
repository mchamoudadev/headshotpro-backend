# 🚀 Complete Deployment Guide for Full Stack Dugsiiye Mentorship

Welcome! 👋 This friendly guide will walk you through deploying a fullstack application (Next.js + Bun backend) using **GitHub Actions** for automatic deployment. 

Don't worry if you're new to deployment - we'll explain everything step by step, and you can always come back to this guide whenever you need help!

---

## 📋 What You'll Deploy

- **Frontend**: Next.js app on `yourdomain.com` (port 3000)
- **Backend**: Bun API on `api.yourdomain.com` (port 8000)
- **Server**: Ubuntu VPS (22.04 or 24.04)
- **Process Manager**: PM2 (keeps apps running)
- **Web Server**: Nginx (handles traffic and SSL)
- **SSL**: Let's Encrypt (free HTTPS certificates)
- **Database**: MongoDB Atlas (cloud database)
- **Deployment**: GitHub Actions (automatic deployment)

---

## 🎯 Deployment Strategy Overview

**Key Concept**: Your `.env` files (containing API keys and secrets) will **NEVER** be in Git or GitHub.

**How it works**:
1. Your code lives in GitHub (public or private)
2. Your secrets live in **GitHub Secrets** (encrypted storage)
3. When you push code → GitHub Actions automatically:
   - Builds your app
   - Connects to your VPS via SSH
   - Pulls the latest code
   - **Creates the `.env` file** on your VPS from GitHub Secrets
   - Restarts your app
4. Your app reads the `.env` file from the VPS and uses the secrets

---


## Part 1: VPS Server Setup (One-Time Setup)

### Step 1: Get Your VPS Ready

When you buy a VPS (from providers like DigitalOcean, Hetzner, Linode,Hostinger, etc.), you'll receive:
- IP address (example: `194.238.22.106`)
- Root password or SSH key

**Login to your server**:
```bash
ssh root@YOUR_SERVER_IP
```

---

### Step 2: Create a Deploy User (Security Best Practice)

Never use root for running apps. Create a dedicated user:

```bash
# Create new user
adduser deploy

# Give it sudo privileges
usermod -aG sudo deploy

# Switch to the new user
su - deploy
```

---

### Step 3: Understanding SSH Keys 🔑

Before we set up SSH keys, let's understand what they are and why we need them.

**What are SSH Keys?**
- SSH (Secure Shell) keys are like a special pair of keys that let you securely connect to your server
- They come in pairs: a **private key** (keep this secret!) and a **public key** (can be shared)
- Think of it like a lock and key: the public key is the lock on your server, the private key is the key you keep

**🔐 Critical Concept:**
> **SSH keys are created on YOUR COMPUTER, but stored on the SERVER per user.**
> 
> This means:
> - Private key stays on your local machine (NEVER share it!)
> - Public key goes to the server (~/.ssh/authorized_keys)
> - Each server user can have different authorized keys

**Why do we need them?**
- More secure than passwords (can't be guessed or brute-forced)
- Required for GitHub Actions to automatically deploy your code
- Industry standard for server access

Now let's set them up! Choose your operating system below:

---

### Step 4: SSH Key Setup for Mac 🍎

**Don't worry, this is easier than it sounds!** Follow along step by step.

#### Step 4a: Open Terminal

1. Press `Cmd + Space` to open Spotlight
2. Type "Terminal" and press Enter
3. You should see a window with a command prompt

#### Step 4b: Generate Your SSH Key

Copy and paste this command into Terminal (press Enter after):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

**Understanding this command (Flag by Flag):**

- **`ssh-keygen`** = The command to generate SSH keys
- **`-t ed25519`** = Specifies the type of key to create
  - `-t` means "type"
  - `ed25519` is a modern, fast, and very secure encryption algorithm
  - Alternative: `-t rsa` (older, still secure but slower)
- **`-C "github-actions-deploy"`** = Adds a comment/label to your key
  - `-C` means "comment"
  - Helps you identify what this key is used for
  - You can use any text here (your email, project name, etc.)
- **`-f ~/.ssh/github_deploy`** = Specifies the filename and location
  - `-f` means "filename"
  - `~/.ssh/` = Your user's SSH directory (home folder → .ssh folder)
  - `github_deploy` = The name of your key file
  - This creates TWO files: `github_deploy` (private) and `github_deploy.pub` (public)

**You'll be asked:**
1. **"Enter passphrase"** → Press Enter (leave it empty for now - this makes automation easier)
2. **"Enter same passphrase again"** → Press Enter again

**Success!** ✅ You'll see:
```
Your identification has been saved in /Users/yourname/.ssh/github_deploy
Your public key has been saved in /Users/yourname/.ssh/github_deploy.pub
```

#### Step 4c: Copy Your Public Key to the Server

Now we need to put your public key on the server. Run this command (replace `YOUR_SERVER_IP` with your actual server IP):

**⚠️ IMPORTANT: Run this command on your LOCAL Mac, NOT on the VPS!**

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@YOUR_SERVER_IP
```

**Understanding this command:**

- **`ssh-copy-id`** = Command that copies your SSH public key to a remote server
- **`-i ~/.ssh/github_deploy.pub`** = Specifies which identity (key) file to copy
  - `-i` means "identity file"
  - Points to your PUBLIC key (the one ending in `.pub`)
- **`deploy@YOUR_SERVER_IP`** = Where to copy the key
  - `deploy` = The username on the server
  - `@` = Separator between user and host
  - `YOUR_SERVER_IP` = Your server's IP address (e.g., 194.238.22.106)

**What this command does automatically:**
1. Connects to your server
2. Creates `~/.ssh` directory if needed
3. Sets correct permissions (`chmod 700 ~/.ssh`)
4. Appends your public key to `~/.ssh/authorized_keys`
5. Sets correct permissions on authorized_keys file (`chmod 600`)

**Example:**
```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@194.238.22.106
```

**You'll be asked:**
- **"Are you sure you want to continue connecting?"** → Type `yes` and press Enter
  - This is the SSH fingerprint verification (first-time only)
- **Password for deploy user** → Enter the password you created in Step 2

**Understanding the password prompt:**
> You will be asked for the `deploy` user password **ONCE ONLY**.
> This is required so the server can accept your SSH key.
> After this step, SSH login will **NOT ask for a password again** - it will use your key instead!

**Success!** ✅ You'll see: "Number of key(s) added: 1"

#### Step 4d: Test Your SSH Connection

Let's make sure it works! Run this command:

```bash
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

**Understanding this test:**
- **`-i ~/.ssh/github_deploy`** = Use this specific identity (private key) file
- If successful: You login **WITHOUT password prompt** 🎉
- This proves your SSH key is working correctly!

**Example:**
```bash
ssh -i ~/.ssh/github_deploy deploy@194.238.22.106
```

**Success looks like:**
```
Welcome to Ubuntu 22.04.3 LTS...
deploy@yourserver:~$
```
**No password prompt = SUCCESS!** ✅

**What should happen:**
- You should login **without** being asked for a password
- You should see your server's welcome message
- Your terminal prompt should change to show you're on the server (e.g., `deploy@yourserver:~$`)

**If it asks for password:**
- Your key setup didn't work
- The `ssh-copy-id` command should have set permissions automatically
- Check the troubleshooting section

**Success!** 🎉 Type `exit` to go back to your local computer.

#### Step 4e: Copy PRIVATE KEY (GitHub Secrets ONLY) 🔐

**🚨 CRITICAL SECURITY WARNING - READ CAREFULLY! 🚨**

This command shows your **PRIVATE KEY** - treat it like your bank password!

```bash
cat ~/.ssh/github_deploy
```

You'll see something starting with `-----BEGIN OPENSSH PRIVATE KEY-----`

**⚠️ PRIVATE KEY SECURITY RULES - NEVER BREAK THESE:**

1. ✅ **ONLY paste this into GitHub → Settings → Secrets**
2. ❌ **NEVER send it on WhatsApp, Slack, or any messaging app**
3. ❌ **NEVER put it in your GitHub repository**
4. ❌ **NEVER put it in your code**
5. ❌ **NEVER show it in screenshots or screen recordings**
6. ❌ **NEVER share it with anyone** (not even your team)
7. ❌ **NEVER email it or paste it in forums**

**If your private key is leaked:**
1. Delete it immediately: `rm ~/.ssh/github_deploy*`
2. Generate a new one (repeat Step 4b)
3. Remove the old public key from the server
4. Update GitHub Secrets with the new key

**Why is this so important?**
- Anyone with your private key can access your server as you
- They can read your data, delete files, or install malware
- It's like giving someone your house keys

**What to do now:**
- Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
- Save it temporarily in a password manager or keep this Terminal window open
- You'll paste it into GitHub Secrets in a later step
- **Do NOT save it in a text file on your desktop!**

---

### Step 5: SSH Key Setup for Windows 🪟

**Two options for Windows users:** Choose the one you prefer!

---

#### **Option A: Using PowerShell (Recommended - Built into Windows 10/11)**

This is the easiest option for most Windows users!

##### Step 5a-1: Open PowerShell

1. Press `Win + X`
2. Click "Windows PowerShell" or "Terminal"
3. You should see a blue window with a command prompt

##### Step 5a-2: Create .ssh Directory (if it doesn't exist)

```powershell
mkdir $HOME\.ssh
```

(Don't worry if it says "already exists" - that's fine!)

##### Step 5a-3: Generate Your SSH Key

Copy and paste this command:

```powershell
ssh-keygen -t ed25519 -C "github-actions-deploy" -f $HOME\.ssh\github_deploy
```

**Understanding this command (Windows PowerShell version):**

- **`ssh-keygen`** = The command to generate SSH keys
- **`-t ed25519`** = Type of encryption algorithm
  - `-t` = "type"
  - `ed25519` = Modern, secure encryption
- **`-C "github-actions-deploy"`** = Comment/label for your key
  - `-C` = "comment"
  - Helps identify this key later
- **`-f $HOME\.ssh\github_deploy`** = File location
  - `-f` = "filename"
  - `$HOME` = PowerShell variable for your user directory (C:\Users\YourName)
  - `\.ssh\` = SSH folder (note: backslash on Windows!)
  - `github_deploy` = Name of your key file

**You'll be asked:**
1. **"Enter passphrase"** → Press Enter (leave empty)
2. **"Enter same passphrase again"** → Press Enter again

**Success!** ✅ You'll see something like:
```
Your identification has been saved in C:\Users\YourName\.ssh\github_deploy
Your public key has been saved in C:\Users\YourName\.ssh\github_deploy.pub
```

##### Step 5a-4: Copy Public Key to Server

**⚠️ IMPORTANT: Run this command on your LOCAL Windows machine, NOT on the VPS!**

```powershell
type $HOME\.ssh\github_deploy.pub | ssh deploy@YOUR_SERVER_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Understanding this command:**
- **`type`** = Windows command to read file contents (like `cat` on Linux)
- **`|`** = Pipe - sends the public key to SSH command
- **`mkdir -p ~/.ssh`** = Create .ssh directory if it doesn't exist
- **`chmod 700 ~/.ssh`** = Set correct permissions on .ssh directory (REQUIRED for SSH security)
- **`cat >> ~/.ssh/authorized_keys`** = Append your public key to authorized keys
- **`chmod 600 ~/.ssh/authorized_keys`** = Set correct permissions on authorized_keys file (REQUIRED!)

**Why permissions matter:**
- Without correct permissions, SSH will **ignore your key** for security reasons
- Server will fall back to password login
- `700` = Only owner can access the directory
- `600` = Only owner can read/write the file

**Example:**
```powershell
type $HOME\.ssh\github_deploy.pub | ssh deploy@194.238.22.106 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**You'll be asked:**
- **Password for deploy user** → Enter the password you created in Step 2

**Understanding the password prompt:**
> You will be asked for the `deploy` user password **ONCE ONLY**.
> This is required so the server can accept your SSH key.
> After this step, SSH login will **NOT ask for a password again** - it will use your key instead!

**Success!** ✅ Your key is now on the server with correct permissions!

##### Step 5a-5: Test Your Connection

```powershell
ssh -i $HOME\.ssh\github_deploy deploy@YOUR_SERVER_IP
```

**Understanding this test:**
- **`-i $HOME\.ssh\github_deploy`** = Use this specific identity (private key) file
- If successful: You login **WITHOUT password prompt** 🎉
- This proves your SSH key is working correctly!

**Success looks like:**
```
Welcome to Ubuntu 22.04.3 LTS...
deploy@yourserver:~$
```
**No password prompt = SUCCESS!** ✅

**If it asks for password:**
- Your key setup didn't work
- Go back to Step 5a-4 and ensure you ran it with `chmod` commands
- Check the troubleshooting section

**To exit:** Type `exit` and press Enter to return to your local computer.

**If it doesn't work at all:** Try Option B below (Git Bash).

##### Step 5a-6: Copy PRIVATE KEY (GitHub Secrets ONLY) 🔐

**🚨 CRITICAL SECURITY WARNING - READ CAREFULLY! 🚨******

This command shows your **PRIVATE KEY** - treat it like your bank password!

```powershell
type $HOME\.ssh\github_deploy
```

**⚠️ PRIVATE KEY SECURITY RULES - NEVER BREAK THESE:**

1. ✅ **ONLY paste this into GitHub → Settings → Secrets**
2. ❌ **NEVER send it on WhatsApp, Slack, or any messaging app**
3. ❌ **NEVER put it in your GitHub repository**
4. ❌ **NEVER put it in your code**
5. ❌ **NEVER show it in screenshots or screen recordings**
6. ❌ **NEVER share it with anyone** (not even your team)
7. ❌ **NEVER email it or paste it in forums**

**If your private key is leaked:**
1. Delete it immediately: `rm $HOME\.ssh\github_deploy*`
2. Generate a new one (repeat Step 5a-3)
3. Remove the old public key from the server
4. Update GitHub Secrets with the new key

**Why is this so important?**
- Anyone with your private key can access your server as you
- They can read your data, delete files, or install malware
- It's like giving someone your house keys

**What to do now:**
- Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
- Save it temporarily in a password manager or keep this window open
- You'll paste it into GitHub Secrets in a later step
- **Do NOT save it in a text file on your desktop!**

---

#### **Option B: Using Git Bash (Alternative for Windows)**

If you have Git installed, you can use Git Bash which works exactly like Mac/Linux!

##### Step 5b-1: Open Git Bash

1. Press `Win + S` and search for "Git Bash"
2. Click "Git Bash" to open it
3. You should see a window similar to Mac Terminal

##### Step 5b-2: Generate Your SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

**You'll be asked:**
1. **"Enter passphrase"** → Press Enter (leave empty)
2. **"Enter same passphrase again"** → Press Enter again

**Success!** ✅ You'll see:
```
Your identification has been saved in /c/Users/YourName/.ssh/github_deploy
```

##### Step 5b-3: Copy Public Key to Server

**⚠️ IMPORTANT: Run this command on your LOCAL Windows machine (in Git Bash), NOT on the VPS!**

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@YOUR_SERVER_IP
```

**Note:** If `ssh-copy-id` doesn't work in Git Bash, use this alternative with proper permissions:

```bash
cat ~/.ssh/github_deploy.pub | ssh deploy@YOUR_SERVER_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Understanding the alternative command:**
- Creates .ssh directory if needed
- Sets correct permissions on directory (`chmod 700`)
- Appends your public key to authorized_keys
- Sets correct permissions on file (`chmod 600`) - **REQUIRED for SSH security!**

**You'll be asked:**
- **Password for deploy user** → Enter the password you created in Step 2

**Understanding the password prompt:**
> You will be asked for the `deploy` user password **ONCE ONLY**.
> After this step, SSH login will **NOT ask for a password again** - it will use your key instead!

##### Step 5b-4: Test Your Connection

```bash
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

**Understanding this test:**
- **`-i ~/.ssh/github_deploy`** = Use this specific identity (private key) file
- If successful: You login **WITHOUT password prompt** 🎉

**Success looks like:**
```
Welcome to Ubuntu 22.04.3 LTS...
deploy@yourserver:~$
```
**No password prompt = SUCCESS!** ✅

**If it asks for password:**
- Go back to Step 5b-3 and use the alternative command with `chmod` included
- Check the troubleshooting section

**Success!** 🎉 Type `exit` to return to your local computer.

##### Step 5b-5: Copy PRIVATE KEY (GitHub Secrets ONLY) 🔐

**🚨 CRITICAL SECURITY WARNING - READ CAREFULLY! 🚨**

This command shows your **PRIVATE KEY** - treat it like your bank password!

```bash
cat ~/.ssh/github_deploy
```

**⚠️ PRIVATE KEY SECURITY RULES - NEVER BREAK THESE:**

1. ✅ **ONLY paste this into GitHub → Settings → Secrets**
2. ❌ **NEVER send it on WhatsApp, Slack, or any messaging app**
3. ❌ **NEVER put it in your GitHub repository**
4. ❌ **NEVER put it in your code**
5. ❌ **NEVER show it in screenshots or screen recordings**
6. ❌ **NEVER share it with anyone** (not even your team)
7. ❌ **NEVER email it or paste it in forums**

**If your private key is leaked:**
1. Delete it immediately: `rm ~/.ssh/github_deploy*`
2. Generate a new one (repeat Step 5b-2)
3. Remove the old public key from the server
4. Update GitHub Secrets with the new key

**What to do now:**
- Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
- Save it temporarily in a password manager
- You'll paste it into GitHub Secrets in a later step
- **Do NOT save it in a text file on your desktop!**

---

#### **Option C: Using PuTTY (Traditional Windows SSH Client)**

If you prefer PuTTY, here's how to set it up:

##### Step 5c-1: Download PuTTY

1. Go to [putty.org](https://www.putty.org/)
2. Download and install PuTTY (includes PuTTYgen)

##### Step 5c-2: Generate Key with PuTTYgen

1. Open **PuTTYgen** (comes with PuTTY)
2. Click **"Generate"**
3. Move your mouse around the blank area to create randomness
4. Click **"Save private key"** → Save as `github_deploy.ppk`
5. Copy the public key from the text box at the top

##### Step 5c-3: Add Public Key to Server

1. Open PuTTY
2. Enter your server IP and login as `deploy` user
3. Run these commands:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

4. Paste your public key (right-click to paste in PuTTY)
5. Press `Ctrl + X`, then `Y`, then Enter to save

```bash
chmod 600 ~/.ssh/authorized_keys
exit
```

##### Step 5c-4: Convert PuTTY Key to OpenSSH Format (for GitHub)

GitHub needs OpenSSH format, not PuTTY format:

1. Open PuTTYgen
2. Click **"Load"** and select your `github_deploy.ppk` file
3. Go to **"Conversions"** → **"Export OpenSSH key"**
4. Save as `github_deploy` (no extension)
5. Open this file in Notepad - this is what you'll use for GitHub Secrets

##### Step 5c-5: Configure PuTTY to Use Your Key

1. Open PuTTY
2. Enter your server IP
3. Go to **Connection → SSH → Auth**
4. Click **"Browse"** and select your `.ppk` file
5. Go back to **Session**, enter a name (e.g., "My VPS"), and click **"Save"**
6. Click **"Open"** to connect

---

### 🎯 SSH Keys Summary - What You Just Learned

**Key Concepts:**
1. ✅ SSH keys are created on **YOUR COMPUTER**
2. ✅ Public key goes to the **SERVER** (in ~/.ssh/authorized_keys)
3. ✅ Private key stays **LOCAL** (NEVER share it!)
4. ✅ Permissions MUST be correct: `700` for .ssh directory, `600` for files
5. ✅ Password asked **ONCE** when copying key, then never again

**Security Checklist:**
- 🔐 Private key is safe (not shared, not in repo)
- 🔓 Public key is on server with correct permissions
- ✅ Can SSH without password using `-i` flag
- 🚫 Never copy private key to server
- 🚫 Never share private key with anyone

**Common Student Mistakes (DON'T DO THESE!):**
1. ❌ Running commands on VPS when they should be on local machine
2. ❌ Sharing private key thinking it's "just for the project"
3. ❌ Forgetting `chmod` commands (SSH will silently fail)
4. ❌ Putting private key in GitHub repo "temporarily"
5. ❌ Copying key with wrong permissions

**If you completed this successfully:**
- 🎉 You understand public-key cryptography!
- 🎉 You can now set up CI/CD securely!
- 🎉 You're using the same method Fortune 500 companies use!

---

### Step 6: SSH Troubleshooting 🔧

**If you're having trouble connecting, try these solutions:**

#### Problem: "Permission denied (publickey)"

This usually means SSH is ignoring your key due to incorrect permissions.

**Solution:**
```bash
# On your server (login with password first)
ssh deploy@YOUR_SERVER_IP

# Fix permissions (CRITICAL!)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify ownership
ls -la ~/.ssh

# Make sure your public key is in the file
cat ~/.ssh/authorized_keys
```

**Understanding these commands:**

- **`chmod 700 ~/.ssh`** = Set directory permissions
  - `700` = Owner can read, write, execute; others cannot access
  - **SSH REQUIRES this - will ignore keys otherwise!**

- **`chmod 600 ~/.ssh/authorized_keys`** = Set file permissions
  - `600` = Owner can read/write; nobody else can access
  - **SSH REQUIRES this for security - non-negotiable!**

- **`ls -la`** = List files with permissions
  - Verify: `.ssh` should show `drwx------` (700)
  - Verify: `authorized_keys` should show `-rw-------` (600)

- **`cat filename`** = Display file contents
  - `cat` = "concatenate" (show file content)
  - Displays entire file on screen
  - Use to verify your public key is there

**Common causes:**
1. Forgot to run `chmod` commands when copying key
2. Edited authorized_keys file (changes permissions sometimes)
3. Wrong user's .ssh directory

#### Problem: "Connection refused"

**Possible causes:**
1. Wrong IP address - Double-check your VPS IP
2. Firewall blocking SSH - Make sure port 22 is open
3. SSH service not running on server

**Solution:**
```bash
# On your server
sudo systemctl status sshd
sudo systemctl start sshd
```

#### Problem: SSH key not working on Windows

**Solution:** Make sure you're using the `-i` flag:
```bash
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

Or use the full path:
```powershell
ssh -i C:\Users\YourName\.ssh\github_deploy deploy@YOUR_SERVER_IP
```

#### Still stuck?

- Make sure you completed Step 2 (creating the deploy user)
- Verify your server IP is correct: `ping YOUR_SERVER_IP`
- Try logging in with password first: `ssh deploy@YOUR_SERVER_IP`
- Check if SSH service is running on your server

---

### Step 7: Harden SSH Security (Disable Password Login) 🔐

**⚠️ CRITICAL SECURITY STEP - Do this AFTER SSH keys work!**

Now that your SSH key is working, let's lock down SSH to prevent password-based attacks.

**Why this matters:**
- Bots constantly try to guess passwords (brute force attacks)
- They try root user first (most common target)
- With keys only, they can't get in even with unlimited tries
- This blocks 99.9% of automated attacks

#### Step 7a: Test SSH Key Works (IMPORTANT!)

**Before disabling passwords, make sure you can login with your key!**

```bash
# From your local computer
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

✅ **If you can login without a password, proceed.**  
❌ **If it asks for password, STOP and fix SSH keys first!**

Locking yourself out means you'll need to use the VPS control panel to regain access.

---

#### Step 7b: Disable Root Login and Password Authentication

**SSH into your server:**

```bash
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

**Edit SSH configuration:**

```bash
sudo nano /etc/ssh/sshd_config
```

**Understanding this file:**
- This is SSH server configuration
- Controls who can login and how
- Changes take effect after restarting SSH service

**Find and modify these lines** (use `Ctrl + W` to search in nano):

**1. Disable root login:**
```bash
# Find this line (might be commented with #):
#PermitRootLogin yes

# Change it to:
PermitRootLogin no
```

**2. Disable password authentication:**
```bash
# Find this line:
#PasswordAuthentication yes

# Change it to:
PasswordAuthentication no
```

**3. Ensure public key authentication is enabled:**
```bash
# Find this line:
#PubkeyAuthentication yes

# Make sure it says (remove # if present):
PubkeyAuthentication yes
```

**4. Optional but recommended - Disable challenge-response:**
```bash
# Find this line:
#ChallengeResponseAuthentication yes

# Change it to:
ChallengeResponseAuthentication no
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` (yes, save)
- Press `Enter` (confirm filename)

---

#### Step 7c: Test Configuration Before Applying

**Test the SSH configuration for syntax errors:**

```bash
sudo sshd -t
```

**Understanding this command:**
- `sshd` = SSH daemon (server)
- `-t` = Test configuration file only (don't start service)
- If successful: Returns to prompt with no output ✅
- If error: Shows what's wrong ❌ (fix before proceeding)

**If you see errors:**
- Open the config file again: `sudo nano /etc/ssh/sshd_config`
- Fix the syntax
- Test again: `sudo sshd -t`

---

#### Step 7d: Restart SSH Service

**⚠️ Keep your current SSH session open! Open a NEW terminal for testing!**

```bash
sudo systemctl restart sshd
```

**Understanding this:**
- Restarts SSH service with new configuration
- Your current connection stays active
- New connections will use new rules

---

#### Step 7e: Test in a NEW Terminal (Don't Close Old One!)

**In a NEW terminal window on your local computer:**

```bash
# Test 1: Key-based login should work
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
# Should work without password ✅

# Exit and test again
exit

# Test 2: Root login should be blocked
ssh root@YOUR_SERVER_IP
# Should show: "Permission denied" ✅

# Test 3: Login without key should fail
ssh deploy@YOUR_SERVER_IP
# Should show: "Permission denied (publickey)" ✅
```

**Expected results:**
1. ✅ With key (`-i`): Login successful
2. ✅ As root: "Permission denied"
3. ✅ Without key: "Permission denied (publickey)"

**If Test 1 fails (can't login with key):**
1. **DON'T CLOSE your original SSH session!**
2. In original session, revert changes:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change back to:
   PasswordAuthentication yes
   # Save and restart: sudo systemctl restart sshd
   ```
3. Figure out why keys aren't working (check Step 6 troubleshooting)

**If all tests pass:**
🎉 **Success!** Your server is now hardened against brute force attacks!

---

#### Step 7f: Understanding What You Just Did

**Security improvements:**

| Before | After |
|--------|-------|
| 💀 Root can login directly | ✅ Root login blocked |
| 💀 Anyone can try passwords | ✅ Keys required |
| 💀 Bots can brute force | ✅ Immune to password attacks |
| 💀 Weak passwords = risk | ✅ Cryptographic keys only |

**Real-world impact:**
- Typical server gets 1000+ login attempts per day
- All automated attacks now fail instantly
- You've eliminated the #1 server compromise method

**Why we do each step:**
1. **PermitRootLogin no**: Forces use of sudo (accountability + security)
2. **PasswordAuthentication no**: Stops all password guessing attacks
3. **PubkeyAuthentication yes**: Only SSH keys can login
4. **ChallengeResponseAuthentication no**: Closes another password-based method

---

### Step 8: Configure Firewall (UFW) 🔒

Now let's add firewall protection! Think of a firewall as a security guard that only lets the right kind of traffic through.

```bash
# Allow SSH, HTTP, and HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Understanding these commands:**

- **`sudo`** = Run command with administrator (root) privileges
  - "sudo" = "superuser do"
  - Required for system-level changes
  - Will ask for your password the first time
  
- **`ufw`** = Uncomplicated Firewall (Ubuntu's firewall manager)
  - Simple firewall interface
  - Manages iptables rules behind the scenes

- **`ufw allow OpenSSH`** = Allow SSH connections
  - `allow` = Open this port
  - `OpenSSH` = Port 22 (SSH service)
  - **CRITICAL:** Do this FIRST or you might lock yourself out!

- **`ufw allow 80/tcp`** = Allow HTTP traffic
  - `80` = Port number for HTTP
  - `/tcp` = Use TCP protocol (standard for web traffic)
  - Needed for: Regular website access, Let's Encrypt verification

- **`ufw allow 443/tcp`** = Allow HTTPS traffic
  - `443` = Port number for HTTPS (secure)
  - Required for encrypted website traffic

- **`ufw enable`** = Turn on the firewall
  - Activates all the rules you just set
  - Firewall will start automatically on reboot

- **`ufw status`** = Show current firewall rules
  - Lists all allowed/blocked ports
  - Shows if firewall is active

**When asked** "Command may disrupt existing ssh connections. Proceed with operation (y|n)?"
→ Type `y` and press Enter (don't worry, OpenSSH is already allowed!)

---

### Step 9: Update System and Install Essential Tools 🛠️

Let's make sure your server has all the latest security updates and tools we'll need.

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git unzip ca-certificates gnupg
```

**Understanding these commands:**

- **`sudo apt update`** = Update package lists
  - `apt` = Advanced Package Tool (Ubuntu's package manager)
  - `update` = Downloads list of available packages and versions
  - Like checking for updates on your phone, but doesn't install them yet

- **`&&`** = Run next command ONLY if previous command succeeds
  - Logical AND operator
  - If `apt update` fails, `apt upgrade` won't run

- **`sudo apt upgrade -y`** = Install available updates
  - `upgrade` = Actually installs the updates
  - `-y` = Automatically answer "yes" to all prompts
  - Without `-y`, it would ask for confirmation

- **`sudo apt install -y`** = Install new packages
  - `install` = Download and install packages
  - `-y` = Auto-confirm installation

- **Packages being installed:**
  - **`curl`** = Command-line tool for downloading files from URLs
    - Used to download Bun, NVM, etc.
  - **`git`** = Version control system
    - Needed to clone your repository
  - **`unzip`** = Extract .zip files
    - Used by various installers
  - **`ca-certificates`** = SSL/TLS certificate authorities
    - Required for HTTPS connections
  - **`gnupg`** = GNU Privacy Guard
    - Used for secure communications and verifying downloads

---

### Step 10: Install Node.js (using NVM) 📦

Node.js is needed to run your frontend. We'll use NVM (Node Version Manager) which makes it easy to install and manage Node versions.

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node -v
npm -v
```

**Understanding these commands:**

- **`curl -o- URL | bash`** = Download and execute installer script
  - `curl` = Download tool
  - `-o-` = Output to stdout (screen) instead of a file
    - `-o` means "output"
    - `-` means "stdout" (standard output)
  - `| bash` = Pipe the downloaded script directly to bash to execute it
    - `|` = "pipe" - sends output of one command to another
    - `bash` = Shell interpreter that runs the script

- **`source ~/.bashrc`** = Reload shell configuration
  - `source` = Execute commands from a file in current shell
  - `~/.bashrc` = Your bash configuration file
  - `~` = Your home directory
  - Needed so NVM commands become available immediately

- **`nvm install --lts`** = Install Node.js Long Term Support version
  - `nvm` = Node Version Manager command
  - `install` = Download and install Node.js
  - `--lts` = Latest stable "Long Term Support" version
    - `--` prefix means it's a "long option" (full word)
    - LTS versions get updates for 30+ months

- **`nvm use --lts`** = Switch to using the LTS version
  - `use` = Set active Node.js version
  - Required if you have multiple Node versions

- **`node -v`** = Show Node.js version
  - `-v` = "version" (short option)
  - Should show something like `v20.11.0`

- **`npm -v`** = Show npm (Node Package Manager) version
  - Comes bundled with Node.js
  - Used for installing JavaScript packages

---

### Step 11: Install Bun ⚡

Bun is the JavaScript runtime we're using for both the backend and frontend. It's super fast!

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.bashrc

# Verify installation
bun -v
```

---

### Step 12: Install PM2 (Process Manager) 🔄

PM2 keeps your apps running and restarts them if they crash:

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 -v
```

**Understanding these commands:**

- **`npm install -g pm2`** = Install PM2 globally
  - `npm` = Node Package Manager
  - `install` = Download and install a package
  - `-g` = Install globally (system-wide)
    - Without `-g`, it installs only in current project
    - Global packages can be used anywhere on the system
  - `pm2` = The package name (Process Manager 2)

- **`pm2 -v`** = Show PM2 version
  - Verifies PM2 was installed correctly

---

### Step 13: Install Nginx (Web Server) 🌐

Nginx will act as a "reverse proxy" - it receives requests from the internet and forwards them to your apps. It also handles SSL certificates for HTTPS!

```bash
# Install Nginx
sudo apt install -y nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Start Nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

**Understanding these commands:**

- **`sudo apt install -y nginx`** = Install Nginx web server
  - Same as earlier package installation
  - `nginx` = High-performance web server and reverse proxy

- **`sudo systemctl enable nginx`** = Make Nginx start automatically on boot
  - `systemctl` = System and service manager for Linux
  - `enable` = Create startup link (doesn't start it now, but will on reboot)
  - Alternative: `disable` would remove auto-start

- **`sudo systemctl start nginx`** = Start Nginx right now
  - `start` = Begin running the service immediately
  - Other options: `stop`, `restart`, `reload`

- **`sudo systemctl status nginx`** = Check if Nginx is running
  - `status` = Show current state of the service
  - Shows: active (running), inactive (stopped), failed, etc.
  - Also shows recent log messages

**Test:** Open `http://YOUR_SERVER_IP` in browser → Should show "Welcome to nginx!"

---

### Step 14: Create Project Directory 📁

Let's create a nice organized place for your application!

```bash
# Create directory for your apps
mkdir -p ~/apps

# Navigate to it
cd ~/apps
```

**Understanding these commands:**

- **`mkdir -p ~/apps`** = Create a directory
  - `mkdir` = "make directory"
  - `-p` = "parents" - create parent directories if they don't exist
    - Without `-p`, it would fail if `~` didn't exist
    - Also, `-p` won't error if directory already exists
  - `~/apps` = Path to create
    - `~` = Your home directory (/home/deploy)
    - `/apps` = Subdirectory named "apps"

- **`cd ~/apps`** = Change directory (navigate to folder)
  - `cd` = "change directory"
  - All subsequent commands will run in this folder

---

## Part 2: Configure Nginx (Web Server)

### Step 15: Create Nginx Configuration 🌐

Let's tell Nginx how to route traffic to your frontend and backend!

```bash
sudo nano /etc/nginx/sites-available/headshotprobuild
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
# =========================
# FRONTEND (HTTP)
# =========================
server {
    listen 80;
    listen [::]:80;

    server_name mchamouda.store www.mchamouda.store;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# =========================
# BACKEND API (HTTP)
# =========================
server {
    listen 80;
    listen [::]:80;

    server_name api.mchamouda.store;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

```

Save the file (Ctrl+X, Y, Enter).

---

### Step 16: Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/headshotprobuild /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
```

**Understanding these commands:**

- **`ln -s source destination`** = Create symbolic link (like a shortcut)
  - `ln` = "link" command
  - `-s` = Create symbolic (soft) link instead of hard link
  - `source` = Original file location (/etc/nginx/sites-available/...)
  - `destination` = Where to put the link (/etc/nginx/sites-enabled/)
  - Nginx reads configs from `sites-enabled/`, but we edit in `sites-available/`

- **`rm -f file`** = Remove (delete) file
  - `rm` = "remove"
  - `-f` = Force (don't ask for confirmation, don't error if file doesn't exist)
  - Removes default Nginx page so yours is used

- **`nginx -t`** = Test Nginx configuration
  - `-t` = Test configuration file syntax
  - Checks for errors BEFORE applying changes
  - Always run this before restarting Nginx!
  - Output: "syntax is ok" means success

- **`systemctl restart nginx`** = Stop and start Nginx
  - `restart` = Full stop and start (applies new config)
  - Alternative: `reload` (smoother, but restart is safer)

---

## Part 3: Prepare Your GitHub Repository

### Step 17: Ensure .env Files Are NOT in Git 🚨

**⚠️ CRITICAL**: Before anything else, make sure your secrets are safe!

**On your local computer**:

```bash
# Navigate to your project
cd /path/to/your/project

# Check if .env files are ignored
cat .gitignore | grep .env
```

**If `.env` is NOT in `.gitignore`, add it**:

```bash
# Add to .gitignore
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
echo "*.env" >> .gitignore
```

**If you already committed .env files to Git, remove them**:

```bash
# Remove .env files from Git (keeps local copy)
git rm --cached frontend/.env.local
git rm --cached backend/.env

# Commit the change
git add .gitignore
git commit -m "Remove .env files from Git and add to .gitignore"

# Push to GitHub
git push origin main
```

✅ **Now your secrets are safe!**

---

### Step 18: Understanding Self-Hosted vs Cloud Runners 🤔

Before we create our workflows, let's understand the two options:

**Option 1: GitHub Cloud Runners (Default)**
- Runs on GitHub's servers
- Connects to your VPS via SSH
- Free for public repos, limited minutes for private repos
- Good for: Simple deployments, small projects

**Option 2: Self-Hosted Runners (What we'll use!)**
- Runs directly on your VPS
- Faster deployments (no SSH needed)
- Unlimited minutes
- Direct access to your server
- Good for: Faster deployments, unlimited builds

**We'll use Self-Hosted Runners because it's faster and gives you unlimited deployments!**

---

### Step 19: Set Up Self-Hosted Runner (GUI Method) 🖱️

Let's set up a self-hosted runner using GitHub's friendly interface!

#### Step 19a: Navigate to GitHub Settings

1. Open your web browser and go to your GitHub repository
2. Click the **"Settings"** tab at the top (you need admin access)
3. In the left sidebar, scroll down and click **"Actions"**
4. Under Actions, click **"Runners"**
5. Click the green **"New self-hosted runner"** button

#### Step 19b: Choose Your Platform

You'll see a page with different options:

1. **Operating System**: Click **"Linux"**
2. **Architecture**: Click **"x64"**
3. You'll see a list of commands below - keep this page open, we'll need it!

#### Step 19c: SSH Into Your VPS

Open your terminal (Mac) or PowerShell/Git Bash (Windows):

```bash
# Use the SSH key you created earlier
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

**Example:**
```bash
ssh -i ~/.ssh/github_deploy deploy@194.238.22.106
```

#### Step 19d: Download and Install the Runner

**Copy the commands from the GitHub page and run them on your server.** Here's what they'll look like (your token will be different):

```bash
# Create a folder for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Optional: Validate the hash (skip if you want)
echo "29fc8cf2dab4c195bb147384e7e2c94cfd4d4022c793b346a6175435265aa278  actions-runner-linux-x64-2.311.0.tar.gz" | shasum -a 256 -c

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

**Understanding these commands:**

- **`mkdir actions-runner && cd actions-runner`** = Create and enter directory
  - Creates folder, then immediately moves into it
  - `&&` means "if first succeeds, do second"

- **`curl -o filename -L URL`** = Download a file
  - `-o filename` = Output to this filename (instead of showing on screen)
  - `-L` = Follow redirects (if URL redirects to another location)
  - Downloads the GitHub Actions runner

- **`shasum -a 256 -c`** = Verify file integrity (security check)
  - `shasum` = Calculate/check SHA checksums
  - `-a 256` = Use SHA-256 algorithm
  - `-c` = Check the hash matches
  - Optional but recommended for security

- **`tar xzf filename.tar.gz`** = Extract compressed archive
  - `tar` = Tape archive utility (packaging tool)
  - `x` = Extract files
  - `z` = Decompress using gzip
  - `f` = Use this file
  - `.tar.gz` = Compressed archive (like .zip on Windows)

**Tip:** Remember "**x**tract **z**e **f**ile" for `tar xzf`!

**Note:** The version number might be different - use the exact commands from your GitHub page!

#### Step 19e: Configure the Runner

Now run the config command (copy from GitHub, it includes your token):

```bash
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
```

**You'll be asked some questions:**

1. **"Enter the name of the runner group"** → Press Enter (uses "Default")
2. **"Enter the name of runner"** → Type a name like `vps-runner` or press Enter
3. **"Enter any additional labels"** → Press Enter (no additional labels)
4. **"Enter name of work folder"** → Press Enter (uses "_work")

**Success!** ✅ You'll see: "Settings Saved."

#### Step 19f: Install as a Service (Runs Automatically)

This makes sure the runner starts automatically when your server reboots:

```bash
# Install the service
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

**Success!** ✅ You should see: "active (running)"

#### Step 19g: Verify on GitHub

Go back to your GitHub repository:
1. Settings → Actions → Runners
2. You should see your runner with a green dot (🟢) and "Idle" status

**Congratulations!** 🎉 Your self-hosted runner is ready!

---

### Step 20: Create GitHub Workflow Files ⚙️

Now let's create the workflow files that will use your self-hosted runner!

**On your local computer**, navigate to your project:

```bash
cd /path/to/your/project

# Create the workflows directory
mkdir -p .github/workflows
```

---

#### Workflow 1: Deploy Backend with .env Creation

Create a new file `.github/workflows/deploy-backend.yml`:

**Using your text editor or VS Code**, create this file with the following content:

```yaml
name: Deploy Backend to VPS

on:
  push:
    branches: ["main"]


jobs:
  build:
    runs-on: self-hosted
    
    strategy:
      matrix:
        node-version: [22.x]
    
    steps:
      # Step 1: Check out the repository
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      # Step 2: 🔐 CREATE .env FILE FROM GITHUB SECRETS (THE MAGIC!)
      - name: 🔐 Create .env file from GitHub Secrets
        run: |
          cd ${{ github.workspace }}
          echo "${{ secrets.BACKEND_ENV }}" > .env
          chmod 600 .env
          echo "✅ .env file created successfully"
      
      # Step 3: Install Bun
      - name: 🔧 Install Bun
        run: |
          export PATH="$HOME/.bun/bin:$PATH"
          if ! command -v bun &> /dev/null; then
            echo "📦 Installing Bun..."
            curl -fsSL https://bun.sh/install | bash
            export PATH="$HOME/.bun/bin:$PATH"
          fi
          bun --version
      
      # Step 4: Install dependencies
      - name: 📦 Install dependencies with Bun
        run: |
          cd ${{ github.workspace }}
          export PATH="$HOME/.bun/bin:$PATH"
          bun install
      
      # Step 5: Build the project
      - name: 🏗️ Build the project
        run: |
          cd ${{ github.workspace }}
          export PATH="$HOME/.bun/bin:$PATH"
          bun run build
      
      # Step 6: Restart the application
      - name: 🚀 Restart Application
        run: |
          cd ${{ github.workspace }}
          pm2 restart backend || pm2 start dist/index.js --name backend
          pm2 save
          echo "✅ Backend deployment completed successfully!"****
```

**Key Points to Notice:**
- 🔥 **Line 17-22**: This is where the `.env` file is created from GitHub Secrets!
- 🏃 **runs-on: self-hosted**: Uses your VPS runner, not GitHub's servers
- 📍 **${{ github.workspace }}**: Automatically points to your code on the VPS
- 🔐 **chmod 600 .env**: Makes the file readable only by you (security!)

---

#### Workflow 2: Deploy Frontend with .env Creation

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Next.js Frontend

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  deploy:
    runs-on: self-hosted
    
    strategy:
      matrix:
        node-version: [22.x]
    
    steps:
      # Step 1: Check out the repository
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      # Step 2: 🔐 CREATE .env FILE FROM GITHUB SECRETS (THE MAGIC!)
      - name: 🔐 Create .env file from GitHub Secrets
        run: |
          cd ${{ github.workspace }}/frontend
          echo "${{ secrets.FRONTEND_ENV }}" > .env
          chmod 600 .env
          echo "✅ .env file created successfully"
      
      # Step 3: Check NODE_ENV in .env file
      - name: ✅ Verify NODE_ENV is production
        run: |
          cd ${{ github.workspace }}/frontend
          if [ ! -f ".env" ]; then
            echo "❌ Error: .env file not found"
            exit 1
          fi
          if ! grep -q "^NODE_ENV=production" .env; then
            echo "⚠️ Warning: NODE_ENV should be set to production"
          else
            echo "✅ NODE_ENV is correctly set to production"
          fi
      
      # Step 4: Install Bun
      - name: 🔧 Install Bun
        run: |
          export PATH="$HOME/.bun/bin:$PATH"
          if ! command -v bun &> /dev/null; then
            echo "📦 Installing Bun..."
            curl -fsSL https://bun.sh/install | bash
            export PATH="$HOME/.bun/bin:$PATH"
          fi
          bun --version
      
      # Step 5: Install Dependencies
      - name: 📦 Install Dependencies
        run: |
          cd ${{ github.workspace }}/frontend
          export PATH="$HOME/.bun/bin:$PATH"
          bun install
      
      # Step 6: Build the Next.js App
      - name: 🏗️ Build Frontend
        run: |
          cd ${{ github.workspace }}/frontend
          export PATH="$HOME/.bun/bin:$PATH"
          bun run build
      
      # Step 7: Restart Frontend with PM2
      - name: 🚀 Restart Frontend
        run: |
          cd ${{ github.workspace }}/frontend
          pm2 restart frontend || pm2 start "bun run start" --name frontend
          pm2 save
          echo "✅ Frontend deployment completed successfully!"
```

**Key Points to Notice:**
- 🔥 **Line 23-28**: Creates `.env` file from `FRONTEND_ENV` secret
- 🎨 Same pattern as backend but for your Next.js app
- 🔄 Uses PM2 to keep your frontend running 24/7

---

### Understanding the .env Creation (Step 2 in both workflows) 🔐

Let's break down what this magical step does:

```yaml
- name: 🔐 Create .env file from GitHub Secrets
  run: |
    cd ${{ github.workspace }}/backend
    echo "${{ secrets.BACKEND_ENV }}" > .env
    chmod 600 .env
```

**Line by line explanation:**

1. **cd ${{ github.workspace }}/backend**
   - Goes to your backend folder on the VPS
   - `${{ github.workspace }}` = `/home/deploy/actions-runner/_work/your-repo/your-repo`

2. **echo "${{ secrets.BACKEND_ENV }}" > .env**
   - `${{ secrets.BACKEND_ENV }}` = Gets the secret from GitHub (encrypted)
   - `> .env` = Writes it to a file called `.env`
   - This file contains ALL your environment variables!

3. **chmod 600 .env**
   - Makes the file readable/writable only by you
   - `600` means: Owner can read/write, nobody else can access it
   - Security best practice! 🔒

**The Result:**
- ✅ Fresh `.env` file created on every deployment
- ✅ Never in Git or GitHub repository
- ✅ Always up-to-date with your GitHub Secrets
- ✅ Secure permissions (only you can read it)

**Understanding the commands used:**

- **`echo "text" > file`** = Write text to a file
  - `echo` = Print/output text
  - `"${{ secrets.BACKEND_ENV }}"` = The secret from GitHub
  - `>` = Redirect output to a file (overwrites if exists)
  - `>>` would append instead of overwrite

- **`chmod 600 .env`** = Change file permissions
  - `chmod` = "change mode" (permissions)
  - `600` = Permission code (explained below)
  - `.env` = File to change

**Understanding chmod permission codes:**
```
chmod 600 .env
      │││
      │││
      ││└─ Others (everyone else): 0 = no permissions
      │└── Group (your group): 0 = no permissions  
      └─── Owner (you): 6 = read (4) + write (2) = 6
```

**Permission numbers:**
- `4` = Read (r)
- `2` = Write (w)
- `1` = Execute (x)
- `0` = No permissions (-)

**Common combinations:**
- `600` = Owner: read+write, Others: none (perfect for secrets!)
- `644` = Owner: read+write, Others: read only
- `700` = Owner: read+write+execute, Others: none
- `755` = Owner: all, Others: read+execute (common for directories)

---

### Step 21: Commit and Push Workflow Files 📤

Now let's save these workflow files to your repository!

**On your local computer:**

```bash
# Make sure you're in your project directory
cd /path/to/your/project

# Add the workflow files
git add .github/workflows/

# Commit them
git commit -m "Add self-hosted GitHub Actions deployment workflows"

# Push to GitHub
git push origin main
```

**⚠️ Don't worry if the workflow fails!** We haven't added the secrets yet. Let's do that now!

---

## Part 4: Configure GitHub Secrets (The Magic Part! 🪄)

This is THE MOST IMPORTANT PART! This is where you securely store your environment variables so GitHub Actions can create your `.env` files automatically.

### Step 22: Add Secrets to GitHub (Using GUI) 🔐

Let's add your secrets using GitHub's friendly web interface!

#### Step 22a: Navigate to GitHub Secrets

1. **Open your web browser** and go to your GitHub repository
2. Click the **"Settings"** tab at the top (between "Insights" and "Security")
3. In the left sidebar, find **"Secrets and variables"**
4. Click **"Actions"** under "Secrets and variables"
5. You should now see the "Actions secrets and variables" page

---

#### Step 22b: Understanding What Secrets We Need

We need **TWO main secrets** for the self-hosted runner setup:

1. **BACKEND_ENV** = All your backend environment variables
2. **FRONTEND_ENV** = All your frontend environment variables

**Why these secrets?**
- They contain ALL your API keys, database passwords, etc.
- GitHub stores them encrypted (super secure! 🔒)
- Your workflows use them to create `.env` files on your VPS
- They NEVER appear in your code or Git history

---

#### Step 22c: Add BACKEND_ENV Secret

**Let's add the backend secret first!**

1. Click the green **"New repository secret"** button (top right)
2. You'll see a form with two fields:

**Field 1: Name**
- Type: `BACKEND_ENV`
- ⚠️ Must be EXACTLY this name (case-sensitive!)

**Field 2: Secret**
- This is where you paste ALL your backend environment variables
- Open your local backend `.env` file and copy EVERYTHING from it

**Example of what to paste:**
```env
PORT=8000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Replicate AI
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

**⚠️ IMPORTANT NOTES:**
- Make sure `NODE_ENV=production` is included (our workflow checks for this!)
- Include ALL variables your backend needs
- Don't add quotes around values (unless they're part of the actual value)
- Each variable on its own line
- No spaces around the `=` sign

3. After pasting your content, click the green **"Add secret"** button at the bottom

**Success!** ✅ You should see "BACKEND_ENV" in your secrets list!

---

#### Step 22d: Add FRONTEND_ENV Secret

Now let's add the frontend environment variables!

1. Click the green **"New repository secret"** button again
2. Fill in the form:

**Field 1: Name**
- Type: `FRONTEND_ENV`
- ⚠️ Must be EXACTLY this name (case-sensitive!)

**Field 2: Secret**
- This is where you paste ALL your frontend environment variables
- Open your local frontend `.env` or `.env.local` file and copy EVERYTHING

**Example of what to paste:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_ENVIRONMENT=production
```

**⚠️ IMPORTANT NOTES:**
- Make sure `NODE_ENV=production` is included
- Variables starting with `NEXT_PUBLIC_` are accessible in the browser
- Other variables are only available during build time
- Include ALL variables your frontend needs

3. After pasting your content, click the green **"Add secret"** button

**Success!** ✅ You should now see both secrets in your list!

---

### Step 22e: Verify Your Secrets ✅

Let's make sure everything is set up correctly!

**Go to:** Settings → Secrets and variables → Actions → Repository secrets

**You should see:**
1. ✅ `BACKEND_ENV` with "Updated X seconds/minutes ago"
2. ✅ `FRONTEND_ENV` with "Updated X seconds/minutes ago"

**Note:** You can't view the secret values after creating them (security feature!). But you can update them anytime by clicking the name and then "Update secret".

---

## Part 5: Initial Deployment to VPS 🚀

Now that everything is configured, let's get your app running for the first time!

### Step 23: Clone Your Repository to VPS 📥

**SSH into your VPS:**

```bash
# On your local computer
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

Now let's get your code onto the server!

**SSH into your VPS**:

```bash
ssh deploy@YOUR_SERVER_IP
```

**Clone your repository**:

```bash
# Navigate to apps directory
cd ~/apps

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/headshotprobuild.git

# Navigate to the project
cd headshotprobuild
```

**Understanding these commands:**

- **`git clone URL`** = Download a copy of a Git repository
  - `git` = Version control system
  - `clone` = Copy repository from remote server to local
  - Creates a new folder with the repository name
  - Downloads all files, branches, and commit history

**Example with explanation:**
```bash
git clone https://github.com/johndoe/myproject.git
#         └─────────┬─────────┘ └──┬──┘ └───┬───┘
#              GitHub server    username  repo name
```

---

### Step 24: Manually Create .env Files (First Time Only) 📝

For the very first deployment, we need to manually create the `.env` files on the server. After this, GitHub Actions will handle it automatically every time you push code!

**⚠️ IMPORTANT**: These files will be **overwritten** by GitHub Actions on every deployment, but we need them for the first run.

**Create frontend .env.local**:

```bash
cd ~/apps/headshotprobuild/frontend
nano .env.local
```

**Understanding these commands:**

- **`nano .env.local`** = Open text editor to create/edit file
  - `nano` = Simple, beginner-friendly text editor
  - `.env.local` = File name to create/edit
  - Files starting with `.` are hidden files in Linux

**Using nano editor:**

1. Paste your frontend environment variables (right-click or Ctrl+Shift+V)
2. **Save the file:**
   - Press `Ctrl + X` (exit)
   - Press `Y` (yes, save changes)
   - Press `Enter` (confirm filename)
3. You're back to command line!

**Nano keyboard shortcuts:**
- `Ctrl + X` = Exit
- `Ctrl + O` = Write Out (save without exiting)
- `Ctrl + K` = Cut line
- `Ctrl + U` = Paste line
- `Ctrl + W` = Search

**Create backend .env**:

```bash
cd ~/apps/headshotprobuild/backend
nano .env
```

Paste your backend environment variables (same content you put in `BACKEND_ENV` secret), then save:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

### Step 25: Build and Start Frontend 🎨

Let's get your beautiful frontend running!

```bash
cd ~/apps/headshotprobuild/frontend

# Install dependencies
bun install

# Build the app
bun run build

# Start with PM2
pm2 start "bun run start" --name frontend

# Check if it's running
pm2 list
```

---

### Step 26: Build and Start Backend 🔧

Now let's get your backend API up and running!

```bash
cd ~/apps/headshotprobuild/backend

# Install dependencies
bun install

# Build the app (if you have a build script)
bun run build

# Start with PM2
pm2 start "bun run start" --name backend

# Check if it's running
pm2 list
```

You should see both apps running!

---

### Step 27: Make PM2 Start on Server Reboot 🔄

This ensures your apps automatically start if your server restarts!

```bash
# Generate startup script
pm2 startup systemd -u deploy --hp /home/deploy

# This will print a command like:
# sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v20.11.0/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

# Copy and run that command (it starts with sudo env...)

# Save current PM2 processes
pm2 save
```

Test by rebooting:

```bash
sudo reboot
```

After the server restarts, SSH back in and check:

```bash
pm2 list
```

Both apps should still be running!

---


## Part 6: DNS Configuration

### Step 28: Configure Your Domain DNS

Go to your domain registrar or DNS provider (like Cloudflare, Namecheap, etc.) and add these DNS records:

**A Records**:
- **Type**: A
- **Name**: `@` (root domain)
- **Value**: Your VPS IP (e.g., `194.238.22.106`)
- **TTL**: Automatic or 3600

- **Type**: A
- **Name**: `www`
- **Value**: Your VPS IP (e.g., `194.238.22.106`)
- **TTL**: Automatic or 3600

- **Type**: A
- **Name**: `api`
- **Value**: Your VPS IP (e.g., `194.238.22.106`)
- **TTL**: Automatic or 3600

**Important**: DNS changes can take 5 minutes to 48 hours to propagate worldwide. Usually, it's quick (5-30 minutes).

**Test DNS propagation**:

```bash
# On your local computer
nslookup yourdomain.com
nslookup www.yourdomain.com
nslookup api.yourdomain.com
```

All should point to your VPS IP.

---

## Part 7: SSL Certificates (HTTPS)

### Step 29: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

### Step 30: Get SSL Certificates

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Follow the prompts**:
1. Enter your email address
2. Agree to Terms of Service (Y)
3. Choose whether to share email (optional)
4. Certbot will automatically configure Nginx for HTTPS

**Test automatic renewal**:

```bash
sudo certbot renew --dry-run
```

If successful, your certificates will auto-renew before expiry!

---

## Part 8: Database Configuration

### Step 31: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Click **Network Access** (left sidebar)
4. Click **Add IP Address**
5. Enter your VPS IP address: `YOUR_VPS_IP/32`
6. Click **Confirm**

**⚠️ Important**: Remove `0.0.0.0/0` (allow all) if it exists for better security.

---

## Part 9: Testing GitHub Actions Deployment 🎉

### Step 32: Test Automatic Deployment

This is the moment of truth! Let's see your automatic deployment in action!

Now that everything is set up, let's test the automatic deployment!

**Make a small change to your code**:

```bash
# On your local computer
cd /path/to/your/project

# Make a small change (example: update a comment in any file)
echo "// Test deployment" >> frontend/app/page.tsx

# Commit and push
git add .
git commit -m "Test: Trigger GitHub Actions deployment"
git push origin main
```

---

### Step 33: Watch GitHub Actions Run (The Exciting Part!) 🎬

Let's watch your deployment happen in real-time!

1. **Open your web browser** and go to your GitHub repository
2. Click the **"Actions"** tab at the top (between "Pull requests" and "Projects")
3. You should see your workflows running!

**What you'll see:**
- 🟡 **Orange dot** = Workflow is currently running
- 🟢 **Green checkmark** = Workflow completed successfully
- 🔴 **Red X** = Workflow failed (don't worry, we'll fix it!)

**Click on a workflow run to see details:**
- You can watch each step execute in real-time
- See the logs for each command
- Watch as your `.env` file is created from secrets ✅
- See your app being built and deployed!

**What's happening (Step by Step):**

1. **📥 Checkout code** - Downloads your latest code
2. **🔐 Create .env file** - Creates `.env` from GitHub Secrets (THE MAGIC!)
3. **✅ Verify NODE_ENV** - Makes sure it's set to production
4. **🔧 Install Bun** - Sets up the Bun runtime
5. **📦 Install dependencies** - Runs `bun install`
6. **🏗️ Build** - Compiles your application
7. **🚀 Restart** - Restarts your app with PM2

**This all happens automatically every time you push code!** 🎉

---

### Step 34: Verify Deployment ✅

Let's make sure everything is working!

**Check if apps are running**:

```bash
ssh deploy@YOUR_SERVER_IP
pm2 list
pm2 logs frontend --lines 50
pm2 logs backend --lines 50
```

**Test your websites**:
- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com/health` (create a health endpoint)

---

## 🎯 Understanding How .env Files Work

### The Complete Flow (Step-by-Step)

**1. You Store Secrets in GitHub**:
- Go to GitHub → Settings → Secrets
- Add `FRONTEND_ENV` and `BACKEND_ENV` with all your environment variables

**2. You Push Code to GitHub**:
```bash
git push origin main
```

**3. GitHub Actions Triggers**:
- GitHub detects your push
- Reads `.github/workflows/deploy-frontend.yml` and `.github/workflows/deploy-backend.yml`
- Starts the deployment process

**4. GitHub Actions Builds Your App**:
- Runs on GitHub's servers (not your VPS)
- Installs dependencies
- Builds your application

**5. GitHub Actions Connects to Your VPS**:
- Uses SSH with the private key from `VPS_SSH_KEY` secret
- Connects as the `deploy` user

**6. GitHub Actions Updates Code on VPS**:
```bash
cd ~/apps/headshotprobuild/backend
git pull origin main
```
- This pulls your latest code
- **NOTE**: `git pull` does NOT touch `.env` because it's in `.gitignore`

**7. GitHub Actions Creates .env File on VPS** ⭐ **THIS IS THE MAGIC**:
```bash
echo "${{ secrets.BACKEND_ENV }}" > .env
```
- GitHub takes the content from `BACKEND_ENV` secret
- Writes it to the `.env` file on your VPS
- **Location**: `/home/deploy/apps/headshotprobuild/backend/.env`

**Example**: If your `BACKEND_ENV` secret contains:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
PORT=8000
```

Then the file `/home/deploy/apps/headshotprobuild/backend/.env` on your VPS will contain:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
PORT=8000
```

**8. GitHub Actions Restarts Your App**:
```bash
pm2 restart backend
```
- PM2 stops the app
- PM2 starts it again
- Your app runs in the directory `/home/deploy/apps/headshotprobuild/backend`
- Your app automatically reads `.env` file from that directory
- Your app now has access to all environment variables

**9. Your App Uses the Secrets**:
```typescript
// In your backend code:
import mongoose from 'mongoose';

// This reads from .env file automatically
const uri = process.env.MONGODB_URI; // ✅ Works!

mongoose.connect(uri);
```

---

### Where Are the .env Files?

**❌ NOT here**:
- Not in your Git repository
- Not in GitHub
- Not publicly visible anywhere

**✅ Here**:
- **Frontend**: `/home/deploy/apps/headshotprobuild/frontend/.env.local` on your VPS
- **Backend**: `/home/deploy/apps/headshotprobuild/backend/.env` on your VPS

**To verify** (SSH into your server):
```bash
ssh deploy@YOUR_SERVER_IP

# Check backend .env
ls -la ~/apps/headshotprobuild/backend/.env
cat ~/apps/headshotprobuild/backend/.env

# Check frontend .env.local
ls -la ~/apps/headshotprobuild/frontend/.env.local
cat ~/apps/headshotprobuild/frontend/.env.local
```

---

### What Happens on Each Deployment?

Every time you push code to GitHub:

1. **GitHub Actions runs**
2. **Pulls latest code**: `git pull origin main`
   - Your `.env` file is NOT affected (it's in `.gitignore`)
3. **Overwrites .env file**: `echo "${{ secrets.BACKEND_ENV }}" > .env`
   - Creates a fresh `.env` file from GitHub Secrets
   - If you updated secrets in GitHub, your VPS gets the new values
4. **Restarts app**: `pm2 restart backend`
   - App reads the updated `.env` file
   - App uses the new/updated environment variables

---

## 📝 Common Deployment Scenarios

### Scenario 1: Update Code Only

```bash
# Make code changes
git add .
git commit -m "Fix bug in user authentication"
git push origin main
```

**What happens**:
- GitHub Actions deploys new code
- `.env` file stays the same (uses existing GitHub Secrets)
- App restarts with new code

---

### Scenario 2: Update Environment Variables

**To update secrets**:
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Find the secret (e.g., `BACKEND_ENV`)
3. Click **Update**
4. Change the value (e.g., add a new API key)
5. Click **Update secret**

**Then trigger a deployment**:
```bash
git commit --allow-empty -m "Update environment variables"
git push origin main
```

**What happens**:
- GitHub Actions pulls code (no changes)
- GitHub Actions overwrites `.env` file with NEW secrets
- App restarts and uses new environment variables

---

### Scenario 3: Add New Environment Variable

**1. Update your GitHub Secret**:
- Go to GitHub → Settings → Secrets
- Edit `BACKEND_ENV`
- Add new variable: `NEW_API_KEY=abc123`

**2. Update your code to use it**:
```typescript
const newApiKey = process.env.NEW_API_KEY;
```

**3. Deploy**:
```bash
git add .
git commit -m "Add support for new API key"
git push origin main
```

**What happens**:
- GitHub Actions deploys new code
- GitHub Actions writes `.env` with new variable
- App restarts and can use `NEW_API_KEY`

---

## 🔧 Troubleshooting

### Deployment Failed?

**Check GitHub Actions logs**:
1. Go to GitHub → Actions tab
2. Click on the failed workflow
3. Click on the job that failed
4. Read the error message

**Common issues**:
- **SSH connection failed**: Check `VPS_SSH_KEY` secret is correct
- **Permission denied**: Ensure `deploy` user has proper permissions
- **Build failed**: Check if dependencies are correctly installed

---

### App Not Starting?

**Check PM2 logs**:
```bash
ssh deploy@YOUR_SERVER_IP
pm2 logs backend --lines 100
pm2 logs frontend --lines 100
```

**Common issues**:
- **Port already in use**: Another process is using port 3000 or 8000
- **Environment variable missing**: Check `.env` file exists and has all required variables
- **Database connection error**: Verify MongoDB Atlas IP whitelist includes your VPS IP

---

### Can't Access Website?

**Check Nginx**:
```bash
sudo nginx -t                    # Test configuration
sudo systemctl status nginx       # Check if running
sudo systemctl restart nginx      # Restart Nginx
```

**Check DNS**:
```bash
nslookup yourdomain.com
```

**Check SSL**:
```bash
sudo certbot certificates
```

---

## 🎓 Teaching Points 

### 1. **Why GitHub Actions?**
- **Automatic**: No manual SSH, no manual deployments
- **Consistent**: Same process every time
- **Safe**: Secrets never in code
- **Auditable**: See history of all deployments

### 2. **Why PM2?**
- Keeps apps running 24/7
- Auto-restarts if app crashes
- Manages logs
- Starts apps on server reboot

### 3. **Why Nginx?**
- Handles HTTPS (SSL certificates)
- Routes traffic (frontend vs backend)
- Serves static files efficiently
- Acts as reverse proxy

### 4. **Why Separate .env Files?**
- **Never in Git**: Prevents accidental exposure
- **GitHub Secrets**: Encrypted storage
- **VPS only**: Lives where app runs
- **Easy updates**: Change secrets without changing code

### 5. **Security Layers**:
- Firewall (UFW): Only specific ports open
- SSH Keys: No password login
- MongoDB Atlas: Only VPS IP allowed
- GitHub Secrets: Encrypted storage
- HTTPS: All traffic encrypted

---

## 🚀 Next Steps

### Production Checklist

- [x] VPS set up with firewall
- [ ] Deploy user created (not using root)
- [ ] SSH keys configured
- [ ] Node.js, Bun, PM2 installed
- [ ] Nginx installed and configured
- [ ] DNS records pointing to VPS
- [ ] SSL certificates installed (Certbot)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] GitHub Secrets added (all 6 secrets)
- [ ] GitHub Actions workflows created
- [ ] Initial deployment successful
- [ ] PM2 configured to start on reboot
- [ ] Automatic deployment tested

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Read the relevant section in this guide
3. Check logs: `pm2 logs`, `sudo nginx -t`, GitHub Actions logs
4. Search for the error message online
5. Ask for help with specific error messages

---

## 🎉 Congratulations! You Did It!

You've successfully set up a professional deployment system with:
- ✅ Self-hosted GitHub Actions runner
- ✅ Automatic deployments on every push
- ✅ Secure environment variable management
- ✅ HTTPS with SSL certificates
- ✅ Process management with PM2
- ✅ Reverse proxy with Nginx

**Your workflow is now:**
1. Make code changes on your local computer
2. Push to GitHub: `git push origin main`
3. GitHub Actions automatically deploys everything
4. Your app updates in seconds! 🚀

---

## 📝 Quick Reference Commands

### SSH Connection Commands

**Mac/Linux:**
```bash
# Connect to your VPS
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP

# Or if using default key
ssh deploy@YOUR_SERVER_IP
```

**Windows PowerShell:**
```powershell
# Connect to your VPS
ssh -i $HOME\.ssh\github_deploy deploy@YOUR_SERVER_IP
```

**Windows Git Bash:**
```bash
# Connect to your VPS
ssh -i ~/.ssh/github_deploy deploy@YOUR_SERVER_IP
```

### PM2 Commands (On your VPS)

```bash
# View all running apps
pm2 list

# View logs
pm2 logs backend
pm2 logs frontend

# Restart apps
pm2 restart backend
pm2 restart frontend
pm2 restart all

# Stop apps
pm2 stop backend
pm2 stop frontend

# Delete apps
pm2 delete backend
pm2 delete frontend

# Save PM2 configuration
pm2 save

# View detailed info
pm2 show backend
```

**Understanding PM2 commands:**

- **`pm2 list`** = Show all PM2-managed apps
  - Shows status, memory usage, CPU usage, restart count

- **`pm2 logs appname`** = View real-time logs
  - Shows both stdout (normal output) and stderr (errors)
  - Press `Ctrl + C` to stop viewing
  - Add `--lines 100` to see last 100 lines

- **`pm2 restart appname`** = Restart a specific app
  - Stops then starts the app
  - Reloads code and .env changes
  - Use `all` to restart all apps

- **`pm2 stop appname`** = Stop app without removing it
  - App still in PM2 list but not running
  - Use `pm2 start appname` to start again

- **`pm2 delete appname`** = Remove app from PM2
  - Completely removes from PM2 management
  - Must re-add with `pm2 start` command

- **`pm2 save`** = Save current PM2 process list
  - Important after making changes
  - Ensures apps restart after server reboot

- **`pm2 show appname`** = Detailed info about one app
  - Memory usage, uptime, error logs, etc.

### Nginx Commands (On your VPS)

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

**Understanding these commands:**

- **`tail -f filename`** = View end of file in real-time
  - `tail` = Show last part of file (default: last 10 lines)
  - `-f` = "follow" - keep watching as new lines are added
  - Perfect for monitoring live logs
  - Press `Ctrl + C` to stop
  - Add `-n 100` to see last 100 lines first

- **Log file locations:**
  - `/var/log/nginx/error.log` = Nginx error messages
  - `/var/log/nginx/access.log` = All incoming requests

### SSL Certificate Commands (On your VPS)

```bash
# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# View installed certificates
sudo certbot certificates
```

### Deployment Commands (On your local computer)

```bash
# Deploy changes
git add .
git commit -m "Your commit message"
git push origin main

# Force trigger deployment (no changes)
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

**Understanding Git commands:**

- **`git add .`** = Stage all changes for commit
  - `git add` = Add files to staging area (prepare for commit)
  - `.` = Current directory (all changed files)
  - Alternative: `git add filename` for specific file

- **`git commit -m "message"`** = Save changes with description
  - `git commit` = Create a commit (snapshot of changes)
  - `-m "message"` = Include commit message directly
  - Without `-m`, it opens a text editor for the message

- **`git push origin main`** = Upload commits to GitHub
  - `git push` = Send commits to remote repository
  - `origin` = Name of remote repository (usually GitHub)
  - `main` = Branch name to push to

- **`git commit --allow-empty`** = Create commit with no changes
  - `--allow-empty` = Create commit even if nothing changed
  - Useful to trigger GitHub Actions without code changes
  - `--` prefix means it's a long option (full word)

### Troubleshooting Commands (On your VPS)

```bash
# Check if runner is working
sudo systemctl status actions.runner.*

# Restart runner
cd ~/actions-runner
sudo ./svc.sh restart

# View GitHub Actions runner logs
cd ~/actions-runner
tail -f _diag/Runner_*.log

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep bun
ps aux | grep node
```

**Understanding these commands:**

- **`systemctl status actions.runner.*`** = Check runner service status
  - `*` = Wildcard (matches any runner name)
  - Shows if runner is active, inactive, or failed

- **`./svc.sh restart`** = Restart runner service
  - `./` = Run script in current directory
  - `.sh` = Shell script file

- **`df -h`** = Show disk space usage
  - `df` = "disk free" (show available disk space)
  - `-h` = "human-readable" (shows GB instead of bytes)
  - Look for "Use%" column - if above 90%, you're running out of space

- **`free -h`** = Show memory (RAM) usage
  - `free` = Display memory information
  - `-h` = Human-readable format
  - Shows total, used, free, and available memory

- **`ps aux | grep processname`** = Find running processes
  - `ps` = "process status" (list running processes)
  - `aux` = Show all processes, user-oriented format
    - `a` = Show all users' processes
    - `u` = Show user/owner
    - `x` = Show processes without terminal
  - `|` = Pipe - send output of `ps` to `grep`
  - `grep bun` = Filter to only show lines containing "bun"

**Example of pipe usage:**
```bash
ps aux | grep bun
#  │      │     └── Filter for "bun"
#  │      └──────── Pipe (send output to next command)
#  └─────────────── List all processes
```

---

## 🔄 How to Update Environment Variables

**When you need to change API keys, passwords, or any environment variable:**

1. **Go to GitHub:**
   - Settings → Secrets and variables → Actions
   - Click on the secret you want to update (e.g., `BACKEND_ENV`)
   - Click "Update secret"
   - Paste the new content
   - Click "Update secret"

2. **Trigger a deployment:**
   ```bash
   git commit --allow-empty -m "Update environment variables"
   git push origin main
   ```

3. **GitHub Actions will:**
   - Create a fresh `.env` file with your new secrets
   - Restart your app
   - Your app now uses the updated variables!

---

## 🆘 Common Issues and Solutions

### Issue 1: Workflow Fails on ".env file not found"

**Solution:** Make sure your GitHub Secrets (`BACKEND_ENV` and `FRONTEND_ENV`) are set correctly.

### Issue 2: "NODE_ENV must be set to production"

**Solution:** Add `NODE_ENV=production` as the first line in your GitHub Secrets.

### Issue 3: Runner shows as "Offline"

**Solution:**
```bash
ssh deploy@YOUR_SERVER_IP
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh restart
```

### Issue 4: App not accessible from browser

**Solution:**
```bash
# Check if apps are running
pm2 list

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check firewall
sudo ufw status
```

### Issue 5: SSL Certificate Error

**Solution:**
```bash
# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## 🎓 What You've Learned

Through this guide, you've learned:

1. **Server Administration**
   - Setting up and securing a Linux VPS
   - Managing users and permissions
   - Configuring firewalls

2. **SSH & Security**
   - Generating and using SSH keys
   - Key-based authentication
   - Secure file permissions

3. **DevOps Practices**
   - CI/CD with GitHub Actions
   - Self-hosted runners
   - Environment variable management
   - Secret management

4. **Web Server Configuration**
   - Nginx reverse proxy setup
   - SSL/TLS certificates
   - Domain configuration

5. **Process Management**
   - PM2 for application lifecycle
   - Auto-restart on crashes
   - Log management

6. **Deployment Automation**
   - Automatic deployments on git push
   - Build and restart workflows
   - Zero-downtime deployments

---

## 🚀 Next Steps

Now that your deployment is working, consider:

1. **Set up monitoring:**
   - Use PM2 Plus for app monitoring
   - Set up uptime monitoring (UptimeRobot, etc.)
   - Configure error logging (Sentry, etc.)

2. **Improve security:**
   - Set up fail2ban to prevent brute force attacks
   - Configure automatic security updates
   - Regular backup strategy

3. **Performance optimization:**
   - Enable Nginx caching
   - Set up CDN for static assets
   - Database indexing and optimization

4. **Add staging environment:**
   - Create a `staging` branch
   - Set up separate workflow for staging
   - Test changes before production

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Bun Documentation](https://bun.sh/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 👨‍💻 About the Author

**Mohamud Osman**  
*Founder of Dugsiiye*

**Connect with me:**

- 🌐 **Website**: [dugsiiye.com](https://dugsiiye.com)
- 💻 **GitHub**: [@mchamoudadev](https://github.com/mchamoudadev)
- 📺 **YouTube**: [@dugsiiye](https://youtube.com/@dugsiiye)
- 💼 **LinkedIn**: [Mohamed Osman](https://linkedin.com/in/mchamoudadev)
- 🐦 **X (Twitter)**: [@mchamoudadev](https://x.com/dugsiiye)

**Visit [dugsiiye.com](https://dugsiiye.com) for more tutorials, projects, and full-stack software engineering content!**

---

**🎉 Amazing Work!** You've completed a professional-grade deployment setup that many companies use in production. You should be proud! 

Every time you push code to GitHub, it will automatically deploy to your VPS. Your secrets are safe in GitHub Secrets, and your deployment is fully automated. 🚀

**Happy Coding!** 💻✨

