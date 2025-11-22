import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
  type: 'TYPING' | 'MATH' | 'CLICKER' | 'REACTION' | 'SCRAMBLE' | 'SLOTS';
}

export const OfficeMiniGames: React.FC<Props> = ({ onClose, gameId, type }) => {
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Game specific states
  const [question, setQuestion] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState('');
  
  // Reaction specific
  const [reactionState, setReactionState] = useState<'WAIT' | 'READY' | 'CLICK'>('WAIT');
  
  const timerRef = useRef<number>(null);

  // --- TYPING GAME ---
  const PHRASES = ["Synergy", "Value Proposition", "Deliverable", "Scope Creep", "Low hanging fruit", "Circle back", "Touch base", "Paradigm shift", "Deep dive", "Moving forward"];
  
  const startTyping = () => {
    setScore(0);
    setStatus('PLAYING');
    setTimeLeft(45);
    nextPhrase();
    startTimer();
  };

  const nextPhrase = () => {
    const p = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setQuestion(p);
    setInput('');
  };

  const checkTyping = (val: string) => {
    setInput(val);
    if (val === question) {
        setScore(s => s + question.length * 10);
        setFeedback('Nice!');
        setTimeout(() => setFeedback(''), 500);
        nextPhrase();
    }
  };

  // --- MATH GAME ---
  const startMath = () => {
    setScore(0);
    setStatus('PLAYING');
    setTimeLeft(60);
    nextMath();
    startTimer();
  };

  const nextMath = () => {
    const a = Math.floor(Math.random() * 50);
    const b = Math.floor(Math.random() * 50);
    setQuestion(`${a} + ${b}`);
    setInput('');
  };

  const checkMath = (val: string) => {
    setInput(val);
    const [a, b] = question.split(' + ').map(Number);
    if (parseInt(val) === a + b) {
        setScore(s => s + 100);
        nextMath();
    }
  };

  // --- CLICKER GAME ---
  const startClicker = () => {
    setScore(0);
    setStatus('PLAYING');
    setTimeLeft(10);
    startTimer();
  };

  const handleClick = () => {
    if (status === 'PLAYING') setScore(s => s + 10);
  };

  // --- REACTION GAME ---
  const startReaction = () => {
    setScore(0);
    setStatus('PLAYING');
    setReactionState('WAIT');
    setFeedback("Wait for green...");
    
    const delay = 2000 + Math.random() * 3000;
    setTimeout(() => {
        if (status !== 'GAME_OVER') {
            setReactionState('CLICK');
            setFeedback("CLICK NOW!");
            timerRef.current = Date.now(); // Use timerRef to store start time
        }
    }, delay);
  };

  const handleReactionClick = () => {
    if (reactionState === 'WAIT') {
        setStatus('GAME_OVER');
        setFeedback("Too early! Failed.");
        setScore(0);
    } else if (reactionState === 'CLICK') {
        const time = Date.now() - (timerRef.current as number);
        setScore(Math.max(0, 1000 - time)); // Faster is better
        setStatus('GAME_OVER');
        setFeedback(`${time}ms`);
    }
  };

  // --- SCRAMBLE ---
  const WORDS = ["AUDIT", "TAX", "ADVISORY", "STRATEGY", "PARTNER"];
  const startScramble = () => {
    setScore(0);
    setStatus('PLAYING');
    setTimeLeft(60);
    nextScramble();
    startTimer();
  };

  const nextScramble = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const scrambled = word.split('').sort(() => 0.5 - Math.random()).join('');
    setQuestion(word); // Store answer in question, display scrambled elsewhere
    setFeedback(scrambled); // Hack: Use feedback state to show scrambled word
    setInput('');
  };

  const checkScramble = (val: string) => {
    setInput(val);
    if (val.toUpperCase() === question) {
        setScore(s => s + 500);
        nextScramble();
    }
  };

  // --- SLOTS ---
  const SYMBOLS = ['🍒', '🍋', '🍇', '💎', 'EY'];
  const startSlots = () => {
    setScore(0);
    setStatus('PLAYING');
    
    const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    
    setFeedback(`${r1} ${r2} ${r3}`);
    
    if (r1 === r3 && r1 === r2) setScore(10000);
    else if (r1 === r2 || r2 === r3) setScore(1000);
    else setScore(100);
    
    setTimeout(() => setStatus('GAME_OVER'), 1000);
  };

  // --- COMMON UTILS ---
  const startTimer = () => {
    const i = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(i);
                setStatus('GAME_OVER');
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
        submitScore(gameId, playerName, score);
        setSubmitted(true);
        setTimeout(() => onClose(), 1500);
    }
  };

  const getTitle = () => {
      switch(type) {
          case 'TYPING': return "Proposal Sprint";
          case 'MATH': return "Excel Wizard";
          case 'CLICKER': return "Billable Frenzy";
          case 'REACTION': return "Urgent Email";
          case 'SCRAMBLE': return "Buzzword Bingo";
          case 'SLOTS': return "Holiday Bonus";
      }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full shadow-2xl border-4 border-ey-yellow relative">
         <div className="p-4 bg-ey-black text-white flex justify-between items-center">
            <h2 className="text-xl font-bold text-ey-yellow uppercase">{getTitle()}</h2>
            <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
         </div>

         <div className="p-8 text-center">
            {status === 'IDLE' && (
                <div className="py-4">
                    <p className="mb-6 text-gray-600">Ready to prove your skills?</p>
                    <button 
                        onClick={() => {
                            if(type === 'TYPING') startTyping();
                            if(type === 'MATH') startMath();
                            if(type === 'CLICKER') startClicker();
                            if(type === 'REACTION') startReaction();
                            if(type === 'SCRAMBLE') startScramble();
                            if(type === 'SLOTS') startSlots();
                        }}
                        className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow hover:scale-105 transition-transform"
                    >
                        START
                    </button>
                </div>
            )}

            {status === 'PLAYING' && (
                <div>
                    <div className="flex justify-between mb-4 font-bold text-gray-500">
                        <span>Time: {timeLeft}s</span>
                        <span>Score: {score}</span>
                    </div>

                    {type === 'TYPING' && (
                        <>
                            <div className="text-xl font-bold mb-4">{question}</div>
                            <input 
                                className="border-2 border-ey-yellow p-2 w-full text-center text-lg" 
                                autoFocus 
                                value={input} 
                                onChange={e => checkTyping(e.target.value)} 
                            />
                            <div className="text-green-500 h-6 mt-2">{feedback}</div>
                        </>
                    )}

                    {type === 'MATH' && (
                         <>
                            <div className="text-3xl font-bold mb-4">{question} = ?</div>
                            <input 
                                type="number"
                                className="border-2 border-ey-yellow p-2 w-24 text-center text-xl" 
                                autoFocus 
                                value={input} 
                                onChange={e => checkMath(e.target.value)} 
                            />
                        </>
                    )}

                    {type === 'CLICKER' && (
                        <button 
                            onClick={handleClick}
                            className="w-32 h-32 rounded-full bg-ey-yellow border-4 border-black active:scale-95 flex items-center justify-center text-2xl font-bold"
                        >
                            BILL!
                        </button>
                    )}

                    {type === 'REACTION' && (
                         <div 
                            onMouseDown={handleReactionClick}
                            className={`w-full h-40 flex items-center justify-center text-white text-2xl font-bold cursor-pointer ${reactionState === 'CLICK' ? 'bg-green-500' : 'bg-red-500'}`}
                         >
                             {feedback}
                         </div>
                    )}

                    {type === 'SCRAMBLE' && (
                        <>
                            <div className="text-gray-500 text-sm">Unscramble:</div>
                            <div className="text-3xl font-bold mb-4 tracking-widest">{feedback}</div>
                            <input 
                                className="border-2 border-ey-yellow p-2 w-full text-center text-lg uppercase" 
                                autoFocus 
                                value={input} 
                                onChange={e => checkScramble(e.target.value)} 
                            />
                        </>
                    )}

                    {type === 'SLOTS' && (
                        <div className="text-6xl py-8">{feedback}</div>
                    )}
                </div>
            )}

            {status === 'GAME_OVER' && (
                <div className="border-t pt-4">
                    <h3 className="text-2xl font-bold mb-2">Game Finished</h3>
                    <p className="text-4xl font-black text-ey-yellow mb-6">{score}</p>
                    
                    {!submitted ? (
                        <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3">
                            <input 
                                type="text" 
                                maxLength={15} 
                                placeholder="Your Name" 
                                className="p-2 border rounded text-center"
                                value={playerName} 
                                onChange={e => setPlayerName(e.target.value)} 
                                autoFocus
                            />
                            <button className="bg-ey-black text-white py-2 rounded font-bold">Submit</button>
                        </form>
                    ) : (
                        <div className="text-green-500 font-bold">Submitted!</div>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};