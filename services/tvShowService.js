export const TVMAZE_API = {
    BASE_URL: 'https://api.tvmaze.com',
    TV_SCHEDULE: '/schedule',
    WEB_SCHEDULE: '/schedule/web'
};

import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
    baseURL: TVMAZE_API.BASE_URL
});

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
 * Format time to 12-hour format
 * @param {string} time - Time in 24-hour format (HH:MM)
 * @returns {string} - Time in 12-hour format
 */
function formatTime(time) {
    if (!time) return 'TBA';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} - Today's date
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
 * Generates a unique ID for a show
 * @returns {string} - Unique ID
 */
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Normalizes show data to a consistent format
 * @param {Object} show - Show data from TVMaze API
 * @returns {Object} - Normalized show object
 */
function normalizeShowData(show) {
    if (!show) return null;

    // Handle both regular schedule and web schedule data structures
    const showDetails = show._embedded?.show || show.show || show;
    if (!showDetails) return null;

    return {
        airtime: show.airtime || '',
        name: showDetails.name || '',
        season: show.season || '',
        number: show.number || '',
        show: {
            id: showDetails.id || generateId(),
            name: showDetails.name || '',
            type: showDetails.type || '',
            network: showDetails.network || null,
            webChannel: showDetails.webChannel || null,
            genres: showDetails.genres || [],
            language: showDetails.language || '',
            image: showDetails.image || null,
            summary: showDetails.summary || ''
        }
    };
}

/**
 * Normalize network names to handle variations
 * @param {string} network - Network name to normalize
 * @returns {string} - Normalized network name
 */
function normalizeNetworkName(network) {
    if (!network) return '';
    
    const name = network.toLowerCase();
    
    // Handle Paramount variations
    if (name.includes('paramount')) {
        if (name.includes('plus') || name.includes('+')) {
            return 'Paramount+';
        }
        return 'Paramount Network';
    }

    // Handle CBS shows also appearing on Paramount+
    if (name === 'cbs') {
        return 'CBS';
    }
    
    return network;
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

        const response = await api.get(endpoint, { params });
        return response.data;
    } catch (error) {
        console.error(`Warning: Failed to fetch from ${endpoint}: ${error.message}`);
        return [];
    }
}

/**
 * Fetch TV shows from TVMaze API
 * @param {Object} options - Options for fetching shows
 * @param {string} [options.date] - Date in YYYY-MM-DD format
 * @param {string} [options.country='US'] - Two-letter country code
 * @param {string[]} [options.types=[]] - Show types to include
 * @param {string[]} [options.networks=[]] - Networks to include
 * @param {string[]} [options.genres=[]] - Genres to include
 * @param {string[]} [options.languages=[]] - Languages to include (e.g., 'English', 'Spanish')
 * @returns {Promise<Array>} Array of TV shows matching the criteria
 */
async function fetchTvShows({ date = getTodayDate(), country = 'US', types = [], networks = [], genres = [], languages = [] } = {}) {
    try {
        // Fetch both regular and web schedules
        const [tvResponse, webResponse] = await Promise.all([
            api.get(TVMAZE_API.TV_SCHEDULE, { params: { date, country } }),
            api.get(TVMAZE_API.WEB_SCHEDULE, { params: { date } })
        ]);

        // Combine and process shows
        const shows = [...tvResponse.data, ...webResponse.data].map(normalizeShowData);

        // Filter shows based on criteria
        const filteredShows = shows.filter(show => {
            // Filter by type if specified
            if (types.length > 0 && !types.includes(show.show.type)) {
                return false;
            }

            // Filter by network if specified
            if (networks.length > 0) {
                const showNetwork = show.show.network?.name || show.show.webChannel?.name;
                if (!showNetwork) return false;
                
                const normalizedShowNetwork = normalizeNetworkName(showNetwork);
                const hasMatchingNetwork = networks.some(network => 
                    normalizeNetworkName(network) === normalizedShowNetwork
                );
                if (!hasMatchingNetwork) return false;
            }

            // Filter by genre if specified
            if (genres.length > 0) {
                const showGenres = show.show.genres || [];
                const hasMatchingGenre = genres.some(genre => 
                    showGenres.includes(genre)
                );
                if (!hasMatchingGenre) return false;
            }

            // Filter by language if specified
            if (languages.length > 0) {
                const showLanguage = show.show.language || '';
                const hasMatchingLanguage = languages.some(lang => 
                    lang.toLowerCase() === showLanguage.toLowerCase()
                );
                if (!hasMatchingLanguage) return false;
            }

            return true;
        });

        return filteredShows;
    } catch (error) {
        return [];
    }
}

/**
 * Group shows by their network
 * @param {Array} shows - Array of shows from TVMaze API
 * @returns {Object} - Shows grouped by network
 */
function groupShowsByNetwork(shows) {
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
function sortShowsByTime(shows) {
    return [...shows].sort((a, b) => (a.airtime || '').localeCompare(b.airtime || ''));
}

/**
 * Extract show details in a consistent format
 * @param {Object} show - The show object from TVMaze API
 * @returns {Object} - Formatted show details
 */
function getShowDetails(show) {
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

export {
    api,
    formatTime,
    getTodayDate,
    normalizeNetworkName,
    normalizeShowData,
    fetchTvShows,
    groupShowsByNetwork,
    sortShowsByTime,
    getShowDetails
};
