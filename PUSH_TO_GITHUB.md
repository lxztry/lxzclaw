# Push to GitHub Instructions

## Option 1: Using GitHub CLI (Recommended)

If you have `gh` installed:

```powershell
# Authenticate with GitHub
gh auth login

# Create repository and push
cd D:\code\lxzclaw
gh repo create lxzclaw --public --source=. --push
```

## Option 2: Manual Steps

1. **Create repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `lxzclaw`
   - Select "Public"
   - Do NOT initialize with README

2. **Push existing code:**

```powershell
cd D:\code\lxzclaw
git remote set-url origin https://github.com/lxztry/lxzclaw.git
git push -u origin master
```

## Option 3: Using Personal Access Token

If you have a GitHub Personal Access Token:

```powershell
$env:GITHUB_TOKEN = "your-token-here"
git remote add origin https://lxztry:${env:GITHUB_TOKEN}@github.com/lxztry/lxzclaw.git
git push -u origin master
```

## Verification

After pushing, verify at:
https://github.com/lxztry/lxzclaw
