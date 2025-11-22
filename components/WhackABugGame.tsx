import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

export const WhackABugGame: React.FC<Props> = ({ onClose, gameId }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const timerRef = useRef<number | null>(null);
  const bugTimerRef = useRef<number | null>(null);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setSubmitted(false);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnBug();
  };

  const spawnBug = () => {
    if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
    
    const randomHole = Math.floor(Math.random() * 9);
    setActiveHole(randomHole);
    
    const speed = timeLeft > 20 ? 800 : timeLeft > 10 ? 600 : 400;
    
    bugTimerRef.current = window.setTimeout(() => {
        setActiveHole(null);
        setTimeout(spawnBug, 100);
    }, speed);
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
    setActiveHole(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
  };

  const handleWhack = (index: number) => {
    if (activeHole === index) {
        setScore(prev => prev + 100);
        setActiveHole(null); 
        if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
        setTimeout(spawnBug, 150);
    } else {
        setScore(prev => Math.max(0, prev - 50)); 
    }
  };

  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (bugTimerRef.current) clearTimeout(bugTimerRef.current);
    };
  }, []);

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
        submitScore(gameId, playerName, score);
        setSubmitted(true);
        setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border-4 border-ey-yellow overflow-hidden">
            <div className="p-4 bg-ey-black text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-ey-yellow uppercase">Debug The Code</h2>
                    <p className="text-xs text-gray-300">Squash the bugs before deadline!</p>
                </div>
                <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
            </div>

            <div className="p-6 bg-gray-100 text-center">
                {!gameActive && !gameOver && (
                    <div className="py-8">
                        <div className="text-6xl mb-4">🐛</div>
                        <p className="mb-6 text-ey-black">Click bugs fast to clean up the project.</p>
                        <button 
                            onClick={startGame}
                            className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-lg hover:scale-105 transition-transform uppercase"
                        >
                            Start Debugging
                        </button>
                    </div>
                )}

                {(gameActive || gameOver) && (
                    <>
                        <div className="flex justify-between mb-6 font-mono font-bold text-xl">
                            <div className="text-ey-black">SCORE: {score}</div>
                            <div className={`${timeLeft < 10 ? 'text-red-600' : 'text-ey-black'}`}>TIME: {timeLeft}s</div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {Array.from({length: 9}).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleWhack(index)}
                                    disabled={!gameActive}
                                    className={`
                                        aspect-square rounded-lg bg-[#2E2E38] shadow-inner relative overflow-hidden
                                        active:scale-95
                                    `}
                                >
                                    <div className={`
                                        absolute inset-0 flex items-center justify-center text-4xl transition-transform duration-100
                                        ${activeHole === index ? 'translate-y-0' : 'translate-y-24'}
                                    `}>
                                        🐛
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {gameOver && (
                    <div className="mt-4 border-t pt-4">
                         {!submitted ? (
                            <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3">
                                <h3 className="font-bold text-ey-black">Project Finished!</h3>
                                <input 
                                    type="text" 
                                    maxLength={15}
                                    placeholder="Ditt Navn" 
                                    className="p-2 rounded border text-center"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    disabled={!playerName.trim()}
                                    className="bg-ey-yellow text-black font-bold py-2 rounded"
                                >
                                    Submit Score
                                </button>
                            </form>
                         ) : (
                            <div className="text-green-600 font-bold">Score Submitted!</div>
                         )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};