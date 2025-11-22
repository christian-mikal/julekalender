
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
  initialSpeed?: number; // Default 3
}

export const StackerGame: React.FC<Props> = ({ onClose, gameId, initialSpeed = 3 }) => {
  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 500;
  const BOX_HEIGHT = 25;
  const INITIAL_BOX_WIDTH = 150;
  const SPEED_INCREMENT = 0.5;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const gameState = useRef({
    stack: [] as { x: number, width: number, y: number }[],
    currentBox: {
      x: 0,
      y: CANVAS_HEIGHT - BOX_HEIGHT,
      width: INITIAL_BOX_WIDTH,
      direction: 1,
      speed: initialSpeed
    },
    level: 1
  });

  const startGame = () => {
    gameState.current = {
      stack: [{ x: (CANVAS_WIDTH - INITIAL_BOX_WIDTH) / 2, width: INITIAL_BOX_WIDTH, y: CANVAS_HEIGHT }],
      currentBox: {
        x: 0,
        y: CANVAS_HEIGHT - BOX_HEIGHT,
        width: INITIAL_BOX_WIDTH,
        direction: 1,
        speed: initialSpeed
      },
      level: 1
    };
    setScore(0);
    setGameOver(false);
    setSubmitted(false);
    setGameStarted(true);
    animate();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const current = gameState.current.currentBox;
    current.x += current.speed * current.direction;

    if (current.x + current.width >= CANVAS_WIDTH || current.x <= 0) {
      current.direction *= -1;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    gameState.current.stack.forEach((box, i) => {
      const isBase = i === 0;
      ctx.fillStyle = isBase ? '#1A1A24' : '#747480';
      ctx.fillRect(box.x, box.y - (gameState.current.level * BOX_HEIGHT) + (CANVAS_HEIGHT - 50), box.width, BOX_HEIGHT);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(box.x, box.y - (gameState.current.level * BOX_HEIGHT) + (CANVAS_HEIGHT - 50), box.width, BOX_HEIGHT);
    });

    ctx.fillStyle = '#FFE600'; 
    ctx.fillRect(current.x, current.y - ((gameState.current.level - 1) * BOX_HEIGHT) + (CANVAS_HEIGHT - 50 - BOX_HEIGHT), current.width, BOX_HEIGHT);
    
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(0, 50);
    ctx.lineTo(CANVAS_WIDTH, 50);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    if (!gameOver) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const placeBlock = useCallback((e?: Event) => {
    if (e && (e as KeyboardEvent).code === 'Space') {
        e.preventDefault();
    }

    if (gameOver || !gameStarted) return;

    const current = gameState.current.currentBox;
    const prevBlock = gameState.current.stack[gameState.current.stack.length - 1];

    const diff = current.x - prevBlock.x;
    const absDiff = Math.abs(diff);

    if (absDiff >= current.width) {
      setGameOver(true);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      const newWidth = current.width - absDiff;
      const newX = diff > 0 ? current.x : prevBlock.x;

      gameState.current.stack.push({ x: newX, width: newWidth, y: current.y });
      gameState.current.level += 1;
      gameState.current.currentBox = {
        x: Math.random() * (CANVAS_WIDTH - newWidth),
        y: current.y - BOX_HEIGHT,
        width: newWidth,
        direction: 1,
        speed: gameState.current.currentBox.speed + SPEED_INCREMENT
      };
      
      setScore(prev => prev + 100 + (gameState.current.level * 10));
    }
  }, [gameOver, gameStarted]);

  useEffect(() => {
    const handleInput = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
        if ((e as KeyboardEvent).code === 'Space' || e.type === 'click' || e.type === 'touchstart') {
            placeBlock(e);
        }
    };

    window.addEventListener('keydown', handleInput);
    
    return () => {
        window.removeEventListener('keydown', handleInput);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [placeBlock]);

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
        submitScore(gameId, playerName, score);
        setSubmitted(true);
        setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full shadow-2xl border-4 border-ey-yellow relative">
        <div className="p-4 bg-ey-black text-white flex justify-between items-center z-10 relative">
          <div>
            <h2 className="text-xl font-bold text-ey-yellow uppercase">Career Ladder</h2>
            <p className="text-xs text-gray-300">Stack your way to the top.</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
        </div>

        <div 
            className="relative bg-gray-100 cursor-pointer select-none"
            onClick={() => placeBlock()}
            onTouchStart={() => placeBlock()}
        >
            <canvas ref={canvasRef} width={300} height={500} className="block mx-auto bg-gray-50 border-x border-gray-200" />

            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Start Climbing
                    </button>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                     <h3 className="text-3xl font-bold text-white mb-2">Career Stalled!</h3>
                     <p className="text-ey-yellow text-5xl font-black mb-6">{score}</p>
                     {!submitted ? (
                        <form onSubmit={handleScoreSubmit} onClick={e => e.stopPropagation()} className="w-full flex flex-col gap-4">
                             <input type="text" maxLength={15} placeholder="Ditt Navn" className="p-3 rounded bg-white text-black font-bold text-center uppercase tracking-wider" value={playerName} onChange={(e) => setPlayerName(e.target.value)} autoFocus />
                            <button type="submit" disabled={!playerName.trim()} className="bg-ey-yellow text-black font-bold py-3 px-6 rounded hover:bg-yellow-400 transition-colors uppercase">Submit Score</button>
                             <button type="button" onClick={(e) => { e.stopPropagation(); startGame(); }} className="text-white underline text-sm">Try Again</button>
                        </form>
                     ) : (
                        <div className="text-green-400 text-xl font-bold">Score Saved!</div>
                     )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
