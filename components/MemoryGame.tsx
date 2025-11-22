import React, { useState, useEffect } from 'react';
import { submitScore } from '../services/mockBackend';

interface Props {
  onClose: () => void;
  gameId: string;
  gridSize?: number; // 4x4 = 16 cards (8 pairs)
}

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Festive Christmas Icons instead of corporate ones
const ICONS_STANDARD = ['🎅', '🎄', '🎁', '⛄', '🦌', '🔔', '🍪', '🕯️'];
// Hard mode icons (More abstract winter/christmas items)
const ICONS_HARD = ['❄️', '🌨️', '🧣', '🧤', '🛷', '⛸️', '🏔️', '🪵', '🔥', '🏠'];

export const MemoryGame: React.FC<Props> = ({ onClose, gameId, gridSize = 4 }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]); 
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Determine icons based on gameId or randomness
  const isHard = gameId.includes('hard');
  const sourceIcons = isHard ? ICONS_HARD : ICONS_STANDARD;

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeGame = () => {
    const shuffledIcons = [...sourceIcons, ...sourceIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledIcons);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setSubmitted(false);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
  };

  const handleCardClick = (index: number) => {
    if (!gameStarted || gameOver || cards[index].isFlipped || flippedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlipped;

      if (cards[firstIndex].icon === cards[secondIndex].icon) {
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatches(prev => prev + 1);

          if (matches + 1 === sourceIcons.length) {
            finishGame();
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const finishGame = () => {
    const endTime = Date.now();
    const timeSpent = (endTime - startTime) / 1000; 
    const base = isHard ? 15000 : 10000;
    const calculatedScore = Math.max(1000, Math.floor(base - (timeSpent * 50) - (moves * 100)));
    
    setFinalScore(calculatedScore);
    setGameOver(true);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
        submitScore(gameId, playerName, finalScore);
        setSubmitted(true);
        setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg overflow-hidden max-w-lg w-full shadow-2xl border-4 border-ey-yellow relative flex flex-col max-h-[90vh]">
        
        <div className="p-4 bg-ey-black text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-ey-yellow uppercase font-christmas">{isHard ? 'Winter Memory' : 'Christmas Memory'}</h2>
            <p className="text-xs text-gray-300">{isHard ? 'Vanskeligere symboler!' : 'Finn parene!'}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-ey-yellow">✕</button>
        </div>

        <div className="p-6 bg-gray-100 flex-grow overflow-y-auto relative">
           {/* Decoration */}
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none text-6xl overflow-hidden">
               ❄️ 🎄 ❄️ 🎄
           </div>
          
          {!gameStarted && !gameOver && (
            <div className="text-center py-12 relative z-10">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-ey-black mb-4">Klar for hjernetrim?</h3>
              <p className="text-gray-600 mb-8">Finn alle parene så raskt som mulig.</p>
              <button 
                onClick={startGame}
                className="bg-ey-yellow text-black font-bold py-3 px-8 rounded shadow-lg hover:scale-105 transition-transform uppercase tracking-widest border-b-4 border-yellow-600"
              >
                Åpne Gavene
              </button>
            </div>
          )}

          {(gameStarted || gameOver) && (
            <>
              <div className="flex justify-between mb-4 text-sm font-bold text-ey-gray relative z-10">
                <span>TREKK: {moves}</span>
                <span>PAR: {matches} / {sourceIcons.length}</span>
              </div>

              <div className={`grid ${isHard ? 'grid-cols-5' : 'grid-cols-4'} gap-2 relative z-10`}>
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    disabled={card.isFlipped || card.isMatched || gameOver}
                    className={`
                      aspect-square rounded-lg text-2xl sm:text-3xl flex items-center justify-center transition-all duration-500 transform
                      ${card.isFlipped || card.isMatched 
                        ? 'bg-white border-2 border-ey-yellow rotate-y-180 shadow-md' 
                        : 'bg-xmas-red border-2 border-red-800 hover:bg-red-700 shadow-inner'
                      }
                      ${card.isMatched ? 'opacity-50 scale-95' : 'opacity-100'}
                    `}
                  >
                    {(card.isFlipped || card.isMatched) ? card.icon : <span className="text-white text-xs sm:text-lg font-bold">?</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
             {!submitted ? (
                <>
                    <h3 className="text-3xl font-bold text-white mb-2 font-christmas">Godt Jobbet!</h3>
                    <p className="text-ey-yellow text-6xl font-black mb-8">{finalScore}</p>
                    <form onSubmit={handleScoreSubmit} className="w-full max-w-xs flex flex-col gap-4">
                        <input 
                            type="text" 
                            maxLength={15}
                            placeholder="Ditt Navn" 
                            className="p-3 rounded bg-white text-black font-bold text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={!playerName.trim()}
                            className="bg-ey-yellow text-black font-bold py-3 px-6 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 uppercase"
                        >
                            Lagre Resultat
                        </button>
                    </form>
                </>
             ) : (
                <div className="text-center animate-pulse">
                    <div className="text-6xl text-green-500 mb-4">✓</div>
                    <h3 className="text-2xl text-white font-bold">Score Lagret</h3>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};