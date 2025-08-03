# Security Guidelines for Codespaces

This document outlines security best practices for the WhatsOnTV Codespaces environment.

## 🔒 What's Safe to Commit

### ✅ Safe Files (Already in Repository)
- **`.devcontainer/devcontainer.json`** - Configuration only, no secrets
- **`.devcontainer/*.sh`** - Scripts with placeholder values only
- **`.devcontainer/README.md`** - Documentation
- **`CODESPACES-QUICKSTART.md`** - Public documentation
- **All files in `docs/`** - Documentation only

### ✅ Safe Content Examples
```bash
# Public API endpoints (no authentication required)
TVMAZE_BASE_URL=https://api.tvmaze.com

# Obvious placeholder values
SLACK_BOT_TOKEN=xoxb-your-actual-slack-bot-token-goes-here
SLACK_CHANNEL_ID=C1234567890
```

## 🚨 What's Protected by .gitignore

### ❌ Never Committed (Automatically Ignored)
- **`.env`** - Contains actual API keys and tokens
- **`config.json`** - May contain sensitive configuration
- **`.vscode/`** - Personal IDE settings
- **`node_modules/`** - Dependencies
- **`coverage/`** - Test coverage reports

## 🛡️ Security Features Built-In

### 1. Automatic .env Creation
- Codespaces setup creates `.env` with placeholder values
- Real values must be manually added by each developer
- `.env` is gitignored and never committed

### 2. Clear Placeholder Indicators
```bash
# Examples of safe placeholders in our scripts:
SLACK_BOT_TOKEN=xoxb-your-actual-slack-bot-token-goes-here
SLACK_CHANNEL_ID=C1234567890
```

### 3. Documentation Warnings
- Setup scripts include warnings about not committing real tokens
- Documentation clearly explains security practices

## 🔧 Developer Security Checklist

### When Setting Up Codespaces:
1. ✅ Create Codespace (automatic setup runs)
2. ✅ Edit `.env` with your actual API keys
3. ✅ Edit `config.json` with your preferences
4. ❌ **NEVER** commit `.env` or `config.json` with real values

### Before Committing:
1. ✅ Check `git status` for any sensitive files
2. ✅ Verify `.env` and `config.json` are not staged
3. ✅ Review diff for any accidentally included secrets
4. ✅ Use `git add .devcontainer/` to add only devcontainer files

### Safe Commands:
```bash
# Safe - only adds devcontainer configuration
git add .devcontainer/

# Safe - only adds documentation
git add docs/ *.md

# Safe - adds specific safe files
git add package.json tsconfig.json eslint.config.js

# DANGEROUS - might include .env or config.json
git add .
git add -A
```

## 🔍 What to Look For

### ❌ Dangerous Content (Never Commit):
- Real Slack bot tokens: `xoxb-REAL-TOKEN-HERE`
- Real channel IDs: `C1234567890` (if not placeholder)
- API keys from other services
- Personal email addresses or usernames
- Internal URLs or endpoints

### ✅ Safe Content (OK to Commit):
- Public API URLs: `https://api.tvmaze.com`
- Obvious placeholders: `your_token_here`
- Configuration structure without values
- Documentation and examples

## 🚨 Emergency Response

### If You Accidentally Commit Secrets:

1. **Immediately rotate the compromised credentials**
   - Generate new Slack bot token
   - Update your local `.env` file

2. **Remove from Git history**
   ```bash
   # Remove the file from the last commit
   git reset HEAD~1
   
   # Or use git filter-branch for older commits
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push the cleaned history**
   ```bash
   git push origin --force --all
   ```

4. **Notify team members** to pull the cleaned history

## 📚 Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Slack App Security](https://api.slack.com/authentication/best-practices)
- [Environment Variables in Codespaces](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)

## 🤝 Questions?

If you're unsure whether something is safe to commit:
1. Check this document
2. Look for the content in `.gitignore`
3. Ask in the project discussions
4. When in doubt, don't commit it!
