
import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

export const PlatformerGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stateRef = useRef({
    player: { x: 200, y: 500, vx: 0, vy: 0 },
    platforms: [] as { x: number, y: number, w: number, type: 'NORMAL' | 'MOVING' | 'BREAK' }[],
    cameraY: 0,
    score: 0
  });

  const requestRef = useRef<number>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const initGame = () => {
    const platforms = [];
    for(let i=0; i<20; i++) {
        platforms.push({ x: Math.random() * 340, y: 600 - (i * 50), w: 60, type: 'NORMAL' as const });
    }
    
    stateRef.current = {
      player: { x: 200, y: 500, vx: 0, vy: -10 },
      platforms,
      cameraY: 0,
      score: 0
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSubmitted(false);
    animate();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const state = stateRef.current;

    // Physics
    if (keysRef.current['ArrowLeft']) state.player.vx = -6;
    else if (keysRef.current['ArrowRight']) state.player.vx = 6;
    else state.player.vx *= 0.9;

    state.player.x += state.player.vx;
    state.player.y += state.player.vy;
    state.player.vy += 0.4; // Gravity

    // Screen Wrap
    if (state.player.x > width) state.player.x = 0;
    if (state.player.x < 0) state.player.x = width;

    // Camera follow (only up)
    if (state.player.y < height / 2) {
        const diff = (height / 2) - state.player.y;
        state.player.y = height / 2;
        state.platforms.forEach(p => p.y += diff);
        state.score += Math.floor(diff);
        
        // Generate new platforms
        if (state.platforms[state.platforms.length - 1].y > 50) {
            state.platforms.push({
                x: Math.random() * (width - 60),
                y: -20,
                w: 60,
                type: Math.random() > 0.8 ? 'MOVING' : 'NORMAL'
            });
        }
        state.platforms = state.platforms.filter(p => p.y < height);
    }

    // Collision
    if (state.player.vy > 0) {
        state.platforms.forEach(p => {
            if (
                state.player.x + 20 > p.x && 
                state.player.x < p.x + p.w &&
                state.player.y + 20 > p.y &&
                state.player.y + 20 < p.y + 20
            ) {
                state.player.vy = -12; // Jump!
            }
        });
    }

    // Game Over
    if (state.player.y > height) {
        setGameOver(true);
        return;
    }

    // Drawing
    ctx.clearRect(0, 0, width, height);
    
    // Background Grid
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    for(let i=0; i<width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
    for(let i=0; i<height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
    ctx.stroke();

    // Platforms
    state.platforms.forEach(p => {
        if (p.type === 'MOVING') {
            p.x += Math.sin(Date.now() / 500) * 2;
            ctx.fillStyle = '#D42E12';
        } else {
            ctx.fillStyle = '#0F5132';
        }
        ctx.fillRect(p.x, p.y, p.w, 15);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("WORK", p.x + 10, p.y + 11);
    });

    // Player
    ctx.fillStyle = '#FFE600';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 15, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
    // Face
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(state.player.x - 5, state.player.y - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(state.player.x + 5, state.player.y - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(state.player.x, state.player.y + 5, 5, 0, Math.PI); ctx.fill();


    setScore(state.score);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { 
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
        keysRef.current[e.code] = true; 
    };
    const ku = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);
  
   const handleTouchStart = (e: React.TouchEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect && e.touches[0]) {
          const x = e.touches[0].clientX - rect.left;
          if(x < rect.width / 2) keysRef.current['ArrowLeft'] = true;
          else keysRef.current['ArrowRight'] = true;
      }
   }
   
   const handleTouchEnd = () => {
       keysRef.current['ArrowLeft'] = false;
       keysRef.current['ArrowRight'] = false;
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
            <h2 className="text-xl font-bold text-ey-yellow">CAREER CLIMBER</h2>
            <button onClick={onClose}>✕</button>
        </div>
        <div className="relative bg-white" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <canvas ref={canvasRef} width={400} height={600} className="w-full h-auto block" />

            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                     <button onClick={initGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl text-xl">JUMP UP!</button>
                </div>
            )}
            
            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-6 text-center">
                     <h3 className="text-3xl font-bold">Game Over</h3>
                     <p className="text-5xl font-black text-ey-yellow mb-4">{score}</p>
                     {!submitted ? (
                        <form onSubmit={handleScoreSubmit} className="w-full flex flex-col gap-3">
                             <input type="text" placeholder="Name" value={playerName} onChange={e=>setPlayerName(e.target.value)} className="border-2 border-black p-2 text-center uppercase font-bold"/>
                             <button className="bg-ey-black text-white py-3 font-bold">SUBMIT</button>
                        </form>
                     ) : <div className="text-green-600 font-bold">Saved!</div>}
                </div>
            )}
            
            <div className="absolute top-2 left-2 bg-ey-yellow px-2 font-bold rounded shadow">Score: {score}</div>
        </div>
      </div>
    </div>
  );
};
