import React from 'react';
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
  
  // Position Logic
  // Default (falling): X=50%, Y=progress%
  // Landing: X=landingDest.x%, Y=landingDest.y%
  const left = isLanding ? `${landingDest.x}%` : '50%';
  const top = isLanding ? `${landingDest.y}%` : `${progress}%`;

  return (
    <div 
      className={`absolute z-30 pointer-events-none flex flex-col items-center justify-center will-change-transform ${isLanding ? 'transition-all duration-300 ease-out' : ''}`}
      style={{ 
        left,
        top,
        // Scale logic: Landing shrinks it, Falling grows slightly.
        transform: `translate(-50%, -50%) ${isLanding ? 'scale(0.5)' : `scale(${1 + (progress / 300)})`}`,
        transition: isLanding ? 'all 0.3s ease-out' : 'none'
      }}
    >
      {/* Explosion Effect Layer - Renders ON TOP of the plane */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
           {/* White Flash: Instant bright burst */}
           <div className="absolute w-12 h-12 bg-white rounded-full opacity-80 animate-[ping_0.2s_ease-out_1]" />
           {/* Gold Ring: Expanding shockwave */}
           <div className="absolute w-16 h-16 border-4 border-gold rounded-full opacity-0 animate-[ping_0.35s_cubic-bezier(0,0,0.2,1)_1]" />
           {/* Gold Cloud: Dissipating body */}
           <div className="w-20 h-20 bg-gold/40 rounded-full animate-[pulse_0.35s_ease-out_1]" />
        </div>
      )}

      {/* Plane Content Layer - Fades out and bursts slightly when exploding */}
      <div 
        className={`relative flex flex-col items-center transition-all duration-300 ease-out ${
          isExploding ? 'opacity-0 scale-125 blur-sm' : 'opacity-100 scale-100'
        }`}
      >
        <div 
          className="relative z-10"
          style={{ filter: 'drop-shadow(0px 4px 0px #551e19)' }}
        >
           <PlaneIcon 
             className="w-14 h-14 text-white fill-white"
             style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}
           />
        </div>

        {!isLanding && (
          <div className="mt-2 z-20">
            <div className="bg-brown text-white font-black px-4 py-1.5 rounded-lg text-lg shadow-lg border-2 border-gold tracking-widest">
              {coordinateToString(target).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      {/* Speed Lines Trail - Hide during landing or explosion */}
      {!isLanding && !isExploding && (
        <div className="w-0.5 h-16 bg-gradient-to-t from-gold to-transparent -mt-10 opacity-60"></div>
      )}
    </div>
  );
};

export default React.memo(Plane);