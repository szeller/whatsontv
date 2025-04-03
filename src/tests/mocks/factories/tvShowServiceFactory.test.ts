/**
 * Tests for the TvShowServiceFactory
 */
import { describe, it, expect, jest } from '@jest/globals';
import { createMockTvShowService } from './tvShowServiceFactory.js';
import type { Show } from '../../../schemas/domain.js';
import type { ShowOptions } from '../../../types/tvShowOptions.js';

describe('TvShowServiceFactory', () => {
  describe('createMockTvShowService', () => {
    // Sample test data
    const sampleShow: Show = {
      id: 1,
      name: 'Test Show',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: '<p>Test summary</p>',
      airtime: '20:00',
      season: 1,
      number: 1
    };
    
    const sampleShow2: Show = {
      id: 2,
      name: 'Another Show',
      type: 'scripted',
      language: 'English',
      genres: ['Comedy'],
      network: 'Another Network',
      summary: '<p>Another summary</p>',
      airtime: '21:00',
      season: 2,
      number: 3
    };

    it('should create a mock TV show service with default empty shows', async () => {
      // Act
      const service = createMockTvShowService();
      
      // Assert
      expect(service).toBeDefined();
      expect(typeof service.fetchShows).toBe('function');
      
      // Check default implementation
      const options: ShowOptions = {
        date: '2025-04-01',
        country: 'US',
        types: [],
        networks: [],
        genres: [],
        languages: ['English'],
        fetchSource: 'all'
      };
      
      const result = await service.fetchShows(options);
      expect(result).toEqual([]);
    });
    
    it('should return default shows when provided', async () => {
      // Arrange
      const defaultShows = [sampleShow, sampleShow2];
      const service = createMockTvShowService({ defaultShows });
      
      // Act
      const result = await service.fetchShows({} as ShowOptions);
      
      // Assert
      expect(result).toEqual(defaultShows);
    });
    
    it('should return shows by date when date matches', async () => {
      // Arrange
      const dateShows = [sampleShow];
      const service = createMockTvShowService({
        defaultShows: [sampleShow2],
        showsByDate: {
          '2025-04-01': dateShows
        }
      });
      
      // Act
      const result = await service.fetchShows({ date: '2025-04-01' } as ShowOptions);
      
      // Assert
      expect(result).toEqual(dateShows);
    });
    
    it('should return shows by country when country matches', async () => {
      // Arrange
      const countryShows = [sampleShow];
      const service = createMockTvShowService({
        defaultShows: [sampleShow2],
        showsByCountry: {
          'US': countryShows
        }
      });
      
      // Act
      const result = await service.fetchShows({ country: 'US' } as ShowOptions);
      
      // Assert
      expect(result).toEqual(countryShows);
    });
    
    it('should return shows by network when network matches', async () => {
      // Arrange
      const networkShows = [sampleShow];
      const service = createMockTvShowService({
        defaultShows: [sampleShow2],
        showsByNetwork: {
          'Test Network': networkShows
        }
      });
      
      // Act
      const result = await service.fetchShows({ networks: ['Test Network'] } as ShowOptions);
      
      // Assert
      expect(result).toEqual(networkShows);
    });
    
    it('should return shows by genre when genre matches', async () => {
      // Arrange
      const genreShows = [sampleShow];
      const service = createMockTvShowService({
        defaultShows: [sampleShow2],
        showsByGenre: {
          'Drama': genreShows
        }
      });
      
      // Act
      const result = await service.fetchShows({ genres: ['Drama'] } as ShowOptions);
      
      // Assert
      expect(result).toEqual(genreShows);
    });
    
    it('should return shows by language when language matches', async () => {
      // Arrange
      const languageShows = [sampleShow];
      const service = createMockTvShowService({
        defaultShows: [sampleShow2],
        showsByLanguage: {
          'English': languageShows
        }
      });
      
      // Act
      const result = await service.fetchShows({ languages: ['English'] } as ShowOptions);
      
      // Assert
      expect(result).toEqual(languageShows);
    });
    
    it('should throw an error when fetchError is provided', async () => {
      // Arrange
      const error = new Error('Test error');
      const service = createMockTvShowService({
        fetchError: error
      });
      
      // Act & Assert
      await expect(service.fetchShows({} as ShowOptions)).rejects.toThrow(error);
    });
    
    it('should apply custom implementation methods', async () => {
      // Arrange
      const mockFetchShows = jest.fn().mockResolvedValue([sampleShow]);
      
      // Act
      const service = createMockTvShowService({
        implementation: {
          // Use the jest mock function directly
          fetchShows: mockFetchShows
        }
      });
      
      // Assert
      const options = { date: '2025-04-01' } as ShowOptions;
      const result = await service.fetchShows(options);
      expect(result).toEqual([sampleShow]);
      expect(mockFetchShows).toHaveBeenCalledWith(options);
    });
  });
});
