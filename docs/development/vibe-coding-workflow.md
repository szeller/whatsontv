# Vibe Coding Workflow: Claude CLI + GitHub Copilot

This guide outlines the optimal workflow for using Claude CLI for exploratory development ("vibe coding") and GitHub Copilot for manual editing in the WhatsOnTV project.

## 🎯 Workflow Overview

### Claude CLI (Vibe Coding)
- **Exploratory development** and brainstorming
- **Code analysis** and architecture discussions
- **Rapid prototyping** and experimentation
- **Debugging** complex issues
- **Learning** new patterns or APIs

### GitHub Copilot (Manual Editing)
- **Inline suggestions** while typing
- **Code completion** for repetitive patterns
- **Boilerplate generation** for tests and interfaces
- **Refactoring assistance** during editing

## 🚀 Getting Started

### Automatic Setup
When you create a Codespace, Claude CLI will be automatically installed. You'll see:
```
🤖 Installing Claude CLI for vibe coding...
✅ Claude CLI installed successfully
🎯 Vibe Coding Workflow Ready!
```

### Manual Verification
```bash
# Check Claude CLI installation
claude --version

# Check Copilot status in VS Code
# Look for Copilot icon in status bar (should show as active)
```

## 🧠 Vibe Coding with Claude CLI

### 1. Exploring the Codebase
```bash
# Understand project architecture
claude "Explain the clean architecture pattern used in this TypeScript project" < package.json

# Analyze specific components
claude "Explain how dependency injection works in this service" < src/implementations/console/consoleOutputServiceImpl.ts

# Review interfaces
claude "What design patterns are used in this interface?" < src/interfaces/outputService.ts
```

### 2. Feature Planning and Design
```bash
# Brainstorm new features
claude "I want to add email notifications to this TV show app. How should I structure this feature following the existing architecture?"

# Analyze requirements
claude "Given this existing Slack integration, what would be needed to add Discord support?" < src/implementations/slack/slackOutputServiceImpl.ts

# Design patterns
claude "How can I improve the testability of this service class?" < src/implementations/tvmaze/tvMazeServiceImpl.ts
```

### 3. Debugging and Problem Solving
```bash
# Debug failing tests
claude "This Jest test is failing. What might be wrong?" < src/tests/implementations/console/consoleFormatterImpl.test.ts

# Analyze error messages
claude "I'm getting this TypeScript error: [paste error]. How do I fix it?"

# Performance analysis
claude "How can I optimize this data transformation?" < src/utils/showUtils.ts
```

### 4. Code Review and Refactoring
```bash
# Get refactoring suggestions
claude "How can I refactor this to reduce complexity?" < src/implementations/console/consoleFormatterImpl.ts

# Review for best practices
claude "Review this code for TypeScript best practices and clean architecture principles" < src/core/application.ts

# Suggest improvements
claude "What improvements would you suggest for this utility function?" < src/utils/dateUtils.ts
```

### 5. Learning and Documentation
```bash
# Understand complex code
claude "Explain how this dependency injection container works" < src/core/container.ts

# Generate documentation
claude "Create comprehensive JSDoc comments for this interface" < src/interfaces/tvShowService.ts

# Learn patterns
claude "Explain the builder pattern used in these test fixtures" < src/tests/fixtures/domain/showBuilder.ts
```

## ✏️ Manual Editing with GitHub Copilot

### 1. Optimized Copilot Settings
The devcontainer includes optimized Copilot settings:
- **Temperature**: 0.1 (more focused suggestions)
- **Length**: 500 characters (detailed completions)
- **Enabled**: TypeScript, JavaScript, Markdown
- **Disabled**: Plain text, commit messages

### 2. Effective Copilot Usage

#### Writing New Code
```typescript
// Type a comment describing what you want
// Copilot will suggest the implementation

// Format episode ranges for display
function formatEpisodeRanges(episodes: Episode[]): string {
  // Copilot will suggest the implementation
}
```

