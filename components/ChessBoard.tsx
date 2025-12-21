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
        return { backgroundColor: '#e6b17e', transition: 'background-color 0.15s ease-out' };
      } else {
        return { opacity: 0.6, transition: 'opacity 0.15s ease-out' }; 
      }
    }
    return {};
  };

  const getTargetPosition = (coord: Coordinate) => {
    const fileIdx = FILES.indexOf(coord.file);
    const rankIdx = RANKS.indexOf(coord.rank);
    // Grid 0 to 7. Center of square is (index + 0.5) * 12.5%
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-4 select-none w-full">
      
      {/* Top Labels (Files) */}
      <div className="flex w-full max-w-[90vw] md:max-w-[520px] mb-1 md:mb-2 pl-6 md:pl-8 pr-1 md:pr-2">
        {FILES.map((file) => (
          <div key={file} className="flex-1 text-center font-bold text-brown/60 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.25em] transition-opacity hover:opacity-100 cursor-default">
            {file}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center relative w-full">
        {/* Left Labels (Ranks) */}
        <div className="flex flex-col h-[90vw] md:h-[80vw] max-h-[520px] justify-between mr-1 md:mr-3 py-2 md:py-5">
          {RANKS.map((rank) => (
            <div key={rank} className="flex-1 flex items-center justify-center font-bold text-brown/60 text-[10px] md:text-sm opacity-80 hover:opacity-100 cursor-default w-4 md:w-6">
              {rank}
            </div>
          ))}
        </div>

        {/* The Board Grid */}
        <div className="w-[90vw] h-[90vw] md:w-[80vw] md:h-[80vw] max-w-[520px] max-h-[520px] grid grid-cols-8 shadow-2xl shadow-brown/30 border-4 md:border-[6px] border-brown rounded-xl overflow-hidden bg-brown relative ring-1 ring-white/10">
          
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
                      active:scale-95 transition-all duration-100 ease-out hover:brightness-95
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
              {/* Flight Path Line - only show when landing (correct) or falling (normal) - hide on explosion */}
              {isLanding && !isExploding && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                  <line
                    x1="50%"
                    y1={`${planeProgress}%`}
                    x2={`${getTargetPosition(activeTarget).x}%`}
                    y2={`${getTargetPosition(activeTarget).y}%`}
                    stroke="#e6b17e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-90 drop-shadow-sm"
                  />
                  <circle 
                    cx={`${getTargetPosition(activeTarget).x}%`}
                    cy={`${getTargetPosition(activeTarget).y}%`}
                    r="4"
                    fill="#e6b17e"
                    className="animate-ping opacity-75"
                  />
                </svg>
              )}

              {/* The Plane */}
              <Plane 
                target={activeTarget} 
                progress={planeProgress} 
                landingDest={isLanding ? getTargetPosition(activeTarget) : undefined}
                isExploding={isExploding}
              />
            </>
          )}

        </div>
        
         {/* Right Spacing Balance (Visual only, to center board against left labels) */}
         <div className="w-4 md:w-6 ml-1 md:ml-3"></div>
      </div>

      {/* Bottom Labels Placeholder for Balance */}
      <div className="flex w-full max-w-[90vw] md:max-w-[520px] mt-1 md:mt-2 pl-6 md:pl-8 pr-1 md:pr-2 h-4 md:h-6">
      </div>

    </div>
  );
};

export default React.memo(ChessBoard);