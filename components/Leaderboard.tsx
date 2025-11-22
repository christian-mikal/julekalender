import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/mockBackend';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: string;
}

// Configuration for the 15 active days
const ACTIVE_DAYS = [
  { day: 1, id: 'day1_runner', label: '1' },
  { day: 2, id: 'day2_memory', label: '2' },
  { day: 3, id: 'day3_whack', label: '3' },
  { day: 4, id: 'day4_quiz', label: '4' },
  { day: 5, id: 'day5_snake', label: '5' },
  // Weekend gap
  { day: 8, id: 'day8_stacker', label: '8' },
  { day: 9, id: 'day9_typing', label: '9' },
  { day: 10, id: 'day10_math', label: '10' },
  { day: 11, id: 'day11_catch', label: '11' },
  { day: 12, id: 'day12_clicker', label: '12' },
  // Weekend gap
  { day: 15, id: 'day15_reaction', label: '15' },
  { day: 16, id: 'day16_runner_hard', label: '16' },
  { day: 17, id: 'day17_memory_hard', label: '17' },
  { day: 18, id: 'day18_quiz_tech', label: '18' },
  { day: 19, id: 'day19_snake_fast', label: '19' },
];

export const Leaderboard: React.FC<Props> = ({ isOpen, onClose, initialGameId }) => {
  const [activeGameId, setActiveGameId] = useState<string>(initialGameId || 'day1_runner');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
        if (initialGameId && ACTIVE_DAYS.find(d => d.id === initialGameId)) {
            setActiveGameId(initialGameId);
        }
        setScores(getLeaderboard(initialGameId || activeGameId));
    }
  }, [isOpen, initialGameId]);

  useEffect(() => {
    setScores(getLeaderboard(activeGameId));
  }, [activeGameId]);

  if (!isOpen) return null;

  const activeDayConfig = ACTIVE_DAYS.find(d => d.id === activeGameId);

  return (
    <div className="fixed inset-0 bg-ey-black/80 backdrop-blur-sm z-[80] flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l-4 border-ey-yellow">
        
        {/* Header */}
        <div className="p-6 bg-ey-black relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 text-9xl opacity-5 transform translate-x-8 -translate-y-4">🎄</div>
          
          <div className="flex justify-between items-center relative z-10 mb-6">
            <div>
                <h2 className="text-4xl font-bold text-ey-yellow font-christmas tracking-wider">Hall of Fame</h2>
                <p className="text-white text-sm opacity-80">BGO Consulting Leaders</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-ey-yellow transition-colors bg-white/10 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
          
          {/* Visual Date Selector */}
          <div className="bg-[#2E2E38] p-4 rounded-xl border border-gray-700 shadow-inner">
              <p className="text-[10px] text-gray-400 mb-3 uppercase font-bold tracking-widest text-center">Velg Luke for å se score</p>
              <div className="grid grid-cols-5 gap-2">
                  {ACTIVE_DAYS.map((config) => {
                      const isActive = activeGameId === config.id;
                      return (
                          <button
                            key={config.id}
                            onClick={() => setActiveGameId(config.id)}
                            className={`
                                aspect-square rounded-lg text-sm font-bold transition-all relative overflow-hidden flex items-center justify-center border-b-4
                                ${isActive 
                                    ? 'bg-ey-yellow text-black border-yellow-600 shadow-lg scale-105 z-10' 
                                    : 'bg-gray-700 text-gray-300 border-gray-800 hover:bg-gray-600'
                                }
                            `}
                          >
                              <span className="font-christmas text-lg">{config.label}</span>
                              {isActive && <div className="absolute -top-1 -right-1 text-[8px]">✨</div>}
                          </button>
                      );
                  })}
              </div>
          </div>
        </div>

        {/* Scores List */}
        <div className="flex-1 overflow-y-auto p-0 bg-[#F6F6FA] relative">
          {/* Garland Separator */}
          <div className="h-2 w-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] bg-xmas-green mb-0"></div>

          {activeDayConfig && (
             <div className="bg-white p-3 text-center border-b border-gray-200 shadow-sm sticky top-0 z-20 flex items-center justify-center gap-2">
                 <span className="text-xl">🎁</span>
                 <span className="text-ey-black font-bold uppercase text-sm tracking-widest">
                    Resultater Luke {activeDayConfig.label}
                 </span>
                 <span className="text-xl">🎁</span>
             </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase border-b border-gray-200 sticky top-[53px] z-10">
              <tr>
                <th className="p-4 font-bold w-16 text-center">Rank</th>
                <th className="p-4 font-bold">Navn</th>
                <th className="p-4 font-bold text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className={`
                    border-b border-gray-100 hover:bg-yellow-50 transition-colors
                    ${index === 0 ? 'bg-yellow-50/60' : ''}
                  `}
                >
                  <td className="p-4 text-center">
                    {index === 0 ? <span className="text-2xl filter drop-shadow-sm">🥇</span> : 
                     index === 1 ? <span className="text-xl filter drop-shadow-sm">🥈</span> : 
                     index === 2 ? <span className="text-xl filter drop-shadow-sm">🥉</span> : 
                     <span className="font-mono text-gray-400 font-bold">{index + 1}</span>}
                  </td>
                  <td className="p-4 font-medium text-ey-black">
                    <div className="flex flex-col">
                        <span className="text-base">{entry.name}</span>
                        <span className="text-[10px] text-gray-400">{entry.date}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold font-mono text-ey-black text-lg">
                    {entry.score.toLocaleString()}
                  </td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-16 text-center text-gray-400">
                    <div className="text-5xl mb-4 animate-pulse">❄️</div>
                    <p className="italic font-christmas text-xl text-gray-500">Ingen nisser har spilt her enda.</p>
                    <button onClick={onClose} className="mt-4 text-xs bg-ey-black text-white px-4 py-2 rounded hover:bg-gray-800">
                        Bli den første!
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-white border-t border-gray-200 text-center text-xs text-gray-400 flex justify-between items-center">
            <span>EY BGO Julekalender</span>
            <span className="text-xmas-red font-bold">🎅 God Jul!</span>
        </div>
      </div>
    </div>
  );
};