import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Zap, Clock, Pause, Plane as PlaneIcon, CheckCircle2, Volume2, VolumeX, Home } from 'lucide-react';
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

  // Refs for loops and audio
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);
  const spawnTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<{ correct: AudioBuffer | null; wrong: AudioBuffer | null }>({
    correct: null,
    wrong: null,
  });

  // --- Sound Initialization ---
  useEffect(() => {
    const initAudio = () => {
      if (soundBuffers.current.correct) return; 

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const createBuffer = (duration: number, synthesizer: (t: number) => number) => {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = synthesizer(i / ctx.sampleRate);
        }
        return buffer;
      };

      soundBuffers.current.correct = createBuffer(0.14, (t) => {
        const freq = 880; 
        const decay = Math.exp(-t * 30);
        return Math.sin(2 * Math.PI * freq * t) * 0.04 * decay;
      });

      soundBuffers.current.wrong = createBuffer(0.25, (t) => {
        const freq = 110 * Math.exp(-t * 12); 
        const decay = Math.exp(-t * 15);
        const tri = (Math.abs((t * freq % 1) - 0.5) * 4 - 1);
        return tri * 0.08 * decay;
      });
    };

    window.addEventListener('mousedown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playSound = useCallback((type: 'correct' | 'wrong') => {
    if (isMuted || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const buffer = soundBuffers.current[type];
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
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

    setTimeout(() => {
      if (gameState === GameState.MAIN_PLAY) spawnPlane();
    }, DIFFICULTY_SETTINGS[difficulty].spawnDelay);
  }, [activeTarget, gameState, spawnPlane, difficulty]);

  // Delta-based loop for ultra-smooth movement
  const updateGame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (isPaused || gameState !== GameState.MAIN_PLAY || isLanding || isExploding) {
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    const config = DIFFICULTY_SETTINGS[difficulty];
    const timeElapsed = MAIN_DURATION - timeLeft;
    // Normalize speed to 60fps base
    const speed = (config.baseSpeed + (timeElapsed / MAIN_DURATION) * config.speedScaling) * (deltaTime / 16.67);
    
    setPlaneProgress(prev => {
      const next = prev + speed;
      if (next >= 105) { 
        handleMiss();
        return 0;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(updateGame);
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
    requestRef.current = requestAnimationFrame(updateGame);
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
    if (storedAccuracy) setLastRunAccuracy(parseInt(storedAccuracy, 10));
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
    lastTimeRef.current = 0; // Reset delta timer
    
    setGameState(GameState.MAIN_PLAY);
    setTimeLeft(MAIN_DURATION);
    spawnPlane();
  };

  const renderHUD = () => {
    const timePercent = (timeLeft / MAIN_DURATION) * 100;
    
    return (
      <div className="w-full fixed top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
         <div className="w-full bg-brown text-cream shadow-xl border-b border-white/5 py-2 md:py-4 px-3 md:px-8 pointer-events-auto transition-all duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 md:gap-4">
              
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[90px]">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/60 mb-0.5 md:mb-1">Score</span>
                 <span key={stats.score} className="text-xl md:text-3xl font-bold leading-none text-white tracking-tight tabular-nums animate-[scale-in_0.2s_ease-out]">
                   {stats.score}
                 </span>
              </div>

              <div className="flex flex-col items-center min-w-[60px] md:min-w-[90px]">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/60 mb-0.5 md:mb-1">Streak</span>
                 <div className="flex items-center gap-1.5 md:gap-2">
                    <Zap size={14} className={`md:w-5 md:h-5 transition-all duration-300 ${stats.streak > 2 ? 'fill-gold text-gold scale-125' : 'text-white/20'}`} />
                    <span key={stats.streak} className="text-xl md:text-3xl font-bold leading-none text-white tracking-tight tabular-nums animate-[scale-in_0.2s_ease-out]">
                      {stats.streak}
                    </span>
                 </div>
              </div>

              <div className="flex flex-col items-center min-w-[60px] md:min-w-[90px]">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/60 mb-0.5 md:mb-1">Time</span>
                 <span className={`text-xl md:text-3xl font-bold leading-none tabular-nums tracking-tight transition-all duration-300 ${timeLeft <= 10 ? 'text-gold animate-pulse scale-110' : 'text-white'}`}>
                   {timeLeft}
                 </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3 ml-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="group w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 flex items-center justify-center transition-all duration-300 border border-white/10 hover:border-white/30"
                >
                  {isMuted ? <VolumeX size={16} className="text-white/40 group-hover:text-white/60" /> : <Volume2 size={16} className="text-white group-hover:text-gold" />}
                </button>

                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="group w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 flex items-center justify-center transition-all duration-300 border border-white/10 hover:border-white/30"
                >
                  {isPaused ? <Play size={16} className="fill-white" /> : <Pause size={16} className="fill-white" />}
                </button>
              </div>
            </div>
         </div>
         
         <div className="w-full h-1 bg-brown">
            <div 
              className="h-full bg-gold transition-all duration-1000 ease-linear rounded-r-full"
              style={{ width: `${timePercent}%` }}
            />
         </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative font-sans bg-cream overflow-hidden">
      
      {/* Background Enhancements */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${gameState === GameState.MAIN_PLAY ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `conic-gradient(#551e19 90deg, transparent 90deg 180deg, #551e19 180deg 270deg, transparent 270deg)`,
          backgroundSize: '400px 400px',
          opacity: 0.02
        }}
      />
      {/* Persistent Oversized Board Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `conic-gradient(#a67c52 90deg, transparent 90deg 180deg, #a67c52 180deg 270deg, transparent 270deg)`,
          backgroundSize: '600px 600px',
          opacity: 0.03
        }}
      />

      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${gameState === GameState.MAIN_PLAY ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gold rounded-full opacity-[0.08] pointer-events-none blur-[120px]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream to-[#f2cfaf] opacity-40 pointer-events-none"></div>

      {gameState === GameState.MAIN_PLAY && renderHUD()}

      {/* Main Game Container - Responsive Padding Logic */}
      <div className="relative z-10 pt-20 md:pt-28 pb-4 flex-1 flex flex-col justify-center items-center w-full max-w-[620px] px-4 h-full">
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
        <div className="absolute inset-0 bg-cream/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 md:p-6 text-center animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(85,30,25,0.12)] border border-white max-w-md w-full transform transition-all duration-500 hover:scale-[1.01] my-auto">
            <button onClick={() => setIsMuted(!isMuted)} className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-brown/5 hover:bg-brown/10 flex items-center justify-center transition-all duration-300 border border-brown/5 hover:border-brown/20 active:scale-90">
              {isMuted ? <VolumeX size={16} className="text-brown/30" /> : <Volume2 size={16} className="text-brown/60" />}
            </button>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-brown rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center shadow-lg shadow-brown/10 -rotate-2 hover:rotate-0 transition-transform duration-500">
               <PlaneIcon size={28} className="text-white md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-brown mb-2 tracking-tight">Plane to E4</h1>
            <p className="text-brown/40 mb-4 md:mb-6 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] leading-relaxed">Advanced Coordinate Mastery</p>
            <div className="mb-4 md:mb-6">
              <h3 className="font-bold text-brown/80 text-[10px] uppercase tracking-[0.2em] mb-2 md:mb-3">Choose Intensity</h3>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-brown/5 rounded-[1.25rem] border border-brown/5">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button 
                    key={d} 
                    onClick={() => setDifficulty(d)} 
                    className={`py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all duration-300 active:scale-95 ${difficulty === d ? 'bg-brown text-gold shadow-md shadow-brown/15' : 'text-brown/40 hover:text-brown/70 hover:bg-brown/5'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={startGame} 
              className="group w-full bg-brown text-white font-bold text-sm md:text-base py-4 md:py-5 rounded-xl shadow-xl shadow-brown/20 hover:bg-[#4a1915] hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Play size={18} className="fill-current group-hover:translate-x-1 transition-transform" /> START PLAYING
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.SUMMARY && (
        <div className="absolute inset-0 bg-brown/98 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-500 overflow-y-auto">
          <div className="bg-cream text-brown p-6 md:p-14 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] max-w-sm w-full mx-auto border border-white/10 relative text-center scale-in duration-300 my-auto mt-12 md:mt-0">
            <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 bg-gold text-brown px-6 md:px-10 py-3 md:py-4 rounded-full font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs shadow-2xl border-[4px] md:border-[6px] border-brown whitespace-nowrap animate-bounce z-10">
              Session Complete
            </div>
            <div className="mt-8 md:mt-12 mb-6 md:mb-10">
              <div className="text-[10px] uppercase font-bold text-brown/40 mb-2 md:mb-3 tracking-[0.2em]">Accuracy</div>
              <div className="text-5xl md:text-8xl font-bold text-brown tracking-tighter mb-2 md:mb-4 animate-[scale-in_0.5s_ease-out]">
                {Math.round((stats.hits / (stats.hits + stats.misses || 1)) * 100)}%
              </div>
              <div className="text-xs md:text-sm font-bold text-brown/60 uppercase tracking-[0.1em]">Score: {stats.score}</div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <button 
                onClick={startGame} 
                className="w-full bg-brown text-gold font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#431814] hover:shadow-xl active:scale-95 transition-all duration-300 shadow-xl shadow-brown/40 text-sm md:text-base"
              >
                <RotateCcw size={16} /> PLAY AGAIN
              </button>
              <button 
                onClick={() => setGameState(GameState.MENU)} 
                className="w-full bg-cream text-brown font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-brown/5 active:scale-95 transition-all duration-300 border border-brown/10 text-sm md:text-base"
              >
                <Home size={16} /> HOME
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isPaused && (
        <div className="absolute inset-0 bg-brown/90 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in duration-300 p-6">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col items-center w-full max-w-xs md:max-w-sm border border-white/20 scale-in">
             <span className="font-bold text-xl md:text-2xl text-brown mb-8 md:mb-12 tracking-[0.3em] uppercase opacity-90">Paused</span>
             <button 
                onClick={() => setIsPaused(false)} 
                className="w-full bg-gold text-brown font-bold py-4 md:py-5 rounded-2xl hover:brightness-105 hover:shadow-lg active:scale-95 transition-all duration-300 mb-4 md:mb-5 flex items-center justify-center gap-3 shadow-lg shadow-gold/20 text-sm md:text-base"
             >
               <Play size={20} className="fill-current" /> RESUME
             </button>
             <button 
                onClick={startGame} 
                className="w-full bg-brown text-cream font-bold py-4 md:py-5 rounded-2xl hover:brightness-110 hover:shadow-xl active:scale-95 transition-all duration-300 mb-4 md:mb-5 flex items-center justify-center gap-3 shadow-xl shadow-brown/20 text-sm md:text-base"
             >
               <RotateCcw size={18} /> RESTART
             </button>
             <button 
                onClick={() => { setGameState(GameState.MENU); setIsPaused(false); }} 
                className="w-full bg-cream text-brown font-bold py-4 md:py-5 rounded-2xl hover:bg-brown/5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 border border-brown/10 text-sm md:text-base"
             >
               <Home size={16} /> HOME
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;