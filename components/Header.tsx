
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b-4 border-ey-yellow sticky top-0 z-50 shadow-sm relative">
      
      {/* Christmas Lights Rope - The "WOW" swing effect */}
      <div className="light-rope overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
            const colors = ['#FFE600', '#D42E12', '#0F5132', '#1A1A24'];
            const color = colors[i % colors.length];
            return (
                <div 
                    key={i} 
                    className="light-bulb" 
                    style={{ backgroundColor: color, color: color }}
                ></div>
            );
        })}
      </div>

      {/* Decorative Garland line (CSS simulated) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] bg-xmas-red border-b border-xmas-green opacity-90"></div>

      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative z-10 mt-2">
        <div className="flex items-center gap-4">
          {/* EY Logo Container with Santa Hat */}
          <div className="w-16 h-16 relative flex items-center justify-center group">
             <div className="absolute -top-4 -right-3 text-4xl transform rotate-12 z-20 filter drop-shadow-md group-hover:rotate-0 transition-transform cursor-pointer hover:scale-110">🎅</div>
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/3/34/EY_logo_2019.svg" 
               alt="EY Logo" 
               className="w-full h-full object-contain"
             />
          </div>
          <div className="hidden sm:block h-10 w-[1px] bg-gray-300 mx-2"></div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-ey-black tracking-tight uppercase font-sans">
              Julekalender
            </h1>
            <span className="text-xs sm:text-sm font-medium text-ey-gray tracking-wide uppercase">
              BGO Consulting
            </span>
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-xmas-red font-christmas text-2xl animate-pulse">MerrEY Christmas</p>
          <p className="text-xs text-gray-500 italic mt-1">Building a better working world</p>
        </div>
      </div>
    </header>
  );
};
