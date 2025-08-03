# GitHub Codespaces Setup for WhatsOnTV

This guide covers setting up the WhatsOnTV project in GitHub Codespaces and integrating Claude Code for AI-assisted development.

## Quick Start

1. **Open in Codespaces**
   - Navigate to your GitHub repository
   - Click the green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main"

2. **Automatic Setup**
   - The devcontainer will automatically install dependencies
   - Run the setup script: `./devcontainer/setup.sh`
   - Your environment will be ready in 2-3 minutes

## Claude Code Integration

### Option 1: Claude Code CLI (Recommended)

The Claude Code CLI allows you to interact with Claude directly from your terminal within Codespaces.

#### Installation
```bash
# Check if Claude CLI is available
claude --version

# If not installed, follow these steps:
# 1. Visit https://claude.ai/download
# 2. Download the appropriate binary for Linux x64
# 3. Install in Codespaces:
curl -L "https://github.com/anthropic/claude-cli/releases/latest/download/claude-linux-x64" -o claude
chmod +x claude
sudo mv claude /usr/local/bin/
```

#### Usage Examples
```bash
# Ask Claude about your code
claude "Explain this TypeScript interface" < src/interfaces/tvShowService.ts

# Get help with debugging
claude "Why might this test be failing?" < src/tests/implementations/console/consoleFormatterImpl.test.ts

# Code review assistance
claude "Review this implementation for best practices" < src/implementations/slack/slackOutputServiceImpl.ts

# Generate documentation
claude "Generate JSDoc comments for this class" < src/core/application.ts
```

### Option 2: Claude Web Interface

Since Codespaces runs in your browser, you can easily use Claude's web interface alongside your development environment.

#### Setup
1. Open a new browser tab to https://claude.ai
2. Sign in to your Claude account
3. Use split-screen or multiple windows to work with both Claude and Codespaces

#### Best Practices
- Copy code snippets from Codespaces to Claude for analysis
- Use Claude to generate test cases, documentation, or refactoring suggestions
- Ask Claude to explain complex TypeScript patterns or dependency injection concepts

### Option 3: VS Code Extensions

The devcontainer includes GitHub Copilot extensions for AI assistance directly in the editor.

## Development Workflow

### Initial Setup
```bash
# Verify installation
npm --version
node --version
tsx --version

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm start
```

### Common Commands
```bash
# Run the CLI application
npm start

# Run Slack integration
npm run slack

# Run tests with coverage
npm test

# Run tests without coverage (faster)
npm run test:no-coverage

# Lint and fix code
npm run lint:fix

# Build the project
npm run build
```

### Environment Configuration

The devcontainer automatically creates example configuration files:

1. **config.json** - Application configuration
2. **.env** - Environment variables

Update these files with your actual API keys and preferences.

## Claude Code Workflow Examples

### 1. Code Review and Refactoring
```bash
# Ask Claude to review a specific file
claude "Review this implementation for TypeScript best practices and suggest improvements" < src/implementations/console/consoleFormatterImpl.ts

# Get refactoring suggestions
claude "How can I improve the testability of this service class?" < src/implementations/tvmaze/tvMazeServiceImpl.ts
```

### 2. Test Generation
```bash
# Generate test cases
claude "Generate comprehensive Jest test cases for this TypeScript class" < src/utils/showUtils.ts

# Debug failing tests
claude "Why might this Jest test be failing? Here's the test file:" < src/tests/utils/showUtils.test.ts
```

### 3. Documentation Generation
```bash
# Generate API documentation
claude "Generate comprehensive JSDoc documentation for this TypeScript interface" < src/interfaces/outputService.ts

# Create README sections
claude "Create a usage guide for this CLI application based on the source code" < src/cli/consoleCli.ts
```

### 4. Architecture Analysis
```bash
# Analyze project structure
claude "Analyze this TypeScript project structure and suggest improvements for maintainability" < package.json

# Review dependency injection setup
claude "Review this dependency injection configuration and suggest best practices" < src/core/container.ts
```

## Tips for Effective Claude Integration

### 1. Context Sharing
- Always provide relevant context when asking Claude questions
- Include error messages, stack traces, and related code files
- Mention the project's architecture (clean architecture, dependency injection)

### 2. Iterative Development
- Use Claude for initial implementation ideas
- Refine suggestions based on project standards
- Validate Claude's suggestions against your test suite

### 3. Code Quality
- Ask Claude to review code against the project's ESLint rules
- Use Claude to suggest TypeScript type improvements
- Get help with complex generic types or utility types

### 4. Testing Strategy
- Use Claude to generate edge cases for your tests
- Ask for help with mocking strategies for dependency injection
- Get suggestions for improving test coverage

## Troubleshooting

### Common Issues

1. **Claude CLI Not Found**
   ```bash
   # Reinstall Claude CLI
   curl -L "https://github.com/anthropic/claude-cli/releases/latest/download/claude-linux-x64" -o claude
   chmod +x claude
   sudo mv claude /usr/local/bin/
   ```

2. **Environment Variables Not Set**
   ```bash
   # Check environment variables
   env | grep -E "(SLACK|TVMAZE|LOG)"
   
   # Source the .env file if needed
   export $(cat .env | xargs)
   ```

3. **Port Forwarding Issues**
   - Codespaces automatically forwards ports 3000 and 8080
   - Check the "Ports" tab in VS Code for active forwards

### Getting Help

1. **Project Documentation**: Check `/workspaces/whatsontv/docs/`
2. **Claude Assistance**: Ask Claude about specific error messages or implementation questions
3. **GitHub Issues**: Create issues for bugs or feature requests
4. **VS Code Command Palette**: Use Ctrl+Shift+P for Codespaces-specific commands

## Security Considerations

- Never commit API keys or sensitive data to the repository
- Use environment variables for all secrets
- The `.env` file is gitignored and should contain your actual credentials
- Consider using GitHub Secrets for production deployments

## Performance Tips

- Use `npm run test:no-coverage` for faster test runs during development
- The devcontainer includes Node.js 20 for optimal performance
- Use VS Code's built-in terminal for better integration with Codespaces

## Next Steps

1. Explore the project documentation in `/workspaces/whatsontv/docs/`
2. Run the application with `npm start` to see it in action
3. Try the Slack integration with `npm run slack`
4. Use Claude to understand the codebase and suggest improvements
5. Contribute to the project by creating feature branches and pull requests
