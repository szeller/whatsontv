/**
 * Tests for ChalkStyleServiceImpl
 */
import { describe, it, expect } from '@jest/globals';
import { ChalkStyleServiceImpl } from '../../../implementations/console/chalkStyleServiceImpl.js';
import chalk from 'chalk';

describe('ChalkStyleServiceImpl', () => {
  let styleService: ChalkStyleServiceImpl;

  beforeEach(() => {
    styleService = new ChalkStyleServiceImpl();
  });

  describe('Basic styling', () => {
    it('should apply bold styling', () => {
      const text = 'Test text';
      const result = styleService.bold(text);
      expect(result).toBe(chalk.bold(text));
    });

    it('should apply dim styling', () => {
      const text = 'Test text';
      const result = styleService.dim(text);
      expect(result).toBe(chalk.dim(text));
    });
  });

  describe('Colors', () => {
    it('should apply green color', () => {
      const text = 'Test text';
      const result = styleService.green(text);
      expect(result).toBe(chalk.green(text));
    });

    it('should apply yellow color', () => {
      const text = 'Test text';
      const result = styleService.yellow(text);
      expect(result).toBe(chalk.yellow(text));
    });

    it('should apply blue color', () => {
      const text = 'Test text';
      const result = styleService.blue(text);
      expect(result).toBe(chalk.blue(text));
    });

    it('should apply magenta color', () => {
      const text = 'Test text';
      const result = styleService.magenta(text);
      expect(result).toBe(chalk.magenta(text));
    });

    it('should apply cyan color', () => {
      const text = 'Test text';
      const result = styleService.cyan(text);
      expect(result).toBe(chalk.cyan(text));
    });

    it('should apply red color', () => {
      const text = 'Test text';
      const result = styleService.red(text);
      expect(result).toBe(chalk.red(text));
    });
  });

  describe('Combined styles', () => {
    it('should apply bold green styling', () => {
      const text = 'Test text';
      const result = styleService.boldGreen(text);
      expect(result).toBe(chalk.bold.green(text));
    });

    it('should apply bold yellow styling', () => {
      const text = 'Test text';
      const result = styleService.boldYellow(text);
      expect(result).toBe(chalk.bold.yellow(text));
    });

    it('should apply bold blue styling', () => {
      const text = 'Test text';
      const result = styleService.boldBlue(text);
      expect(result).toBe(chalk.bold.blue(text));
    });

    it('should apply bold magenta styling', () => {
      const text = 'Test text';
      const result = styleService.boldMagenta(text);
      expect(result).toBe(chalk.bold.magenta(text));
    });

    it('should apply bold cyan styling', () => {
      const text = 'Test text';
      const result = styleService.boldCyan(text);
      expect(result).toBe(chalk.bold.cyan(text));
    });

    it('should apply bold red styling', () => {
      const text = 'Test text';
      const result = styleService.boldRed(text);
      expect(result).toBe(chalk.bold.red(text));
    });
  });
});
