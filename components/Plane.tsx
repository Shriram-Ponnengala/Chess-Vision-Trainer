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
      className={`absolute z-30 pointer-events-none flex flex-col items-center justify-center will-change-transform ${isLanding ? 'transition-all duration-300 ease-out' : ''}`}
      style={{ 
        left,
        top,
        transform: `translate(-50%, -50%) ${isLanding ? 'scale(0.55)' : `scale(${1 + (progress / 400)})`}`,
        transition: isLanding ? 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
      }}
    >
      {/* Clean Explosion Feedback */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="w-14 h-14 bg-[#E94B35]/25 rounded-full animate-ping" />
          <div className="w-10 h-10 bg-[#E94B35]/40 rounded-full animate-pulse" />
        </div>
      )}

      {/* Target Aircraft & Coordinate Badge */}
      <div 
        className={`relative flex flex-col items-center transition-all duration-300 ease-out ${
          isExploding ? 'opacity-0 scale-125' : 'opacity-100 scale-100'
        }`}
      >
        {/* Plane Icon */}
        <div 
          className="relative z-10 drop-shadow-md"
        >
          <div className="w-12 h-12 rounded-full bg-white/90 border-2 border-[#2D4A6B] flex items-center justify-center shadow-md">
            <PlaneIcon 
              className="w-7 h-7 text-[#2D4A6B]"
              style={{ 
                transform: 'rotate(135deg)', 
                transformOrigin: 'center',
                fill: '#2D4A6B',
                stroke: '#C8854A',
                strokeWidth: '1.5px'
              }}
            />
          </div>
        </div>

        {/* Clean, High-Contrast Coordinate Badge */}
        {!isLanding && (
          <div className="mt-2.5 z-20">
            <div className="bg-[#2D4A6B] text-[#FFD447] font-black px-4 py-1.5 rounded-xl text-lg sm:text-xl shadow-lg border-2 border-[#C8854A] tracking-[0.16em] tabular-nums font-mono">
              {coordinateToString(target).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      {/* Subtle trail guide */}
      {!isLanding && !isExploding && (
        <div className="w-0.5 h-16 bg-gradient-to-t from-[#C8854A]/40 to-transparent -mt-8 rounded-full" />
      )}
    </div>
  );
};

export default React.memo(Plane);