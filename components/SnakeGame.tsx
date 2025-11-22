
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
  initialSpeed?: number; // Lower is faster. Default 150.
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const SnakeGame: React.FC<Props> = ({ onClose, gameId, initialSpeed = 150 }) => {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20; 

  const [snake, setSnake] = useState<{x: number, y: number}[]>([{x: 10, y: 10}]);
  const [food, setFood] = useState<{x: number, y: number}>({x: 15, y: 5});
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);

  const spawnFood = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  };

  const resetGame = () => {
    setSnake([{x: 10, y: 10}]);
    setFood(spawnFood());
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setSubmitted(false);
    setIsPlaying(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
      case 'ArrowUp': if (directionRef.current !== 'DOWN') directionRef.current = 'UP'; break;
      case 'ArrowDown': if (directionRef.current !== 'UP') directionRef.current = 'DOWN'; break;
      case 'ArrowLeft': if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT'; break;
      case 'ArrowRight': if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT'; break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (directionRef.current) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE || 
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 100);
          setFood(spawnFood());
        } else {
          newSnake.pop(); 
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, initialSpeed - Math.floor(score / 500) * 10);
    gameLoopRef.current = window.setInterval(moveSnake, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, food, score, initialSpeed]);

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
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full shadow-2xl border-4 border-ey-yellow relative flex flex-col">
        
        <div className="p-4 bg-ey-black text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-ey-yellow uppercase">{initialSpeed < 100 ? 'Busy Season' : 'Audit Trail'}</h2>
            <p className="text-xs text-gray-300">Collect receipts. Don't crash.</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
        </div>

        <div className="p-6 bg-gray-100 flex flex-col items-center">
          
          {!isPlaying && !gameOver && (
            <div className="text-center py-8">
               <div className="text-6xl mb-4">🐍</div>
               <p className="mb-6">{initialSpeed < 100 ? 'WARNING: High Speed Mode.' : 'Navigate the audit trail.'}</p>
               <button 
                onClick={resetGame}
                className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-lg uppercase tracking-widest hover:scale-105 transition-transform"
               >
                 Start Audit
               </button>
            </div>
          )}

          {(isPlaying || gameOver) && (
             <div className="relative">
                <div className="mb-2 flex justify-between font-mono font-bold text-ey-black w-full">
                   <span>SCORE: {score}</span>
                </div>
                
                <div 
                  className="bg-[#2E2E38] border-4 border-gray-300 relative"
                  style={{
                    width: GRID_SIZE * CELL_SIZE,
                    height: GRID_SIZE * CELL_SIZE
                  }}
                >
                    <div 
                       className="absolute bg-green-500 rounded-full shadow-lg flex items-center justify-center text-[10px]"
                       style={{ left: food.x * CELL_SIZE, top: food.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                    >🧾</div>

                    {snake.map((segment, i) => (
                      <div 
                        key={i}
                        className="absolute bg-ey-yellow border border-ey-black"
                        style={{ left: segment.x * CELL_SIZE, top: segment.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, zIndex: 10 }}
                      />
                    ))}

                    {gameOver && (
                       <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4 text-center z-20">
                          <h3 className="text-2xl font-bold text-red-500 mb-2">AUDIT FAILED</h3>
                          {!submitted ? (
                            <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 w-full max-w-[200px]">
                                <input type="text" maxLength={15} placeholder="Ditt Navn" className="p-2 rounded text-black font-bold text-center uppercase" value={playerName} onChange={(e) => setPlayerName(e.target.value)} autoFocus />
                                <button type="submit" disabled={!playerName.trim()} className="bg-ey-yellow text-black font-bold py-2 rounded hover:bg-yellow-400">LAGRE SCORE</button>
                                <button type="button" onClick={resetGame} className="text-xs underline mt-2">Prøv igjen</button>
                            </form>
                          ) : (
                            <div className="text-green-400 font-bold text-xl">✓ Submitted</div>
                          )}
                       </div>
                    )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
