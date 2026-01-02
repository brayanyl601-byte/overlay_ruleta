
export enum SpinResult {
  WIN = 'WIN',
  LOSE = 'LOSE'
}

export interface RouletteConfig {
  winProbability: number;
  winColor: string;
  loseColor: string;
  spinDuration: number;
  voiceName: string; // Browser voice name
  pitch: number;
  rate: number;
  aiCommentaryEnabled: boolean;
  scale: number;
  positionX: number;
  positionY: number;
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
