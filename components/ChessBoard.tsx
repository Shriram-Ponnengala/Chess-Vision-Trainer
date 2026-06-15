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
  // State for floating texts (+5 / -5)
  const [floatingAlert, setFloatingAlert] = useState<{ x: number; y: number; text: string; isSuccess: boolean } | null>(null);
  
  // State for wrong clicked particles
  const [wrongClickParticles, setWrongClickParticles] = useState<{ x: number, y: number } | null>(null);
  
  const getSquareColor = (fileIndex: number, rankIndex: number) => {
    const isDark = (fileIndex + rankIndex) % 2 !== 0;
    return isDark ? 'bg-[#551e19]' : 'bg-white';
  };

  const getTargetPosition = (coord: Coordinate) => {
    const fileIdx = FILES.indexOf(coord.file);
    const rankIdx = RANKS.indexOf(coord.rank);
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  // Triggers whenever lastResult is reported
  useEffect(() => {
    if (lastResult) {
      const pos = getTargetPosition(lastResult.coord);
      
      // Spawn floating alert text
      setFloatingAlert({
        x: pos.x,
        y: pos.y,
        text: lastResult.success ? '+5' : '-5',
        isSuccess: lastResult.success
      });
      
      // If wrongful touch, spawn orange-red spark particles on that square
      if (!lastResult.success) {
        setWrongClickParticles(pos);
      }
      
      const timer = setTimeout(() => {
        setFloatingAlert(null);
        setWrongClickParticles(null);
      }, 750);
      
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
        backgroundColor: lastResult.success ? '#4CAF50' : '#e53935',
        borderColor: lastResult.success ? '#4CAF50' : '#e53935',
      };
    }
    if (!lastResult.success && isCorrectTarget) {
      return { 
        backgroundColor: '#c8854a',
        borderColor: '#c8854a',
      };
    }
    return {};
  };

  // Optimized visibility for mobile
  const labelClasses = "flex-1 text-center font-extrabold text-[#fdf0e4]/90 text-[10px] md:text-sm uppercase tracking-wider";
  const rankLabelClasses = "flex items-center justify-center font-extrabold text-[#fdf0e4]/90 text-[10px] md:text-sm tracking-wider w-5 md:w-8";
  
  // Layout constants
  const sideLabelWidth = "w-5 md:w-8"; 
  const gapSize = "gap-1 md:gap-3"; 

  return (
    // Responsive container using min() logic for constraints to fit landscape/portrait mobile
    // Applies 'shake-effect' when isExploding is active for wrong squares
    <div className={`flex flex-col items-center justify-center w-full max-w-[min(90vw,60vh)] md:max-w-[540px] animate-in fade-in zoom-in-98 duration-700 ${isExploding ? 'shake-effect' : ''}`}>
      
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
        <div className="flex-1 aspect-square grid grid-cols-8 shadow-[0_24px_48px_-12px_rgba(85,30,25,0.5)] border-4 md:border-[12px] border-[#551e19] rounded-[1rem] md:rounded-[2.5rem] overflow-hidden bg-[#551e19] relative shrink-0">
          
          {RANKS.map((rank, rankIndex) => (
            <React.Fragment key={rank}>
              {FILES.map((file, fileIndex) => {
                const coordString = `${file}${rank}`;
                const fClass = getFeedbackClass(file, rank);
                return (
                  <div
                    key={coordString}
                    onClick={() => onSquareClick({ file, rank })}
                    className={`
                      relative flex items-center justify-center cursor-pointer 
                      active:scale-95 transition-all duration-150 ease-out 
                      ${getSquareColor(fileIndex, rankIndex)}
                      ${fClass}
                    `}
                    style={getFeedbackStyle(file, rank)}
                  >
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Floating alert overlay */}
          {floatingAlert && (
            <motion.div
              initial={{ y: 10, opacity: 1, scale: 0.8 }}
              animate={{ y: -45, opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute select-none pointer-events-none z-30 font-extrabold text-xl md:text-3xl drop-shadow-lg"
              style={{
                left: `${floatingAlert.x}%`,
                top: `${floatingAlert.y}%`,
                transform: 'translate(-50%, -50%)',
                color: floatingAlert.isSuccess ? '#4CAF50' : '#e53935',
                textShadow: '0px 0px 4px rgba(255,255,255,0.95), 0px 0px 8px rgba(0,0,0,0.6)',
              }}
            >
              {floatingAlert.text}
            </motion.div>
          )}

          {/* Spark Particles Burst on Wrong Selection */}
          {wrongClickParticles && (
            <div 
              className="absolute pointer-events-none z-30"
              style={{
                left: `${wrongClickParticles.x}%`,
                top: `${wrongClickParticles.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12 + Math.random() * 15;
                const radians = (angle * Math.PI) / 180;
                const distance = 40 + Math.random() * 30; // pixels to fly
                const toX = Math.cos(radians) * distance;
                const toY = Math.sin(radians) * distance;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                    animate={{ 
                      scale: [1, 1.4, 0],
                      opacity: [1, 0.9, 0],
                      x: toX,
                      y: toY,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute w-2 h-2 rounded-full ${
                      i % 2 === 0 ? 'bg-[#ff5522]' : 'bg-[#ff9900]'
                    } blur-[1px]`}
                    style={{
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </div>
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
                    stroke="#c8854a"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-90 drop-shadow-md animate-in fade-in duration-300"
                  />
                  <circle 
                    cx={`${getTargetPosition(activeTarget).x}%`}
                    cy={`${getTargetPosition(activeTarget).y}%`}
                    r="6"
                    fill="#c8854a"
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
