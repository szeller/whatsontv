#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { fetchTvShows, groupShowsByNetwork, sortShowsByTime, getTodayDate } from './services/tvShowService.js';
import { formatShowDetails } from './utils/formatting.js';
import config from './config.js';
// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('date', {
    alias: 'd',
    description: 'Date to fetch shows for (YYYY-MM-DD)',
    type: 'string',
    default: getTodayDate()
})
    .option('country', {
    alias: 'c',
    description: 'Country code (e.g., US, GB)',
    type: 'string',
    default: config.country
})
    .option('types', {
    alias: 't',
    description: 'Show types to filter by (e.g., News, Scripted, Reality, Documentary)',
    type: 'array',
    default: config.types
})
    .option('networks', {
    alias: 'n',
    description: 'Networks to filter by (e.g., CBS, Netflix, Discovery, HBO)',
    type: 'array',
    default: config.networks
})
    .option('genres', {
    alias: 'g',
    description: 'Genres to filter by (e.g., Drama, Comedy, Action)',
    type: 'array',
    default: config.genres
})
    .option('languages', {
    alias: 'l',
    description: 'Languages to filter by (e.g., English, Spanish)',
    type: 'array',
    default: config.languages
})
    .option('time-sort', {
    alias: 's',
    type: 'boolean',
    description: 'Sort shows by time instead of network',
    default: false
})
    .help()
    .parse();
async function displayShows() {
    try {
        const shows = await fetchTvShows({
            date: argv.date,
            country: argv.country,
            types: argv.types,
            networks: argv.networks,
            genres: argv.genres,
            languages: argv.languages
        });
        if (!shows || shows.length === 0) {
            console.log('No shows found for the specified criteria.');
            return;
        }
        // Group or sort shows
        if (argv.timeSort) {
            const displayShows = sortShowsByTime(shows);
            displayShows.forEach((show) => {
                console.log(formatShowDetails(show));
            });
        }
        else {
            const showsByNetwork = groupShowsByNetwork(shows);
            Object.entries(showsByNetwork).forEach(([network, networkShows]) => {
                console.log(chalk.bold(network));
                networkShows.forEach((show) => {
                    console.log(formatShowDetails(show));
                });
                console.log();
            });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        }
        else {
            console.error('An unknown error occurred');
        }
    }
}
displayShows();
