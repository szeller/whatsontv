# 🚀 Codespaces Quick Start Guide

**Get productive in 2 minutes with AI-assisted development!**

## 🎯 One-Click Setup

### Option 1: With Secrets (Recommended)
1. **Set up secrets first**: GitHub → Settings → Codespaces → Secrets
   - Add `SLACK_BOT_TOKEN` (your Slack bot token)
   - Add `SLACK_CHANNEL_ID` (your target channel)
2. **Open in Codespaces**: Click "Code" → "Codespaces" → "Create codespace"
3. **Wait 3 minutes**: Everything configured automatically!
4. **Start coding**: Full Slack integration ready

### Option 2: Basic Setup (No Slack)
1. **Open in Codespaces**: Click "Code" → "Codespaces" → "Create codespace"
2. **Wait 3 minutes**: CLI tools ready (Slack integration disabled)
3. **Add secrets later**: Follow Option 1 to enable Slack

## 🤖 AI Workflow (Optimized for You!)

### Claude CLI (Vibe Coding) 🧠
```bash
# Load aliases first
source ~/.bashrc

# Instant code review
cr src/core/application.ts

# Understand the codebase  
explain src/interfaces/outputService.ts

# Debug issues
debug

# Generate tests
gentests src/utils/showUtils.ts

# Architecture analysis
arch src/implementations/console/
```

### GitHub Copilot (Manual Editing) ✏️
- **Auto-enabled** in VS Code with optimized settings
- **Type comments** → Get implementation suggestions
- **Start typing** → Get intelligent completions
- **Temperature: 0.1** (focused suggestions)
- **Length: 500** (detailed completions)

## 🎮 Essential Commands

### Project Commands
```bash
wtv-start      # Run CLI app
wtv-slack      # Run Slack integration
wtv-test       # Run tests
wtv-lint       # Fix code style
wtv-build      # Build project
```

### Development Commands
```bash
npm start              # Run the CLI application
npm run slack          # Run Slack integration
npm test               # Run tests with coverage
npm run lint:fix       # Fix linting issues
npm run build          # Build TypeScript
```

## 🔍 Check Your Setup

```bash
# Run the status dashboard
bash .devcontainer/status.sh
```

This shows:
- ✅ Environment status (Node.js, npm, tsx)
- 🤖 Claude CLI installation
- 🎯 Vibe coding aliases
- 🤝 GitHub Copilot status
- 🔐 Codespaces secrets status
- ⚙️ Auto-generated configuration
- 🔨 Build status

## 🚨 Troubleshooting

### Claude CLI Not Working?
```bash
# Reinstall Claude CLI
bash .devcontainer/install-claude.sh

# Check installation
claude --version
```

### Aliases Not Available?
```bash
# Reload shell configuration
source ~/.bashrc

# Or re-run alias setup
bash .devcontainer/vibe-aliases.sh
```

### Copilot Not Suggesting?
1. Check Copilot icon in VS Code status bar
2. Sign in to GitHub if prompted
3. Restart VS Code if needed

## 📚 Learn More

- **Environment Setup**: `.devcontainer/ENVIRONMENT-SETUP.md`
- **Detailed Workflow**: `docs/development/vibe-coding-workflow.md`
- **Devcontainer Config**: `.devcontainer/README.md`
- **Security Guidelines**: `.devcontainer/SECURITY.md`
- **Project Overview**: `README.md`

## 🎯 Pro Tips

1. **Start with exploration**: `explain package.json`
2. **Use Claude for big picture**: Architecture, design, debugging
3. **Use Copilot for details**: Implementation, boilerplate, tests
4. **Check status anytime**: `bash .devcontainer/status.sh`
5. **All aliases available**: Type `alias | grep claude` to see all

## 🔄 Workflow Example

```bash
# 1. Understand the project
explain package.json

# 2. Explore a component
cr src/implementations/console/consoleFormatterImpl.ts

# 3. Plan a feature
claude "How should I add email notifications to this app?"

# 4. Implement with Copilot assistance (in VS Code)
# Type: // Create email service interface
# Copilot suggests the implementation

# 5. Generate tests
gentests src/implementations/email/emailService.ts

# 6. Review your work
cr src/implementations/email/emailService.ts
```

**Ready to code? Start with `wtv-start` to see the app in action!** 🎉
