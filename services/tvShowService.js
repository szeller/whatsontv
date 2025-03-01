import axios from 'axios';

const TVMAZE_API = {
    TV_SCHEDULE: 'https://api.tvmaze.com/schedule',
    WEB_SCHEDULE: 'https://api.tvmaze.com/schedule/web'
};

// List of streaming platforms and networks that are available in the US
const US_AVAILABLE_PLATFORMS = [
    'Netflix',
    'Paramount+',
    'Paramount Plus',
    'Paramount',
    'Hulu',
    'Prime Video',
    'Apple TV+',
    'Apple TV Plus',
    'Disney+',
    'Disney Plus',
    'Max',
    'Peacock',
    'CBS',
    'Paramount Network'
];

/**
 * Check if a show is scheduled for a specific date
 * @param {Object} show - The show object
 * @param {string} date - The date to check (YYYY-MM-DD)
 * @returns {boolean} - True if the show is on the specified date
 */
function isShowOnDate(show, date) {
    return show.airdate === date;
}

/**
 * Format the show's airtime
 * @param {string} time - The show's airtime
 * @returns {string}
 */
export function formatTime(time) {
    if (!time) return 'TBA';
    return time;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if a platform or network is US-based
 * @param {string} name - The platform or network name
 * @returns {boolean}
 */
function isUSPlatform(name) {
    if (!name) return false;
    
    // Normalize the name by replacing special characters
    const normalizedName = name.toLowerCase()
        .replace(/\+/g, ' plus')
        .replace(/\s+/g, ' ')
        .trim();
    
    return US_AVAILABLE_PLATFORMS.some(platform => {
        const normalizedPlatform = platform.toLowerCase()
            .replace(/\+/g, ' plus')
            .replace(/\s+/g, ' ')
            .trim();
        
        return normalizedName.includes(normalizedPlatform) || 
               normalizedPlatform.includes(normalizedName);
    });
}

/**
 * Check if a show matches the user's country criteria
 * @param {Object} show - The show object
 * @param {string} country - The country code
 * @returns {boolean}
 */
function isShowFromCountry(show, country) {
    // Get the show's country and platform information
    const showCountry = show._embedded?.show?.network?.country?.code || 
                       show._embedded?.show?.webChannel?.country?.code ||
                       show.show?.network?.country?.code ||
                       show.show?.webChannel?.country?.code;
    
    const webChannel = show._embedded?.show?.webChannel?.name || 
                      show.show?.webChannel?.name;
    const network = show._embedded?.show?.network?.name || 
                   show.show?.network?.name;

    // Include the show if any of these conditions are met:
    return (
        // Show is from the user's country
        showCountry === country ||
        // Show has no country information
        !showCountry ||
        // Show is on a major US streaming platform or network
        isUSPlatform(webChannel) ||
        isUSPlatform(network)
    );
}

/**
 * Normalize show data structure between TV and web schedules
 * @param {Object} show - The show object from either API
 * @returns {Object} - Normalized show object
 */
function normalizeShowData(show) {
    const showDetails = show._embedded?.show || show.show || show;
    return {
        airtime: show.airtime || 'TBA',
        name: show.name || 'TBA',
        season: show.season || 'TBA',
        number: show.number || 'TBA',
        show: {
            name: showDetails.name || 'Unknown Show',
            type: showDetails.type || 'Unknown',
            network: showDetails.network,
            webChannel: showDetails.webChannel,
            genres: showDetails.genres || []
        }
    };
}

/**
 * Fetch shows from a specific TVMaze endpoint
 * @param {string} endpoint - The TVMaze API endpoint
 * @param {Object} options - The options for fetching shows
 * @param {boolean} includeCountry - Whether to include country in the request
 * @returns {Promise<Array>} - Array of shows
 */
async function fetchFromEndpoint(endpoint, { date, country }, includeCountry = true) {
    try {
        const params = { date };
        if (includeCountry) {
            params.country = country;
        }

        const response = await axios.get(endpoint, { params });
        return response.data;
    } catch (error) {
        console.error(`Warning: Failed to fetch from ${endpoint}: ${error.message}`);
        return [];
    }
}

/**
 * Fetch TV shows from TVMaze API
 * @param {Object} options - Options for fetching shows
 * @param {string} options.date - The date to fetch shows for (YYYY-MM-DD)
 * @param {string} options.country - The country code (e.g., US, GB)
 * @param {string[]} [options.types] - Optional array of show types to filter by
 * @param {string[]} [options.networks] - Optional array of networks to filter by
 * @param {string[]} [options.genres] - Optional array of genres to filter by
 * @returns {Promise<Array>} - Combined array of shows
 */
export async function fetchTvShows({ date = getTodayDate(), country = 'US', types = [], networks = [], genres = [] } = {}) {
    try {
        // Fetch both regular and web schedules
        const [tvResponse, webResponse] = await Promise.all([
            axios.get(`${TVMAZE_API.TV_SCHEDULE}`, { params: { date, country } }),
            axios.get(`${TVMAZE_API.WEB_SCHEDULE}`, { params: { date, country } })
        ]);

        // Combine and process shows
        const shows = [...tvResponse.data, ...webResponse.data].map(normalizeShowData);

        // Filter shows
        return shows.filter(show => {
            // Network/platform filter
            const showNetwork = show.show.network?.name || show.show.webChannel?.name;
            if (networks.length > 0 && !networks.some(n => showNetwork?.includes(n))) {
                return false;
            }

            // Type filter
            if (types.length > 0 && !types.includes(show.show.type)) {
                return false;
            }

            // Genre filter
            if (genres.length > 0 && !show.show.genres.some(g => genres.includes(g))) {
                return false;
            }

            return true;
        });
    } catch (error) {
        console.error('Error fetching TV shows:', error.message);
        return [];
    }
}

/**
 * Group shows by their network
 * @param {Array} shows - Array of shows from TVMaze API
 * @returns {Object} - Shows grouped by network
 */
export function groupShowsByNetwork(shows) {
    const networkGroups = {};
    
    shows.forEach(show => {
        // For web shows, prefer the web channel name
        let network = show.show.webChannel?.name
            ? show.show.webChannel.name
            : show.show.network?.name || 'Other';

        const country = show.show.network?.country?.code || show.show.webChannel?.country?.code;
        const platform = show.show.webChannel?.name;
        
        // Add country code for non-US networks, unless it's a major US streaming platform
        if (country && country !== 'US' && !isUSPlatform(platform)) {
            network = `${network} (${country})`;
        }
        
        if (!networkGroups[network]) {
            networkGroups[network] = [];
        }
        networkGroups[network].push(show);
    });

    // Sort shows by airtime within each network
    Object.values(networkGroups).forEach(shows => {
        shows.sort((a, b) => (a.airtime || '').localeCompare(b.airtime || ''));
    });

    return networkGroups;
}

/**
 * Sort shows chronologically by airtime
 * @param {Array} shows - Array of shows from TVMaze API
 * @returns {Array} - Sorted shows
 */
export function sortShowsByTime(shows) {
    return [...shows].sort((a, b) => (a.airtime || '').localeCompare(b.airtime || ''));
}

/**
 * Extract show details in a consistent format
 * @param {Object} show - The show object from TVMaze API
 * @returns {Object} - Formatted show details
 */
export function getShowDetails(show) {
    // For web shows, prefer the web channel name
    let network = show.show.webChannel?.name
        ? show.show.webChannel.name
        : show.show.network?.name || 'N/A';

    const country = show.show.network?.country?.code || show.show.webChannel?.country?.code;
    const platform = show.show.webChannel?.name;
    
    // Add country code for non-US networks, unless it's a major US streaming platform
    if (country && country !== 'US' && !isUSPlatform(platform)) {
        network = `${network} (${country})`;
    }

    return {
        time: formatTime(show.airtime),
        network: network,
        episodeNum: show.number || 'TBA',
        seasonNum: show.season || 'TBA',
        showName: show.show.name || 'Unknown Show',
        episodeName: show.name,
        isEpisodeNameDifferent: show.name !== show.show.name
    };
}
