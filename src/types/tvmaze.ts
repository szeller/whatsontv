export interface Country {
    name: string;
    code: string;
    timezone: string;
}

export interface Network {
    id: number;
    name: string;
    country: Country | null;
}

export interface Image {
    medium: string;
    original: string;
}

export interface ShowDetails {
    id: number | string;
    name: string;
    type: string;
    language: string;
    genres: string[];
    network: Network | null;
    webChannel: Network | null;
    image: Image | null;
    summary: string;
}

export interface Show {
    airtime: string;
    name: string;
    season: string | number;
    number: string | number;
    show: ShowDetails;
}

export interface TVMazeShow {
    airdate?: string;
    airtime: string;
    name?: string;
    season?: string | number;
    number?: string | number;
    id?: number | string;
    type?: string;
    language?: string;
    genres?: string[];
    network?: Network | null;
    webChannel?: Network | null;
    image?: Image | null;
    summary?: string;
    show?: ShowDetails;
    _embedded?: {
        show: ShowDetails;
    };
}

export interface FetchOptions {
    date?: string;
    country?: string;
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
}

export interface GroupedShows {
    [network: string]: Show[];
}
