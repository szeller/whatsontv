#!/usr/bin/env node

import 'reflect-metadata';
import config from './config.js';
import { container } from './container.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { CliArgs } from './services/consoleOutputService.js';

/**
 * Main function to run the CLI application
 * @param args CLI arguments for filtering shows
 */
export async function main(args?: CliArgs): Promise<void> {
  try {
    // Resolve the services from the container
    const outputService = container.resolve<OutputService>('OutputService');
    const tvShowService = container.resolve<TvShowService>('TvShowService');
    const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
    
    // Parse command line arguments
    const parsedArgs = args || outputService.parseArgs();
    
    // Display header
    outputService.displayHeader();
    
    // Use config values as defaults when CLI arguments aren't provided
    const types = parsedArgs.types?.length ? parsedArgs.types : config.types;
    const networks = parsedArgs.networks?.length ? parsedArgs.networks : config.networks;
    const genres = parsedArgs.genres?.length ? parsedArgs.genres : config.genres;
    const languages = parsedArgs.languages?.length ? parsedArgs.languages : config.languages;
    
    consoleOutput.log(
      `Making GET request to: ${config.apiUrl}/schedule?date=${parsedArgs.date}` +
      `&country=${parsedArgs.country}`
    );
    
    // Fetch shows based on the provided options
    const shows = await tvShowService.fetchShowsWithOptions({
      date: parsedArgs.date,
      country: parsedArgs.country,
      types: types,
      networks: networks,
      genres: genres,
      languages: languages
    });

    // Debug: Print all unique networks and web channels
    if (parsedArgs.debug) {
      const uniqueNetworks = new Set<string>();
      const uniqueWebChannels = new Set<string>();
      
      for (const show of shows) {
        if (
          show.show.network?.name !== undefined &&
          show.show.network.name !== null &&
          show.show.network.name !== ''
        ) {
          uniqueNetworks.add(show.show.network.name);
        }
        if (
          show.show.webChannel?.name !== undefined &&
          show.show.webChannel.name !== null &&
          show.show.webChannel.name !== ''
        ) {
          uniqueWebChannels.add(show.show.webChannel.name);
        }
      }
      
      consoleOutput.log('\nAvailable Networks:');
      consoleOutput.log([...uniqueNetworks].sort().join(', '));
      
      consoleOutput.log('\nAvailable Web Channels:');
      consoleOutput.log([...uniqueWebChannels].sort().join(', '));
    }

    // Display the shows
    await outputService.displayShows(shows, parsedArgs.timeSort);
    
    // Display footer
    outputService.displayFooter();
  } catch (error) {
    const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
    if (error instanceof Error) {
      consoleOutput.error('Error:', error.message);
    } else {
      consoleOutput.error('An unknown error occurred');
    }
  }
}

// Run the main function
void main();
