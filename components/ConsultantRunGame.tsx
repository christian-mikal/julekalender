
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../types';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
  difficultyMultiplier?: number; // 1.0 is normal, 1.5 is hard
}

export const ConsultantRunGame: React.FC<Props> = ({ onClose, gameId, difficultyMultiplier = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    difficultyLevel: 1
  });
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Game constants
  const PLAYER_SIZE = 30;
  const OBSTACLE_WIDTH = 40;
  const COLLECTIBLE_SIZE = 20;
  const LANE_COUNT = 4;
  
  const stateRef = useRef({
    playerLane: 1, 
    obstacles: [] as { x: number, y: number, type: 'RISK' | 'BLOCKER' }[],
    collectibles: [] as { x: number, y: number, val: number }[],
    score: 0,
    speed: 5 * difficultyMultiplier,
    lastSpawn: 0,
    isPlaying: false,
    frameCount: 0
  });

  const movePlayer = useCallback((direction: 'LEFT' | 'RIGHT') => {
    if (!stateRef.current.isPlaying) return;
    
    stateRef.current.playerLane = direction === 'LEFT' 
      ? Math.max(0, stateRef.current.playerLane - 1)
      : Math.min(LANE_COUNT - 1, stateRef.current.playerLane + 1);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') movePlayer('LEFT');
    if (e.code === 'ArrowRight' || e.code === 'KeyD') movePlayer('RIGHT');
  }, [movePlayer]);

  const startGame = () => {
    stateRef.current = {
      playerLane: 1,
      obstacles: [],
      collectibles: [],
      score: 0,
      speed: 5 * difficultyMultiplier,
      lastSpawn: 0,
      isPlaying: true,
      frameCount: 0
    };
    setGameState(prev => ({ ...prev, isPlaying: true, isGameOver: false, score: 0 }));
    setSubmitted(false);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, laneWidth: number, height: number) => {
    const lane = stateRef.current.playerLane;
    const x = lane * laneWidth + (laneWidth - PLAYER_SIZE) / 2;
    const y = height - 100;

    ctx.fillStyle = difficultyMultiplier > 1.2 ? '#FF0000' : '#FFE600'; 
    ctx.beginPath();
    ctx.moveTo(x + PLAYER_SIZE / 2, y);
    ctx.lineTo(x + PLAYER_SIZE, y + PLAYER_SIZE);
    ctx.lineTo(x, y + PLAYER_SIZE);
    ctx.fill();
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const updateGame = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (!stateRef.current.isPlaying) return;

    const width = canvas.width;
    const height = canvas.height;
    const laneWidth = width / LANE_COUNT;

    ctx.clearRect(0, 0, width, height);

    // Draw Lanes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, height);
      ctx.stroke();
    }

    stateRef.current.score += 1;
    stateRef.current.frameCount++;

    // Increase difficulty
    if (stateRef.current.frameCount % 600 === 0) {
      stateRef.current.speed += 1.5;
      setGameState(prev => ({ ...prev, difficultyLevel: prev.difficultyLevel + 1 }));
    }

    // Spawn Logic
    if (stateRef.current.frameCount - stateRef.current.lastSpawn > (60 - stateRef.current.speed * 2)) {
      stateRef.current.lastSpawn = stateRef.current.frameCount;
      
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const isGood = Math.random() > 0.7; 

      if (isGood) {
        stateRef.current.collectibles.push({
          x: lane * laneWidth + (laneWidth - COLLECTIBLE_SIZE) / 2,
          y: -50,
          val: 500
        });
      } else {
        stateRef.current.obstacles.push({
          x: lane * laneWidth + (laneWidth - OBSTACLE_WIDTH) / 2,
          y: -50,
          type: Math.random() > 0.5 ? 'RISK' : 'BLOCKER'
        });
      }
    }

    // Move & Draw Collectibles
    stateRef.current.collectibles.forEach((c, index) => {
      c.y += stateRef.current.speed;
      
      ctx.fillStyle = '#00FF00'; 
      ctx.beginPath();
      ctx.arc(c.x + COLLECTIBLE_SIZE/2, c.y + COLLECTIBLE_SIZE/2, COLLECTIBLE_SIZE/2, 0, Math.PI * 2);
      ctx.fill();

      const playerX = stateRef.current.playerLane * laneWidth + (laneWidth - PLAYER_SIZE) / 2;
      const playerY = height - 100;

      if (
        c.y + COLLECTIBLE_SIZE > playerY &&
        c.y < playerY + PLAYER_SIZE &&
        Math.abs(c.x - playerX) < PLAYER_SIZE
      ) {
        stateRef.current.score += c.val;
        stateRef.current.collectibles.splice(index, 1);
      }
    });

    // Move & Draw Obstacles
    stateRef.current.obstacles.forEach((obs, index) => {
      obs.y += stateRef.current.speed;

      ctx.fillStyle = obs.type === 'RISK' ? '#FF0000' : '#747480';
      ctx.fillRect(obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_WIDTH);

      const playerX = stateRef.current.playerLane * laneWidth + (laneWidth - PLAYER_SIZE) / 2;
      const playerY = height - 100;

      if (
        obs.y + OBSTACLE_WIDTH > playerY + 10 && 
        obs.y < playerY + PLAYER_SIZE - 10 &&
        Math.abs(obs.x - playerX) < PLAYER_SIZE - 5
      ) {
        stateRef.current.isPlaying = false;
        setGameState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isGameOver: true, 
          score: stateRef.current.score 
        }));
      }
    });

    stateRef.current.obstacles = stateRef.current.obstacles.filter(o => o.y < height);
    stateRef.current.collectibles = stateRef.current.collectibles.filter(c => c.y < height);

    drawPlayer(ctx, laneWidth, height);
    
    setGameState(prev => ({ ...prev, score: stateRef.current.score }));

    requestAnimationFrame(() => updateGame(canvas, ctx));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 600;

    window.addEventListener('keydown', handleKeyDown);
    
    if (gameState.isPlaying) {
        requestAnimationFrame(() => updateGame(canvas, ctx));
    } else {
        ctx.fillStyle = '#1A1A24';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Inter';
        ctx.textAlign = 'center';
        if (!gameState.isGameOver) {
            ctx.fillText("Trykk START for å begynne", canvas.width/2, canvas.height/2);
        }
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, handleKeyDown]);

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
        submitScore(gameId, playerName, gameState.score);
        setSubmitted(true);
        setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full shadow-2xl border-4 border-ey-yellow relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-ey-black hover:bg-gray-800 rounded-full p-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 bg-ey-black text-white text-center">
          <h2 className="text-2xl font-bold text-ey-yellow uppercase">
             {difficultyMultiplier > 1 ? "Deadline Dash" : "Value Venture"}
          </h2>
          <p className="text-sm text-gray-300">
             {difficultyMultiplier > 1 ? "Hard Mode: Faster Speed!" : "Dodge Risk. Collect Value."}
          </p>
        </div>

        <div className="relative bg-ey-black flex justify-center">
            <canvas 
                ref={canvasRef} 
                className="bg-[#2E2E38] shadow-inner cursor-pointer max-w-full"
                style={{ width: '100%', maxHeight: '60vh', touchAction: 'none' }}
                onClick={(e) => {
                    if(gameState.isPlaying) {
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if(rect) {
                            const x = e.clientX - rect.left;
                            if(x < rect.width / 2) movePlayer('LEFT');
                            else movePlayer('RIGHT');
                        }
                    }
                }}
            />
            
            {gameState.isGameOver && !submitted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                    <h3 className="text-3xl font-bold text-white mb-2">Game Over</h3>
                    <p className="text-ey-yellow text-5xl font-black mb-6">{gameState.score}</p>
                    
                    <form onSubmit={handleScoreSubmit} className="w-full flex flex-col gap-4">
                        <input 
                            type="text" 
                            maxLength={15}
                            placeholder="Ditt Navn / Alias" 
                            className="p-3 rounded bg-white text-black font-bold text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={!playerName.trim()}
                            className="bg-ey-yellow text-black font-bold py-3 px-6 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            Save to Leaderboard
                        </button>
                        <button 
                            type="button"
                            onClick={startGame}
                            className="text-white text-sm underline hover:text-ey-yellow"
                        >
                            Prøv igjen
                        </button>
                    </form>
                </div>
            )}
             {gameState.isGameOver && submitted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                    <h3 className="text-2xl text-ey-yellow font-bold mb-4">Score Saved!</h3>
                    <div className="text-green-400 text-6xl mb-4">✓</div>
                    <p className="text-white mb-4">Closing game...</p>
                </div>
            )}

            {!gameState.isPlaying && !gameState.isGameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6">
                     <button 
                        onClick={startGame}
                        className="bg-ey-yellow text-black text-xl font-bold py-4 px-12 rounded-sm shadow-lg hover:scale-105 transition-transform uppercase tracking-widest"
                    >
                        START GAME
                    </button>
                </div>
            )}
        </div>

        <div className="bg-ey-gray p-2 flex justify-between items-center text-white text-xs sm:text-sm font-mono">
            <span>SCORE: {gameState.score}</span>
            <span>LEVEL: {gameState.difficultyLevel}</span>
        </div>
      </div>
    </div>
  );
};
