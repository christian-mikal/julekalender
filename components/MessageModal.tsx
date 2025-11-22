import React from 'react';

interface Props {
  onClose: () => void;
  type: 'LOCKED' | 'WEEKEND' | 'HOLIDAY_START' | 'XMAS_EVE';
  customMessage?: string;
}

export const MessageModal: React.FC<Props> = ({ onClose, type, customMessage }) => {
  
  const getContent = () => {
    switch (type) {
      case 'LOCKED':
        return {
          icon: '🔒',
          title: 'Vent litt!',
          text: 'Denne luken er låst. Du får smøre deg med tålmodighet – nissen følger med!',
          btnText: 'OK, jeg venter',
          color: 'bg-gray-800'
        };
      case 'WEEKEND':
        return {
          icon: '☕',
          title: 'Det er helg!',
          text: 'Ingen leveranser i dag. Lad batteriene, nyt en pepperkake og kom tilbake på mandag.',
          btnText: 'God Helg',
          color: 'bg-ey-yellow'
        };
      case 'HOLIDAY_START':
        return {
          icon: '🎄',
          title: 'God Juleferie!',
          text: 'Nå senker julefreden seg. Vi i BGO Consulting ønsker deg en fantastisk ferie.',
          btnText: 'Takk det samme!',
          color: 'bg-xmas-green'
        };
      case 'XMAS_EVE':
        return {
          icon: '🎅',
          title: 'GOD JUL!',
          text: 'Tusen takk for innsatsen i år! Håper du får en magisk feiring med nære og kjære.',
          btnText: 'Ho Ho Ho!',
          color: 'bg-xmas-red'
        };
      default:
        return {
          icon: '✨',
          title: 'Beskjed',
          text: customMessage || '',
          btnText: 'Lukk',
          color: 'bg-ey-black'
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-hidden transform scale-100 transition-transform border-4 border-white">
        <div className={`h-32 ${content.color} flex items-center justify-center relative overflow-hidden`}>
           {/* Decorative elements */}
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full opacity-20"></div>
           <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black rounded-full opacity-20"></div>
           <span className="text-6xl relative z-10 drop-shadow-md">{content.icon}</span>
        </div>
        
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-ey-black mb-2 font-christmas tracking-wide">{content.title}</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {content.text}
          </p>
          
          <div className="flex justify-center">
            <button 
                onClick={onClose}
                className={`text-black font-bold py-3 px-8 rounded shadow-lg hover:scale-105 transition-transform uppercase tracking-widest text-xs ${type === 'LOCKED' ? 'bg-gray-200' : 'bg-ey-yellow'}`}
            >
                {content.btnText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};