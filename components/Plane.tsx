import React from 'react';
import { Plane as PlaneIcon } from 'lucide-react';
import { Coordinate } from '../types';
import { coordinateToString } from '../constants';

interface PlaneProps {
  target: Coordinate;
  progress: number; // 0 to 100
  landingDest?: { x: number; y: number };
}

const Plane: React.FC<PlaneProps> = ({ target, progress, landingDest }) => {
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
        transform: `translate(-50%, -50%) scale(${isLanding ? 0.5 : 1 + (progress / 300)})`, // Scale down on landing
        opacity: isLanding ? 0.8 : 1
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* The Plane Icon - White for neutral base */}
        {/* Rotated 135deg to point straight down (Lucide Plane points NE by default) */}
        {/* Filter applied to wrapper so shadow stays vertical regardless of rotation */}
        <div 
          className="relative z-10"
          style={{ filter: 'drop-shadow(0px 4px 0px #551e19)' }}
        >
           <PlaneIcon 
             className="w-14 h-14 text-white fill-white"
             style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}
           />
        </div>

        {/* The Coordinate Label - Hide during landing to clean up visual */}
        {!isLanding && (
          <div className="mt-2 z-20">
            <div className="bg-brown text-white font-black px-4 py-1.5 rounded-lg text-lg shadow-lg border-2 border-gold tracking-widest">
              {coordinateToString(target).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      {/* Speed Lines Trail - Hide during landing */}
      {!isLanding && (
        <div className="w-0.5 h-16 bg-gradient-to-t from-gold to-transparent -mt-10 opacity-60"></div>
      )}
    </div>
  );
};

export default React.memo(Plane);