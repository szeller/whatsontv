/**
 * Tests for the StyleServiceFactory
 */
import { describe, it, expect, jest } from '@jest/globals';
import { createMockStyleService } from './styleServiceFactory.js';

describe('StyleServiceFactory', () => {
  describe('createMockStyleService', () => {
    it('should create a mock style service with default plain text styling', () => {
      // Act
      const service = createMockStyleService();
      
      // Assert
      expect(service).toBeDefined();
      expect(typeof service.bold).toBe('function');
      expect(typeof service.green).toBe('function');
      expect(typeof service.boldGreen).toBe('function');
      
      // Check default implementation returns plain text
      expect(service.bold('test')).toBe('test');
      expect(service.green('test')).toBe('test');
      expect(service.boldGreen('test')).toBe('test');
    });
    
    it('should create a mock style service with styled text when styled=true', () => {
      // Act
      const service = createMockStyleService({ styled: true });
      
      // Assert
      expect(service.bold('test')).toBe('[BOLD]test');
      expect(service.green('test')).toBe('[GREEN]test');
      expect(service.boldGreen('test')).toBe('[BOLD_GREEN]test');
    });
    
    it('should apply custom style transformations', () => {
      // Arrange
      const customStyles = {
        bold: (text: string) => `**${text}**`,
        green: (text: string) => `<green>${text}</green>`,
        boldGreen: (text: string) => `**<green>${text}</green>**`
      };
      
      // Act
      const service = createMockStyleService({ customStyles });
      
      // Assert
      expect(service.bold('test')).toBe('**test**');
      expect(service.green('test')).toBe('<green>test</green>');
      expect(service.boldGreen('test')).toBe('**<green>test</green>**');
      
      // Methods without custom styles should use the default (plain)
      expect(service.yellow('test')).toBe('test');
    });
    
    it('should apply custom implementations', () => {
      // Arrange
      const mockBold = jest.fn().mockReturnValue('CUSTOM_BOLD');
      
      // Act
      const service = createMockStyleService({
        implementation: {
          bold: mockBold
        }
      });
      
      // Assert
      expect(service.bold('test')).toBe('CUSTOM_BOLD');
      expect(mockBold).toHaveBeenCalledWith('test');
    });
    
    it('should track method calls for all styling methods', () => {
      // Arrange
      const service = createMockStyleService();
      
      // Act
      service.bold('bold');
      service.dim('dim');
      service.green('green');
      service.yellow('yellow');
      service.blue('blue');
      service.magenta('magenta');
      service.cyan('cyan');
      service.red('red');
      service.boldGreen('boldGreen');
      service.boldYellow('boldYellow');
      service.boldBlue('boldBlue');
      service.boldMagenta('boldMagenta');
      service.boldCyan('boldCyan');
      service.boldRed('boldRed');
      
      // Assert
      expect(service.bold).toHaveBeenCalledWith('bold');
      expect(service.dim).toHaveBeenCalledWith('dim');
      expect(service.green).toHaveBeenCalledWith('green');
      expect(service.yellow).toHaveBeenCalledWith('yellow');
      expect(service.blue).toHaveBeenCalledWith('blue');
      expect(service.magenta).toHaveBeenCalledWith('magenta');
      expect(service.cyan).toHaveBeenCalledWith('cyan');
      expect(service.red).toHaveBeenCalledWith('red');
      expect(service.boldGreen).toHaveBeenCalledWith('boldGreen');
      expect(service.boldYellow).toHaveBeenCalledWith('boldYellow');
      expect(service.boldBlue).toHaveBeenCalledWith('boldBlue');
      expect(service.boldMagenta).toHaveBeenCalledWith('boldMagenta');
      expect(service.boldCyan).toHaveBeenCalledWith('boldCyan');
      expect(service.boldRed).toHaveBeenCalledWith('boldRed');
    });
  });
});
