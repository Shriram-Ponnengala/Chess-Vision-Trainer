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
        return { backgroundColor: '#e6b17e', transition: 'background-color 0.2s ease-out' };
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

  const labelClasses = "flex-1 text-center font-bold text-brown/40 text-[10px] md:text-xs uppercase tracking-[0.2em]";
  const rankLabelClasses = "flex-1 flex items-center justify-center font-bold text-brown/40 text-[10px] md:text-xs tracking-widest w-6 md:w-8";

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 select-none w-full animate-in fade-in zoom-in-98 duration-700">
      
      {/* Top Labels (Files) */}
      <div className="flex w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-[540px] mb-3 md:mb-5 pl-10 md:pl-14 pr-10 md:pr-14">
        {FILES.map((file) => (
          <div key={`top-${file}`} className={labelClasses}>
            {file}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center relative w-full">
        {/* Left Labels (Ranks) */}
        <div className="flex flex-col h-[90vw] md:h-[80vw] max-h-[540px] justify-between mr-4 md:mr-6 py-2 md:py-4">
          {RANKS.map((rank) => (
            <div key={`left-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>

        {/* The Board Grid */}
        <div className="w-[90vw] md:w-[80vw] max-w-[540px] aspect-square grid grid-cols-8 shadow-[0_32px_64px_-24px_rgba(85,30,25,0.4)] border-8 md:border-[12px] border-brown rounded-[2.5rem] overflow-hidden bg-brown relative shrink-0">
          
          {/* Squares */}
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
                      active:scale-95 transition-all duration-200 ease-out 
                      hover:ring-[1.5px] hover:ring-inset hover:ring-gold/30
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
                    className="opacity-90 drop-shadow-md"
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
        
        {/* Right Labels (Ranks) */}
        <div className="flex flex-col h-[90vw] md:h-[80vw] max-h-[540px] justify-between ml-4 md:ml-6 py-2 md:py-4">
          {RANKS.map((rank) => (
            <div key={`right-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Labels (Files) */}
      <div className="flex w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-[540px] mt-3 md:mt-5 pl-10 md:pl-14 pr-10 md:pr-14">
        {FILES.map((file) => (
          <div key={`bottom-${file}`} className={labelClasses}>
            {file}
          </div>
        ))}
      </div>

      <div className="h-6 md:h-10"></div>

    </div>
  );
};

export default React.memo(ChessBoard);