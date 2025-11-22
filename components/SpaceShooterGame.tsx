
import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

export const SpaceShooterGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stateRef = useRef({
    player: { x: 200, y: 550 },
    bullets: [] as { x: number, y: number }[],
    enemies: [] as { x: number, y: number, type: 'EMAIL' | 'MEETING' }[],
    particles: [] as { x: number, y: number, vx: number, vy: number, life: number, color: string }[],
    spawnTimer: 0,
    score: 0,
    frame: 0
  });

  const requestRef = useRef<number>(null);

  const startGame = () => {
    stateRef.current = {
      player: { x: 200, y: 550 },
      bullets: [],
      enemies: [],
      particles: [],
      spawnTimer: 0,
      score: 0,
      frame: 0
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSubmitted(false);
    animate();
  };
  
  const createExplosion = (x: number, y: number, color: string) => {
      for(let i=0; i<10; i++) {
          stateRef.current.particles.push({
              x, y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 1.0,
              color
          });
      }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const state = stateRef.current;
    state.frame++;

    ctx.fillStyle = '#1A1A24';
    ctx.fillRect(0, 0, width, height);
    
    // Starfield
    ctx.fillStyle = 'white';
    for(let i=0; i<10; i++) {
        const sx = Math.random() * width;
        const sy = (state.frame * 2 + Math.random() * height) % height;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // Player
    ctx.fillStyle = '#FFE600';
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y - 20);
    ctx.lineTo(state.player.x - 15, state.player.y + 15);
    ctx.lineTo(state.player.x, state.player.y + 5);
    ctx.lineTo(state.player.x + 15, state.player.y + 15);
    ctx.fill();

    // Spawning
    if (state.frame % 40 === 0) {
        state.enemies.push({
            x: Math.random() * (width - 40) + 20,
            y: -40,
            type: Math.random() > 0.7 ? 'MEETING' : 'EMAIL'
        });
    }

    // Update Bullets
    for(let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.y -= 10;
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
        if(b.y < 0) state.bullets.splice(i, 1);
    }

    // Update Enemies
    for(let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        e.y += 3 + (state.score / 5000); // Speed up
        
        // Draw
        ctx.font = '24px Arial';
        const icon = e.type === 'EMAIL' ? '✉️' : '📅';
        ctx.fillText(icon, e.x - 12, e.y);
        
        // Collision Player
        if (Math.hypot(state.player.x - e.x, state.player.y - e.y) < 30) {
            setGameOver(true);
            return;
        }

        // Collision Bullet
        for(let j = state.bullets.length - 1; j >= 0; j--) {
            const b = state.bullets[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < 25) {
                state.enemies.splice(i, 1);
                state.bullets.splice(j, 1);
                state.score += 100;
                createExplosion(e.x, e.y, e.type === 'EMAIL' ? '#FFF' : '#F00');
                break;
            }
        }

        if (e.y > height) {
             setGameOver(true); // Failed to clear inbox
             return;
        }
    }
    
    // Particles
    for(let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
        
        if(p.life <= 0) state.particles.splice(i, 1);
    }

    setScore(state.score);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      const handleMove = (e: MouseEvent) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if(rect) {
              stateRef.current.player.x = e.clientX - rect.left;
          }
      };
      const handleClick = () => {
          if(gameStarted && !gameOver) {
             stateRef.current.bullets.push({ x: stateRef.current.player.x, y: stateRef.current.player.y - 20 });
          }
      };
      const handleKey = (e: KeyboardEvent) => {
          if(['ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      };
      
      const handleTouch = (e: TouchEvent) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if(rect && e.touches[0]) {
               stateRef.current.player.x = e.touches[0].clientX - rect.left;
               if (stateRef.current.frame % 10 === 0) {
                   stateRef.current.bullets.push({ x: stateRef.current.player.x, y: stateRef.current.player.y - 20 });
               }
          }
      }

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mousedown', handleClick);
      window.addEventListener('keydown', handleKey);
      
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mousedown', handleClick);
          window.removeEventListener('keydown', handleKey);
           if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [gameStarted, gameOver]);

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
            <h2 className="text-xl font-bold text-ey-yellow">INBOX DEFENDER</h2>
            <button onClick={onClose}>✕</button>
        </div>
        <div className="relative bg-black">
            <canvas 
                ref={canvasRef} 
                width={400} 
                height={600} 
                className="w-full h-auto block cursor-crosshair"
                onClick={() => {
                     if(gameStarted && !gameOver) {
                         stateRef.current.bullets.push({ x: stateRef.current.player.x, y: stateRef.current.player.y - 20 });
                     }
                }}
                onPointerMove={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if(rect) stateRef.current.player.x = e.clientX - rect.left;
                }}
            />
            
            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                     <button onClick={startGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl">LAUNCH</button>
                </div>
            )}

            {gameOver && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white">
                     <h3 className="text-3xl font-bold text-red-500">INBOX FULL</h3>
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
