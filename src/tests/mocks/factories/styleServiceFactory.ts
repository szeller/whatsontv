/**
 * Factory for creating mock StyleService instances
 */
import { jest } from '@jest/globals';
import type { StyleService } from '../../../interfaces/styleService.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock style service
 */
export interface StyleServiceOptions extends MockOptions<StyleService> {
  /** Whether to return styled text (true) or plain text (false) */
  styled?: boolean;

  /** Custom style transformations for specific methods */
  customStyles?: {
    bold?: (text: string) => string;
    dim?: (text: string) => string;
    green?: (text: string) => string;
    yellow?: (text: string) => string;
    blue?: (text: string) => string;
    magenta?: (text: string) => string;
    cyan?: (text: string) => string;
    red?: (text: string) => string;
    boldGreen?: (text: string) => string;
    boldYellow?: (text: string) => string;
    boldBlue?: (text: string) => string;
    boldMagenta?: (text: string) => string;
    boldCyan?: (text: string) => string;
    boldRed?: (text: string) => string;
  };
}

/**
 * Creates a mock style service for testing
 * @param options Options for configuring the mock
 * @returns A mock style service instance
 */
export function createMockStyleService(
  options: StyleServiceOptions = {}
): jest.Mocked<StyleService> {
  // Default implementation returns the text unchanged if styled is false
  // If styled is true, adds a prefix indicating the style
  const isStyled = options.styled ?? false;

  const mockStyleService: jest.Mocked<StyleService> = {
    // Basic styling
    bold: jest.fn((text: string) => {
      if (options.customStyles?.bold) {
        return options.customStyles.bold(text);
      }
      return isStyled ? `[BOLD]${text}` : text;
    }),

    dim: jest.fn((text: string) => {
      if (options.customStyles?.dim) {
        return options.customStyles.dim(text);
      }
      return isStyled ? `[DIM]${text}` : text;
    }),

    // Colors
    green: jest.fn((text: string) => {
      if (options.customStyles?.green) {
        return options.customStyles.green(text);
      }
      return isStyled ? `[GREEN]${text}` : text;
    }),

    yellow: jest.fn((text: string) => {
      if (options.customStyles?.yellow) {
        return options.customStyles.yellow(text);
      }
      return isStyled ? `[YELLOW]${text}` : text;
    }),

    blue: jest.fn((text: string) => {
      if (options.customStyles?.blue) {
        return options.customStyles.blue(text);
      }
      return isStyled ? `[BLUE]${text}` : text;
    }),

    magenta: jest.fn((text: string) => {
      if (options.customStyles?.magenta) {
        return options.customStyles.magenta(text);
      }
      return isStyled ? `[MAGENTA]${text}` : text;
    }),

    cyan: jest.fn((text: string) => {
      if (options.customStyles?.cyan) {
        return options.customStyles.cyan(text);
      }
      return isStyled ? `[CYAN]${text}` : text;
    }),

    red: jest.fn((text: string) => {
      if (options.customStyles?.red) {
        return options.customStyles.red(text);
      }
      return isStyled ? `[RED]${text}` : text;
    }),

    // Combined styles
    boldGreen: jest.fn((text: string) => {
      if (options.customStyles?.boldGreen) {
        return options.customStyles.boldGreen(text);
      }
      return isStyled ? `[BOLD_GREEN]${text}` : text;
    }),

    boldYellow: jest.fn((text: string) => {
      if (options.customStyles?.boldYellow) {
        return options.customStyles.boldYellow(text);
      }
      return isStyled ? `[BOLD_YELLOW]${text}` : text;
    }),

    boldBlue: jest.fn((text: string) => {
      if (options.customStyles?.boldBlue) {
        return options.customStyles.boldBlue(text);
      }
      return isStyled ? `[BOLD_BLUE]${text}` : text;
    }),

    boldMagenta: jest.fn((text: string) => {
      if (options.customStyles?.boldMagenta) {
        return options.customStyles.boldMagenta(text);
      }
      return isStyled ? `[BOLD_MAGENTA]${text}` : text;
    }),

    boldCyan: jest.fn((text: string) => {
      if (options.customStyles?.boldCyan) {
        return options.customStyles.boldCyan(text);
      }
      return isStyled ? `[BOLD_CYAN]${text}` : text;
    }),

    boldRed: jest.fn((text: string) => {
      if (options.customStyles?.boldRed) {
        return options.customStyles.boldRed(text);
      }
      return isStyled ? `[BOLD_RED]${text}` : text;
    })
  };

  // Apply any custom implementations
  if (options.implementation) {
    for (const [key, value] of Object.entries(options.implementation)) {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockStyleService as any)[key] = value;
    }
  }

  return mockStyleService;
}
