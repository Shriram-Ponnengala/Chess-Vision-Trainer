
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Zap, Clock, Pause, Plane as PlaneIcon, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { GameState, Coordinate, GameStats, MoveHistory, Difficulty } from './types';
import { MAIN_DURATION, getRandomCoordinate, coordinateToString, DIFFICULTY_SETTINGS } from './constants';
import ChessBoard from './components/ChessBoard';
import { getCoachFeedback } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    totalSpawns: 0,
  });
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastRunAccuracy, setLastRunAccuracy] = useState<number | null>(null);

  // Gameplay State
  const [activeTarget, setActiveTarget] = useState<Coordinate | null>(null);
  const [planeProgress, setPlaneProgress] = useState(0); // 0 to 100
  const [lastResult, setLastResult] = useState<{ coord: Coordinate; success: boolean } | null>(null);
  const [isLanding, setIsLanding] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  // Refs for loops
  const requestRef = useRef<number>();
  const spawnTimeRef = useRef<number>(0);

  // --- Sound Logic ---
  const playSound = useCallback((type: 'correct' | 'wrong') => {
    if (isMuted) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  }, [isMuted]);

  // --- Game Loop Logic ---

  const spawnPlane = useCallback(() => {
    setActiveTarget(getRandomCoordinate());
    setPlaneProgress(0);
    spawnTimeRef.current = Date.now();
    setStats(prev => ({ ...prev, totalSpawns: prev.totalSpawns + 1 }));
  }, []);

  const handleMiss = useCallback(() => {
    setStats(prev => ({
      ...prev,
      misses: prev.misses + 1,
      streak: 0,
    }));
    setLastResult(null); 
    setIsLanding(false);
    
    if (activeTarget) {
      setHistory(prev => [...prev, {
        target: activeTarget,
        wasCorrect: false,
        timeTakenMs: Date.now() - spawnTimeRef.current,
        phase: 'main'
      }]);
    }

    // Spawn after difficulty-based delay
    setTimeout(() => {
      if (gameState === GameState.MAIN_PLAY) spawnPlane();
    }, DIFFICULTY_SETTINGS[difficulty].spawnDelay);
  }, [activeTarget, gameState, spawnPlane, difficulty]);

  const updateGame = useCallback((time: number) => {
    if (isPaused || gameState !== GameState.MAIN_PLAY || isLanding || isExploding) {
      requestRef.current = requestAnimationFrame((t) => updateGame(t));
      return;
    }

    const config = DIFFICULTY_SETTINGS[difficulty];
    const timeElapsed = MAIN_DURATION - timeLeft;
    const speed = config.baseSpeed + (timeElapsed / MAIN_DURATION) * config.speedScaling;
    
    setPlaneProgress(prev => {
      const next = prev + speed;
      if (next >= 105) { 
        handleMiss();
        return 0;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame((t) => updateGame(t));
  }, [gameState, timeLeft, handleMiss, isPaused, isLanding, isExploding, difficulty]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isPaused && gameState === GameState.MAIN_PLAY) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isPaused]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateGame(t));
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateGame]);

  const handlePhaseComplete = () => {
    endGame();
  };

  const endGame = async () => {
    setGameState(GameState.SUMMARY);
    setIsLoadingFeedback(true);
    const accuracy = Math.round((stats.hits / (stats.hits + stats.misses || 1)) * 100);
    
    const storedAccuracy = localStorage.getItem('lastRunAccuracy');
    if (storedAccuracy) {
      setLastRunAccuracy(parseInt(storedAccuracy, 10));
    }
    localStorage.setItem('lastRunAccuracy', accuracy.toString());

    const feedback = await getCoachFeedback(history, stats.score, accuracy);
    setCoachFeedback(feedback);
    setIsLoadingFeedback(false);
  };

  const handleSquareClick = (coord: Coordinate) => {
    if (isPaused || !activeTarget || gameState !== GameState.MAIN_PLAY || isLanding || isExploding) return;

    const isCorrect = coord.file === activeTarget.file && coord.rank === activeTarget.rank;
    const reactionTime = Date.now() - spawnTimeRef.current;

    setLastResult({ coord, success: isCorrect });
    setTimeout(() => setLastResult(null), 250);

    if (isCorrect) {
      playSound('correct');
      setStats(prev => {
        const newStreak = prev.streak + 1;
        let pointsToAdd = 5;
        if (newStreak % 5 === 0) pointsToAdd += 10;

        return {
          ...prev,
          score: prev.score + pointsToAdd,
          hits: prev.hits + 1,
          streak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
        };
      });

      setHistory(prev => [...prev, {
        target: activeTarget,
        wasCorrect: true,
        timeTakenMs: reactionTime,
        phase: 'main'
      }]);

      setIsLanding(true);
      setTimeout(() => {
        setIsLanding(false);
        spawnPlane();
      }, 400 + DIFFICULTY_SETTINGS[difficulty].spawnDelay);

    } else {
        playSound('wrong');
        setIsExploding(true);
        setTimeout(() => {
          setIsExploding(false);
          handleMiss();
        }, 400);
    }
  };

  const startGame = () => {
    setStats({ score: 0, streak: 0, maxStreak: 0, hits: 0, misses: 0, totalSpawns: 0 });
    setHistory([]);
    setCoachFeedback('');
    setIsPaused(false);
    setIsLanding(false);
    setIsExploding(false);
    setLastRunAccuracy(null);
    
    setGameState(GameState.MAIN_PLAY);
    setTimeLeft(MAIN_DURATION);
    spawnPlane();
  };

  const renderHUD = () => {
    const timePercent = (timeLeft / MAIN_DURATION) * 100;
    
    return (
      <div className="w-full fixed top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
         <div className="w-full bg-brown/95 backdrop-blur-md text-cream shadow-xl border-b border-white/10 py-2 md:pt-4 md:pb-3 px-3 md:px-6 pointer-events-auto transition-all duration-300">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
              
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                 <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5">Score</span>
                 <span className="text-xl md:text-3xl font-black leading-none text-white tracking-tight drop-shadow-sm tabular-nums">{stats.score}</span>
              </div>

              <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                 <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5">Streak</span>
                 <div className="flex items-center gap-1 md:gap-1.5">
                    <Zap size={16} className={`md:w-[18px] md:h-[18px] ${stats.streak > 2 ? 'fill-gold text-gold animate-pulse' : 'text-white/20'}`} />
                    <span className="text-xl md:text-3xl font-black leading-none text-white tracking-tight drop-shadow-sm tabular-nums">{stats.streak}</span>
                 </div>
              </div>

              <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                 <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5">Time</span>
                 <span className={`text-xl md:text-3xl font-black leading-none tabular-nums tracking-tight drop-shadow-sm transition-colors duration-300 ${timeLeft <= 10 ? 'text-gold animate-pulse' : 'text-white'}`}>
                   {timeLeft}
                 </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="group w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-gold/30 shadow-sm"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX size={18} className="md:w-5 md:h-5 text-white/50 group-hover:text-gold transition-colors" />
                  ) : (
                    <Volume2 size={18} className="md:w-5 md:h-5 text-white group-hover:text-gold transition-colors" />
                  )}
                </button>

                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="group w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-gold/30 shadow-sm"
                  aria-label={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <Play size={18} className="md:w-5 md:h-5 fill-white text-white group-hover:text-gold transition-colors" /> : <Pause size={18} className="md:w-5 md:h-5 fill-white text-white group-hover:text-gold transition-colors" />}
                </button>
              </div>
            </div>
         </div>
         
         <div className="w-full h-1 md:h-1.5 bg-brown/50">
            <div 
              className="h-full bg-gradient-to-r from-gold to-[#f0cfa5] shadow-[0_0_10px_rgba(230,177,126,0.5)] transition-all duration-1000 ease-linear rounded-r-full"
              style={{ width: `${timePercent}%` }}
            />
         </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative font-sans bg-cream overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold rounded-full opacity-10 pointer-events-none blur-[100px] animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cream via-cream to-[#edcbb0] opacity-50 pointer-events-none"></div>

      {gameState === GameState.MAIN_PLAY && renderHUD()}

      <div className="relative z-10 mt-[5.5rem] md:mt-24 flex-1 flex flex-col justify-center w-full max-w-[600px] px-2 md:px-4">
        <ChessBoard 
          onSquareClick={handleSquareClick}
          activeTarget={activeTarget}
          lastResult={lastResult}
          planeProgress={gameState === GameState.MAIN_PLAY && !isPaused ? planeProgress : undefined}
          isLanding={isLanding}
          isExploding={isExploding}
        />
      </div>

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-cream/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 md:p-6 text-center animate-in fade-in duration-300">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-brown/10 border border-white max-w-lg w-full mx-4 transform transition-all hover:scale-[1.005]">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-brown rounded-2xl mx-auto mb-6 md:mb-8 flex items-center justify-center shadow-lg shadow-brown/20 rotate-3 hover:rotate-6 transition-transform duration-300">
               <PlaneIcon size={32} className="md:w-[40px] md:h-[40px] text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-brown mb-2 tracking-tight">Plane to E4</h1>
            <p className="text-brown/60 mb-6 md:mb-8 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">Learn Chess Coordinates at Jet Speed!</p>
            
            {/* Difficulty Selection */}
            <div className="mb-8">
              <h3 className="font-bold text-brown/90 text-[10px] uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                Select Difficulty
              </h3>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-brown/5 rounded-2xl border border-brown/5">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all duration-200 ${
                      difficulty === d 
                        ? 'bg-brown text-gold shadow-lg shadow-brown/20' 
                        : 'text-brown/40 hover:text-brown/60'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-left bg-cream/20 p-4 md:p-6 rounded-2xl mb-6 md:mb-8 border border-brown/5">
                <h3 className="font-bold text-brown/90 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold"></span> 
                  How to Play
                </h3>
                <ul className="text-xs md:text-sm text-brown/70 space-y-2 md:space-y-2.5 list-none font-medium pl-1">
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="text-gold font-bold">•</span>
                      Land planes by clicking the matching square
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="text-gold font-bold">•</span>
                      Speed increases over 60 seconds
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="text-gold font-bold">•</span>
                      Maintain streaks for massive bonus points
                    </li>
                </ul>
            </div>

            <button 
              onClick={startGame}
              className="group w-full bg-brown text-white font-bold text-base md:text-lg py-4 md:py-5 rounded-2xl shadow-xl shadow-brown/20 hover:shadow-brown/40 hover:bg-[#4a1915] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 border border-transparent hover:border-gold/10"
            >
              <Play size={20} className="md:w-[22px] md:h-[22px] fill-current group-hover:scale-110 transition-transform" /> START MISSION
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.SUMMARY && (
        <div className="absolute inset-0 bg-brown/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-cream text-brown p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 border border-gold/30 relative">
            <div className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 bg-gold text-brown px-6 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl border-4 border-brown whitespace-nowrap">
              Run Complete
            </div>
            
            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-5 mb-4 md:mb-5">
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-brown/5 text-center group hover:shadow-md transition-shadow">
                <div className="text-[9px] md:text-[10px] uppercase font-bold text-brown/40 mb-1 md:mb-2 tracking-wider">Score</div>
                <div className="text-3xl md:text-4xl font-black text-brown tracking-tighter group-hover:scale-110 transition-transform duration-300">{stats.score}</div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-brown/5 text-center group hover:shadow-md transition-shadow">
                <div className="text-[9px] md:text-[10px] uppercase font-bold text-brown/40 mb-1 md:mb-2 tracking-wider">Accuracy</div>
                <div className="text-3xl md:text-4xl font-black text-brown tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {Math.round((stats.hits / (stats.hits + stats.misses || 1)) * 100)}%
                </div>
              </div>
            </div>

            <div className="text-center mb-6 md:mb-8">
               <div className="text-[10px] uppercase font-bold text-brown/40 tracking-wider">Accuracy Index</div>
               <div className="text-xl font-black text-brown leading-none my-1">
                  {Math.round((stats.hits / (stats.hits + stats.misses || 1)) * 100)}%
               </div>
               <div className="text-[9px] text-brown/50">Tracks board-coordinate accuracy per run.</div>
               {lastRunAccuracy !== null && (
                  <div className="text-[9px] text-brown/60 font-bold mt-1">Last Run: {lastRunAccuracy}%</div>
               )}
            </div>

            <div className="bg-white/60 rounded-2xl p-5 md:p-6 mb-6 md:mb-8 border border-white/50 shadow-inner">
              <h3 className="flex items-center gap-2 font-bold mb-3 text-brown text-xs uppercase tracking-widest opacity-80">
                <CheckCircle2 size={16} className="text-gold" />
                Coach's Feedback
              </h3>
              {isLoadingFeedback ? (
                <div className="flex flex-col items-center py-6 space-y-4 opacity-50">
                  <div className="w-8 h-8 border-[3px] border-brown/20 border-t-brown rounded-full animate-spin"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brown/60">Analyzing Performance...</span>
                </div>
              ) : (
                <p className="text-xs md:text-sm leading-relaxed text-brown font-medium opacity-90">{coachFeedback}</p>
              )}
            </div>

            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-full bg-brown text-gold font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#4a1915] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-brown/20 border border-gold/10 text-sm md:text-base"
            >
              <RotateCcw size={16} className="md:w-[18px] md:h-[18px]" /> RETURN TO MENU
            </button>
          </div>
        </div>
      )}
      
      {isPaused && (
        <div className="absolute inset-0 bg-brown/80 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col items-center w-[90%] max-w-[320px] border border-white/20">
             <span className="font-black text-xl md:text-2xl text-brown mb-8 md:mb-10 tracking-[0.2em] uppercase opacity-90 text-center">Paused</span>
             
             <button 
                onClick={() => setIsPaused(false)}
                className="w-full bg-gold text-brown font-black py-4 md:py-5 px-6 md:px-8 rounded-2xl hover:bg-[#eecfa5] active:scale-[0.98] transition-all duration-200 mb-4 flex items-center justify-center gap-3 shadow-lg shadow-gold/30 text-sm md:text-base"
             >
               <Play size={20} className="md:w-[22px] md:h-[22px] fill-current" /> RESUME
             </button>

             <button 
                onClick={startGame}
                className="w-full bg-brown text-cream font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl hover:bg-[#4a1915] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-brown/30 text-sm md:text-base"
             >
               <RotateCcw size={18} className="md:w-[20px] md:h-[20px]" /> RESTART
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
