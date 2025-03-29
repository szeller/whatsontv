/**
 * Tests for TVMaze schemas
 */
import { describe, it, expect } from '@jest/globals';
import {
  networkSchema,
  baseShowSchema,
  showDetailsSchema,
  networkScheduleItemSchema,
  webScheduleItemSchema,
  scheduleItemSchema
} from '../../schemas/tvmaze.js';

describe('TVMaze Schemas', () => {
  describe('networkSchema', () => {
    it('should validate a valid network', () => {
      const network = {
        id: 1,
        name: 'NBC',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      };
      
      const result = networkSchema.safeParse(network);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(network);
      }
    });
    
    it('should validate a network with null country', () => {
      const network = {
        id: 1,
        name: 'Netflix',
        country: null
      };
      
      const result = networkSchema.safeParse(network);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(network);
      }
    });
    
    it('should reject invalid networks', () => {
      const invalidNetwork = {
        id: 'not-a-number',
        name: 'NBC'
      };
      
      const result = networkSchema.safeParse(invalidNetwork);
      expect(result.success).toBe(false);
    });
  });
  
  describe('baseShowSchema', () => {
    it('should validate a valid show', () => {
      const show = {
        id: 1,
        name: 'Show Name',
        type: 'scripted',
        language: 'English',
        genres: ['Drama', 'Comedy'],
        status: 'Running',
        runtime: 60,
        premiered: '2020-01-01',
        summary: 'A show about things'
      };
      
      const result = baseShowSchema.safeParse(show);
      expect(result.success).toBe(true);
    });
    
    it('should provide default values for missing fields', () => {
      const show = {
        id: 1,
        name: 'Show Name'
      };
      
      const result = baseShowSchema.safeParse(show);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.genres).toEqual([]);
      }
    });
  });
  
  describe('showDetailsSchema', () => {
    it('should validate a show with network information', () => {
      const show = {
        id: 1,
        name: 'Show Name',
        network: {
          id: 1,
          name: 'NBC',
          country: {
            name: 'United States',
            code: 'US',
            timezone: 'America/New_York'
          }
        }
      };
      
      const result = showDetailsSchema.safeParse(show);
      expect(result.success).toBe(true);
    });
  });
  
  describe('networkScheduleItemSchema', () => {
    it('should validate a valid network schedule item', () => {
      const item = {
        id: 1,
        name: 'Episode Name',
        season: 1,
        number: 2,
        airtime: '20:00',
        show: {
          id: 100,
          name: 'Show Name',
          type: 'scripted'
        }
      };
      
      const result = networkScheduleItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
    
    it('should convert string seasons and numbers to numbers', () => {
      const item = {
        id: 1,
        name: 'Episode Name',
        season: '1',
        number: '2',
        airtime: '20:00',
        show: {
          id: 100,
          name: 'Show Name',
          type: 'scripted'
        }
      };
      
      const result = networkScheduleItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.season).toBe('number');
        expect(result.data.season).toBe(1);
        expect(typeof result.data.number).toBe('number');
        expect(result.data.number).toBe(2);
      }
    });
  });
  
  describe('webScheduleItemSchema', () => {
    it('should validate a valid web schedule item', () => {
      const item = {
        id: 1,
        name: 'Episode Name',
        season: 1,
        number: 2,
        airtime: '20:00',
        _embedded: {
          show: {
            id: 100,
            name: 'Show Name',
            type: 'scripted'
          }
        }
      };
      
      const result = webScheduleItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });
  
  describe('scheduleItemSchema', () => {
    it('should validate a network schedule item', () => {
      const item = {
        id: 1,
        name: 'Episode Name',
        season: 1,
        number: 2,
        airtime: '20:00',
        show: {
          id: 100,
          name: 'Show Name',
          type: 'scripted'
        }
      };
      
      const result = scheduleItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
    
    it('should validate a web schedule item', () => {
      const item = {
        id: 1,
        name: 'Episode Name',
        season: 1,
        number: 2,
        airtime: '20:00',
        _embedded: {
          show: {
            id: 100,
            name: 'Show Name',
            type: 'scripted'
          }
        }
      };
      
      const result = scheduleItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });
});
