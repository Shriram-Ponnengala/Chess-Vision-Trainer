import React from 'react';
import { FILES, RANKS } from '../constants';
import { Coordinate } from '../types';
import Plane from './Plane';

interface ChessBoardProps {
  onSquareClick: (coord: Coordinate) => void;
  activeTarget: Coordinate | null;
  lastResult: { coord: Coordinate; success: boolean } | null;
  planeProgress?: number;
  isLanding?: boolean;
  isExploding?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  onSquareClick, 
  activeTarget, 
  lastResult,
  planeProgress = 0,
  isLanding = false,
  isExploding = false
}) => {
  
  const getSquareColor = (fileIndex: number, rankIndex: number) => {
    const isDark = (fileIndex + rankIndex) % 2 !== 0;
    return isDark ? 'bg-brown' : 'bg-white';
  };

  const getFeedbackStyle = (file: string, rank: number) => {
    if (!lastResult) return {};
    const isTarget = lastResult.coord.file === file && lastResult.coord.rank === rank;
    
    if (isTarget) {
      if (lastResult.success) {
        return { backgroundColor: '#e6b17e', transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)' };
      } else {
        return { opacity: 0.6, transition: 'opacity 0.2s ease-out' }; 
      }
    }
    return {};
  };

  const getTargetPosition = (coord: Coordinate) => {
    const fileIdx = FILES.indexOf(coord.file);
    const rankIdx = RANKS.indexOf(coord.rank);
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  // Optimized visibility for mobile
  const labelClasses = "flex-1 text-center font-extrabold text-brown/90 text-[10px] md:text-sm uppercase tracking-wider";
  const rankLabelClasses = "flex items-center justify-center font-extrabold text-brown/90 text-[10px] md:text-sm tracking-wider w-5 md:w-8";
  
  // Layout constants
  const sideLabelWidth = "w-5 md:w-8"; 
  const gapSize = "gap-1 md:gap-3"; 

  return (
    // Responsive container using min() logic for constraints to fit landscape/portrait mobile
    <div className="flex flex-col items-center justify-center w-full max-w-[min(90vw,60vh)] md:max-w-[540px] animate-in fade-in zoom-in-98 duration-700">
      
      {/* Top Section: Spacer + Files + Spacer */}
      <div className={`flex items-end justify-center w-full mb-1 md:mb-2 ${gapSize}`}>
         <div className={`${sideLabelWidth} shrink-0`} />
         <div className="flex-1 flex px-1 md:px-[12px] shrink-0">
            {FILES.map((file) => (
              <div key={`top-${file}`} className={labelClasses}>
                {file}
              </div>
            ))}
         </div>
         <div className={`${sideLabelWidth} shrink-0`} />
      </div>

      {/* Middle Section: Ranks + Board + Ranks */}
      <div className={`flex items-stretch justify-center w-full ${gapSize}`}>
        
        {/* Left Ranks */}
        <div className={`grid grid-rows-8 py-1 md:py-[12px] ${sideLabelWidth} shrink-0`}>
          {RANKS.map((rank) => (
            <div key={`left-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>

        {/* The Board Grid */}
        <div className="flex-1 aspect-square grid grid-cols-8 shadow-[0_24px_48px_-12px_rgba(85,30,25,0.5)] border-4 md:border-[12px] border-brown rounded-[1rem] md:rounded-[2.5rem] overflow-hidden bg-brown relative shrink-0">
          
          {RANKS.map((rank, rankIndex) => (
            <React.Fragment key={rank}>
              {FILES.map((file, fileIndex) => {
                const coordString = `${file}${rank}`;
                return (
                  <div
                    key={coordString}
                    onClick={() => onSquareClick({ file, rank })}
                    className={`
                      relative flex items-center justify-center cursor-pointer 
                      active:scale-95 transition-all duration-150 ease-out 
                      ${getSquareColor(fileIndex, rankIndex)}
                    `}
                    style={getFeedbackStyle(file, rank)}
                  >
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Overlay: Plane & Flight Path */}
          {activeTarget && (typeof planeProgress === 'number' || isLanding || isExploding) && (
            <>
              {isLanding && !isExploding && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                  <line
                    x1="50%"
                    y1={`${planeProgress}%`}
                    x2={`${getTargetPosition(activeTarget).x}%`}
                    y2={`${getTargetPosition(activeTarget).y}%`}
                    stroke="#e6b17e"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-90 drop-shadow-md animate-in fade-in duration-300"
                  />
                  <circle 
                    cx={`${getTargetPosition(activeTarget).x}%`}
                    cy={`${getTargetPosition(activeTarget).y}%`}
                    r="6"
                    fill="#e6b17e"
                    className="animate-pulse"
                  />
                </svg>
              )}

              <Plane 
                target={activeTarget} 
                progress={planeProgress} 
                landingDest={isLanding ? getTargetPosition(activeTarget) : undefined}
                isExploding={isExploding}
              />
            </>
          )}

        </div>
        
        {/* Right Ranks */}
        <div className={`grid grid-rows-8 py-1 md:py-[12px] ${sideLabelWidth} shrink-0`}>
          {RANKS.map((rank) => (
            <div key={`right-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Spacer + Files + Spacer */}
      <div className={`flex items-start justify-center w-full mt-1 md:mt-2 ${gapSize}`}>
         <div className={`${sideLabelWidth} shrink-0`} />
         <div className="flex-1 flex px-1 md:px-[12px] shrink-0">
            {FILES.map((file) => (
              <div key={`bottom-${file}`} className={labelClasses}>
                {file}
              </div>
            ))}
         </div>
         <div className={`${sideLabelWidth} shrink-0`} />
      </div>

      <div className="h-4 md:h-6"></div>
    </div>
  );
};

export default React.memo(ChessBoard);