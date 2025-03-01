import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default configuration
const defaultConfig = {
    country: 'US',
    types: [], // e.g., ['Reality', 'Scripted']
    networks: [], // e.g., ['Discovery', 'CBS']
    genres: [], // e.g., ['Drama', 'Comedy']
    languages: ['English'], // Default to English shows
    notificationTime: '9:00', // 24-hour format
    slack: {
        enabled: true,
        botToken: process.env.SLACK_BOT_TOKEN,
        channel: process.env.SLACK_CHANNEL
    }
};
// Try to load user config from config.json
let userConfig = {};
const configPath = path.join(__dirname, '..', 'config.json');
try {
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        userConfig = JSON.parse(configFile);
    }
}
catch (error) {
    if (error instanceof Error) {
        console.warn(`Warning: Could not load config.json: ${error.message}`);
    }
}
// Merge default and user config
const config = {
    ...defaultConfig,
    ...userConfig,
    slack: {
        ...defaultConfig.slack,
        ...(userConfig.slack || {})
    }
};
export default config;
