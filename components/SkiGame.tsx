
import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

export const SkiGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stateRef = useRef({
    playerX: 200,
    speed: 5,
    distance: 0,
    obstacles: [] as { x: number, y: number, type: 'TREE' | 'ROCK' | 'GIFT' }[],
    score: 0,
    isCrashed: false
  });

  const requestRef = useRef<number>(null);

  const startGame = () => {
    stateRef.current = {
      playerX: 200,
      speed: 5,
      distance: 0,
      obstacles: [],
      score: 0,
      isCrashed: false
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSubmitted(false);
    animate();
  };

  const spawnObstacle = (width: number) => {
    if (Math.random() < 0.05 + (stateRef.current.speed * 0.002)) {
      const type = Math.random() > 0.85 ? 'GIFT' : (Math.random() > 0.5 ? 'TREE' : 'ROCK');
      stateRef.current.obstacles.push({
        x: Math.random() * width,
        y: 600, 
        type
      });
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Snow Background
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, width, height);

    // Speed lines
    ctx.strokeStyle = 'rgba(200, 210, 230, 0.5)';
    ctx.beginPath();
    const offset = (stateRef.current.distance % 50);
    for(let i=0; i<height; i+=50) {
        ctx.moveTo(0, i - offset);
        ctx.lineTo(width, i - offset);
    }
    ctx.stroke();

    if (!stateRef.current.isCrashed) {
        stateRef.current.distance += stateRef.current.speed;
        stateRef.current.score = Math.floor(stateRef.current.distance / 10);
        stateRef.current.speed += 0.005; 
        spawnObstacle(width);
    }

    const playerY = 150;

    // Draw Player (Skier)
    ctx.fillStyle = stateRef.current.isCrashed ? '#FF0000' : '#1A1A24'; 
    ctx.beginPath();
    ctx.arc(stateRef.current.playerX, playerY, 10, 0, Math.PI*2); // Head
    ctx.fillRect(stateRef.current.playerX - 10, playerY + 10, 20, 20); // Body
    
    // Skis
    ctx.strokeStyle = stateRef.current.isCrashed ? '#555' : '#D42E12'; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (!stateRef.current.isCrashed) {
        ctx.moveTo(stateRef.current.playerX - 15, playerY + 30);
        ctx.lineTo(stateRef.current.playerX - 15, playerY - 10);
        ctx.moveTo(stateRef.current.playerX + 15, playerY + 30);
        ctx.lineTo(stateRef.current.playerX + 15, playerY - 10);
    } else {
        ctx.moveTo(stateRef.current.playerX - 20, playerY + 20);
        ctx.lineTo(stateRef.current.playerX + 20, playerY - 20);
        ctx.moveTo(stateRef.current.playerX + 20, playerY + 20);
        ctx.lineTo(stateRef.current.playerX - 20, playerY - 20);
    }
    ctx.stroke();
    ctx.fill();

    // Obstacles
    for (let i = stateRef.current.obstacles.length - 1; i >= 0; i--) {
        const obs = stateRef.current.obstacles[i];
        if (!stateRef.current.isCrashed) {
            obs.y -= stateRef.current.speed;
        }

        if (obs.type === 'TREE') {
            ctx.fillStyle = '#0F5132';
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y - 40);
            ctx.lineTo(obs.x + 20, obs.y);
            ctx.lineTo(obs.x - 20, obs.y);
            ctx.fill();
        } else if (obs.type === 'ROCK') {
            ctx.fillStyle = '#747480';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y - 10, 15, 0, Math.PI, true);
            ctx.fill();
        } else if (obs.type === 'GIFT') {
             ctx.fillStyle = '#FFE600';
             ctx.fillRect(obs.x - 15, obs.y - 30, 30, 30);
             ctx.strokeStyle = 'red';
             ctx.lineWidth = 2;
             ctx.strokeRect(obs.x - 15, obs.y - 30, 30, 30);
             ctx.fillText("🎁", obs.x - 10, obs.y - 10);
        }

        // Collision
        const dist = Math.hypot(stateRef.current.playerX - obs.x, playerY - (obs.y - 20));
        if (dist < 30) {
            if (obs.type === 'GIFT') {
                stateRef.current.score += 500;
                stateRef.current.obstacles.splice(i, 1);
            } else {
                stateRef.current.isCrashed = true;
                setGameOver(true);
            }
        }

        if (obs.y < -50) {
            stateRef.current.obstacles.splice(i, 1);
        }
    }

    setScore(stateRef.current.score);

    if (!gameOver) {
        requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
      const handleMove = (e: KeyboardEvent) => {
          if (['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
          if (stateRef.current.isCrashed) return;
          if (e.key === 'ArrowLeft') stateRef.current.playerX -= 15;
          if (e.key === 'ArrowRight') stateRef.current.playerX += 15;
          stateRef.current.playerX = Math.max(20, Math.min(380, stateRef.current.playerX));
      };

      window.addEventListener('keydown', handleMove);
      return () => {
        window.removeEventListener('keydown', handleMove);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, []);

  const handleTouch = (e: React.TouchEvent) => {
      if (stateRef.current.isCrashed) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if(!rect) return;
      const touchX = e.touches[0].clientX - rect.left;
      stateRef.current.playerX = touchX;
  }

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
        submitScore(gameId, playerName, score);
        setSubmitted(true);
        setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full shadow-2xl border-4 border-ey-yellow relative">
        <div className="p-4 bg-ey-black text-white flex justify-between items-center">
            <h2 className="text-xl font-bold text-ey-yellow">ALPINE CONSULTANT</h2>
            <button onClick={onClose}>✕</button>
        </div>
        
        <div className="relative bg-white" onTouchMove={handleTouch}>
            <canvas ref={canvasRef} width={400} height={600} className="w-full h-auto block" />
            
            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="text-center">
                        <h3 className="text-3xl font-bold mb-4">Ready to Ski?</h3>
                        <p className="mb-6 text-gray-600">Use Arrow Keys or Touch to steer.</p>
                        <button onClick={startGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl transform hover:scale-110 transition-transform">
                            START
                        </button>
                    </div>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-6 text-center">
                    <h3 className="text-4xl font-black text-red-600 mb-2">WIPEOUT!</h3>
                    <p className="text-2xl font-bold mb-6">Score: {score}</p>
                    
                    {!submitted ? (
                        <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 w-full">
                            <input 
                                type="text" 
                                placeholder="Your Name" 
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                className="p-3 border-2 border-ey-black rounded text-center font-bold uppercase"
                                autoFocus
                            />
                            <button className="bg-ey-black text-white py-3 rounded font-bold">SUBMIT RUN</button>
                        </form>
                    ) : (
                        <div className="text-green-600 font-bold text-xl">Saved!</div>
                    )}
                     <button onClick={startGame} className="mt-4 underline text-sm">Try Again</button>
                </div>
            )}

            <div className="absolute top-4 right-4 font-mono font-bold text-2xl">
                {score} m
            </div>
        </div>
      </div>
    </div>
  );
};
