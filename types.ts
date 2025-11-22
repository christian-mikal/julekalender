export interface LeaderboardEntry {
  id: string;
  gameId: string; // New: Identifies which game/day this score belongs to
  name: string;
  score: number;
  date: string;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  difficultyLevel: number;
}

export interface DoorStatus {
  day: number;
  isOpen: boolean;
  isLocked: boolean; 
}

export type GameMode = 'CALENDAR' | 'GAME' | 'LEADERBOARD';