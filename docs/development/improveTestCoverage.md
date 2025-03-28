# Test Coverage Improvement Plan

This document outlines a detailed plan for improving test coverage in the WhatsOnTV application, focusing on three key areas identified in our coverage analysis. The plan follows our development standards, particularly the requirement for 80% coverage across statements, branches, functions, and lines.

## Table of Contents

1. [Leveraging Existing Fixtures](#leveraging-existing-fixtures)
2. [Console Output Service Tests](#console-output-service-tests)
3. [TVMaze Model Tests](#tvmaze-model-tests)
4. [TVMaze Utils Tests](#tvmaze-utils-tests)
5. [Implementation Timeline](#implementation-timeline)
6. [Success Criteria](#success-criteria)

## Leveraging Existing Fixtures

The WhatsOnTV project already has a well-structured fixtures system in `src/tests/fixtures/`. Instead of creating new fixtures, we'll leverage and extend the existing ones as needed.

### Existing Fixture Structure

```
src/tests/fixtures/
├── domain/
│   ├── networks.ts  - Network groups fixtures
│   └── shows.ts     - Show domain model fixtures
├── tvmaze/
│   ├── models.ts    - TVMaze API model fixtures
│   └── *.json       - Raw JSON fixture data
└── index.ts         - Main export file
```

### Extending Existing Fixtures

Where needed, we'll extend the existing fixtures to support our test coverage improvements:

1. **Domain Shows Extension**
   ```typescript
   // Add to src/tests/fixtures/domain/shows.ts

   /**
    * Get sample shows with specific episode sequences
    * @param count Number of episodes to create
    * @param season Season number
    * @param startNumber Starting episode number
    * @returns Array of sequential episode shows
    */
   export function getEpisodeSequence(
     count: number,
     season = 1,
     startNumber = 1
   ): Show[] {
     return Array.from({ length: count }, (_, index) => ({
       id: 1000 + index,
       name: `Episode ${startNumber + index}`,
       type: 'scripted',
       language: 'English',
       genres: ['Drama'],
       network: 'ABC',
       summary: 'A test episode in a sequence',
       airtime: '',
       season,
       number: startNumber + index
     }));
   }

   /**
    * Get sample shows with mixed airtime values
    * @returns Array of shows with and without airtimes
    */
   export function getMixedAirtimeShows(): Show[] {
     return [
       {
         id: 101,
         name: 'Show with time',
         type: 'scripted',
         language: 'English',
         genres: ['Drama'],
         network: 'ABC',
         summary: 'A show with airtime',
         airtime: '20:00',
         season: 1,
         number: 1
       },
       {
         id: 102,
         name: 'Show without time',
         type: 'scripted',
         language: 'English',
         genres: ['Drama'],
         network: 'ABC',
         summary: 'A show without airtime',
         airtime: '',
         season: 1,
         number: 2
       }
     ];
   }
   ```

2. **Domain Networks Extension**
   ```typescript
   // Add to src/tests/fixtures/domain/networks.ts

   /**
    * Get network groups with mixed airtime shows
    * @returns Network groups with shows having mixed airtime values
    */
   export function getMixedAirtimeNetworkGroups(): NetworkGroups {
     const mixedShows = getMixedAirtimeShows();
     return {
       'ABC': mixedShows.filter(show => show.network === 'ABC'),
       'NBC': [
         {
           id: 103,
           name: 'NBC Show with time',
           type: 'scripted',
           language: 'English',
           genres: ['Comedy'],
           network: 'NBC',
           summary: 'An NBC show with airtime',
           airtime: '21:00',
           season: 1,
           number: 1
         },
         {
           id: 104,
           name: 'NBC Show without time',
           type: 'scripted',
           language: 'English',
           genres: ['Comedy'],
           network: 'NBC',
           summary: 'An NBC show without airtime',
           airtime: '',
           season: 1,
           number: 2
         }
       ]
     };
   }

   /**
    * Get network groups with multiple episodes
    * @returns Network groups with multiple episodes for some shows
    */
   export function getMultiEpisodeNetworkGroups(): NetworkGroups {
     return {
       'ABC': getEpisodeSequence(3, 1, 1).map(show => ({
         ...show,
         name: 'Show with multiple episodes',
         network: 'ABC'
       })),
       'NBC': [
         {
           id: 201,
           name: 'Single episode show',
           type: 'scripted',
           language: 'English',
           genres: ['Comedy'],
           network: 'NBC',
           summary: 'A single episode show',
           airtime: '21:00',
           season: 1,
           number: 1
         }
       ]
     };
   }
   ```

3. **Update Index File**
   ```typescript
   // Update imports in src/tests/fixtures/index.ts if needed
   import * as domainShows from './domain/shows.js';
   import * as domainNetworks from './domain/networks.js';
   ```

## Console Output Service Tests

**Current Status:**
- 86.15% statement coverage
- 69.44% branch coverage ⚠️
- 68.75% function coverage ⚠️
- Uncovered lines: 124, 148, 150-154, 223-259

### Test Implementation Plan

1. **Test for `displayShowsByType` Method**
   ```typescript
   describe('displayShowsByType', () => {
     it('should display shows filtered by type', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getAllShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByType(['scripted']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         expect.arrayContaining([
           expect.objectContaining({ type: 'scripted' })
         ]),
         false,
         true
       );
       expect(mockConsoleFormatter.formatShows).not.toHaveBeenCalledWith(
         expect.arrayContaining([
           expect.objectContaining({ type: 'reality' })
         ]),
         false,
         true
       );
     });

     it('should handle empty type array', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByType([]);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         mockShows,
         false,
         true
       );
     });

     it('should handle no matching shows', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows().map(show => ({
         ...show,
         type: 'reality'
       }));
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByType(['scripted']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('No shows found')
       );
     });
   });
   ```

2. **Test for `displayShowsByNetwork` Method**
   ```typescript
   describe('displayShowsByNetwork', () => {
     it('should display shows filtered by network', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByNetwork(['ABC']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         expect.arrayContaining([
           expect.objectContaining({ network: 'ABC' })
         ]),
         true,
         true
       );
       expect(mockConsoleFormatter.formatShows).not.toHaveBeenCalledWith(
         expect.arrayContaining([
           expect.objectContaining({ network: 'NBC' })
         ]),
         true,
         true
       );
     });

     it('should handle empty network array', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByNetwork([]);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         mockShows,
         true,
         true
       );
     });

     it('should handle no matching shows', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows().filter(
         show => show.network !== 'ABC'
       );
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByNetwork(['ABC']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('No shows found')
       );
     });
   });
   ```

3. **Test for `displayShowsByGenre` Method**
   ```typescript
   describe('displayShowsByGenre', () => {
     it('should display shows filtered by genre', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByGenre(['Drama']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         expect.arrayContaining([
           expect.objectContaining({ 
             genres: expect.arrayContaining(['Drama']) 
           })
         ]),
         true,
         true
       );
     });

     it('should handle empty genre array', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows();
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByGenre([]);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleFormatter.formatShows).toHaveBeenCalledWith(
         mockShows,
         true,
         true
       );
     });

     it('should handle no matching shows', async () => {
       // Arrange
       const mockShows = Fixtures.domain.getNetworkShows().map(show => ({
         ...show,
         genres: ['SciFi']
       }));
       mockTvShowService.getShows.mockResolvedValue(mockShows);
       
       // Act
       await service.displayShowsByGenre(['Drama']);
       
       // Assert
       expect(mockTvShowService.getShows).toHaveBeenCalledTimes(1);
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('No shows found')
       );
     });
   });
   ```

4. **Tests for Error Handling in Display Methods**
   ```typescript
   describe('error handling', () => {
     it('should handle API errors in displayShows', async () => {
       // Arrange
       const error = new Error('API error');
       mockTvShowService.getShows.mockRejectedValue(error);
       
       // Act
       await service.displayShows();
       
       // Assert
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('Error fetching shows')
       );
     });
     
     it('should handle API errors in displayShowsByType', async () => {
       // Arrange
       const error = new Error('API error');
       mockTvShowService.getShows.mockRejectedValue(error);
       
       // Act
       await service.displayShowsByType(['scripted']);
       
       // Assert
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('Error fetching shows')
       );
     });
     
     it('should handle API errors in displayShowsByNetwork', async () => {
       // Arrange
       const error = new Error('API error');
       mockTvShowService.getShows.mockRejectedValue(error);
       
       // Act
       await service.displayShowsByNetwork(['ABC']);
       
       // Assert
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('Error fetching shows')
       );
     });
     
     it('should handle API errors in displayShowsByGenre', async () => {
       // Arrange
       const error = new Error('API error');
       mockTvShowService.getShows.mockRejectedValue(error);
       
       // Act
       await service.displayShowsByGenre(['Drama']);
       
       // Assert
       expect(mockConsoleOutput.log).toHaveBeenCalledWith(
         expect.stringContaining('Error fetching shows')
       );
     });
   });
   ```

## TVMaze Model Tests

**Current Status:**
- 88.75% statement coverage
- 90.78% branch coverage
- 55.55% function coverage ⚠️
- Uncovered lines: 15-17, 24, 285, 432-435, 461

### Test Implementation Plan

1. **Tests for Type Conversion Functions**
   ```typescript
   describe('type conversion functions', () => {
     describe('convertTvMazeShowToShow', () => {
       it('should convert a TvMazeShow to a Show', () => {
         // Arrange
         const tvMazeShow = Fixtures.tvMaze.getNetworkSchedule()[0];
         
         // Act
         const result = convertTvMazeShowToShow(tvMazeShow);
         
         // Assert
         expect(result).toEqual(expect.objectContaining({
           id: expect.any(Number),
           name: expect.any(String),
           type: expect.any(String),
           network: expect.any(String)
         }));
       });
       
       it('should handle null network and use webChannel', () => {
         // Arrange
         const tvMazeShow = {
           ...Fixtures.tvMaze.getNetworkSchedule()[0],
           network: null,
           webChannel: { name: 'Netflix' }
         };
         
         // Act
         const result = convertTvMazeShowToShow(tvMazeShow);
         
         // Assert
         expect(result.network).toBe('Netflix');
       });
       
       it('should handle null network and null webChannel', () => {
         // Arrange
         const tvMazeShow = {
           ...Fixtures.tvMaze.getNetworkSchedule()[0],
           network: null,
           webChannel: null
         };
         
         // Act
         const result = convertTvMazeShowToShow(tvMazeShow);
         
         // Assert
         expect(result.network).toBe('Unknown');
       });
       
       it('should handle null schedule', () => {
         // Arrange
         const tvMazeShow = {
           ...Fixtures.tvMaze.getNetworkSchedule()[0],
           schedule: null
         };
         
         // Act
         const result = convertTvMazeShowToShow(tvMazeShow);
         
         // Assert
         expect(result.airtime).toBe('');
       });
     });
     
     describe('convertTvMazeEpisodeToShow', () => {
       it('should convert a TvMazeEpisode to a Show', () => {
         // Arrange - Create a mock episode using fixture data
         const showData = Fixtures.tvMaze.getNetworkSchedule()[0];
         const tvMazeEpisode = {
           id: 1001,
           name: 'Pilot',
           season: 1,
           number: 1,
           airdate: '2023-01-01',
           airtime: '20:00',
           runtime: 60,
           summary: 'Test summary',
           show: showData
         };
         
         // Act
         const result = convertTvMazeEpisodeToShow(tvMazeEpisode);
         
         // Assert
         expect(result).toEqual(expect.objectContaining({
           id: 1001,
           name: expect.any(String),
           season: 1,
           number: 1,
           airtime: '20:00'
         }));
       });
       
       it('should handle null network and use webChannel', () => {
         // Arrange
         const showData = {
           ...Fixtures.tvMaze.getNetworkSchedule()[0],
           network: null,
           webChannel: { name: 'Netflix' }
         };
         const tvMazeEpisode = {
           id: 1001,
           name: 'Pilot',
           season: 1,
           number: 1,
           airdate: '2023-01-01',
           airtime: '20:00',
           runtime: 60,
           summary: 'Test summary',
           show: showData
         };
         
         // Act
         const result = convertTvMazeEpisodeToShow(tvMazeEpisode);
         
         // Assert
         expect(result.network).toBe('Netflix');
       });
     });
   });
   ```

2. **Tests for Model Validation Functions**
   ```typescript
   describe('model validation functions', () => {
     describe('isTvMazeShow', () => {
       it('should return true for valid TvMazeShow', () => {
         // Arrange
         const show = Fixtures.tvMaze.getNetworkSchedule()[0];
         
         // Act & Assert
         expect(isTvMazeShow(show)).toBe(true);
       });
       
       it('should return false for invalid object', () => {
         // Arrange
         const notAShow = {
           id: 1,
           title: 'Not a show'
         };
         
         // Act & Assert
         expect(isTvMazeShow(notAShow)).toBe(false);
       });
       
       it('should return false for null', () => {
         // Act & Assert
         expect(isTvMazeShow(null)).toBe(false);
       });
     });
     
     describe('isTvMazeEpisode', () => {
       it('should return true for valid TvMazeEpisode', () => {
         // Arrange - Create a mock episode using fixture data
         const showData = Fixtures.tvMaze.getNetworkSchedule()[0];
         const episode = {
           id: 1001,
           name: 'Pilot',
           season: 1,
           number: 1,
           airdate: '2023-01-01',
           airtime: '20:00',
           runtime: 60,
           summary: 'Test summary',
           show: showData
         };
         
         // Act & Assert
         expect(isTvMazeEpisode(episode)).toBe(true);
       });
       
       it('should return false for invalid object', () => {
         // Arrange
         const notAnEpisode = {
           id: 1,
           title: 'Not an episode'
         };
         
         // Act & Assert
         expect(isTvMazeEpisode(notAnEpisode)).toBe(false);
       });
       
       it('should return false for null', () => {
         // Act & Assert
         expect(isTvMazeEpisode(null)).toBe(false);
       });
     });
   });
   ```

## TVMaze Utils Tests

**Current Status:**
- 100% statement coverage
- 66.66% branch coverage ⚠️
- 100% function coverage
- Uncovered branches: lines 32-42

### Test Implementation Plan

1. **Tests for Branch Coverage in `extractNetworkName`**
   ```typescript
   describe('extractNetworkName', () => {
     it('should extract name from network object', () => {
       // Arrange
       const show = {
         network: { name: 'ABC' },
         webChannel: null
       };
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('ABC');
     });
     
     it('should extract name from webChannel when network is null', () => {
       // Arrange
       const show = {
         network: null,
         webChannel: { name: 'Netflix' }
       };
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('Netflix');
     });
     
     it('should return "Unknown" when both network and webChannel are null', () => {
       // Arrange
       const show = {
         network: null,
         webChannel: null
       };
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('Unknown');
     });
     
     it('should handle undefined network and webChannel properties', () => {
       // Arrange
       const show = {};
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('Unknown');
     });
     
     it('should handle network with no name property', () => {
       // Arrange
       const show = {
         network: {},
         webChannel: null
       };
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('Unknown');
     });
     
     it('should handle webChannel with no name property when network is null', () => {
       // Arrange
       const show = {
         network: null,
         webChannel: {}
       };
       
       // Act
       const result = extractNetworkName(show);
       
       // Assert
       expect(result).toBe('Unknown');
     });
   });
   ```

2. **Tests for Error Handling in API Response Processing**
   ```typescript
   describe('processTvMazeResponse', () => {
     it('should process valid show response', () => {
       // Arrange
       const response = {
         data: Fixtures.tvMaze.getNetworkSchedule()[0]
       };
       
       // Act
       const result = processTvMazeResponse(response);
       
       // Assert
       expect(result).toEqual(Fixtures.tvMaze.getNetworkSchedule()[0]);
     });
     
     it('should process valid array response', () => {
       // Arrange
       const response = {
         data: Fixtures.tvMaze.getNetworkSchedule()
       };
       
       // Act
       const result = processTvMazeResponse(response);
       
       // Assert
       expect(result).toEqual(Fixtures.tvMaze.getNetworkSchedule());
     });
     
     it('should handle null response', () => {
       // Act & Assert
       expect(() => processTvMazeResponse(null)).toThrow();
     });
     
     it('should handle response with no data property', () => {
       // Arrange
       const response = {};
       
       // Act & Assert
       expect(() => processTvMazeResponse(response)).toThrow();
     });
     
     it('should handle response with null data', () => {
       // Arrange
       const response = { data: null };
       
       // Act & Assert
       expect(() => processTvMazeResponse(response)).toThrow();
     });
   });
   ```

## Implementation Timeline

### Week 1: Fixture Extensions and Console Output Service

| Day | Task | Description |
|-----|------|-------------|
| 1 | Extend existing fixtures | Add helper functions to existing fixture files |
| 2 | Update fixture exports | Ensure new fixture functions are properly exported |
| 3 | Implement ConsoleOutputService tests (part 1) | Add tests for displayShowsByType and displayShowsByNetwork |
| 4 | Implement ConsoleOutputService tests (part 2) | Add tests for displayShowsByGenre and error handling |
| 5 | Code review and refinement | Review test coverage and refine tests as needed |

### Week 2: TVMaze Model and Utils Tests

| Day | Task | Description |
|-----|------|-------------|
| 1 | Implement TVMaze model tests (part 1) | Add tests for type conversion functions |
| 2 | Implement TVMaze model tests (part 2) | Add tests for model validation functions |
| 3 | Implement TVMaze utils tests | Add tests for branch coverage in extractNetworkName |
| 4 | Implement error handling tests | Add tests for error handling in API response processing |
| 5 | Final review and documentation | Review test coverage, update documentation, and prepare PR |

## Success Criteria

| Component | Current | Target | Metric |
|-----------|---------|--------|--------|
| Console Output Service | 68.75% | ≥80% | Function coverage |
| Console Output Service | 69.44% | ≥80% | Branch coverage |
| TVMaze Model | 55.55% | ≥80% | Function coverage |
| TVMaze Utils | 66.66% | ≥80% | Branch coverage |
| Overall | 90.45% | ≥90% | Statement coverage |
| Overall | 82.32% | ≥85% | Branch coverage |
| Overall | 89.23% | ≥90% | Function coverage |
| Overall | 90.22% | ≥90% | Line coverage |

The implementation of this plan will ensure our codebase meets or exceeds our development standards for test coverage, while leveraging our existing fixture system for testing consistency.
