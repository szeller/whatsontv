#!/bin/bash

# WhatsOnTV Codespaces Status Dashboard
# Shows the current state of the development environment and AI tools

echo "🚀 WhatsOnTV Development Environment Status"
echo "=============================================="
echo ""

# Check Node.js and npm
echo "📦 Development Environment:"
if command -v node &> /dev/null; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js: Not installed"
fi

if command -v npm &> /dev/null; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm: Not installed"
fi

if command -v tsx &> /dev/null; then
    echo "  ✅ tsx: $(tsx --version)"
else
    echo "  ❌ tsx: Not installed"
fi

echo ""

# Check Claude CLI installation
echo "🤖 Claude CLI (Vibe Coding):"
if command -v claude &> /dev/null; then
    echo "  ✅ Claude CLI: Installed and ready"
    echo "  📋 Try: claude 'explain this project' < package.json"
else
    echo "  ❌ Claude CLI: Not installed"
    echo "  🔧 Run: bash .devcontainer/install-claude.sh"
fi

echo ""

# Check vibe coding aliases
echo "🎯 Vibe Coding Aliases:"
if alias cr &> /dev/null; then
    echo "  ✅ Aliases loaded and ready"
    echo "  📋 Available: cr, explain, debug, gentests, arch, refactor"
    echo "  📋 Project: wtv-start, wtv-slack, wtv-test, wtv-lint"
else
    echo "  ❌ Aliases not loaded"
    echo "  🔧 Run: source ~/.bashrc"
fi

echo ""

# Check GitHub Copilot (if in VS Code)
echo "🤝 GitHub Copilot (Manual Editing):"
if [ "$TERM_PROGRAM" = "vscode" ]; then
    echo "  ✅ Running in VS Code - Copilot should be active"
    echo "  ⚙️  Settings: Temperature 0.1, Length 500"
    echo "  📋 Enabled for: TypeScript, JavaScript, Markdown"
else
    echo "  ℹ️  Status unknown (not in VS Code terminal)"
fi

echo ""

# Check project dependencies
echo "📚 Project Dependencies:"
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "  ✅ Dependencies installed"
    else
        echo "  ❌ Dependencies not installed"
        echo "  🔧 Run: npm install"
    fi
else
    echo "  ❌ package.json not found"
fi

echo ""

# Check configuration
echo "⚙️  Configuration Status:"

# Check .env file
if [ -f ".env" ]; then
    echo "  ✅ .env: Auto-generated"
else
    echo "  ❌ .env: Missing"
    echo "  🔧 Run: bash .devcontainer/setup.sh"
fi

# Check Codespaces secrets
if [ -n "$SLACK_BOT_TOKEN" ]; then
    echo "  ✅ SLACK_BOT_TOKEN: Available from Codespaces secrets"
else
    echo "  ⚠️  SLACK_BOT_TOKEN: Not set"
    echo "     Set in: GitHub → Settings → Codespaces → Secrets"
fi

if [ -n "$SLACK_CHANNEL_ID" ]; then
    echo "  ✅ SLACK_CHANNEL_ID: Available from Codespaces secrets"
else
    echo "  ⚠️  SLACK_CHANNEL_ID: Not set"
    echo "     Set in: GitHub → Settings → Codespaces → Secrets"
fi

# Check config.json
if [ -f "config.json" ]; then
    echo "  ✅ config.json: Present"
else
    echo "  ❌ config.json: Missing"
    echo "  🔧 Run: bash .devcontainer/setup.sh"
fi

echo ""

# Check build status
echo "🔨 Build Status:"
if [ -d "dist" ]; then
    echo "  ✅ Project built (dist/ exists)"
else
    echo "  ❌ Project not built"
    echo "  🔧 Run: npm run build"
fi

echo ""

# Quick start commands
echo "🚀 Quick Start Commands:"
echo "  npm start          - Run the CLI application"
echo "  npm run slack      - Run Slack integration"
echo "  npm test           - Run tests with coverage"
echo "  npm run lint:fix   - Fix code style issues"
echo ""

# Vibe coding examples
echo "🎯 Vibe Coding Examples:"
echo "  cr src/core/application.ts                    - Review code"
echo "  explain src/interfaces/outputService.ts       - Explain interface"
echo "  gentests src/utils/showUtils.ts              - Generate tests"
echo "  arch src/implementations/console/             - Analyze architecture"
echo ""

# Documentation links
echo "📖 Documentation:"
echo "  📁 .devcontainer/ENVIRONMENT-SETUP.md        - Environment variables guide"
echo "  📁 .devcontainer/README.md                   - Codespaces setup"
echo "  📁 docs/development/vibe-coding-workflow.md   - AI workflow guide"
echo "  📁 CODESPACES-QUICKSTART.md                  - Quick start guide"
echo "  📁 README.md                                 - Project overview"
echo ""

# Environment info
echo "🌍 Environment Info:"
echo "  📍 Working Directory: $(pwd)"
echo "  🕐 Current Time: $(date)"
echo "  👤 User: $(whoami)"
echo "  🖥️  Shell: $SHELL"
echo ""

echo "✨ Ready for vibe coding! Use Claude CLI for exploration and Copilot for implementation."
