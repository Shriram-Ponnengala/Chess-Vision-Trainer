export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Coordinate {
  file: File;
  rank: Rank;
}

export interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  hits: number;
  misses: number;
  totalSpawns: number;
}

export interface MoveHistory {
  target: Coordinate;
  wasCorrect: boolean;
  timeTakenMs: number;
  phase: 'main';
}

export enum GameState {
  MENU = 'MENU',
  MAIN_INTRO = 'MAIN_INTRO',
  MAIN_PLAY = 'MAIN_PLAY',
  SUMMARY = 'SUMMARY',
}