# Codespaces Development Environment

This directory contains the GitHub Codespaces configuration for the WhatsOnTV project, optimized for AI-assisted development with Claude CLI and GitHub Copilot.

## 📁 Files Overview

### Core Configuration
- **`devcontainer.json`** - Main Codespaces configuration
  - Node.js 20 environment with TypeScript support
  - Pre-installed VS Code extensions for TypeScript, ESLint, Jest, and GitHub Copilot
  - Optimized Copilot settings (temperature: 0.1, length: 500)
  - Automatic dependency installation and Claude CLI setup

### Setup Scripts
- **`setup.sh`** - Main setup script (runs automatically)
  - Creates example config files
  - Sets up environment variables
  - Runs initial build and tests
  - Loads vibe coding aliases

- **`install-claude.sh`** - Claude CLI installation (runs automatically)
  - Downloads and installs Claude CLI for Linux x64
  - Verifies installation and provides usage tips

- **`vibe-aliases.sh`** - Shell aliases for vibe coding workflow
  - Creates convenient shortcuts for Claude CLI commands
  - Adds project-specific aliases (wtv-*)

## 🚀 What Happens When You Create a Codespace

1. **Environment Setup** (1-2 minutes)
   - Node.js 20 and TypeScript environment created
   - VS Code extensions installed automatically
   - GitHub CLI and development tools configured

2. **Project Setup** (1-2 minutes)
   - `npm install` - Install all dependencies
   - `npm run build` - Initial TypeScript build
   - Claude CLI installation and verification

3. **Workflow Setup** (30 seconds)
   - Vibe coding aliases loaded into shell
   - Example configuration files created
   - Environment variables template created

4. **Ready to Code!**
   - All tools configured and ready
   - Vibe coding workflow active
   - GitHub Copilot optimized for TypeScript

## 🎯 AI Workflow Configuration

### Claude CLI (Vibe Coding)
```bash
# Automatic aliases available:
cr <file>           # Code review
explain <file>      # Explain code
debug               # Debug assistance
gentests <file>     # Generate tests
arch <file>         # Architecture analysis
refactor <file>     # Refactoring suggestions
```

### GitHub Copilot (Manual Editing)
- **Temperature**: 0.1 (focused suggestions)
- **Length**: 500 characters (detailed completions)
- **Enabled for**: TypeScript, JavaScript, Markdown
- **Disabled for**: Plain text, commit messages

## 🔧 Customization

### Adding New Extensions
Edit `devcontainer.json` → `customizations.vscode.extensions`:
```json
"extensions": [
  "existing.extension",
  "your.new-extension"
]
```

### Modifying Copilot Settings
Edit `devcontainer.json` → `customizations.vscode.settings`:
```json
"github.copilot.advanced": {
  "length": 500,
  "temperature": 0.1
}
```

### Adding New Aliases
Edit `vibe-aliases.sh` and add to the aliases section:
```bash
alias myalias='claude "your custom prompt"'
```

## 🐛 Troubleshooting

### Claude CLI Issues
```bash
# Check installation
claude --version

# Reinstall if needed
bash .devcontainer/install-claude.sh
```

### Missing Aliases
```bash
# Reload aliases
source ~/.bashrc

# Or re-run setup
bash .devcontainer/vibe-aliases.sh
```

### Copilot Not Working
1. Check status bar in VS Code (should show Copilot icon)
2. Sign in to GitHub if prompted
3. Restart VS Code if needed

## 📚 Documentation

- **Workflow Guide**: `/docs/development/vibe-coding-workflow.md`
- **General Codespaces**: `/docs/development/codespaces.md`
- **Project README**: `/README.md`

## 🔄 Updates and Maintenance

To update the Codespaces configuration:
1. Modify files in `.devcontainer/`
2. Commit and push changes
3. Rebuild existing Codespaces or create new ones
4. Test the setup with a fresh Codespace

## 💡 Tips for Contributors

- Use `wtv-*` aliases for common project commands
- Start with `explain package.json` to understand the project
- Use `cr <file>` for instant code reviews with Claude
- Leverage Copilot for boilerplate and repetitive code
- Check `/docs/development/` for detailed workflow guides
