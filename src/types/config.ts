export interface SlackConfig {
  enabled: boolean;
  botToken?: string;
  channel?: string;
}

export interface Config {
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  notificationTime: string;
  slack: SlackConfig;
}
