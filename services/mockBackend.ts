import { LeaderboardEntry } from '../types';

const STORAGE_KEY_SCORES = 'ey_bgo_scores_v2'; // Incremented version
const STORAGE_KEY_DOORS = 'ey_bgo_doors_v1';

// Helper to get all scores
const getAllScores = (): Record<string, LeaderboardEntry[]> => {
  const stored = localStorage.getItem(STORAGE_KEY_SCORES);
  return stored ? JSON.parse(stored) : {};
};

export const getLeaderboard = (gameId: string): LeaderboardEntry[] => {
  const allScores = getAllScores();
  const gameScores = allScores[gameId] || [];
  
  // Sort by score descending
  return gameScores.sort((a, b) => b.score - a.score);
};

export const submitScore = (gameId: string, name: string, score: number) => {
  const allScores = getAllScores();
  const currentGameScores = allScores[gameId] || [];

  const newEntry: LeaderboardEntry = {
    id: Date.now().toString(),
    gameId,
    name: name || 'Anonymous Consultant',
    score,
    date: new Date().toISOString().split('T')[0]
  };
  
  const updatedGameScores = [...currentGameScores, newEntry].sort((a, b) => b.score - a.score);
  
  // Keep top 50 per game
  const top50 = updatedGameScores.slice(0, 50);
  
  // Save back
  allScores[gameId] = top50;
  localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(allScores));
  
  return top50;
};

export const getOpenedDoors = (): number[] => {
  const stored = localStorage.getItem(STORAGE_KEY_DOORS);
  return stored ? JSON.parse(stored) : [];
};

export const openDoor = (day: number) => {
  const opened = getOpenedDoors();
  if (!opened.includes(day)) {
    opened.push(day);
    localStorage.setItem(STORAGE_KEY_DOORS, JSON.stringify(opened));
  }
};