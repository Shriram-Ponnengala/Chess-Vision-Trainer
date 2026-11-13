import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  // State for floating score feedback (+5 / -5)
  const [floatingAlert, setFloatingAlert] = useState<{ x: number; y: number; text: string; isSuccess: boolean } | null>(null);
  
  const getSquareColor = (fileIndex: number, rankIndex: number) => {
    const isDark = (fileIndex + rankIndex) % 2 !== 0;
    // Brand Manual: Navy (#2D4A6B) for dark squares, Cream (#FDF0E4) for light squares
    return isDark ? 'bg-[#2D4A6B]' : 'bg-[#FDF0E4]';
  };

  const getTargetPosition = (coord: Coordinate) => {
    const fileIdx = FILES.indexOf(coord.file);
    const rankIdx = RANKS.indexOf(coord.rank);
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  useEffect(() => {
    if (lastResult) {
      const pos = getTargetPosition(lastResult.coord);
      setFloatingAlert({
        x: pos.x,
        y: pos.y,
        text: lastResult.success ? '+5' : '-5',
        isSuccess: lastResult.success
      });
      
      const timer = setTimeout(() => {
        setFloatingAlert(null);
      }, 650);
      
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const getFeedbackClass = (file: string, rank: number) => {
    if (!lastResult || !activeTarget) return '';
    const isTapped = lastResult.coord.file === file && lastResult.coord.rank === rank;
    const isCorrectTarget = activeTarget.file === file && activeTarget.rank === rank;

    if (isTapped) {
      return 'animate-feedback z-10';
    }
    if (!lastResult.success && isCorrectTarget) {
      return 'animate-learn';
    }
    return '';
  };

  const getFeedbackStyle = (file: string, rank: number) => {
    if (!lastResult || !activeTarget) return {};
    const isTapped = lastResult.coord.file === file && lastResult.coord.rank === rank;
    const isCorrectTarget = activeTarget.file === file && activeTarget.rank === rank;
    
    if (isTapped) {
      return { 
        backgroundColor: lastResult.success ? '#22C55E' : '#E94B35',
        borderColor: lastResult.success ? '#16A34A' : '#DC2626',
      };
    }
    if (!lastResult.success && isCorrectTarget) {
      return { 
        backgroundColor: '#C8854A',
        borderColor: '#C8854A',
      };
    }
    return {};
  };

  // High contrast typography for labels against Cream background (#FDF0E4)
  const labelClasses = "flex-1 text-center font-black text-[#4A2018] text-xs md:text-sm uppercase tracking-widest";
  const rankLabelClasses = "flex items-center justify-center font-black text-[#4A2018] text-xs md:text-sm tracking-widest w-5 md:w-8";
  
  const sideLabelWidth = "w-5 md:w-8"; 
  const gapSize = "gap-1 md:gap-2"; 

  return (
    <div className={`flex flex-col items-center justify-center w-full max-w-[min(92vw,56vh)] md:max-w-[500px] animate-in fade-in duration-300 ${isExploding ? 'shake-effect' : ''}`}>
      
      {/* Top Files (a-h) */}
      <div className={`flex items-end justify-center w-full mb-1 ${gapSize}`}>
         <div className={`${sideLabelWidth} shrink-0`} />
         <div className="flex-1 flex px-1 md:px-2 shrink-0">
            {FILES.map((file) => (
              <div key={`top-${file}`} className={labelClasses}>
                {file}
              </div>
            ))}
         </div>
         <div className={`${sideLabelWidth} shrink-0`} />
      </div>

      {/* Ranks (1-8) + Board Grid */}
      <div className={`flex items-stretch justify-center w-full ${gapSize}`}>
        
        {/* Left Ranks */}
        <div className={`grid grid-rows-8 py-1 md:py-2 ${sideLabelWidth} shrink-0`}>
          {RANKS.map((rank) => (
            <div key={`left-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>

        {/* The Board Grid */}
        <div className="flex-1 aspect-square grid grid-cols-8 shadow-[0_16px_40px_rgba(45,74,107,0.18),0_4px_12px_rgba(74,32,24,0.08)] border-4 md:border-8 border-[#4A2018] rounded-2xl md:rounded-3xl overflow-hidden bg-[#2D4A6B] relative shrink-0">
          
          {RANKS.map((rank, rankIndex) => (
            <React.Fragment key={rank}>
              {FILES.map((file, fileIndex) => {
                const coordString = `${file}${rank}`;
                const fClass = getFeedbackClass(file, rank);
                return (
                  <button
                    type="button"
                    key={coordString}
                    onClick={() => onSquareClick({ file, rank })}
                    aria-label={`Square ${file}${rank}`}
                    className={`
                      relative flex items-center justify-center cursor-pointer 
                      active:scale-95 transition-all duration-150 ease-out 
                      ${getSquareColor(fileIndex, rankIndex)}
                      ${fClass}
                    `}
                    style={getFeedbackStyle(file, rank)}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {/* Floating score indicator */}
          {floatingAlert && (
            <motion.div
              initial={{ y: 5, opacity: 1, scale: 0.85 }}
              animate={{ y: -35, opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`absolute select-none pointer-events-none z-30 font-black text-xl md:text-2xl px-2.5 py-0.5 rounded-lg shadow-md ${
                floatingAlert.isSuccess 
                  ? 'bg-[#22C55E] text-white border border-[#16A34A]' 
                  : 'bg-[#E94B35] text-white border border-[#DC2626]'
              }`}
              style={{
                left: `${floatingAlert.x}%`,
                top: `${floatingAlert.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {floatingAlert.text}
            </motion.div>
          )}

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
                    stroke="#C8854A"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    className="opacity-80"
                  />
                  <circle 
                    cx={`${getTargetPosition(activeTarget).x}%`}
                    cy={`${getTargetPosition(activeTarget).y}%`}
                    r="5"
                    fill="#C8854A"
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
        <div className={`grid grid-rows-8 py-1 md:py-2 ${sideLabelWidth} shrink-0`}>
          {RANKS.map((rank) => (
            <div key={`right-${rank}`} className={rankLabelClasses}>
              {rank}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Files (a-h) */}
      <div className={`flex items-start justify-center w-full mt-1 ${gapSize}`}>
         <div className={`${sideLabelWidth} shrink-0`} />
         <div className="flex-1 flex px-1 md:px-2 shrink-0">
            {FILES.map((file) => (
              <div key={`bottom-${file}`} className={labelClasses}>
                {file}
              </div>
            ))}
         </div>
         <div className={`${sideLabelWidth} shrink-0`} />
      </div>
    </div>
  );
};

export default React.memo(ChessBoard);
