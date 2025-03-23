# Dependency Injection in WhatsOnTV

This document outlines the dependency injection (DI) approach implemented in the WhatsOnTV project using the tsyringe library.

## Overview

Dependency injection is a design pattern that allows us to:
- Decouple components from their dependencies
- Improve testability by making it easier to substitute mock implementations
- Make the codebase more maintainable and flexible

We've chosen **tsyringe** as our DI container because it's:
- Lightweight and simple to use
- TypeScript-first with good type support
- Compatible with ES modules
- Requires minimal configuration

## Setup

### Required Dependencies

```bash
npm install tsyringe reflect-metadata
```

### TypeScript Configuration

The `tsconfig.json` file has been updated to enable decorators and metadata reflection:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Import Requirements

Every file that uses dependency injection must import `reflect-metadata` at the top:

```typescript
import 'reflect-metadata';
```

## Container Setup

The central container configuration is in `src/container.ts`:

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { ConsoleFormatter } from './formatters/consoleFormatter.js';
import { ConsoleOutputService } from './services/consoleOutputService.js';
import { consoleOutput } from './utils/console.js';
import { ChalkStyleService } from './utils/styleService.js';

// Register services with the container
container.register('StyleService', {
  useClass: ChalkStyleService
});

container.register('ShowFormatter', {
  useClass: ConsoleFormatter
});

container.register('ConsoleOutput', {
  useValue: consoleOutput
});

container.register('OutputService', {
  useClass: ConsoleOutputService
});

export { container };
```

## Using Dependency Injection

### Creating Injectable Classes

Use the `@injectable()` decorator and `@inject()` parameter decorators:

```typescript
import { injectable, inject } from 'tsyringe';

@injectable()
export class ConsoleFormatter implements ShowFormatter {
  constructor(
    @inject('StyleService') private readonly styleService: StyleService
  ) {}
  
  // Class implementation...
}
```

### Resolving Dependencies

In application code, resolve dependencies from the container:

```typescript
import 'reflect-metadata';
import { container } from './container.js';

// Resolve a service from the container
const outputService = container.resolve<OutputService>('OutputService');
```

## Testing with Dependency Injection

### Test Utilities

We've created test utilities in `src/tests/utils/testDiContainer.ts` to simplify testing with DI:

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';

// Setup a test container with mock dependencies
export function setupTestContainer(customRegistrations) {
  const testContainer = container.createChildContainer();
  
  // Register default test dependencies...
  
  // Register custom dependencies
  if (customRegistrations) {
    Object.entries(customRegistrations).forEach(([token, registration]) => {
      testContainer.register(token, { useValue: registration });
    });
  }
  
  return testContainer;
}
```

### Writing Tests with DI

```typescript
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { setupTestContainer, createMockConsoleOutput } from '../utils/testDiContainer.js';

describe('ConsoleOutputService', () => {
  let service;
  let mockFormatter;
  let mockConsoleOutput;
  
  beforeEach(() => {
    // Create mock dependencies
    mockFormatter = createMockShowFormatter();
    mockConsoleOutput = createMockConsoleOutput();
    
    // Setup test container with mocks
    const testContainer = setupTestContainer({
      'ShowFormatter': mockFormatter,
      'ConsoleOutput': mockConsoleOutput
    });
    
    // Resolve the service from the container
    service = testContainer.resolve(ConsoleOutputService);
  });
  
  // Tests...
});
```

## Best Practices

1. **Token Naming**: Use consistent naming for tokens, typically matching the interface name
2. **Interface-Based Injection**: Inject dependencies based on interfaces rather than concrete implementations
3. **Constructor Injection**: Prefer constructor injection over property or method injection
4. **Container Access**: Only resolve from the container at the application's entry points
5. **Testing**: Always use the test container utilities for consistent test setup

## Troubleshooting

### Common Issues

1. **Missing reflect-metadata import**: Ensure `reflect-metadata` is imported at the top of files using DI
2. **Circular Dependencies**: Avoid circular dependencies between services
3. **ESM Module Issues**: When using Jest with ESM modules, ensure proper configuration in jest.config.js

## Next Steps

1. Complete the migration of all services to use dependency injection
2. Update all tests to use the DI testing utilities
3. Consider creating factory functions for common test scenarios
4. Document any performance considerations or optimizations

## References

- [tsyringe Documentation](https://github.com/microsoft/tsyringe)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Jest Testing with ES Modules](https://jestjs.io/docs/ecmascript-modules)
