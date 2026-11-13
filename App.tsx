import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Trophy, Zap, Clock, Pause, Volume2, VolumeX, Home, Sparkles, Award } from 'lucide-react';
import { GameState, Coordinate, GameStats, MoveHistory, Difficulty } from './types';
import { MAIN_DURATION, getRandomCoordinate, DIFFICULTY_SETTINGS } from './constants';
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

  // --- Sound Playback (Synthesized via Web Audio API) ---
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
      // Two-note ascending chime (C5 → E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
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
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.115);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.2);
    } 
    else if (type === 'wrong') {
      // Soft low tone (160Hz)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.05, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } 
    else if (type === 'milestone') {
      // Ascending fanfare
      const duration = 0.08;
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      });
    } 
    else if (type === 'plane_drop') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.03, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (type === 'heartbeat') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'game_over') {
      const duration = 0.15;
      const freqs = [783.99, 659.25, 523.25, 261.63];
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration + 0.05);
      });
    } 
    else if (type === 'personal_best') {
      const duration = 0.1;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const time = now + idx * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.07, time + 0.02);
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
            endGame();
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
        const nextStreak = prev.streak + 1;
        let pointsToAdd = 5;
        if (nextStreak % 5 === 0) pointsToAdd += 10;
        return {
          ...prev,
          score: prev.score + pointsToAdd,
          streak: nextStreak,
          maxStreak: Math.max(prev.maxStreak, nextStreak),
          hits: prev.hits + 1,
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
      }, 350 + DIFFICULTY_SETTINGS[difficulty].spawnDelay);
    } else {
      playSound('wrong');
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch (_) {}
      }
      setIsExploding(true);
      
      setStats(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 5),
        streak: 0,
        misses: prev.misses + 1,
      }));

      setHistory(prev => [...prev, {
        target: activeTarget,
        wasCorrect: false,
        timeTakenMs: reactionTime,
        phase: 'main'
      }]);

      setTimeout(() => {
        setIsExploding(false);
        spawnPlane();
      }, 400 + DIFFICULTY_SETTINGS[difficulty].spawnDelay);
    }
  };

  const startGame = () => {
    setStats({
      score: 0,
      streak: 0,
      maxStreak: 0,
      hits: 0,
      misses: 0,
      totalSpawns: 0,
    });
    setHistory([]);
    setCoachFeedback('');
    setIsPaused(false);
    setIsLanding(false);
    setIsExploding(false);
    setLastResult(null);
    setLastRunAccuracy(null);
    lastTimeRef.current = 0;
    
    setGameState(GameState.MAIN_PLAY);
    setTimeLeft(MAIN_DURATION);
    spawnPlane();
  };

  // --- Render Clean HUD (VCA Brand) ---
  const renderHUD = () => {
    const timePercent = (timeLeft / MAIN_DURATION) * 100;
    const isCriticalTime = timeLeft <= 10;

    return (
      <header className="w-full fixed top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
        <div className="w-full bg-[#2D4A6B] text-white shadow-md border-b border-[#C8854A]/30 py-2.5 px-4 md:px-8 pointer-events-auto">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 md:gap-6">
            
            {/* Zone 1: Brand & Exit Action */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setGameState(GameState.MENU)}
                title="Return to Menu"
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#FDF0E4] flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                <Home size={16} />
              </button>
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFD447] block leading-none">
                  Venture Chess Academy
                </span>
                <span className="text-[9px] font-medium text-white/70 tracking-wide block mt-0.5">
                  Small Steps. Big Players.
                </span>
              </div>
            </div>

            {/* Zone 2: Three Clean Metric Controls */}
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Score */}
              <div className="flex flex-col items-center min-w-[55px] sm:min-w-[70px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Score
                </span>
                <span
                  key={stats.hits}
                  className={`text-xl sm:text-2xl font-black text-[#FFD447] tabular-nums leading-tight ${stats.hits > 0 ? 'animate-score-pop' : ''}`}
                >
                  {stats.score}
                </span>
              </div>

              {/* Streak */}
              <div className="flex flex-col items-center min-w-[55px] sm:min-w-[70px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Streak
                </span>
                <div className="flex items-center gap-1">
                  <Zap size={14} className={stats.streak >= 5 ? 'text-[#FFD447] fill-[#FFD447]' : 'text-white/40'} />
                  <span className={`text-xl sm:text-2xl font-black tabular-nums leading-tight ${stats.streak >= 5 ? 'text-[#FFD447]' : 'text-white'}`}>
                    {stats.streak}
                  </span>
                </div>
              </div>

              {/* Time Remaining */}
              <div className="flex flex-col items-center min-w-[55px] sm:min-w-[70px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Time
                </span>
                <div className="flex items-center gap-1">
                  <Clock size={14} className={isCriticalTime ? 'text-[#E94B35]' : 'text-white/70'} />
                  <span className={`text-xl sm:text-2xl font-black tabular-nums leading-tight ${isCriticalTime ? 'text-[#E94B35] animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Zone 3: Interactive Controls (Mute / Pause) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#FDF0E4] flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                {isMuted ? <VolumeX size={16} className="text-white/50" /> : <Volume2 size={16} />}
              </button>

              <button 
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume Session' : 'Pause Session'}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#FDF0E4] flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                {isPaused ? <Play size={16} className="fill-current" /> : <Pause size={16} className="fill-current" />}
              </button>
            </div>

          </div>
        </div>
        
        {/* Clean Progress Line (Caramel #C8854A) */}
        <div className="w-full h-1 bg-[#2D4A6B]/30">
          <div 
            className="h-full bg-[#C8854A] transition-all duration-1000 ease-linear"
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </header>
    );
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative font-sans bg-[#FDF0E4] text-[#4A2018] overflow-hidden select-none">
      
      {/* Serene Academy Canvas (Mode B: Educational) */}
      <GameBackground />

      {/* In-Game Navigation & Metric HUD */}
      {gameState === GameState.MAIN_PLAY && renderHUD()}

      {/* Centerpiece: Chessboard Container */}
      <main className={`relative z-10 pt-16 md:pt-20 pb-4 flex-1 flex flex-col justify-center items-center w-full max-w-[620px] px-3 h-full transition-opacity duration-300 ${gameState === GameState.MENU ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <ChessBoard 
          onSquareClick={handleSquareClick}
          activeTarget={activeTarget}
          lastResult={lastResult}
          planeProgress={gameState === GameState.MAIN_PLAY && !isPaused ? planeProgress : undefined}
          isLanding={isLanding}
          isExploding={isExploding}
        />
      </main>

      {/* Menu / Welcome Modal */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
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

      {/* Summary / Report Modal */}
      {gameState === GameState.SUMMARY && (
        <div className="absolute inset-0 bg-[#2D4A6B]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white text-[#4A2018] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-[#4A2018]/10 relative text-center z-10">
            
            {/* Top Brand Tag */}
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#2D4A6B] mb-1">
              Venture Chess Academy
            </div>
            <div className="text-[10px] font-semibold text-[#C8854A] mb-4">
              Small Steps. Big Players.
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#2D4A6B] tracking-tight">
              Session Complete
            </h2>

            {/* Personal Best Ribbon */}
            {isNewPersonalBest && (
              <div className="inline-flex items-center gap-1.5 bg-[#FFD447]/20 text-[#4A2018] font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider my-3 border border-[#FFD447]">
                <Award size={14} className="text-[#C8854A]" />
                New Academy Record!
              </div>
            )}

            {/* Score Showcase */}
            <div className="my-5 py-4 bg-[#FDF0E4] rounded-2xl border border-[#C8854A]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A2018]/60 block mb-1">
                Final Score
              </span>
              <span className="text-5xl sm:text-6xl font-black text-[#2D4A6B] tabular-nums tracking-tight">
                {stats.score}
              </span>
            </div>

            {/* Performance Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-[#FAF2EA] p-2.5 rounded-xl border border-[#4A2018]/5">
                <span className="text-[10px] font-semibold text-[#4A2018]/60 block">Accuracy</span>
                <span className="text-base font-extrabold text-[#2D4A6B] tabular-nums">
                  {Math.round((stats.hits / (stats.hits + stats.misses || 1)) * 100)}%
                </span>
              </div>
              <div className="bg-[#FAF2EA] p-2.5 rounded-xl border border-[#4A2018]/5">
                <span className="text-[10px] font-semibold text-[#4A2018]/60 block">Max Streak</span>
                <span className="text-base font-extrabold text-[#2D4A6B] tabular-nums">
                  {stats.maxStreak}
                </span>
              </div>
              <div className="bg-[#FAF2EA] p-2.5 rounded-xl border border-[#4A2018]/5">
                <span className="text-[10px] font-semibold text-[#4A2018]/60 block">Hits / Miss</span>
                <span className="text-base font-extrabold text-[#2D4A6B] tabular-nums">
                  {stats.hits}/{stats.misses}
                </span>
              </div>
            </div>

            {/* AI Coach Feedback Card */}
            <div className="text-left bg-[#FDF0E4] rounded-2xl p-4 mb-6 border border-[#2D4A6B]/10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-md bg-[#2D4A6B] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                  ♟
                </div>
                <span className="text-xs font-bold text-[#2D4A6B] uppercase tracking-wide">
                  Coach Analysis
                </span>
              </div>
              <p className="text-xs text-[#4A2018]/80 leading-relaxed font-medium">
                {isLoadingFeedback ? (
                  <span className="italic text-[#4A2018]/50">Analyzing your session performance...</span>
                ) : (
                  coachFeedback || "Consistent repetition builds instinctual coordinate sight. Excellent effort!"
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button 
                onClick={startGame} 
                className="w-full bg-[#C8854A] hover:bg-[#B67338] text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 shadow-md shadow-[#C8854A]/25 active:scale-[0.98]"
              >
                <RotateCcw size={16} />
                <span className="uppercase tracking-wider text-sm">Practice Again</span>
              </button>
              <button 
                onClick={() => setGameState(GameState.MENU)} 
                className="w-full bg-transparent hover:bg-[#FDF0E4] text-[#2D4A6B] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 border border-[#2D4A6B]/20 text-sm active:scale-[0.98]"
              >
                <Home size={16} />
                <span className="uppercase tracking-wider">Main Menu</span>
              </button>
            </div>

          </div>
        </div>
      )}
      
      {/* Clean Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 bg-[#2D4A6B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-xs border border-[#4A2018]/10 text-[#4A2018]">
            <span className="font-extrabold text-sm uppercase tracking-widest text-[#2D4A6B] mb-1">
              Venture Chess Academy
            </span>
            <span className="text-2xl font-black text-[#4A2018] mb-6">
              Session Paused
            </span>
            
            <button 
              onClick={() => setIsPaused(false)} 
              className="w-full bg-[#C8854A] hover:bg-[#B67338] text-white font-bold py-3 rounded-xl transition-all duration-150 mb-3 flex items-center justify-center gap-2 shadow-md shadow-[#C8854A]/25"
            >
              <Play size={16} className="fill-current" />
              <span className="uppercase tracking-wide text-xs">Resume</span>
            </button>
            <button 
              onClick={startGame} 
              className="w-full bg-[#2D4A6B] hover:bg-[#233A53] text-white font-bold py-3 rounded-xl transition-all duration-150 mb-3 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              <span className="uppercase tracking-wide text-xs">Restart</span>
            </button>
            <button 
              onClick={() => { setGameState(GameState.MENU); setIsPaused(false); }} 
              className="w-full bg-transparent hover:bg-[#FDF0E4] text-[#2D4A6B] font-bold py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 border border-[#2D4A6B]/20 text-xs"
            >
              <Home size={16} />
              <span className="uppercase tracking-wide">Main Menu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;