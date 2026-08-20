import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Trophy, Zap, Clock, Pause, CheckCircle2, Volume2, VolumeX, Home } from 'lucide-react';
import { GameState, Coordinate, GameStats, MoveHistory, Difficulty } from './types';
import { MAIN_DURATION, getRandomCoordinate, coordinateToString, DIFFICULTY_SETTINGS } from './constants';
import ChessBoard from './components/ChessBoard';
import GameBackground from './components/GameBackground';
import MenuModal from './components/MenuModal';
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
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('chessCoordinateTrainerHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);

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

  // --- Sound Playback (Web Audio API Synthesized) ---
  const playSound = useCallback((type: 'correct' | 'wrong' | 'milestone' | 'plane_drop' | 'heartbeat' | 'game_over' | 'personal_best') => {
    if (isMuted) return;
    
    let ctx = audioContextRef.current;
    if (!ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
    }
    
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    if (type === 'correct') {
      // Correct answer: Two-note ascending chime (C5 → E5, 100ms each, sine wave)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.06, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.115);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.2);
    } 
    else if (type === 'wrong') {
      // Wrong answer: Low buzz (150Hz, 200ms, sawtooth wave, quick fade)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } 
    else if (type === 'milestone') {
      // Streak milestone (5x): Three-note ascending fanfare (C5 → E5 → G5, 80ms each)
      const duration = 0.08;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.07, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      });
    } 
    else if (type === 'plane_drop') {
      // Plane drop start: Soft descending whistle (800Hz → 400Hz, 300ms, sine wave)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === 'heartbeat') {
      // Heartbeat (last 10s): Low thump (60Hz, 100ms, sine wave with sharp attack)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01); // Sharp attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'game_over') {
      // Game over: Descending four-note melody (G5 → E5 → C5 → C4, 150ms each)
      const duration = 0.15;
      const freqs = [783.99, 659.25, 523.25, 261.63]; // G5, E5, C5, C4
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.07, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration + 0.05);
      });
    } 
    else if (type === 'personal_best') {
      // New personal best: Bright ascending arpeggio (C5 → E5 → G5 → C6, 100ms each)
      const duration = 0.1;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration + 0.1);
      });
    }
  }, [isMuted]);

  // --- Game Loop Logic ---

  const spawnPlane = useCallback(() => {
    setActiveTarget(getRandomCoordinate());
    setPlaneProgress(0);
    spawnTimeRef.current = Date.now();
    setStats(prev => ({ ...prev, totalSpawns: prev.totalSpawns + 1 }));
    playSound('plane_drop');
  }, [playSound]);

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
          if (prev <= 11 && prev > 1) {
            playSound('heartbeat');
          }
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isPaused, playSound]);

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

    // Personal Best Achievement Check
    const currentHighScore = parseInt(localStorage.getItem('chessCoordinateTrainerHighScore') || '0', 10);
    const isNewBest = stats.score > currentHighScore;
    if (isNewBest) {
      localStorage.setItem('chessCoordinateTrainerHighScore', stats.score.toString());
      setHighScore(stats.score);
      setIsNewPersonalBest(true);
      playSound('personal_best');
    } else {
      setIsNewPersonalBest(false);
      playSound('game_over');
    }

    const feedback = await getCoachFeedback(history, stats.score, accuracy);
    setCoachFeedback(feedback);
    setIsLoadingFeedback(false);
  };

  const handleSquareClick = (coord: Coordinate) => {
    if (isPaused || !activeTarget || gameState !== GameState.MAIN_PLAY || isLanding || isExploding) return;

    const isCorrect = coord.file === activeTarget.file && coord.rank === activeTarget.rank;
    const reactionTime = Date.now() - spawnTimeRef.current;

    setLastResult({ coord, success: isCorrect });
    setTimeout(() => setLastResult(null), 400);

    if (isCorrect) {
      const newStreak = stats.streak + 1;
      if (newStreak % 5 === 0) {
        playSound('milestone');
      } else {
        playSound('correct');
      }

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
        
        // Deduct 5 points for explosion (wrong answer), floor at 0
        setStats(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 5)
        }));

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
    const streak = stats.streak;

    // Determine visual states for the streak counter
    let streakContainerClass = "flex items-center gap-1.5 md:gap-2 px-3 py-1 rounded-xl transition-all duration-300 relative overflow-visible z-10";
    let zapIconClass = "md:w-5 md:h-5 transition-all duration-300 z-10 relative";
    let showLightning = false;
    let flameType: 'none' | 'orange' | 'blue' = 'none';

    if (streak >= 5 && streak <= 9) {
      // Glow caramel
      streakContainerClass += " glow-caramel-aura bg-gold/15 border border-gold/40";
      zapIconClass += " fill-gold text-gold scale-125";
    } else if (streak >= 10 && streak <= 14) {
      // Orange flame
      streakContainerClass += " bg-gold/15 border border-gold/40 shadow-inner";
      zapIconClass += " fill-gold text-white scale-125";
      flameType = 'orange';
    } else if (streak >= 15 && streak <= 19) {
      // Blue flame and subtle shake
      streakContainerClass += " bg-blue-500/15 border border-blue-400/40 animate-subtle-shake";
      zapIconClass += " fill-blue-400 text-blue-100 scale-125";
      flameType = 'blue';
    } else if (streak >= 20) {
      // Blue flame, glowing background, subtle shake, lightning bolt active
      streakContainerClass += " bg-yellow-400/25 border border-yellow-300/50 glow-caramel-aura animate-subtle-shake";
      zapIconClass += " fill-yellow-400 text-yellow-100 scale-125";
      showLightning = true;
      flameType = 'blue';
    } else if (streak > 2) {
      zapIconClass += " fill-gold text-gold scale-125";
    } else {
      zapIconClass += " text-cream/20";
    }

    return (
      <div className="w-full fixed top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
         <div className={`w-full bg-navy text-cream shadow-xl border-b border-[#c8854a]/20 py-2 md:py-4 px-3 md:px-8 pointer-events-auto transition-all duration-300 ${streak >= 20 ? 'shimmer-gold-bar' : ''}`}>
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 md:gap-4">
              
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[90px]">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5 md:mb-1">Score</span>
                 <span key={stats.score} className="text-xl md:text-3xl font-bold leading-none text-cream tracking-tight tabular-nums animate-[scale-in_0.2s_ease-out]">
                   {stats.score}
                 </span>
              </div>

              <div className="flex flex-col items-center min-w-[70px] md:min-w-[120px] overflow-visible">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5 md:mb-1">Streak</span>
                 <div className={streakContainerClass}>
                    {/* SVG Flame Behind the numbers */}
                    {flameType !== 'none' && (
                      <svg 
                        className={`absolute inset-x-0 bottom-[-8px] h-[52px] w-full pointer-events-none opacity-60 z-0 ${flameType === 'blue' ? 'flame-blue' : 'flame-orange'}`}
                        viewBox="0 0 100 120" 
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="orange-fire-gradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#f97316" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="blue-fire-gradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M15,100 C30,90 20,30 50,10 C80,30 70,90 85,100 C70,111 30,111 15,100 Z" 
                          fill={flameType === 'blue' ? "url(#blue-fire-gradient)" : "url(#orange-fire-gradient)"} 
                        />
                        <path 
                          d="M30,100 C40,95 35,60 50,40 C65,60 60,95 70,100 C60,106 40,106 30,100 Z" 
                          fill={flameType === 'blue' ? "#bae6fd" : "#fef08a"} 
                          className="opacity-80"
                        />
                      </svg>
                    )}

                    <Zap size={14} className={zapIconClass} />
                    <span key={stats.streak} className="text-xl md:text-3xl font-bold leading-none text-cream tracking-tight tabular-nums animate-[scale-in_0.2s_ease-out] z-10 relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {streak}
                    </span>

                    {/* Lightning Bolt extra indicator for Streak 20+ */}
                    {showLightning && (
                      <Zap size={16} className="md:w-6 md:h-6 text-yellow-300 fill-yellow-200 animate-bounce absolute -right-6 top-1/2 -translate-y-1/2 drop-shadow-[0_0_12px_rgba(250,204,21,0.95)] z-20" />
                    )}
                 </div>
              </div>

              <div className="flex flex-col items-center min-w-[60px] md:min-w-[90px]">
                 <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-gold/80 mb-0.5 md:mb-1">Time</span>
                 <span className={`text-xl md:text-3xl font-bold leading-none tabular-nums tracking-tight transition-all duration-300 ${timeLeft <= 10 ? 'text-gold animate-pulse scale-110' : 'text-cream'}`}>
                   {timeLeft}
                 </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3 ml-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="group w-9 h-9 md:w-11 md:h-11 rounded-xl bg-cream/5 hover:bg-cream/10 active:scale-90 flex items-center justify-center transition-all duration-300 border border-cream/10 hover:border-cream/30"
                >
                  {isMuted ? <VolumeX size={16} className="text-cream/40 group-hover:text-cream/60" /> : <Volume2 size={16} className="text-cream group-hover:text-gold" />}
                </button>

                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="group w-9 h-9 md:w-11 md:h-11 rounded-xl bg-cream/5 hover:bg-cream/10 active:scale-90 flex items-center justify-center transition-all duration-300 border border-cream/10 hover:border-cream/30"
                >
                  {isPaused ? <Play size={16} className="fill-cream" /> : <Pause size={16} className="fill-cream" />}
                </button>
              </div>
            </div>
         </div>
         
         <div className="w-full h-1 bg-navy/35">
            <div 
              className="h-full bg-gold transition-all duration-1000 ease-linear rounded-r-full"
              style={{ width: `${timePercent}%` }}
            />
         </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative font-sans bg-[#071527] overflow-hidden">
      
      {/* Deep Blue Chessboard Sky Theme Background (Image 1) */}
      <GameBackground />

      {gameState === GameState.MAIN_PLAY && renderHUD()}

      {/* Main Game Container - Responsive Padding Logic */}
      <div className={`relative z-10 pt-20 md:pt-28 pb-4 flex-1 flex flex-col justify-center items-center w-full max-w-[620px] px-4 h-full transition-opacity duration-500 ${gameState === GameState.MENU ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          <MenuModal
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onStart={startGame}
            highScore={highScore}
          />
        </div>
      )}

      {gameState === GameState.SUMMARY && (
        <div className="absolute inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-500 overflow-y-auto">
          {/* Celebration Graphics */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {[...Array(40)].map((_, i) => {
              const colors = ['bg-gold', 'bg-white', 'bg-cream', 'bg-[#c8854a]', 'bg-[#e8bfa4]'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const isCircle = Math.random() > 0.5;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [1, 1, 0],
                    scale: [0, Math.random() + 0.5, 0.5],
                    x: `${(Math.random() - 0.5) * 100}vw`,
                    y: `${(Math.random() - 0.5) * 100}vh`,
                    rotate: Math.random() * 720
                  }}
                  transition={{ duration: 2.5 + Math.random(), ease: "easeOut", delay: Math.random() * 0.2 }}
                  className={`absolute w-3 h-3 md:w-4 md:h-4 ${color} ${isCircle ? 'rounded-full' : 'rounded-sm'}`}
                />
              );
            })}
          </div>

          <div className="bg-cream text-brown p-6 md:p-14 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_24px_64px_rgba(45,74,107,0.3)] max-w-sm w-full mx-auto border border-white/10 relative text-center scale-in duration-300 my-auto mt-12 md:mt-0 z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="mt-8 md:mt-12 mb-6 md:mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-brown mb-6 tracking-tight">Congratulations!</h2>
              {isNewPersonalBest && (
                <div className="inline-block bg-gold text-cream font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4 animate-bounce shadow-md shadow-gold/25 border border-white/20">
                  👑 New Personal Best!
                </div>
              )}
              <div className="text-[10px] uppercase font-bold text-brown/40 mb-2 md:mb-3 tracking-[0.2em]">Score</div>
              <div className="text-6xl md:text-9xl font-bold text-brown tracking-tighter mb-2 md:mb-4">
                {stats.score}
              </div>
            </motion.div>
            <div className="space-y-3 md:space-y-4 relative z-20">
              <button 
                onClick={startGame} 
                className="w-full bg-gold text-white font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#b0733d] hover:shadow-xl active:scale-95 transition-all duration-300 shadow-xl shadow-gold/25 text-sm md:text-base"
              >
                <RotateCcw size={16} /> PLAY AGAIN
              </button>
              <button 
                onClick={() => setGameState(GameState.MENU)} 
                className="w-full bg-transparent text-brown hover:bg-brown/10 font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 border border-brown/20 text-sm md:text-base"
              >
                <Home size={16} /> HOME
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isPaused && (
        <div className="absolute inset-0 bg-navy/90 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in duration-300 p-6">
          <div className="bg-cream p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col items-center w-full max-w-xs md:max-w-sm border border-white/20 scale-in text-brown">
             <span className="font-bold text-xl md:text-2xl text-brown mb-8 md:mb-12 tracking-[0.3em] uppercase opacity-90">Paused</span>
             <button 
                onClick={() => setIsPaused(false)} 
                className="w-full bg-gold text-white font-bold py-4 md:py-5 rounded-2xl hover:bg-[#b0733d] hover:shadow-lg active:scale-95 transition-all duration-300 mb-4 md:mb-5 flex items-center justify-center gap-3 shadow-lg shadow-gold/20 text-sm md:text-base"
             >
               <Play size={20} className="fill-current" /> RESUME
             </button>
             <button 
                onClick={startGame} 
                className="w-full bg-brown text-cream font-bold py-4 md:py-5 rounded-2xl hover:bg-[#3d1812] hover:shadow-xl active:scale-95 transition-all duration-300 mb-4 md:mb-5 flex items-center justify-center gap-3 shadow-xl shadow-brown/25 text-sm md:text-base"
             >
               <RotateCcw size={18} /> RESTART
             </button>
             <button 
                onClick={() => { setGameState(GameState.MENU); setIsPaused(false); }} 
                className="w-full bg-transparent text-brown hover:bg-brown/10 font-bold py-4 md:py-5 rounded-2xl active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 border border-brown/20 text-sm md:text-base"
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