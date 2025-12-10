import { File, Rank } from './types';

export const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS: Rank[] = [8, 7, 6, 5, 4, 3, 2, 1]; // Visual order top-down

export const COLORS = {
  brown: '#551e19', // Primary
  gold: '#e6b17e',  // Secondary
  cream: '#f7d5b4', // Background
  white: '#ffffff', // Neutral
};

// Durations in seconds
export const MAIN_DURATION = 100;

export const getRandomCoordinate = (): { file: File; rank: Rank } => {
  const file = FILES[Math.floor(Math.random() * FILES.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)]; // Random rank from 1-8
  return { file, rank };
};

export const coordinateToString = (c: { file: File; rank: Rank }) => `${c.file}${c.rank}`;