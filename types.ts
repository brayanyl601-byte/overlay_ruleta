
export enum SpinResult {
  WIN = 'WIN',
  LOSE = 'LOSE'
}

export interface RouletteConfig {
  winProbability: number; // 0.0 to 1.0
  winColor: string;
  loseColor: string;
  spinDuration: number; // in milliseconds
  voiceName: string;
  pitch: number;
  rate: number;
  aiCommentaryEnabled: boolean;
  scale: number; // 0.2 to 1.5
  positionX: number; // 0 to 100 (percentage)
  positionY: number; // 0 to 100 (percentage)
}

export interface SpinEvent {
  id: string;
  username: string;
  rewardName: string;
  timestamp: number;
}

export interface TwitchSettings {
  channelId: string;
  rewardId: string;
  clientId: string;
  accessToken: string;
}
