
import { File, Rank, Difficulty } from './types';

export const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS: Rank[] = [8, 7, 6, 5, 4, 3, 2, 1]; // Visual order top-down

export const COLORS = {
  brown: '#551e19', // Primary
  gold: '#e6b17e',  // Secondary
  cream: '#f7d5b4', // Background
  white: '#ffffff', // Neutral
};

// Durations in seconds
export const MAIN_DURATION = 60;

export interface DifficultyConfig {
  baseSpeed: number;
  speedScaling: number;
  spawnDelay: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    baseSpeed: 0.12,
    speedScaling: 0.3,
    spawnDelay: 800,
  },
  medium: {
    baseSpeed: 0.25,
    speedScaling: 0.5,
    spawnDelay: 400,
  },
  hard: {
    baseSpeed: 0.45,
    speedScaling: 0.7,
    spawnDelay: 100,
  },
};

export const getRandomCoordinate = (): { file: File; rank: Rank } => {
  const file = FILES[Math.floor(Math.random() * FILES.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)]; // Random rank from 1-8
  return { file, rank };
};

export const coordinateToString = (c: { file: File; rank: Rank }) => `${c.file}${c.rank}`;
