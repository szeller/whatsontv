#!/bin/bash

# Vibe Coding Aliases for Claude CLI + WhatsOnTV Development
echo "🎯 Setting up vibe coding aliases..."

# Create aliases for common Claude CLI workflows
cat >> ~/.bashrc << 'EOF'

# === VIBE CODING ALIASES ===

# Quick code review
alias cr='claude "Review this code for TypeScript best practices, clean architecture principles, and suggest improvements"'

# Explain code in detail
alias explain='claude "Explain this code in detail, including design patterns and architectural decisions"'

# Debug assistance
alias debug='claude "Help debug this issue. Analyze the code and suggest potential solutions"'

# Generate comprehensive tests
alias gentests='claude "Generate comprehensive Jest test cases following the AAA pattern for this TypeScript code"'

# Architecture analysis
alias arch='claude "Analyze this code from a clean architecture perspective and suggest improvements"'

# Refactoring suggestions
alias refactor='claude "Suggest refactoring opportunities to improve maintainability and testability"'

# Documentation generation
alias gendocs='claude "Generate comprehensive JSDoc documentation for this TypeScript code"'

# Performance analysis
alias perf='claude "Analyze this code for performance issues and suggest optimizations"'

# Security review
alias security='claude "Review this code for security vulnerabilities and best practices"'

# Type safety analysis
alias types='claude "Review this TypeScript code for type safety improvements and better type definitions"'

# === PROJECT-SPECIFIC ALIASES ===

# WhatsOnTV specific commands
alias wtv-start='npm start'
alias wtv-slack='npm run slack'
alias wtv-test='npm test'
alias wtv-lint='npm run lint:fix'
alias wtv-build='npm run build'

# Quick project exploration
alias wtv-explore='claude "Explain the WhatsOnTV project structure and key components" < package.json'

# Service analysis
alias wtv-services='find src/implementations -name "*.ts" -exec basename {} \; | sort | uniq'

# Interface review
alias wtv-interfaces='find src/interfaces -name "*.ts" -exec basename {} \; | sort | uniq'

EOF

echo "✅ Vibe coding aliases added to ~/.bashrc"
echo ""
echo "🚀 Available aliases:"
echo "   cr <file>         - Code review"
echo "   explain <file>    - Explain code"
echo "   debug             - Debug assistance"
echo "   gentests <file>   - Generate tests"
echo "   arch <file>       - Architecture analysis"
echo "   refactor <file>   - Refactoring suggestions"
echo "   gendocs <file>    - Generate documentation"
echo "   perf <file>       - Performance analysis"
echo "   security <file>   - Security review"
echo "   types <file>      - Type safety analysis"
echo ""
echo "📋 Project aliases:"
echo "   wtv-start         - Run CLI app"
echo "   wtv-slack         - Run Slack integration"
echo "   wtv-test          - Run tests"
echo "   wtv-lint          - Fix linting issues"
echo "   wtv-build         - Build project"
echo ""
echo "🔄 Reload your shell: source ~/.bashrc"
