
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ConsultantRunGame } from './components/ConsultantRunGame';
import { MemoryGame } from './components/MemoryGame';
import { WhackABugGame } from './components/WhackABugGame';
import { QuizGame } from './components/QuizGame';
import { StackerGame } from './components/StackerGame';
import { CatchGame } from './components/CatchGame';
import { OfficeMiniGames } from './components/OfficeMiniGames';
import { Leaderboard } from './components/Leaderboard';
import { MessageModal } from './components/MessageModal'; 
import { openDoor, getOpenedDoors } from './services/mockBackend';

// NEW EXTRAORDINARY GAMES
import { SkiGame } from './components/SkiGame';
import { PlatformerGame } from './components/PlatformerGame';
import { RhythmGame } from './components/RhythmGame';
import { SpaceShooterGame } from './components/SpaceShooterGame';
import { NeonSnakeGame } from './components/NeonSnakeGame';

const TOTAL_DAYS = 24;

// --- MOUSE TRAIL COMPONENT ---
const MouseTrail: React.FC = () => {
    const [trail, setTrail] = useState<{x: number, y: number, id: number}[]>([]);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if(Math.random() > 0.7) return; // Don't render every frame
            const newPoint = { x: e.clientX, y: e.clientY, id: Date.now() };
            setTrail(prev => [...prev.slice(-15), newPoint]); // Keep last 15 points
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <>
            {trail.map((point) => (
                <div 
                    key={point.id}
                    className="sparkle"
                    style={{ 
                        left: point.x, 
                        top: point.y,
                        width: Math.random() * 8 + 2 + 'px',
                        height: Math.random() * 8 + 2 + 'px',
                    }} 
                />
            ))}
        </>
    );
};