#### Test Generation
```typescript
// Copilot excels at generating test patterns
describe('formatEpisodeRanges', () => {
  it('should format consecutive episodes as ranges', () => {
    // Copilot will suggest test setup and assertions
  });
});
```

#### Interface Implementation
```typescript
// When implementing interfaces, Copilot suggests method signatures
export class NewOutputService implements OutputService {
  // Copilot will suggest all required methods
}
```

### 3. Copilot Best Practices

#### Use Descriptive Comments
```typescript
// Good: Specific intent
// Parse time string in HH:MM format and return minutes since midnight
function parseTimeToMinutes(timeString: string): number {

// Bad: Vague intent
// Parse time
function parseTime(time: string) {
```

#### Leverage Context
- Keep related files open in tabs
- Copilot uses context from all open files
- Name variables and functions descriptively

#### Accept and Refine
- Accept Copilot suggestions as starting points
- Refine to match project standards (ESLint will help)
- Use Claude CLI to review complex suggestions

## 🔄 Combined Workflow Examples

### Example 1: Adding a New Feature

1. **Vibe with Claude** - Explore the idea
```bash
claude "I want to add a web dashboard to this CLI app. How should I structure this following clean architecture?"
```

2. **Design with Claude** - Plan the implementation
```bash
claude "Given this existing output service pattern, how would I add a web interface?" < src/interfaces/outputService.ts
```

3. **Implement with Copilot** - Write the code
```typescript
// Create web output service interface
export interface WebOutputService extends OutputService {
  // Copilot suggests methods
}
```

4. **Review with Claude** - Validate the implementation
```bash
claude "Review this new web service implementation for best practices" < src/implementations/web/webOutputServiceImpl.ts
```

### Example 2: Debugging Complex Issues

1. **Analyze with Claude** - Understand the problem
```bash
claude "This test is failing intermittently. What could cause flaky behavior?" < src/tests/integration/cliTestRunner.test.ts
```

2. **Fix with Copilot** - Implement the solution
```typescript
// Add proper async handling based on Claude's analysis
// Copilot suggests the specific async/await patterns
```

3. **Validate with Claude** - Confirm the fix
```bash
claude "Does this fix address the race condition properly?" < src/tests/integration/cliTestRunner.test.ts
```

## 🎛️ Workflow Customization

### Claude CLI Aliases
Add these to your shell profile for faster access:
```bash
# Quick code review
alias cr='claude "Review this code for best practices"'

# Explain code
alias explain='claude "Explain this code in detail"'

# Debug help
alias debug='claude "Help debug this issue"'

# Generate tests
alias gentests='claude "Generate comprehensive tests for this code"'
```

### VS Code Keybindings
Optimize for the workflow:
- `Ctrl+Shift+P` → "GitHub Copilot: Toggle Inline Suggestions"
- `Alt+]` → Accept Copilot suggestion
- `Alt+[` → Reject Copilot suggestion
- `Ctrl+Enter` → Open Copilot suggestions panel

## 🔧 Troubleshooting

### Claude CLI Issues
```bash
# Reinstall Claude CLI
curl -L "https://github.com/anthropic/claude-cli/releases/latest/download/claude-linux-x64" -o claude
chmod +x claude
sudo mv claude /usr/local/bin/

# Test installation
claude --version
```

### Copilot Issues
1. Check Copilot status in VS Code status bar
2. Sign in to GitHub if prompted
3. Restart VS Code if suggestions stop working
4. Check Copilot settings in VS Code preferences

### Performance Tips
- Use Claude CLI for big picture thinking
- Use Copilot for detailed implementation
- Keep Claude sessions focused (one topic at a time)
- Restart Copilot if suggestions become repetitive

## 📈 Measuring Success

### Effective Vibe Coding Signs
- Faster understanding of complex code
- Better architectural decisions
- More comprehensive test coverage
- Improved code quality from reviews

### Effective Manual Editing Signs
- Faster implementation of repetitive patterns
- Fewer syntax errors
- Better code completion
- More consistent code style

This workflow combines the best of both AI tools: Claude's deep reasoning for exploration and planning, and Copilot's contextual assistance for implementation.
