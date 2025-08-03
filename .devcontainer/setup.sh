#!/bin/bash

# WhatsOnTV Codespaces Setup Script
echo "🚀 Setting up WhatsOnTV development environment..."

# Install global dependencies
echo "📦 Installing global dependencies..."
npm install -g tsx typescript

# Set up git configuration for Codespaces
echo "🔧 Configuring git..."
git config --global init.defaultBranch main
git config --global pull.rebase false

# Check for Codespaces environment variables and create .env only if secrets are provided
echo "🔐 Configuring environment variables..."

# Always create a basic .env for development (no secrets)
cat > /workspaces/whatsontv/.env << 'EOF'
# TVMaze API Configuration (public API, no authentication required)
TVMAZE_BASE_URL=https://api.tvmaze.com

# Logging Configuration
LOG_LEVEL=info

# Development Mode
NODE_ENV=development
EOF

# Add Slack configuration if Codespaces secrets are available
if [ -n "$SLACK_BOT_TOKEN" ]; then
    echo "✅ Found SLACK_BOT_TOKEN in Codespaces secrets"
    echo "SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN" >> /workspaces/whatsontv/.env
else
    echo "ℹ️  No SLACK_BOT_TOKEN found in Codespaces secrets"
    echo "   Set it in: GitHub → Settings → Codespaces → Secrets"
fi

if [ -n "$SLACK_CHANNEL_ID" ]; then
    echo "✅ Found SLACK_CHANNEL_ID in Codespaces secrets"
    echo "SLACK_CHANNEL_ID=$SLACK_CHANNEL_ID" >> /workspaces/whatsontv/.env
else
    echo "ℹ️  No SLACK_CHANNEL_ID found in Codespaces secrets"
    echo "   Set it in: GitHub → Settings → Codespaces → Secrets"
fi

# Create config.json from environment variables if available
if [ -n "$WTV_NETWORKS" ] || [ -n "$WTV_TYPES" ] || [ -n "$WTV_GENRES" ] || [ -n "$WTV_LANGUAGE" ]; then
    echo "📝 Creating config.json from environment variables..."
    cat > /workspaces/whatsontv/config.json << EOF
{
  "networks": ${WTV_NETWORKS:-'["Discovery", "CBS", "Netflix", "Paramount+", "Peacock", "Hulu", "NBC", "HBO", "MAX", "ABC", "Prime Video", "Disney+", "Fox"]'},
  "types": ${WTV_TYPES:-'["Scripted", "Documentary"]'},
  "genres": ${WTV_GENRES:-'[]'},
  "language": ${WTV_LANGUAGE:-'["English"]'}
}
EOF
else
    # Create example config if no environment variables
    if [ ! -f "/workspaces/whatsontv/config.json" ]; then
        echo "📝 Creating example config.json..."
        cp /workspaces/whatsontv/config.json.example /workspaces/whatsontv/config.json
    fi
fi

# Set up vibe coding aliases
echo "🎯 Setting up vibe coding aliases..."
bash /workspaces/whatsontv/.devcontainer/vibe-aliases.sh

# Run initial build and tests
echo "🧪 Running initial build and tests..."
npm run build
npm run test:no-coverage

echo "✅ Setup complete! Your WhatsOnTV development environment is ready."
echo ""
echo "📋 Quick Start Commands:"
echo "  npm start          - Run the CLI application"
echo "  npm run slack      - Run the Slack integration"
echo "  npm test           - Run tests with coverage"
echo "  npm run lint       - Check code quality"
echo "  npm run lint:fix   - Fix linting issues"
echo ""
echo "🎯 Vibe Coding Commands:"
echo "  cr <file>          - Code review with Claude"
echo "  explain <file>     - Explain code with Claude"
echo "  debug              - Debug assistance"
echo "  gentests <file>    - Generate tests"
echo "  arch <file>        - Architecture analysis"
echo "  source ~/.bashrc   - Load vibe coding aliases"
echo ""
echo "🔗 Useful Links:"
echo "  - Project README: /workspaces/whatsontv/README.md"
echo "  - Documentation: /workspaces/whatsontv/docs/"
echo "  - TVMaze API: https://www.tvmaze.com/api"
