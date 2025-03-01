import axios from 'axios';
export const TVMAZE_API = {
    BASE_URL: 'https://api.tvmaze.com',
    TV_SCHEDULE: '/schedule',
    WEB_SCHEDULE: '/schedule/web'
};
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
 */
function isShowOnDate(show, date) {
    return show.airdate === date;
}
/**
 * Format time to 12-hour format
 */
function formatTime(time) {
    if (!time)
        return 'TBA';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}
/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}
/**
 * Check if a platform or network is US-based
 */
function isUSPlatform(name) {
    if (!name)
        return false;
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
        isUSPlatform(network));
}
/**
 * Generates a unique ID for a show
 */
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
/**
 * Normalizes show data to a consistent format
 */
function normalizeShowData(show) {
    if (!show)
        return null;
    // Handle both regular schedule and web schedule data structures
    const showDetails = show._embedded?.show || show.show || {
        id: show.id,
        name: show.name,
        type: show.type,
        language: show.language,
        genres: show.genres,
        network: show.network,
        webChannel: show.webChannel,
        image: show.image,
        summary: show.summary
    };
    if (!showDetails || !showDetails.name)
        return null;
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
 */
function normalizeNetworkName(network) {
    if (!network)
        return '';
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
 */
async function fetchFromEndpoint(endpoint, { date, country }, includeCountry = true) {
    try {
        const params = { date };
        if (includeCountry) {
            params.country = country;
        }
        const response = await api.get(endpoint, { params });
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        return [];
    }
}
/**
 * Fetch TV shows from TVMaze API
 */
async function fetchTvShows({ date = getTodayDate(), country = 'US', types = [], networks = [], genres = [], languages = [] } = {}) {
    try {
        // Fetch both regular and web schedules
        const [tvResponse, webResponse] = await Promise.all([
            fetchFromEndpoint(TVMAZE_API.TV_SCHEDULE, { date, country }),
            fetchFromEndpoint(TVMAZE_API.WEB_SCHEDULE, { date, country }, false)
        ]);
        // Combine and process shows
        const shows = [...tvResponse, ...webResponse].map(normalizeShowData).filter((show) => show !== null);
        // Filter shows based on criteria
        return shows.filter(show => {
            // Filter by type if specified
            if (types.length > 0 && !types.includes(show.show.type)) {
                return false;
            }
            // Filter by network if specified
            if (networks.length > 0) {
                const showNetwork = show.show.network?.name || show.show.webChannel?.name;
                if (!showNetwork)
                    return false;
                const normalizedShowNetwork = normalizeNetworkName(showNetwork);
                const hasMatchingNetwork = networks.some(network => normalizeNetworkName(network) === normalizedShowNetwork);
                if (!hasMatchingNetwork)
                    return false;
            }
            // Filter by genre if specified
            if (genres.length > 0) {
                const showGenres = show.show.genres || [];
                const hasMatchingGenre = genres.some(genre => showGenres.includes(genre));
                if (!hasMatchingGenre)
                    return false;
            }
            // Filter by language if specified
            if (languages.length > 0) {
                const showLanguage = show.show.language || '';
                const hasMatchingLanguage = languages.some(lang => lang.toLowerCase() === showLanguage.toLowerCase());
                if (!hasMatchingLanguage)
                    return false;
            }
            return true;
        });
    }
    catch (error) {
        return [];
    }
}
/**
 * Group shows by their network
 */
function groupShowsByNetwork(shows) {
    return shows.reduce((grouped, show) => {
        const network = show.show.network?.name || show.show.webChannel?.name || 'Other';
        if (!grouped[network]) {
            grouped[network] = [];
        }
        grouped[network].push(show);
        return grouped;
    }, {});
}
/**
 * Sort shows chronologically by airtime
 */
function sortShowsByTime(shows) {
    return [...shows].sort((a, b) => {
        return (a.airtime || '').localeCompare(b.airtime || '');
    });
}
/**
 * Extract show details in a consistent format
 */
function getShowDetails(show) {
    return show.show;
}
export { api, formatTime, getTodayDate, normalizeNetworkName, normalizeShowData, fetchTvShows, groupShowsByNetwork, sortShowsByTime, getShowDetails };
