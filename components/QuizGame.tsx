import React, { useState } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
}

const QUESTIONS_GENERAL = [
  { q: "Hva står EY for?", options: ["Ernst & Young", "Energy & Youth", "Excellent Year", "Everything Yellow"], correct: 0 },
  { q: "Hvilket år fusjonerte Ernst & Whinney med Arthur Young?", options: ["1989", "1999", "1975", "2002"], correct: 0 },
  { q: "Hva er EY sitt globale formål (Purpose)?", options: ["Just do it", "Building a better working world", "Your world, our business", "Quality first"], correct: 1 },
  { q: "Hva heter EYs globale strategi?", options: ["NextWave", "FutureFirst", "Vision 2030", "All in"], correct: 0 },
  { q: "Hvilken av disse er IKKE en av EYs fire servicelinjer?", options: ["Assurance", "Consulting", "Strategy and Transactions", "Engineering"], correct: 3 }
];

const QUESTIONS_TECH = [
  { q: "Hva står 'API' for?", options: ["All People Inside", "Application Programming Interface", "Apple Pie Ingredients", "Automated Process Integration"], correct: 1 },
  { q: "Hva beskriver best en 'Microservice' arkitektur?", options: ["En stor monolittisk kodebase", "Små, uavhengige tjenester som kommuniserer", "Kun frontend-kode", "En database uten tabeller"], correct: 1 },
  { q: "Hva er hovedformålet med 'Docker'?", options: ["Designe nettsider", "Kjøre applikasjoner i containere", "Skrive dokumentasjon", "Hacke servere"], correct: 1 },
  { q: "Hvilket prinsipp bryter man ofte med 'Spaghetti Code'?", options: ["DRY (Don't Repeat Yourself)", "KISS (Keep It Simple Stupid)", "SOLID", "Alle overnevnte"], correct: 3 },
  { q: "Hva er 'Latency' i nettverkssammenheng?", options: ["Båndbredde", "Forsinkelse", "Pakketap", "Kryptering"], correct: 1 }
];

export const QuizGame: React.FC<Props> = ({ onClose, gameId }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Select question set
  const QUESTIONS = gameId.includes('tech') ? QUESTIONS_TECH : QUESTIONS_GENERAL;

  const handleAnswer = (index: number) => {
    if (index === QUESTIONS[currentQ].correct) {
      setScore(prev => prev + 1000);
    }

    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      const timeTaken = (Date.now() - startTime) / 1000;
      // Bonus for speed, but only if you answered somewhat correctly
      const bonus = Math.max(0, Math.floor((40 - timeTaken) * 50));
      setScore(prev => prev + bonus);
      setFinished(true);
    }
  };

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
        <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border-4 border-ey-yellow overflow-hidden">
            <div className="p-4 bg-ey-black text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-ey-yellow uppercase font-christmas">Julequiz</h2>
                    <p className="text-xs text-gray-300">{gameId.includes('tech') ? 'Tech Edition' : 'Consultant Edition'}</p>
                </div>
                <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
            </div>

            <div className="p-6">
                {!finished ? (
                    <>
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase font-bold">
                                <span>Q {currentQ + 1} / {QUESTIONS.length}</span>
                                <span>Poeng: {score}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full">
                                <div 
                                    className="bg-ey-yellow h-2 rounded-full transition-all duration-300"
                                    style={{width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`}}
                                ></div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-ey-black mb-6 min-h-[4rem] flex items-center">
                            {QUESTIONS[currentQ].q}
                        </h3>

                        <div className="grid gap-3">
                            {QUESTIONS[currentQ].options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className="p-4 text-left border-2 border-gray-100 rounded-lg hover:bg-ey-yellow hover:border-black hover:font-bold transition-all hover:shadow-md text-sm sm:text-base"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <h3 className="text-3xl font-bold mb-2 font-christmas text-xmas-red">Quiz Ferdig!</h3>
                        <p className="text-6xl font-black text-ey-yellow mb-6 drop-shadow-sm">{score}</p>
                        
                        {!submitted ? (
                             <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3">
                                <input 
                                    type="text" 
                                    maxLength={15}
                                    placeholder="Ditt Navn" 
                                    className="p-3 rounded border text-center bg-gray-50 font-bold uppercase"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    disabled={!playerName.trim()}
                                    className="bg-ey-black text-white font-bold py-3 rounded hover:bg-gray-800 uppercase tracking-wider shadow-lg"
                                >
                                    Lagre Resultat
                                </button>
                            </form>
                        ) : (
                            <div className="text-green-600 font-bold text-xl flex items-center justify-center gap-2">
                                <span>✓</span> Lagret
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};