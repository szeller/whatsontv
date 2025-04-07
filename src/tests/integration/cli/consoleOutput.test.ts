/**
 * Console Output Integration Test
 * 
 * This test verifies that the ConsoleOutputService correctly formats and displays
 * TV show information using the complete formatting pipeline with real components.
 */
import { container } from '../../../container.js';
import { 
  ConsoleOutputServiceImpl
} from '../../../implementations/console/consoleOutputServiceImpl.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { OutputService } from '../../../interfaces/outputService.js';
import type { TextShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show } from '../../../schemas/domain.js';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder.js';
import { 
  createMockConsoleOutput,
  createMockConfigService
} from '../../mocks/factories/index.js';
import { MockConsoleOutput } from '../../mocks/implementations/mockConsoleOutput.js';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

describe('Console Output Integration Tests', () => {
  // Original services
  let originalTextShowFormatter: TextShowFormatter | null = null;
  
  // Test services
  let mockConsoleOutput: MockConsoleOutput;
  let outputService: OutputService;
  let configService: ConfigService;
  
  // Test data
  const testShows: Show[] = [
    ShowBuilder.createTestShow({
      name: 'Game of Thrones',
      airtime: '21:00',
      network: 'HBO',
      type: 'Scripted',
      season: 8,
      number: 6
    }),
    ShowBuilder.createTestShow({
      name: 'The Last of Us',
      airtime: '22:00',
      network: 'HBO',
      type: 'Scripted',
      season: 1,
      number: 9
    }),
    ShowBuilder.createTestShow({
      name: 'Stranger Things',
      airtime: '',
      network: 'Netflix',
      type: 'Scripted',
      season: 4,
      number: 9
    }),
    ShowBuilder.createTestShow({
      id: 1,
      name: 'Breaking Bad',
      airtime: '', // No airtime so it will be grouped
      network: 'AMC',
      type: 'Scripted',
      season: 5,
      number: 7
    }),
    ShowBuilder.createTestShow({
      id: 1,
      name: 'Breaking Bad',
      airtime: '', // No airtime so it will be grouped
      network: 'AMC',
      type: 'Scripted',
      season: 5,
      number: 8
    }),
    ShowBuilder.createTestShow({
      name: 'The Walking Dead',
      airtime: '22:00',
      network: 'AMC',
      type: 'Scripted',
      season: 11,
      number: 24
    })
  ];
  
  beforeEach(() => {
    originalTextShowFormatter = container.resolve<TextShowFormatter>('TextShowFormatter');

    // Create mock console output with spies
    mockConsoleOutput = createMockConsoleOutput();
    
    // Create mock config service with test settings
    configService = createMockConfigService({
      showOptions: {
        date: '2025-04-06',
        country: 'US',
        types: ['Scripted', 'Reality'],
        networks: [],
        languages: ['English']
      },
      cliOptions: {
        groupByNetwork: true,
        debug: false
      },
      enhanceWithJestMocks: true
    });
    
    // Register services in the container
    container.register('ConsoleOutput', { useValue: mockConsoleOutput });
    container.register('ConfigService', { useValue: configService });
    
    // Create the output service directly
    outputService = new ConsoleOutputServiceImpl(
      originalTextShowFormatter,
      mockConsoleOutput,
      configService
    );
  });
  
  afterEach(() => {
    // Clear container instances
    container.clearInstances();
  });
  
  test('should format and display all shows correctly with chalk styling', async () => {
    // Act - render the output using our test data
    await outputService.renderOutput(testShows);
    
    // Assert - verify the output contains expected content
    const outputLines = mockConsoleOutput.getOutput();
    
    // Header should be present
    expect(outputLines.some(line => line.includes('WhatsOnTV'))).toBe(true);
    
    // Network headers should be present
    expect(outputLines.some(line => line.includes('HBO'))).toBe(true);
    expect(outputLines.some(line => line.includes('Netflix'))).toBe(true);
    expect(outputLines.some(line => line.includes('AMC'))).toBe(true);
    
    // Show titles should be present
    expect(outputLines.some(line => line.includes('Game of Thrones'))).toBe(true);
    expect(outputLines.some(line => line.includes('The Last of Us'))).toBe(true);
    expect(outputLines.some(line => line.includes('Stranger Things'))).toBe(true);
    expect(outputLines.some(line => line.includes('Breaking Bad'))).toBe(true);
    expect(outputLines.some(line => line.includes('The Walking Dead'))).toBe(true);
    
    // Episode info should be present
    expect(outputLines.some(line => line.includes('S08E06'))).toBe(true);
    expect(outputLines.some(line => line.includes('S01E09'))).toBe(true);
    expect(outputLines.some(line => line.includes('S04E09'))).toBe(true);
    expect(outputLines.some(line => line.includes('S11E24'))).toBe(true);
    
    // Airtime should be present
    expect(outputLines.some(line => line.includes('21:00'))).toBe(true);
    expect(outputLines.some(line => line.includes('22:00'))).toBe(true);
    expect(outputLines.some(line => line.includes('N/A'))).toBe(true);
    
    // Footer should be present
    expect(outputLines.some(line => line.includes('Data provided by TVMaze API'))).toBe(true);
    
    // Verify that ANSI color codes are present in the output (chalk styling)
    expect(outputLines.some(line => line.includes('\u001b['))).toBe(true);
  });
  
  test('should format multiple episodes with consistent styling', async () => {
    // Clear previous output
    mockConsoleOutput.clearOutput();
    
    // Get the Breaking Bad episodes
    const breakingBadEpisodes = testShows.filter((show: Show) => show.name === 'Breaking Bad');
    
    // Act - render the output
    await outputService.renderOutput(breakingBadEpisodes);
    
    // Assert - verify the output contains expected content
    const outputLines = mockConsoleOutput.getOutput();
    
    // Network header should be present
    expect(outputLines.some(line => line.includes('AMC'))).toBe(true);
    
    // Show title should be present
    expect(outputLines.some(line => line.includes('Breaking Bad'))).toBe(true);
    
    // Episode info should be present
    expect(outputLines.some(line => line.includes('S05E07-08'))).toBe(true);
    
    // Find the Breaking Bad line with the episode range
    const breakingBadLine = outputLines.find(line => 
      line.includes('Breaking Bad') && line.includes('S05E')
    );
    
    // The line should have N/A for airtime since we removed the airtime
    expect(breakingBadLine).toContain('N/A');
    
    // Verify that ANSI color codes are present (chalk styling)
    expect(breakingBadLine).toContain('\u001b[');
  });
  
  test('should format untimed shows with N/A for airtime', async () => {
    // Clear previous output
    mockConsoleOutput.clearOutput();
    
    // Filter just the Stranger Things episode (untimed)
    const untimedShows = testShows.filter((show: Show) => show.name === 'Stranger Things');
    
    // Act - render the output
    await outputService.renderOutput(untimedShows);
    
    // Assert - verify the output contains expected content
    const outputLines = mockConsoleOutput.getOutput();
    
    // Network header should be present
    expect(outputLines.some(line => line.includes('Netflix'))).toBe(true);
    
    // Show title should be present
    expect(outputLines.some(line => line.includes('Stranger Things'))).toBe(true);
    
    // N/A should be present for airtime
    const strangerThingsLine = outputLines.find(line => 
      line.includes('Stranger Things') && line.includes('S04E09')
    );
    
    expect(strangerThingsLine).toContain('N/A');
    
    // Verify that ANSI color codes are present (chalk styling)
    expect(strangerThingsLine).toContain('\u001b[');
  });
});
