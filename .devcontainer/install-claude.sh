#!/bin/bash

# Claude CLI Installation Script for Codespaces
echo "🤖 Installing Claude CLI for vibe coding..."

# Check if Claude CLI is already installed
if command -v claude &> /dev/null; then
    echo "✅ Claude CLI already installed: $(claude --version)"
    exit 0
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Download Claude CLI for Linux x64
echo "📥 Downloading Claude CLI..."
curl -L "https://github.com/anthropic/claude-cli/releases/latest/download/claude-linux-x64" -o claude

# Make executable and install
chmod +x claude
sudo mv claude /usr/local/bin/

# Verify installation
if command -v claude &> /dev/null; then
    echo "✅ Claude CLI installed successfully: $(claude --version)"
    echo ""
    echo "🎯 Vibe Coding Workflow Ready!"
    echo "   Use 'claude' command for exploratory development"
    echo "   Use GitHub Copilot for inline suggestions while editing"
    echo ""
    echo "📋 Quick Claude Commands:"
    echo "   claude 'explain this code' < src/file.ts"
    echo "   claude 'suggest improvements' < src/file.ts"
    echo "   claude 'generate tests' < src/file.ts"
    echo "   claude 'debug this error: [error message]'"
else
    echo "❌ Failed to install Claude CLI"
    exit 1
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"
