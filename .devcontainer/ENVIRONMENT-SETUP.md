# Environment Variables Setup for Codespaces

This guide shows how to configure WhatsOnTV using GitHub Codespaces environment variables and secrets instead of editing files that might accidentally get committed.

## 🔐 GitHub Codespaces Secrets (Recommended)

### Setting Up Secrets

1. **Go to GitHub Settings**:
   - Navigate to: GitHub → Settings → Codespaces → Repository secrets
   - Or visit: `https://github.com/settings/codespaces`

2. **Add Required Secrets**:

   | Secret Name | Description | Example Value |
   |-------------|-------------|---------------|
   | `SLACK_BOT_TOKEN` | Your Slack bot token | `xoxb-YOUR-ACTUAL-TOKEN-HERE` |
   | `SLACK_CHANNEL_ID` | Target Slack channel ID | `C1234567890` |

3. **Add Optional Configuration** (for custom filtering):

   | Variable Name | Description | Example Value |
   |---------------|-------------|---------------|
   | `WTV_NETWORKS` | TV networks to filter | `"NBC", "CBS", "ABC"` |
   | `WTV_TYPES` | Show types to include | `"Scripted", "Reality"` |
   | `WTV_GENRES` | Genres to filter | `"Drama", "Comedy"` |
   | `WTV_LANGUAGE` | Language preference | `English` |

### How It Works

When you create a Codespace, the setup script automatically:

1. ✅ **Creates a clean `.env` file** with public configuration
2. ✅ **Adds secrets from Codespaces** if they exist
3. ✅ **Generates `config.json`** from environment variables
4. ✅ **Never commits sensitive data** to the repository

## 🚀 Setup Process

### Automatic Configuration
```bash
# When Codespace starts, you'll see:
🔐 Configuring environment variables...
✅ Found SLACK_BOT_TOKEN in Codespaces secrets
✅ Found SLACK_CHANNEL_ID in Codespaces secrets
📝 Creating config.json from environment variables...
```

### Manual Configuration (Alternative)
If you prefer not to use Codespaces secrets, you can still manually edit files:

```bash
# Edit .env file (gitignored, safe to edit)
nano .env

# Edit config.json (gitignored, safe to edit)
nano config.json
```

## 📋 Environment Variables Reference

### Required for Slack Integration
```bash
SLACK_BOT_TOKEN=xoxb-your-actual-token-here
SLACK_CHANNEL_ID=C1234567890
```

### Optional Configuration
```bash
# TV Show Filtering (JSON array format)
WTV_NETWORKS="\"NBC\", \"CBS\", \"ABC\""
WTV_TYPES="\"Scripted\", \"Reality\""
WTV_GENRES="\"Drama\", \"Comedy\", \"Action\""
WTV_LANGUAGE="English"

# Logging
LOG_LEVEL=info

# Development
NODE_ENV=development
```

### Public Configuration (Always Set)
```bash
# TVMaze API (public, no authentication required)
TVMAZE_BASE_URL=https://api.tvmaze.com
```

## 🔧 Getting Slack Credentials

### 1. Create a Slack App
1. Visit: https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "WhatsOnTV Bot")
4. Select your workspace

### 2. Configure Bot Permissions
1. Go to "OAuth & Permissions"
2. Add these Bot Token Scopes:
   - `chat:write` - Send messages
   - `channels:read` - Read channel information

### 3. Install to Workspace
1. Click "Install to Workspace"
2. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Get Channel ID
1. Open Slack in browser
2. Navigate to your target channel
3. Copy the channel ID from the URL: `/C1234567890/`

## 🛡️ Security Benefits

### ✅ Advantages of Environment Variables:
- **No accidental commits** of sensitive data
- **Per-developer configuration** without conflicts
- **Easy rotation** of credentials
- **Centralized secret management** through GitHub
- **Clean repository** with no sensitive files

### ✅ What Gets Created:
```bash
# .env (gitignored, auto-generated)
TVMAZE_BASE_URL=https://api.tvmaze.com
SLACK_BOT_TOKEN=xoxb-actual-token-from-secrets
SLACK_CHANNEL_ID=C1234567890
LOG_LEVEL=info
NODE_ENV=development

# config.json (gitignored, auto-generated)
{
  "networks": ["NBC", "CBS"],
  "types": ["Scripted"],
  "genres": ["Drama", "Comedy"],
  "language": "English"
}
```

## 🔍 Verification

### Check Environment Setup
```bash
# Run the status dashboard
bash .devcontainer/status.sh

# Check environment variables
env | grep -E "(SLACK|WTV|TVMAZE)"

# Test the application
npm start
```

### Expected Output
```bash
🔐 Configuring environment variables...
✅ Found SLACK_BOT_TOKEN in Codespaces secrets
✅ Found SLACK_CHANNEL_ID in Codespaces secrets
📝 Creating config.json from environment variables...
✅ Setup complete!
```

## 🚨 Troubleshooting

### Secrets Not Found
```bash
ℹ️  No SLACK_BOT_TOKEN found in Codespaces secrets
   Set it in: GitHub → Settings → Codespaces → Secrets
```

**Solution**: Add the secrets in GitHub Settings → Codespaces

### Invalid JSON in Config
```bash
# Check your environment variable format:
WTV_NETWORKS="\"NBC\", \"CBS\""  # ✅ Correct
WTV_NETWORKS="NBC, CBS"          # ❌ Invalid JSON
```

### App Not Working
```bash
# Check if .env was created properly
cat .env

# Check if config.json is valid
cat config.json | jq .

# Run with debug logging
LOG_LEVEL=debug npm start
```

## 🔄 Updating Configuration

### Change Secrets
1. Update in GitHub → Settings → Codespaces → Secrets
2. Rebuild Codespace or run: `bash .devcontainer/setup.sh`

### Change App Configuration
1. Update environment variables in Codespaces settings
2. Restart Codespace or regenerate config:
   ```bash
   rm config.json .env
   bash .devcontainer/setup.sh
   ```

## 📚 Additional Resources

- [GitHub Codespaces Secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)
- [Slack App Configuration](https://api.slack.com/authentication/basics)
- [Environment Variables Best Practices](https://12factor.net/config)
