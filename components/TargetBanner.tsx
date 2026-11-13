import React from 'react';
import { motion } from 'motion/react';
import { Coordinate } from '../types';
import { coordinateToString } from '../constants';
import { Compass, Check } from 'lucide-react';

interface TargetBannerProps {
  target: Coordinate | null;
  planeProgress?: number;
  isLanding?: boolean;
  isExploding?: boolean;
}

const TargetBanner: React.FC<TargetBannerProps> = ({
  target,
  planeProgress = 0,
  isLanding = false,
  isExploding = false,
}) => {
  if (!target) return null;

  // Remaining time for this specific target before miss (0 to 100)
  const remainingPercent = Math.max(0, Math.min(100, 100 - planeProgress));

  return (
    <div 
      className={`relative w-full max-w-[min(90vw,60vh)] md:max-w-[540px] mb-2 md:mb-3.5 transition-all duration-200 select-none ${
        isExploding ? 'shake-effect' : ''
      }`}
    >
      {/* Warm Cream Card Surface with Soft Gold/Sand Border and Subtle Shadow */}
      <div className={`relative bg-[#FFF8EF] rounded-2xl md:rounded-[1.25rem] border-2 border-[#E6B17E] p-2.5 md:p-3.5 shadow-[0_6px_20px_rgba(11,31,58,0.06),0_2px_6px_rgba(107,48,40,0.04)] overflow-hidden flex items-center justify-between gap-3 ${
        isLanding ? 'ring-2 ring-[#22C55E]/60 bg-[#F4FBF6]' : ''
      }`}>
        
        {/* Left: Illustrated Aviation Jet Mascot */}
        <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
          <div className="relative w-11 h-11 md:w-13 md:h-13 rounded-xl bg-white border border-[#E6B17E]/60 shadow-[0_2px_6px_rgba(11,31,58,0.06)] flex items-center justify-center shrink-0">
            <svg 
              className="w-7 h-7 md:w-8 md:h-8 -rotate-12 transition-transform duration-300"
              viewBox="0 0 100 55" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White Airplane Fuselage */}
              <path 
                d="M 12,22 C 28,16 65,14 88,22 C 96,25 98,30 89,33 C 70,36 30,37 15,32 C 10,30 8,24 12,22 Z" 
                fill="#FFFFFF" 
                stroke="#0B1F3A" 
                strokeWidth="2.5" 
              />
              {/* Cockpit Window */}
              <path d="M 82,22 C 89,25 90,28 84,30 L 80,30 C 79,26 81,23 82,22 Z" fill="#0B1F3A" />
              {/* Gold cheatline stripe */}
              <path d="M 28,28 Q 55,28 80,28" stroke="#F2B544" strokeWidth="2.2" strokeLinecap="round" />
              {/* Tail Fin */}
              <path d="M 10,22 L 3,5 C 2,2 5,1 10,4 L 25,20 Z" fill="#0B1F3A" />
              <path d="M 5,7 L 12,14" stroke="#F2B544" strokeWidth="2" strokeLinecap="round" />
              {/* Wing */}
              <path d="M 38,26 L 26,45 C 24,47 28,49 32,47 L 56,30 Z" fill="#0B1F3A" />
              {/* Jet Engine */}
              <rect x="36" y="38" width="15" height="7" rx="3.5" fill="#F2B544" stroke="#0B1F3A" strokeWidth="1.5" />
            </svg>

            {/* Success Checkmark indicator when landing */}
            {isLanding && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#22C55E] text-white rounded-full flex items-center justify-center shadow-md"
              >
                <Check size={12} strokeWidth={3} />
              </motion.div>
            )}
          </div>

          {/* Compass / Aviation motif */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6B3028]/80 flex items-center gap-1">
              <Compass size={11} className="text-[#F2B544]" /> MISSION
            </span>
            <span className="text-[11px] font-bold text-[#0B1F3A]/70">
              Fly to square
            </span>
          </div>
        </div>

        {/* Center: Main Primary Visual Focus - TARGET: G2 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.22em] text-[#F2B544]">
              FIND SQUARE
            </span>
          </div>

          <div className="flex items-center justify-center gap-1">
            <span 
              key={coordinateToString(target)} 
              className={`text-3xl md:text-4xl font-black text-[#0B1F3A] tracking-wider leading-none tabular-nums animate-[scale-in_0.2s_ease-out] ${
                isLanding ? 'text-[#22C55E]' : ''
              }`}
            >
              {coordinateToString(target).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: Sleek Target Timer Speed Progress */}
        <div className="flex flex-col items-end justify-center shrink-0 min-w-[70px] md:min-w-[90px]">
          <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider text-[#6B3028]/70 mb-1">
            Approaching
          </span>
          <div className="w-16 md:w-22 h-2 bg-[#F7E8D4] rounded-full overflow-hidden border border-[#E6B17E]/40 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-100 linear ${
                remainingPercent < 25 ? 'bg-[#EF4444]' : 'bg-[#F2B544]'
              }`}
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(TargetBanner);
