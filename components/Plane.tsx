import React from 'react';
import { motion } from 'motion/react';
import { Plane as PlaneIcon } from 'lucide-react';
import { Coordinate } from '../types';
import { coordinateToString } from '../constants';

interface PlaneProps {
  target: Coordinate;
  progress: number; // 0 to 100
  landingDest?: { x: number; y: number };
  isExploding?: boolean;
}

const Plane: React.FC<PlaneProps> = ({ target, progress, landingDest, isExploding }) => {
  const isLanding = !!landingDest;
  
  const left = isLanding ? `${landingDest.x}%` : '50%';
  const top = isLanding ? `${landingDest.y}%` : `${progress}%`;

  return (
    <div 
      className={`absolute z-30 pointer-events-none flex flex-col items-center justify-center will-change-transform ${isLanding ? 'transition-all duration-400 ease-in-out' : ''}`}
      style={{ 
        left,
        top,
        transform: `translate(-50%, -50%) ${isLanding ? 'scale(0.5)' : `scale(${1 + (progress / 400)})`}`,
        transition: isLanding ? 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
      }}
    >
      {/* Explosion & Fire Effect */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
           {/* Flash */}
           <div className="absolute w-16 h-16 bg-white rounded-full opacity-90 animate-[ping_0.2s_ease-out_1]" />
           <div className="absolute w-20 h-20 border-4 border-gold rounded-full opacity-0 animate-[ping_0.4s_cubic-bezier(0,0,0.2,1)_1]" />
           
           {/* Fire Particles */}
           {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
               animate={{ 
                 scale: [1, 1.5, 0],
                 opacity: [1, 0.8, 0],
                 x: (Math.random() - 0.5) * 60,
                 y: (Math.random() - 0.5) * 60 - 20,
               }}
               transition={{ duration: 0.5 + Math.random() * 0.3, ease: "easeOut" }}
               className={`absolute w-4 h-4 rounded-full ${
                 i % 3 === 0 ? 'bg-orange-500' : i % 3 === 1 ? 'bg-red-500' : 'bg-yellow-400'
               } blur-sm`}
             />
           ))}

           {/* Core Glow */}
           <div className="w-24 h-24 bg-orange-500/40 rounded-full animate-[pulse_0.4s_ease-out_1] blur-md" />
        </div>
      )}

      {/* Plane Content */}
      <div 
        className={`relative flex flex-col items-center transition-all duration-400 ease-out ${
          isExploding ? 'opacity-0 scale-150 blur-md' : 'opacity-100 scale-100'
        }`}
      >
        <div 
          className="relative z-10"
          style={{ filter: 'drop-shadow(0px 10px 14px rgba(85,30,25,0.2))' }}
        >
           <PlaneIcon 
             className="w-16 h-16"
             style={{ 
               transform: 'rotate(135deg)', 
               transformOrigin: 'center',
               fill: '#fffdfa',
               stroke: '#e6b17e',
               strokeWidth: '1px'
             }}
           />
        </div>

        {!isLanding && (
          <div className="mt-4 z-20">
            <div className="bg-brown text-gold font-bold px-5 py-2 rounded-xl text-xl shadow-2xl border-2 border-gold/20 tracking-[0.2em]">
              {coordinateToString(target).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      {/* Speed Lines */}
      {!isLanding && !isExploding && (
        <div className="w-1 h-20 bg-gradient-to-t from-gold to-transparent -mt-12 opacity-30 rounded-full"></div>
      )}
    </div>
  );
};

export default React.memo(Plane);