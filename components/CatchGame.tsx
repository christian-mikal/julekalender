import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

export const CatchGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lives, setLives] = useState(3);

  const stateRef = useRef({
    playerX: 150,
    items: [] as { x: number, y: number, type: 'GOOD' | 'BAD' }[],
    lastSpawn: 0,
    speed: 3
  });

  const requestRef = useRef<number | null>(null);

  const startGame = () => {
    stateRef.current = { playerX: 150, items: [], lastSpawn: 0, speed: 3 };
    setScore(0);
    setLives(3);
    setGameOver(false);
    setSubmitted(false);
    setGameStarted(true);
    animate();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Spawn
    if (Date.now() - stateRef.current.lastSpawn > 800) {
        stateRef.current.lastSpawn = Date.now();
        stateRef.current.items.push({
            x: Math.random() * (width - 30),
            y: -30,
            type: Math.random() > 0.3 ? 'GOOD' : 'BAD'
        });
        stateRef.current.speed += 0.05;
    }

    // Player
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(stateRef.current.playerX, height - 40, 50, 20);

    // Items
    for (let i = stateRef.current.items.length - 1; i >= 0; i--) {
        const item = stateRef.current.items[i];
        item.y += stateRef.current.speed;

        ctx.font = '20px Arial';
        ctx.fillText(item.type === 'GOOD' ? '💰' : '📉', item.x, item.y);

        // Catch
        if (item.y > height - 50 && item.y < height - 20 && 
            item.x > stateRef.current.playerX - 20 && item.x < stateRef.current.playerX + 50) {
            if (item.type === 'GOOD') {
                setScore(s => s + 100);
            } else {
                setLives(l => {
                    if (l <= 1) setGameOver(true);
                    return l - 1;
                });
            }
            stateRef.current.items.splice(i, 1);
        } else if (item.y > height) {
            stateRef.current.items.splice(i, 1);
        }
    }

    if (!gameOver) {
        requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

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
        <div className="p-4 bg-ey-black text-white flex justify-between items-center">
           <h2 className="text-xl font-bold">Budget Catcher</h2>
           <button onClick={onClose}>✕</button>
        </div>
        <div className="relative bg-[#2E2E38]">
            <canvas 
                ref={canvasRef} 
                width={350} 
                height={500} 
                className="block mx-auto cursor-pointer"
                onPointerMove={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                        stateRef.current.playerX = e.clientX - rect.left - 25;
                    }
                }}
            />
            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={startGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded">START</button>
                </div>
            )}
            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">Budget Depleted!</h3>
                    <p className="text-4xl mb-4 text-ey-yellow">{score}</p>
                    {!submitted ? (
                        <form onSubmit={handleScoreSubmit} className="flex flex-col gap-2">
                             <input type="text" placeholder="Name" className="p-2 text-black" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                             <button className="bg-ey-yellow text-black p-2 font-bold">Submit</button>
                        </form>
                    ): <div className="text-green-500">Saved!</div>}
                </div>
            )}
            <div className="absolute top-2 left-2 text-white font-mono">
                Lives: {'❤️'.repeat(lives)} Score: {score}
            </div>
        </div>
      </div>
    </div>
  );
};