/**
 * Tests for the PlainStyleServiceImpl implementation
 */
import { describe, it, expect } from '@jest/globals';
import { container } from 'tsyringe';

import { PlainStyleServiceImpl } from '../../../implementations/test/plainStyleServiceImpl.js';
import type { StyleService } from '../../../interfaces/styleService.js';

describe('PlainStyleServiceImpl', () => {
  let styleService: StyleService;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create the service
    styleService = container.resolve(PlainStyleServiceImpl);
  });

  describe('basic styling methods', () => {
    it('should return text unchanged for bold method', () => {
      const text = 'Test text';
      expect(styleService.bold(text)).toBe(text);
    });

    it('should return text unchanged for dim method', () => {
      const text = 'Test text';
      expect(styleService.dim(text)).toBe(text);
    });
  });

  describe('color methods', () => {
    it('should return text unchanged for green method', () => {
      const text = 'Test text';
      expect(styleService.green(text)).toBe(text);
    });

    it('should return text unchanged for yellow method', () => {
      const text = 'Test text';
      expect(styleService.yellow(text)).toBe(text);
    });

    it('should return text unchanged for blue method', () => {
      const text = 'Test text';
      expect(styleService.blue(text)).toBe(text);
    });

    it('should return text unchanged for magenta method', () => {
      const text = 'Test text';
      expect(styleService.magenta(text)).toBe(text);
    });

    it('should return text unchanged for cyan method', () => {
      const text = 'Test text';
      expect(styleService.cyan(text)).toBe(text);
    });

    it('should return text unchanged for red method', () => {
      const text = 'Test text';
      expect(styleService.red(text)).toBe(text);
    });
  });

  describe('combined style methods', () => {
    it('should return text unchanged for boldGreen method', () => {
      const text = 'Test text';
      expect(styleService.boldGreen(text)).toBe(text);
    });

    it('should return text unchanged for boldYellow method', () => {
      const text = 'Test text';
      expect(styleService.boldYellow(text)).toBe(text);
    });

    it('should return text unchanged for boldBlue method', () => {
      const text = 'Test text';
      expect(styleService.boldBlue(text)).toBe(text);
    });

    it('should return text unchanged for boldMagenta method', () => {
      const text = 'Test text';
      expect(styleService.boldMagenta(text)).toBe(text);
    });

    it('should return text unchanged for boldCyan method', () => {
      const text = 'Test text';
      expect(styleService.boldCyan(text)).toBe(text);
    });

    it('should return text unchanged for boldRed method', () => {
      const text = 'Test text';
      expect(styleService.boldRed(text)).toBe(text);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(styleService.bold('')).toBe('');
      expect(styleService.green('')).toBe('');
      expect(styleService.boldRed('')).toBe('');
    });

    it('should handle strings with special characters', () => {
      const specialText = '!@#$%^&*()_+';
      expect(styleService.bold(specialText)).toBe(specialText);
      expect(styleService.green(specialText)).toBe(specialText);
      expect(styleService.boldRed(specialText)).toBe(specialText);
    });
  });
});
