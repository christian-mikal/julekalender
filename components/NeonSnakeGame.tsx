import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const NeonSnakeGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const GRID_SIZE = 20;
  const TILE_SIZE = 20;

  const stateRef = useRef({
    snake: [{x: 10, y: 10}],
    food: {x: 15, y: 5},
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    particles: [] as {x:number, y:number, color: string, life: number}[],
    score: 0
  });

  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  const startGame = () => {
    stateRef.current = {
      snake: [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}],
      food: {x: 15, y: 5},
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      particles: [],
      score: 0
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSubmitted(false);
    lastTimeRef.current = 0;
    animate(0);
  };

  const spawnFood = () => {
     return {
         x: Math.floor(Math.random() * GRID_SIZE),
         y: Math.floor(Math.random() * GRID_SIZE)
     };
  };
  
  const createExplosion = (x: number, y: number) => {
      for(let i=0; i<20; i++) {
          stateRef.current.particles.push({
              x: x * TILE_SIZE + TILE_SIZE/2 + (Math.random()-0.5)*10,
              y: y * TILE_SIZE + TILE_SIZE/2 + (Math.random()-0.5)*10,
              color: `hsl(${Math.random()*360}, 100%, 50%)`,
              life: 1.0
          });
      }
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (time - lastTimeRef.current > 100) { // Speed control (100ms tick)
        lastTimeRef.current = time;
        
        // Logic Tick
        const state = stateRef.current;
        state.direction = state.nextDirection;
        
        const head = { ...state.snake[0] };
        if (state.direction === 'UP') head.y -= 1;
        if (state.direction === 'DOWN') head.y += 1;
        if (state.direction === 'LEFT') head.x -= 1;
        if (state.direction === 'RIGHT') head.x += 1;
        
        // Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            setGameOver(true);
            return;
        }
        
        // Self Collision
        if (state.snake.some(s => s.x === head.x && s.y === head.y)) {
             setGameOver(true);
             return;
        }
        
        state.snake.unshift(head);
        
        // Eat Food
        if (head.x === state.food.x && head.y === state.food.y) {
            state.score += 100;
            state.food = spawnFood();
            createExplosion(head.x, head.y);
        } else {
            state.snake.pop();
        }
        setScore(state.score);
    }

    // Drawing (Runs every frame for smoothness of particles)
    const width = canvas.width;
    const height = canvas.height;
    const state = stateRef.current;

    // Background with Trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,width,height);
    
    // Grid (subtle)
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    for(let i=0; i<=GRID_SIZE; i++) {
        ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, height);
        ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(width, i*TILE_SIZE);
    }
    ctx.stroke();
    
    // Draw Food (Neon)
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FF00FF';
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(state.food.x * TILE_SIZE, state.food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.shadowBlur = 0;
    
    // Draw Snake (Neon)
    state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#FFFFFF' : '#00FF00';
        ctx.shadowBlur = i === 0 ? 20 : 10;
        ctx.shadowColor = '#00FF00';
        ctx.fillRect(seg.x * TILE_SIZE, seg.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
    });
    ctx.shadowBlur = 0;
    
    // Particles
    for(let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= 0.05;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
        
        // Move randomly
        p.x += (Math.random() - 0.5) * 5;
        p.y += (Math.random() - 0.5) * 5;
        
        if (p.life <= 0) state.particles.splice(i, 1);
    }
    
    if (!gameOver) {
        requestRef.current = requestAnimationFrame(animate);
    }
  };
  
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          const cur = stateRef.current.direction;
          if (e.key === 'ArrowUp' && cur !== 'DOWN') stateRef.current.nextDirection = 'UP';
          if (e.key === 'ArrowDown' && cur !== 'UP') stateRef.current.nextDirection = 'DOWN';
          if (e.key === 'ArrowLeft' && cur !== 'RIGHT') stateRef.current.nextDirection = 'LEFT';
          if (e.key === 'ArrowRight' && cur !== 'LEFT') stateRef.current.nextDirection = 'RIGHT';
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, []);
  
  // Touch Controls
   const handleTouchStart = (e: React.TouchEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect && e.touches[0]) {
          const x = e.touches[0].clientX - rect.left;
          const y = e.touches[0].clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const dx = x - centerX;
          const dy = y - centerY;
          
          const cur = stateRef.current.direction;
          
          if (Math.abs(dx) > Math.abs(dy)) {
              // Horizontal
              if (dx > 0 && cur !== 'LEFT') stateRef.current.nextDirection = 'RIGHT';
              if (dx < 0 && cur !== 'RIGHT') stateRef.current.nextDirection = 'LEFT';
          } else {
              // Vertical
              if (dy > 0 && cur !== 'UP') stateRef.current.nextDirection = 'DOWN';
              if (dy < 0 && cur !== 'DOWN') stateRef.current.nextDirection = 'UP';
          }
      }
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
            <h2 className="text-xl font-bold text-ey-yellow">NEON SNAKE 2077</h2>
            <button onClick={onClose}>✕</button>
        </div>
        <div className="relative bg-black" onTouchStart={handleTouchStart}>
            <canvas ref={canvasRef} width={400} height={400} className="w-full h-auto block" />
            
            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                     <button onClick={startGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl">CONNECT</button>
                </div>
            )}
            
            {gameOver && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white">
                     <h3 className="text-3xl font-bold text-red-500">CRASHED</h3>
                     <p className="text-5xl font-black text-white mb-4">{score}</p>
                     {!submitted ? (
                        <form onSubmit={handleScoreSubmit} className="w-full flex flex-col gap-3">
                             <input type="text" placeholder="Name" value={playerName} onChange={e=>setPlayerName(e.target.value)} className="p-2 text-black text-center uppercase font-bold"/>
                             <button className="bg-ey-yellow text-black py-3 font-bold">SUBMIT</button>
                        </form>
                     ) : <div className="text-green-500 font-bold">Saved!</div>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};