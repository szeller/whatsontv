/**
 * Tests to ensure all fixtures are valid according to their schemas
 */
import { describe, it, expect } from '@jest/globals';
import * as fixtureHelper from '../helpers/fixtureHelper.js';
import {
  networkScheduleItemSchema,
  webScheduleItemSchema,
  scheduleItemSchema
} from '../../schemas/tvmaze.js';
import { showSchema } from '../../schemas/domain.js';
import { z } from 'zod';

describe('Fixture Validation', () => {
  describe('TVMaze Fixtures', () => {
    it('should validate network schedule fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          networkScheduleItemSchema, 
          'tvmaze/network-schedule.json'
        );
      }).not.toThrow();
    });
    
    it('should validate web schedule fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          webScheduleItemSchema, 
          'tvmaze/web-schedule.json'
        );
      }).not.toThrow();
    });
    
    it('should validate combined schedule fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          scheduleItemSchema, 
          'tvmaze/combined-schedule.json'
        );
      }).not.toThrow();
    });
    
    it('should throw error for invalid data', () => {
      // Create a simple schema for testing
      const testSchema = z.object({
        id: z.number(),
        name: z.string()
      });
      
      // Create invalid data that doesn't match the schema
      const invalidData = JSON.stringify([{ id: 'not-a-number', missing: 'name-field' }]);
      
      // Expect validation to throw when we manually validate the data
      expect(() => {
        const parsed = JSON.parse(invalidData);
        const arraySchema = z.array(testSchema);
        arraySchema.parse(parsed);
      }).toThrow();
    });
  });
  
  describe('Domain Model Fixtures', () => {
    it('should validate network shows fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          showSchema, 
          'domain/network-shows.json'
        );
      }).not.toThrow();
    });
    
    it('should validate streaming shows fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          showSchema, 
          'domain/streaming-shows.json'
        );
      }).not.toThrow();
    });
    
    it('should validate cable shows fixture against schema', () => {
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          showSchema, 
          'domain/cable-shows.json'
        );
      }).not.toThrow();
    });
  });
  
  describe('Error Handling', () => {
    it('should throw error for malformed JSON file', () => {
      // Create a simple schema for testing
      const testSchema = z.object({
        id: z.number(),
        name: z.string()
      });
      
      // Expect loadValidatedArrayFixture to throw when the JSON is malformed
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          z.array(testSchema), 
          'test/malformed.json'
        );
      }).toThrow();
      
      // Expect loadFixture to throw when the JSON is malformed
      expect(() => {
        fixtureHelper.loadFixture('test/malformed.json');
      }).toThrow();
    });
    
    it('should throw error for well-formed but invalid schedule JSON', () => {
      // This test verifies that validation correctly identifies JSON that is 
      // syntactically correct but missing required fields according to the schema
      
      // Expect validation to throw for a schedule missing required fields
      expect(() => {
        fixtureHelper.loadValidatedArrayFixture(
          networkScheduleItemSchema,
          'test/invalid-schedule.json'
        );
      }).toThrow();
      
      // Load the fixture directly to confirm it's well-formed JSON
      expect(() => {
        fixtureHelper.loadFixture('test/invalid-schedule.json');
      }).not.toThrow();
      
      // Manually validate to confirm the specific validation errors
      try {
        const invalidSchedule = fixtureHelper.loadFixture('test/invalid-schedule.json');
        z.array(networkScheduleItemSchema).parse(invalidSchedule);
        // If we get here, validation didn't throw as expected
        expect(true).toBe(false); // Force test to fail
      } catch (err) {
        // Convert error to string to check for expected validation failures
        const errorString = String(err);
        
        // Check for specific missing fields in the error message
        expect(errorString).toContain('id');
        expect(errorString).toContain('show');
        expect(errorString).toContain('Required');
      }
    });
  });
});