// --- CONFETTI COMPONENT ---
const Confetti: React.FC = () => {
    // Generate 50 random particles
    const particles = Array.from({length: 50}).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + 'vw',
        animationDelay: Math.random() * 0.5 + 's',
        backgroundColor: ['#FFE600', '#D42E12', '#0F5132', '#ffffff'][Math.floor(Math.random() * 4)]
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {particles.map(p => (
                <div 
                    key={p.id} 
                    className="confetti" 
                    style={{
                        left: p.left,
                        top: '-20px',
                        animationDelay: p.animationDelay,
                        backgroundColor: p.backgroundColor
                    }}
                />
            ))}
        </div>
    );
};

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<any>(null); 
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [messageModal, setMessageModal] = useState<{show: boolean, type: 'LOCKED' | 'WEEKEND' | 'HOLIDAY_START' | 'XMAS_EVE'}>({ show: false, type: 'LOCKED' });
  const [openedDays, setOpenedDays] = useState<number[]>([]);
  const [animateSanta, setAnimateSanta] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // =====================================================================
  // UTVIKLER MODUS / DEV MODE
  // =====================================================================
  
  // ALTERNATIV 1: PRODUKSJON (Bruk denne når spillet skal være live)
  // const todayDate = new Date();

  // ALTERNATIV 2: TEST (Bruk denne for å låse opp luker for testing)
  // Endre datoen i parentesen for å simulere en dag. F.eks (2025, 11, 24) er 24. Des.
  const todayDate = new Date(2025, 11, 24); 

  // =====================================================================

  // Helper to get current day number in Dec (or 0 if not Dec)
  const currentDayNum = todayDate.getMonth() === 11 ? todayDate.getDate() : 0; 

  useEffect(() => {
    setOpenedDays(getOpenedDoors());
    
    // Initial random Santa trigger on load
    if(Math.random() > 0.5) {
        setTimeout(() => setAnimateSanta(true), 2000);
    }
  }, []);

  const handleDoorClick = (day: number) => {
    // 1. CHECK IF LOCKED
    if (day > currentDayNum) {
      setMessageModal({ show: true, type: 'LOCKED' });
      return;
    }

    // Trigger Santa Animation randomly (20% chance)
    if (Math.random() > 0.8) {
        setAnimateSanta(false);
        setTimeout(() => setAnimateSanta(true), 50);
    }

    // Trigger Confetti if opening for first time today
    if (!openedDays.includes(day)) {
        setTriggerConfetti(true);
        setTimeout(() => setTriggerConfetti(false), 3000);
    }

    openDoor(day);
    setOpenedDays(prev => [...new Set([...prev, day])]);

    // 2. CHECK FOR WEEKEND (Dec 2025: 6,7, 13,14, 20,21)
    const dateObj = new Date(2025, 11, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat

    if ((dayOfWeek === 0 || dayOfWeek === 6) && day < 22) {
      setMessageModal({ show: true, type: 'WEEKEND' });
      return;
    }
    
    // 3. GAME / CONTENT LOGIC
    switch (day) {
      // WEEK 1 (Dec 1-5)
      case 1: setActiveGame({ component: 'RUNNER', id: 'day1_runner', props: { difficultyMultiplier: 1.0 } }); break;
      case 2: setActiveGame({ component: 'MEMORY', id: 'day2_memory', props: { gridSize: 4 } }); break;
      case 3: setActiveGame({ component: 'WHACK', id: 'day3_whack', props: {} }); break;
      case 4: setActiveGame({ component: 'QUIZ', id: 'day4_quiz', props: {} }); break;
      case 5: setActiveGame({ component: 'SKI', id: 'day5_ski', props: {} }); break; // FRIDAY EXTRAORDINARY
      
      // WEEK 2 (Dec 8-12)
      case 8: setActiveGame({ component: 'STACKER', id: 'day8_stacker', props: { initialSpeed: 3 } }); break;
      case 9: setActiveGame({ component: 'MINI', id: 'day9_typing', props: { type: 'TYPING' } }); break;
      case 10: setActiveGame({ component: 'PLATFORMER', id: 'day10_platformer', props: {} }); break; // EXTRAORDINARY
      case 11: setActiveGame({ component: 'CATCH', id: 'day11_catch', props: {} }); break;
      case 12: setActiveGame({ component: 'RHYTHM', id: 'day12_rhythm', props: {} }); break; // FRIDAY EXTRAORDINARY

      // WEEK 3 (Dec 15-19)
      case 15: setActiveGame({ component: 'SHOOTER', id: 'day15_shooter', props: {} }); break; // EXTRAORDINARY
      case 16: setActiveGame({ component: 'RUNNER', id: 'day16_runner_hard', props: { difficultyMultiplier: 1.5 } }); break;
      case 17: setActiveGame({ component: 'MEMORY', id: 'day17_memory_hard', props: { gridSize: 4 } }); break; 
      case 18: setActiveGame({ component: 'QUIZ', id: 'day18_quiz_tech', props: {} }); break;
      case 19: setActiveGame({ component: 'NEONSNAKE', id: 'day19_snake_neon', props: {} }); break; // FRIDAY EXTRAORDINARY

      // HOLIDAY WEEK (Dec 22-24)
      case 22: 
      case 23:
        setMessageModal({ show: true, type: 'HOLIDAY_START' });
        break;
      case 24:
        setMessageModal({ show: true, type: 'XMAS_EVE' });
        break;

      default:
        break;
    }
  };

  const renderGame = () => {
    if (!activeGame) return null;
    const commonProps = { onClose: () => setActiveGame(null), gameId: activeGame.id };
    
    switch(activeGame.component) {
        case 'RUNNER': return <ConsultantRunGame {...commonProps} {...activeGame.props} />;
        case 'MEMORY': return <MemoryGame {...commonProps} {...activeGame.props} />;
        case 'WHACK': return <WhackABugGame {...commonProps} {...activeGame.props} />;
        case 'QUIZ': return <QuizGame {...commonProps} {...activeGame.props} />;
        case 'STACKER': return <StackerGame {...commonProps} {...activeGame.props} />;
        case 'CATCH': return <CatchGame {...commonProps} {...activeGame.props} />;
        case 'MINI': return <OfficeMiniGames {...commonProps} {...activeGame.props} />;
        
        // THE EXTRAORDINARY GAMES
        case 'SKI': return <SkiGame {...commonProps} {...activeGame.props} />;
        case 'PLATFORMER': return <PlatformerGame {...commonProps} {...activeGame.props} />;
        case 'RHYTHM': return <RhythmGame {...commonProps} {...activeGame.props} />;
        case 'SHOOTER': return <SpaceShooterGame {...commonProps} {...activeGame.props} />;
        case 'NEONSNAKE': return <NeonSnakeGame {...commonProps} {...activeGame.props} />;
        
        default: return null;
    }
  };

  const daysArray = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
  const weekDays = ['Man', 'Tirs', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  // Helper to create EY themed variety for doors
  const getDoorStyle = (day: number, isOpened: boolean, isLocked: boolean) => {
    if (isOpened) {
        return {
            bg: 'bg-ey-yellow',
            border: 'border-ey-yellow',
            text: 'text-black',
            ribbon: null
        };
    }

    if (isLocked) {
        // Varied EY styles for locked doors
        const styles = [
            { bg: 'bg-ey-black', text: 'text-white', ribbon: 'bg-ey-yellow' },  // Pattern 0
            { bg: 'bg-white', text: 'text-black', ribbon: 'bg-xmas-red' },      // Pattern 1
            { bg: 'bg-[#2E2E38]', text: 'text-white', ribbon: 'bg-white' },     // Pattern 2 (Dark Gray)
            { bg: 'bg-ey-yellow', text: 'text-black', ribbon: 'bg-black' },     // Pattern 3
        ];
        const style = styles[(day - 1) % 4];
        return {
            bg: style.bg,
            border: 'border-gray-200',
            text: style.text,
            ribbon: style.ribbon
        };
    }

    // The "Current Active Day" style - Golden and shiny
    if (!isLocked && !isOpened && day === currentDayNum) {
        return { 
            bg: 'bg-gradient-to-br from-white to-yellow-100 ring-4 ring-ey-yellow ring-opacity-50 animate-pulse-gold', 
            border: 'border-ey-yellow', 
            text: 'text-ey-black', 
            ribbon: 'bg-xmas-red' 
        };
    }

    // Fallback unlocked
    return { bg: 'bg-white', border: 'border-gray-200', text: 'text-black', ribbon: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6FA] font-sans relative overflow-x-hidden">
      <MouseTrail />
      {triggerConfetti && <Confetti />}
      
      <Header />
      
      {/* Flying Santa Animation Layer - Positioned higher and flies further */}
      {animateSanta && (
          <div className="fixed top-20 -left-64 w-64 z-50 pointer-events-none animate-fly-santa">
              <img src="https://cdn-icons-png.flaticon.com/512/744/744546.png" alt="Santa" className="w-full opacity-90 drop-shadow-2xl" />
              <div className="text-lg font-christmas text-ey-yellow bg-black/80 px-3 py-1 rounded-full absolute -top-8 right-0 shadow-lg whitespace-nowrap">
                Ho Ho Ho! Merry EY-mas!
              </div>
          </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 max-w-5xl relative z-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-ey-black font-christmas tracking-wider text-shadow-sm flex items-center gap-2">
                <span className="text-xmas-red text-5xl">Desember</span> <span className="text-gray-400">2025</span>
            </h2>
            <p className="text-ey-gray mt-1 font-medium">BGO Consulting Advent Calendar</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2 bg-white border-2 border-ey-yellow px-6 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all group relative overflow-hidden"
            >
                {/* Shine effect on button */}
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:animate-slide-in-right"></div>
                
                <span className="text-3xl group-hover:animate-bounce">🏆</span>
                <div className="flex flex-col text-left relative z-10">
                    <span className="font-bold text-sm text-ey-black uppercase tracking-wider">Leaderboard</span>
                </div>
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 perspective-1000">
          {daysArray.map((day) => {
            const isOpened = openedDays.includes(day);
            const isLocked = day > currentDayNum;
            const style = getDoorStyle(day, isOpened, isLocked);
            
            return (
              <button
                key={day}
                onClick={() => handleDoorClick(day)}
                className={`
                  aspect-square relative group transition-all duration-500 transform-gpu
                  ${isLocked ? 'hover:scale-95 opacity-90' : 'hover:-translate-y-2 hover:z-20 hover:rotate-1'}
                  cursor-pointer rounded-xl
                `}
              >
                {/* Door Container */}
                <div className={`
                  w-full h-full rounded-lg sm:rounded-xl shadow-sm border-2 flex flex-col items-center justify-center overflow-hidden relative
                  ${style.bg} ${style.border}
                  ${!isOpened && !isLocked ? 'hover:border-ey-yellow hover:shadow-xl' : ''}
                `}>
                   
                   {/* Wrapping Paper Texture (Subtle) */}
                   {!isOpened && (
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]"></div>
                   )}

                   {/* Ribbon decoration */}
                   {!isOpened && style.ribbon && (
                       <>
                         <div className={`absolute top-0 left-1/2 w-3 sm:w-4 h-full transform -translate-x-1/2 ${style.ribbon} opacity-90 shadow-sm`}></div>
                         <div className={`absolute top-1/2 left-0 h-3 sm:h-4 w-full transform -translate-y-1/2 ${style.ribbon} opacity-90 shadow-sm`}></div>
                         {/* Center Knot */}
                         <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md z-10 flex items-center justify-center text-[10px]">
                            <span className="animate-spin-slow">✨</span>
                         </div>
                       </>
                   )}

                  {/* Day Number */}
                  <span className={`
                    text-xl sm:text-3xl font-bold font-christmas z-20 relative
                    ${style.text} drop-shadow-md transition-transform duration-300 group-hover:scale-110
                  `}>
                    {day}
                  </span>
                  
                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
                        <span className="text-3xl drop-shadow-xl grayscale opacity-80">🔒</span>
                    </div>
                  )}

                  {/* Interaction Overlay (Only for unlocked, unopened) */}
                  {!isOpened && !isLocked && (
                    <div className="absolute inset-0 bg-ey-yellow/90 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity z-40">
                       <div className="text-center transform scale-0 group-hover:scale-100 transition-transform duration-200">
                          <span className="text-3xl block animate-bounce">🎁</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Åpne</span>
                       </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto relative z-10">
        <div className="container mx-auto px-4 text-center">
            <p className="text-xs text-gray-400 font-medium">© 2025 EY BGO Consulting • Version 2.0 (Magical Edition)</p>
        </div>
      </footer>

      {renderGame()}
      
      {messageModal.show && (
          <MessageModal 
            type={messageModal.type} 
            onClose={() => setMessageModal({ ...messageModal, show: false })} 
          />
      )}
      
      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} initialGameId={activeGame?.id} />
    </div>
  );
};

export default App;
