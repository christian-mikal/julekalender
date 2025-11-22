
import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

interface Note {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number;
  hit: boolean;
}

export const RhythmGame: React.FC<Props> = ({ onClose, gameId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [combo, setCombo] = useState(0);

  const stateRef = useRef({
    notes: [] as Note[],
    spawnTimer: 0,
    speed: 5,
    score: 0,
    hp: 100,
    lastFrame: 0,
    beat: 0
  });

  const requestRef = useRef<number>(null);

  const LANES = 4;
  const KEYS = ['A', 'S', 'D', 'F'];
  const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

  const startGame = () => {
    stateRef.current = {
      notes: [],
      spawnTimer: 0,
      speed: 4,
      score: 0,
      hp: 100,
      lastFrame: Date.now(),
      beat: 0
    };
    setScore(0);
    setCombo(0);
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
    const now = Date.now();
    state.lastFrame = now;

    // Spawning (on beat roughly)
    state.spawnTimer++;
    if (state.spawnTimer > (60 / state.speed) * 1.5) {
        const lane = Math.floor(Math.random() * LANES);
        state.notes.push({ id: Math.random(), lane, y: -50, hit: false });
        state.spawnTimer = 0;
        
        if(Math.random() > 0.7) {
             const lane2 = (lane + 1) % LANES;
             state.notes.push({ id: Math.random(), lane: lane2, y: -50, hit: false });
        }
    }

    state.speed += 0.001;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // Draw Lanes
    const laneWidth = width / LANES;
    ctx.lineWidth = 2;
    for(let i=0; i<LANES; i++) {
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(i*laneWidth, height - 100, laneWidth, 20);
        
        ctx.fillStyle = '#555';
        ctx.font = '20px Arial';
        ctx.fillText(KEYS[i], i*laneWidth + laneWidth/2 - 10, height - 40);
    }

    // Update and Draw Notes
    for (let i = state.notes.length - 1; i >= 0; i--) {
        const note = state.notes[i];
        note.y += state.speed;

        if (!note.hit) {
            ctx.fillStyle = COLORS[note.lane];
            
            // Neon effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS[note.lane];
            
            ctx.beginPath();
            ctx.arc(note.lane * laneWidth + laneWidth/2, note.y, 20, 0, Math.PI*2);
            ctx.fill();
            
            ctx.shadowBlur = 0;

            // Missed
            if (note.y > height) {
                state.hp -= 10;
                setCombo(0);
                state.notes.splice(i, 1);
            }
        } else {
            state.notes.splice(i, 1);
        }
    }

    // Hit Line
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, height - 80);
    ctx.lineTo(width, height - 80);
    ctx.stroke();

    // HP Bar
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, width, 10);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, width * (state.hp / 100), 10);

    if (state.hp <= 0) {
        setGameOver(true);
        return;
    }
    
    setScore(state.score);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if(KEYS.includes(e.key.toUpperCase())) e.preventDefault();
          if (!gameStarted || gameOver) return;
          const lane = KEYS.indexOf(e.key.toUpperCase());
          if (lane === -1) return;

          const canvas = canvasRef.current;
          if (!canvas) return;
          const height = canvas.height;
          
          const hitZoneY = height - 80;
          
          const hitNoteIndex = stateRef.current.notes.findIndex(n => 
              n.lane === lane && 
              !n.hit && 
              Math.abs(n.y - hitZoneY) < 50
          );

          if (hitNoteIndex !== -1) {
              const note = stateRef.current.notes[hitNoteIndex];
              note.hit = true;
              stateRef.current.score += 100 + (combo * 10);
              setCombo(c => c + 1);
          } else {
              stateRef.current.hp -= 5;
              setCombo(0);
          }
      };

      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [gameStarted, gameOver, combo]);
  
  const handleTouch = (idx: number) => {
      if (!gameStarted || gameOver) return;
       const height = 600;
       const hitZoneY = height - 80;
       const hitNoteIndex = stateRef.current.notes.findIndex(n => 
              n.lane === idx && 
              !n.hit && 
              Math.abs(n.y - hitZoneY) < 60
       );
        if (hitNoteIndex !== -1) {
              const note = stateRef.current.notes[hitNoteIndex];
              note.hit = true;
              stateRef.current.score += 100 + (combo * 10);
              setCombo(c => c + 1);
        } else {
             stateRef.current.hp -= 5;
             setCombo(0);
        }
  };

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
            <h2 className="text-xl font-bold text-ey-yellow">FRIDAY AUDIT</h2>
            <button onClick={onClose}>✕</button>
        </div>
        <div className="relative bg-black">
            <canvas ref={canvasRef} width={400} height={600} className="w-full h-auto block" />
            
            {/* Mobile Controls Overlay */}
            <div className="absolute bottom-0 w-full h-32 grid grid-cols-4 opacity-20">
                 {[0,1,2,3].map(i => (
                     <div key={i} className="border border-white" onTouchStart={() => handleTouch(i)}></div>
                 ))}
            </div>

            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                     <div className="text-center text-white">
                        <h3 className="text-3xl font-bold mb-4 text-ey-yellow">DEADLINE APPROACHING</h3>
                        <p className="mb-6">Hit keys A S D F in rhythm!</p>
                        <button onClick={startGame} className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-xl transform hover:scale-110 transition-transform">
                            LET'S ROCK
                        </button>
                     </div>
                </div>
            )}
            
            {gameStarted && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
                     <div className="text-4xl font-black text-white italic drop-shadow-md">{combo > 1 ? `${combo}x` : ''}</div>
                     <div className="text-ey-yellow font-bold">Score: {score}</div>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white">
                     <h3 className="text-3xl font-bold text-red-500">AUDIT FAILED</h3>
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
