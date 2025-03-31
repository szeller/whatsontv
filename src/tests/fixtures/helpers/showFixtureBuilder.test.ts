/**
 * Tests for the Show Fixture Builder
 */
import { describe, it, expect } from '@jest/globals';
import { ShowBuilder, ShowFixtures } from './showFixtureBuilder.js';

describe('ShowBuilder', () => {
  describe('basic builder functionality', () => {
    it('should create a show with default values', () => {
      const show = new ShowBuilder().build();
      
      expect(show).toHaveProperty('id', 999);
      expect(show).toHaveProperty('name', 'Test Show');
      expect(show).toHaveProperty('type', 'Scripted');
      expect(show).toHaveProperty('language', 'English');
      expect(show).toHaveProperty('genres');
      expect(show.genres).toContain('Drama');
      expect(show).toHaveProperty('network', 'Test Network');
      expect(show).toHaveProperty('summary', 'Test summary');
      expect(show).toHaveProperty('airtime', '20:00');
      expect(show).toHaveProperty('season', 1);
      expect(show).toHaveProperty('number', 1);
    });
    
    it('should allow customizing all properties', () => {
      const show = new ShowBuilder()
        .withId(123)
        .withName('Custom Show')
        .withType('Reality')
        .withLanguage('Spanish')
        .withGenres(['Comedy', 'Family'])
        .withNetwork('Custom Network')
        .withSummary('Custom summary')
        .withAirtime('15:30')
        .withEpisode(3, 7)
        .build();
      
      expect(show).toHaveProperty('id', 123);
      expect(show).toHaveProperty('name', 'Custom Show');
      expect(show).toHaveProperty('type', 'Reality');
      expect(show).toHaveProperty('language', 'Spanish');
      expect(show.genres).toEqual(['Comedy', 'Family']);
      expect(show).toHaveProperty('network', 'Custom Network');
      expect(show).toHaveProperty('summary', 'Custom summary');
      expect(show).toHaveProperty('airtime', '15:30');
      expect(show).toHaveProperty('season', 3);
      expect(show).toHaveProperty('number', 7);
    });
    
    it('should support null values for optional fields', () => {
      const show = new ShowBuilder()
        .withLanguage(null)
        .withSummary(null)
        .withAirtime(null)
        .build();
      
      expect(show.language).toBeNull();
      expect(show.summary).toBeNull();
      expect(show.airtime).toBeNull();
    });
  });
  
  describe('static factory methods', () => {
    it('should create a minimal show', () => {
      const show = ShowBuilder.minimal();
      
      expect(show).toHaveProperty('id', 0);
      expect(show).toHaveProperty('name', 'Minimal Show');
      expect(show).toHaveProperty('type', '');
      expect(show.language).toBeNull();
      expect(show.genres).toEqual([]);
      expect(show).toHaveProperty('network', '');
      expect(show.summary).toBeNull();
      expect(show.airtime).toBeNull();
      expect(show).toHaveProperty('season', 0);
      expect(show).toHaveProperty('number', 0);
    });
    
    it('should create a show without airtime', () => {
      const show = ShowBuilder.withoutAirtime();
      
      expect(show.airtime).toBeNull();
      // Other properties should have default values
      expect(show).toHaveProperty('name', 'Test Show');
    });
    
    it('should create an episode sequence', () => {
      const count = 3;
      const shows = ShowBuilder.episodeSequence(count, 'Sequence Show', 2, 5);
      
      expect(shows).toHaveLength(count);
      
      // All shows should have the same base properties
      shows.forEach(show => {
        expect(show).toHaveProperty('name', 'Sequence Show');
        expect(show).toHaveProperty('season', 2);
      });
      
      // Episode numbers should be sequential
      expect(shows[0]).toHaveProperty('number', 5);
      expect(shows[1]).toHaveProperty('number', 6);
      expect(shows[2]).toHaveProperty('number', 7);
    });
    
    it('should create shows with different airtimes', () => {
      const count = 4;
      const shows = ShowBuilder.withDifferentAirtimes(count);
      
      expect(shows).toHaveLength(count);
      
      // Airtimes should be evenly distributed
      expect(shows[0].airtime).toBe('00:00');
      expect(shows[1].airtime).toBe('06:00');
      expect(shows[2].airtime).toBe('12:00');
      expect(shows[3].airtime).toBe('18:00');
    });
  });
});

describe('ShowFixtures', () => {
  describe('fixture loading methods', () => {
    it('should load network shows from fixture', () => {
      const shows = ShowFixtures.getNetworkShows();
      
      expect(shows.length).toBeGreaterThan(0);
      expect(shows[0]).toHaveProperty('network');
      // Network shows typically have broadcast networks
      expect(['ABC', 'NBC', 'CBS', 'FOX', 'CW']).toContain(shows[0].network);
    });
    
    it('should load all shows from fixtures', () => {
      const shows = ShowFixtures.getAllShows();
      
      // Should include network, streaming, and cable shows
      expect(shows.length).toBeGreaterThan(0);
    });
  });
  
  describe('dynamic fixture creation methods', () => {
    it('should create shows with different types', () => {
      const types = ['Scripted', 'Reality', 'Talk Show'];
      const shows = ShowFixtures.withDifferentTypes(types);
      
      expect(shows).toHaveLength(types.length);
      
      // Each show should have the corresponding type
      types.forEach((type, index) => {
        expect(shows[index].type).toBe(type);
        expect(shows[index].name).toContain(type);
      });
    });
    
    it('should create shows with different networks', () => {
      const networks = ['ABC', 'NBC', 'Netflix'];
      const shows = ShowFixtures.withDifferentNetworks(networks);
      
      expect(shows).toHaveLength(networks.length);
      
      // Each show should have the corresponding network
      networks.forEach((network, index) => {
        expect(shows[index].network).toBe(network);
        expect(shows[index].name).toContain(network);
      });
    });
    
    it('should create shows with different genres', () => {
      const genreSets = [
        ['Drama'], 
        ['Comedy', 'Romance'], 
        ['Action', 'Adventure', 'Fantasy']
      ];
      const shows = ShowFixtures.withDifferentGenres(genreSets);
      
      expect(shows).toHaveLength(genreSets.length);
      
      // Each show should have the corresponding genres
      genreSets.forEach((genres, index) => {
        expect(shows[index].genres).toEqual(genres);
        // Name should include the genres joined with '/'
        expect(shows[index].name).toContain(genres.join('/'));
      });
    });
  });
});
