/**
 * Tests for TVMaze service implementation
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import { MockHttpClient } from '../testutils/mockHttpClient.js';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../../utils/tvMazeUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { getNetworkSchedule, getWebSchedule } from '../fixtures/tvmaze/models.js';

describe('TvMazeServiceImpl', () => {
  let tvMazeService: TvMazeServiceImpl;
  let mockHttpClient: MockHttpClient;
  
  beforeEach(() => {
    // Clear any previous registrations
    container.clearInstances();
    
    // Create a new mock HTTP client for each test
    mockHttpClient = new MockHttpClient();
    
    // Register the mock HTTP client with the DI container
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);
    
    // Create the service under test
    tvMazeService = new TvMazeServiceImpl(mockHttpClient);
  });

  describe('constructor', () => {
    it('creates a new instance with the provided HTTP client', () => {
      // Clear any previous registrations
      container.clearInstances();
      
      // Create a new mock HTTP client
      const httpClient = new MockHttpClient();
      
      // Create the service with the mock client
      const service = new TvMazeServiceImpl(httpClient);
      
      // Verify the service was created
      expect(service).toBeInstanceOf(TvMazeServiceImpl);
    });
  });

  describe('fetchShows', () => {
    it('returns shows for a specific date', async () => {
      // Mock the HTTP client for this specific endpoint
      mockHttpClient.mockGet(getNetworkScheduleUrl('2023-01-01', 'US'), {
        data: getNetworkSchedule(),
        status: 200,
        headers: {}
      });
      
      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });
      
      // Verify the result
      expect(shows.length).toBeGreaterThan(0);
    });
    
    it('fetches shows for today', async () => {
      // Mock the HTTP client for this specific endpoint
      const todayDate = getTodayDate(); // Format: YYYY-MM-DD
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: getNetworkSchedule(),
        status: 200,
        headers: {}
      });
      
      // Call the method under test with no date (defaults to today)
      const shows = await tvMazeService.fetchShows();
      
      // Verify the result
      expect(shows.length).toBeGreaterThan(0);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      mockHttpClient.mockGet(getNetworkScheduleUrl('2099-01-01', 'US'), {
        data: [],
        status: 200,
        headers: {}
      });
      
      // Call the method under test with a future date that has no shows
      const shows = await tvMazeService.fetchShows({ date: '2099-01-01' });
      
      // Verify the result is an empty array
      expect(shows).toEqual([]);
    });
    
    it('handles HTTP errors', async () => {
      // Mock an HTTP error
      mockHttpClient.mockGetError(
        getNetworkScheduleUrl('2023-01-01', 'US'), 
        new Error('Network error')
      );
      
      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });
      
      // Verify the result is an empty array on error
      expect(shows).toEqual([]);
    });
    
    it('transforms schedule data correctly', async () => {
      // Create a mock show with the minimum required fields
      const todayDate = getTodayDate();
      const mockShow = {
        id: 1,
        name: 'Test Show',
        airdate: todayDate,
        airtime: '20:00',
        runtime: 60,
        show: {
          id: 100,
          name: 'Test Show Title',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          runtime: 60,
          premiered: '2020-01-01',
          network: {
            id: 1,
            name: 'Test Network',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: '<p>Test show summary</p>',
          schedule: { time: '20:00', days: ['Monday'] }
        }
      };
      
      // Mock the HTTP client with our mock data
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: [mockShow],
        status: 200,
        headers: {}
      });
      
      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: todayDate });
      
      // Verify the result has been transformed correctly
      expect(shows.length).toBe(1);
      expect(shows[0].id).toBe(100);
      expect(shows[0].name).toBe('Test Show Title');
      expect(shows[0].network).toBe('Test Network (US)');
    });
    
    it('fetches web-only shows', async () => {
      // Mock the web schedule endpoint
      const todayDate = getTodayDate();
      mockHttpClient.mockGet(getWebScheduleUrl(todayDate), {
        data: getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      // Call the method under test with the web source
      const shows = await tvMazeService.fetchShows({ fetchSource: 'web' });
      
      // Verify the result
      expect(shows.length).toBeGreaterThan(0);
    });
    
    it('fetches both network and web shows when fetchSource is all', async () => {
      // Mock both endpoints
      const todayDate = getTodayDate();
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: getNetworkSchedule(),
        status: 200,
        headers: {}
      });
      
      mockHttpClient.mockGet(getWebScheduleUrl(todayDate), {
        data: getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      // Call the method under test with 'all' source
      const shows = await tvMazeService.fetchShows({ fetchSource: 'all' });
      
      // Verify the result includes shows from both sources
      expect(shows.length).toBeGreaterThan(0);
    });
  });
});
