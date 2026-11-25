import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX, Star } from 'lucide-react';
import { GameState, type Coordinate, type GameStats, type MoveHistory, type Difficulty } from './types';
import { MAIN_DURATION, DIFFICULTY_SETTINGS, getRandomCoordinate, coordinateToString } from './constants';
import Board, { type DropStatus, type PointsChip, type SquareMark } from './components/Board';
import { Brand, Button, Card, IconButton, Meter, Stat, ThemeToggle } from './components/ui';
import { getCoachFeedback } from './services/geminiService';
import { playSound, type Sound } from './services/sound';

const EMPTY_STATS: GameStats = { score: 0, streak: 0, maxStreak: 0, hits: 0, misses: 0, totalSpawns: 0 };

const PACES: { value: Difficulty; name: string; help: string; icon: string }[] = [
  { value: 'easy', name: 'Easy', help: 'Slow fall', icon: '🐢' },
  { value: 'medium', name: 'Medium', help: 'Standard', icon: '🐇' },
  { value: 'hard', name: 'Hard', help: 'Fast reflex', icon: '⚡' },
];

function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const v = localStorage.getItem(key);
  return (allowed as readonly string[]).includes(v ?? '') ? (v as T) : fallback;
}

const accuracyOf = (s: GameStats) => Math.round((s.hits / (s.hits + s.misses || 1)) * 100);

function starsFor(s: GameStats) {
  const acc = accuracyOf(s);
  if (s.hits >= 10 && acc >= 90) return 3;
  if (s.hits >= 5 && acc >= 70) return 2;
  return s.hits > 0 ? 1 : 0;
}
const TITLES = ['Keep practising!', 'Good effort!', 'Well done!', 'Brilliant!'];

const App: React.FC = () => {
  // Settings, remembered on this device.
  const [difficulty, setDifficulty] = useState<Difficulty>(() => stored('cvt-pace', ['easy', 'medium', 'hard'], 'medium'));
  const [muted, setMuted] = useState(() => localStorage.getItem('cvt-muted') === '1');
  useEffect(() => localStorage.setItem('cvt-pace', difficulty), [difficulty]);
  useEffect(() => localStorage.setItem('cvt-muted', muted ? '1' : '0'), [muted]);

  const [phase, setPhase] = useState<GameState>(GameState.MENU);
  const [paused, setPaused] = useState(false);
  const [stats, setStatsState] = useState<GameStats>(EMPTY_STATS);
  const [timeLeft, setTimeLeft] = useState(MAIN_DURATION);
  const [drop, setDrop] = useState<{ id: number; target: Coordinate; progress: number; status: DropStatus; dest?: Coordinate } | null>(null);
  const [marks, setMarks] = useState<Record<string, SquareMark>>({});
  const [points, setPoints] = useState<PointsChip | null>(null);
  const [burstId, setBurstId] = useState(0);
  const [shakeId, setShakeId] = useState(0);
  const [streakNote, setStreakNote] = useState<string | null>(null);

  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('chessCoordinateTrainerHighScore') || '0', 10) || 0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [missed, setMissed] = useState<string[]>([]);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // The game loop reads these refs, never state, so it always sees the latest values.
  const statsRef = useRef(EMPTY_STATS);
  const historyRef = useRef<MoveHistory[]>([]);
  const dropRef = useRef<typeof drop>(null);
  const timeRef = useRef(MAIN_DURATION);
  const pausedRef = useRef(false);
  const mutedRef = useRef(muted);
  const spawnAtRef = useRef(0);
  const dropIdRef = useRef(0);
  const sessionRef = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  mutedRef.current = muted;
  pausedRef.current = paused;

  const sound = useCallback((s: Sound) => {
    if (!mutedRef.current) playSound(s);
  }, []);

  const setStats = (fn: (s: GameStats) => GameStats) => {
    statsRef.current = fn(statsRef.current);
    setStatsState(statsRef.current);
  };
  const setDropBoth = (d: typeof drop) => {
    dropRef.current = d;
    setDrop(d);
  };
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  };

  const record = (target: Coordinate, wasCorrect: boolean) => {
    historyRef.current.push({ target, wasCorrect, timeTakenMs: Date.now() - spawnAtRef.current, phase: 'main' });
  };

  const spawn = () => {
    const prev = dropRef.current?.target;
    let target = getRandomCoordinate();
    while (prev && target.file === prev.file && target.rank === prev.rank) target = getRandomCoordinate();
    setMarks({});
    setDropBoth({ id: ++dropIdRef.current, target, progress: 0, status: 'falling' });
    spawnAtRef.current = Date.now();
    setStats((s) => ({ ...s, totalSpawns: s.totalSpawns + 1 }));
    sound('drop');
  };

  const delay = () => DIFFICULTY_SETTINGS[difficulty].spawnDelay;

  // The token reached the bottom: show where it was, then the next one.
  const timeOut = () => {
    const d = dropRef.current;
    if (!d) return;
    setStats((s) => ({ ...s, misses: s.misses + 1, streak: 0 }));
    record(d.target, false);
    setDropBoth({ ...d, progress: 100, status: 'crash' });
    setMarks({ [coordinateToString(d.target)]: 'answer' });
    sound('boom');
    later(spawn, 900 + delay());
  };

  const onSquare = (coord: Coordinate) => {
    const d = dropRef.current;
    if (phase !== GameState.MAIN_PLAY || pausedRef.current || !d || d.status !== 'falling') return;
    const tapped = coordinateToString(coord);
    const wanted = coordinateToString(d.target);

    if (tapped === wanted) {
      const streak = statsRef.current.streak + 1;
      const milestone = streak % 5 === 0;
      const gained = milestone ? 15 : 5;
      setStats((s) => ({
        ...s,
        score: s.score + gained,
        streak,
        maxStreak: Math.max(s.maxStreak, streak),
        hits: s.hits + 1,
      }));
      record(d.target, true);
      setMarks({ [tapped]: 'hit' });
      setPoints({ id: Date.now(), coord, text: `+${gained}`, good: true });
      setDropBoth({ ...d, status: 'landing' });
      if (milestone) {
        setBurstId((b) => b + 1);
        setStreakNote(`🔥 ${streak} in a row! +10 bonus`);
        later(() => setStreakNote(null), 2200);
        sound('milestone');
      } else {
        sound('correct');
      }
      later(spawn, 380 + delay());
    } else {
      setStats((s) => ({ ...s, score: Math.max(0, s.score - 5), streak: 0, misses: s.misses + 1 }));
      record(d.target, false);
      setMarks({ [tapped]: 'miss', [wanted]: 'answer' });
      setPoints({ id: Date.now(), coord, text: '−5', good: false });
      // The plane flies to the wrong square and explodes there; the board shakes as it hits.
      setDropBoth({ ...d, status: 'crash', dest: coord });
      later(() => {
        setShakeId((n) => n + 1);
        sound('boom');
      }, 280);
      sound('wrong');
      try {
        navigator.vibrate?.(20);
      } catch {
        /* not supported */
      }
      later(spawn, 1150 + delay());
    }
  };

  const endGame = () => {
    clearTimers();
    const session = sessionRef.current;
    const s = statsRef.current;
    setPhase(GameState.SUMMARY);
    setPaused(false);
    setDropBoth(null);
    setMarks({});
    setStreakNote(null);

    const missedSquares = [...new Set(historyRef.current.filter((h) => !h.wasCorrect).map((h) => coordinateToString(h.target)))];
    setMissed(missedSquares);

    const best = parseInt(localStorage.getItem('chessCoordinateTrainerHighScore') || '0', 10) || 0;
    const newBest = s.score > best;
    setIsNewBest(newBest);
    if (newBest) {
      localStorage.setItem('chessCoordinateTrainerHighScore', String(s.score));
      setHighScore(s.score);
      sound('personal_best');
    } else {
      sound('game_over');
    }

    setCoachFeedback('');
    setLoadingFeedback(true);
    getCoachFeedback(historyRef.current, s.score, accuracyOf(s)).then((text) => {
      if (sessionRef.current !== session) return; // a new game started meanwhile
      setCoachFeedback(text);
      setLoadingFeedback(false);
    });
  };

  const startGame = () => {
    clearTimers();
    sessionRef.current++;
    statsRef.current = EMPTY_STATS;
    setStatsState(EMPTY_STATS);
    historyRef.current = [];
    timeRef.current = MAIN_DURATION;
    setTimeLeft(MAIN_DURATION);
    setPaused(false);
    setPoints(null);
    setStreakNote(null);
    setPhase(GameState.MAIN_PLAY);
    spawn();
  };

  const goMenu = () => {
    clearTimers();
    sessionRef.current++;
    setPhase(GameState.MENU);
    setPaused(false);
    setDropBoth(null);
    setMarks({});
    setPoints(null);
    setStreakNote(null);
  };

  // The fall: one frame at a time, faster as the minute goes on.
  useEffect(() => {
    if (phase !== GameState.MAIN_PLAY) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50); // no jump after a background tab
      last = now;
      const d = dropRef.current;
      if (!pausedRef.current && d && d.status === 'falling') {
        const cfg = DIFFICULTY_SETTINGS[difficulty];
        const elapsed = MAIN_DURATION - timeRef.current;
        const step = (cfg.baseSpeed + (elapsed / MAIN_DURATION) * cfg.speedScaling) * (dt / 16.67);
        const progress = d.progress + step;
        if (progress >= 100) timeOut();
        else setDropBoth({ ...d, progress });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, difficulty]);

  // The clock.
  useEffect(() => {
    if (phase !== GameState.MAIN_PLAY || paused) return;
    const id = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) endGame();
      else if (timeRef.current <= 10) sound('tick');
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused]);

  // Space or P pauses; Enter starts from the menu or the results.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === GameState.MAIN_PLAY && (e.key === ' ' || e.key === 'p' || e.key === 'Escape')) {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (phase !== GameState.MAIN_PLAY && e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        startGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Leaving the tab mid-game pauses it.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phase === GameState.MAIN_PLAY) setPaused(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [phase]);

  useEffect(() => () => clearTimers(), []);

  const playing = phase === GameState.MAIN_PLAY;
  const accuracy = accuracyOf(stats);
  const critical = timeLeft <= 10;

  // ───────────── Side panels ─────────────

  // The home screen: its own page before the game, the board only appears once you press Start.
  const homeScreen = (
    <div className="fade-in mx-auto grid w-full max-w-5xl items-center gap-5 px-4 py-4 sm:gap-6 sm:py-6 lg:grid-cols-[1fr_24rem] lg:gap-10 lg:py-10">
      {/* Hero: a little board with a square falling into it, the title and what the game is. */}
      <div className="flex flex-col items-center gap-4 text-center sm:gap-5 lg:items-start lg:text-left">
        <div className="mini-board" aria-hidden>
          <Board disabled drop={{ id: 0, target: { file: 'e', rank: 4 }, progress: 30, status: 'falling' }} marks={{ e4: 'answer' }} />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Speed drill · 60 seconds</p>
          <h1 className="mt-1 font-brand text-[2rem] leading-tight font-semibold sm:text-5xl">Coordinate Trainer</h1>
          <p className="mt-1.5 max-w-md text-[0.95rem] leading-relaxed text-muted sm:mt-2 sm:text-base">
            A square name falls down the board. Tap that square before it reaches the bottom. Learn every square by sight.
          </p>
        </div>
        <ul className="hidden w-full max-w-md grid-cols-2 gap-x-4 gap-y-1.5 text-left text-sm text-muted sm:grid">
          {[
            ['✅', 'Right square: +5'],
            ['🔥', '5 in a row: +10'],
            ['❌', 'Wrong square: −5'],
            ['⏳', 'Too slow: streak resets'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-center gap-2">
              <span aria-hidden className="w-5 text-center">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Settings and Start. */}
      <div className="flex w-full flex-col gap-3">
        <Card>
          <p className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">Choose your pace</p>
          <div role="radiogroup" aria-label="Pace" className="grid grid-cols-3 gap-2">
            {PACES.map((p) => {
              const on = p.value === difficulty;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDifficulty(p.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 transition active:scale-[0.97] ${
                    on ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2 ring-1 ring-transparent hover:ring-line'
                  }`}
                >
                  <span aria-hidden className="text-2xl leading-none">
                    {p.icon}
                  </span>
                  <span className={`mt-1 text-[0.95rem] font-semibold ${on ? 'text-accent' : ''}`}>{p.name}</span>
                  <span className="text-[0.7rem] text-muted">{p.help}</span>
                </button>
              );
            })}
          </div>

        </Card>

        <Button variant="primary" size="lg" onClick={startGame} className="w-full">
          <Play size={20} className="fill-current" />
          Start training
        </Button>

        <p className="text-center text-xs text-muted">Press Enter to start · Space pauses</p>
      </div>
    </div>
  );

  const fallLeft = drop ? Math.max(0, 100 - drop.progress) : 0;
  const playPanel = (
    <>
      {/* What to find: big, so it reads from across the room. Hidden on phones (the token says it). */}
      <Card className="hidden text-center xl:block">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Find</p>
        <p key={drop?.id} className="pop-in font-brand text-6xl leading-tight font-semibold">
          {drop ? coordinateToString(drop.target) : '–'}
        </p>
        <div className="mx-auto mt-2 max-w-[12rem]">
          <Meter value={drop?.status === 'falling' ? fallLeft : 0} tone={fallLeft < 25 ? 'danger' : 'hint'} />
        </div>
      </Card>

      <Card className="p-3.5">
        <div className="flex items-start">
          <Stat label="Score" value={stats.score} tone="accent" bumpKey={stats.hits || undefined} />
          <Stat label="Streak" value={stats.streak >= 5 ? `🔥${stats.streak}` : stats.streak} tone={stats.streak >= 5 ? 'hint' : undefined} />
          <Stat label="Accuracy" value={stats.hits + stats.misses ? `${accuracy}%` : '–'} />
          <Stat label="Time" value={`${timeLeft}s`} tone={critical ? 'danger' : undefined} />
        </div>
        <div className="mt-3">
          <Meter value={(timeLeft / MAIN_DURATION) * 100} tone={critical ? 'danger' : 'accent'} />
        </div>
      </Card>

      {streakNote && (
        <p key={streakNote} className="pop-in rounded-2xl bg-accent-soft px-4 py-2.5 text-center font-semibold text-accent" aria-live="polite">
          {streakNote}
        </p>
      )}

      <div className="hidden gap-2 xl:flex">
        <Button onClick={() => setPaused((p) => !p)} className="flex-1" disabled={!playing}>
          {paused ? <Play size={16} className="fill-current" /> : <Pause size={16} className="fill-current" />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="ghost" onClick={goMenu}>
          End
        </Button>
      </div>
      <p className="hidden px-1 text-xs text-muted xl:block">Space pauses · Leaving the tab pauses too</p>
    </>
  );

  // ───────────── Page ─────────────

  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none">
      <header className="sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center bg-bg/85 px-2 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center">
          {phase !== GameState.MENU && (
            <IconButton label="Back to menu" onClick={goMenu}>
              <Home size={18} />
            </IconButton>
          )}
        </div>
        <Brand />
        <div className="flex items-center justify-end">
          {playing && (
            <IconButton label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </IconButton>
          )}
          <IconButton label={muted ? 'Sound off' : 'Sound on'} onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </IconButton>
          {/* Phones: no room for it next to Pause while playing. */}
          <span className={playing ? 'hidden sm:contents' : 'contents'}>
            <ThemeToggle />
          </span>
        </div>
      </header>

      {phase === GameState.MENU ? (
        <main className="flex flex-1 flex-col justify-center">{homeScreen}</main>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 pb-4 xl:flex-row xl:items-start xl:justify-center xl:gap-6 xl:px-6 xl:pt-4">
          <div className="relative">
            <Board
              onSquare={onSquare}
              disabled={!playing || paused}
              drop={playing && drop ? drop : null}
              marks={marks}
              points={playing ? points : null}
              burstId={burstId}
              shakeId={shakeId}
              paused={paused}
            />

            {paused && playing && (
              <div className="fade-in absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <div className="wd-card flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center shadow-xl ring-1 ring-line">
                  <p className="font-brand text-2xl font-semibold">Paused</p>
                  <p className="-mt-1 text-sm text-muted">
                    {stats.score} points · {timeLeft}s left
                  </p>
                  <Button variant="primary" onClick={() => setPaused(false)} className="w-full">
                    <Play size={16} className="fill-current" /> Resume
                  </Button>
                  <Button onClick={startGame} className="w-full">
                    <RotateCcw size={16} /> Restart
                  </Button>
                  <Button variant="ghost" onClick={goMenu} className="w-full">
                    Back to menu
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="flex w-full max-w-[40rem] flex-col gap-3 px-3 xl:w-80 xl:px-0">
            {playPanel}
          </aside>
        </main>
      )}

      {phase === GameState.SUMMARY && (
        <Summary
          stats={stats}
          isNewBest={isNewBest}
          highScore={highScore}
          missed={missed}
          coachFeedback={coachFeedback}
          loadingFeedback={loadingFeedback}
          difficulty={difficulty}
          onAgain={startGame}
          onMenu={goMenu}
        />
      )}
    </div>
  );
};

function Summary({
  stats,
  isNewBest,
  highScore,
  missed,
  coachFeedback,
  loadingFeedback,
  difficulty,
  onAgain,
  onMenu,
}: {
  stats: GameStats;
  isNewBest: boolean;
  highScore: number;
  missed: string[];
  coachFeedback: string;
  loadingFeedback: boolean;
  difficulty: Difficulty;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const stars = starsFor(stats);
  const pace = PACES.find((p) => p.value === difficulty)!.name;
  const items = [
    { label: 'Accuracy', value: `${accuracyOf(stats)}%` },
    { label: 'Best streak', value: stats.maxStreak },
    { label: 'Right / wrong', value: `${stats.hits} / ${stats.misses}` },
  ];
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-label="Results" className="wd-card w-full max-w-md rounded-3xl bg-surface p-6 text-center shadow-2xl ring-1 ring-line sm:p-7">
        <div className="flex justify-center gap-2" aria-label={`${stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              size={i === 1 ? 52 : 40}
              className={`wd-star ${i === 1 ? '-mt-2' : 'mt-1'} ${i < stars ? 'fill-[#f5c518] text-[#e0a800]' : 'fill-progress-off text-progress-off'}`}
              style={{ animationDelay: `${0.25 + i * 0.15}s` }}
            />
          ))}
        </div>

        <h2 className="wd-title mt-3 font-brand text-3xl font-semibold">{TITLES[stars]}</h2>
        <p className="mt-0.5 text-sm text-muted">{pace} pace · 60 seconds</p>

        {isNewBest && (
          <p className="pop-in mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-hint-soft px-3 py-1 text-sm font-semibold text-hint">
            <Trophy size={15} /> New personal best!
          </p>
        )}

        <div className="wd-stat mt-4 rounded-2xl bg-surface-2 py-4" style={{ animationDelay: '0.35s' }}>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Score</p>
          <p className="font-brand text-6xl leading-none font-semibold text-accent tabular-nums">{stats.score}</p>
          {!isNewBest && highScore > 0 && <p className="mt-1 text-xs text-muted">Best: {highScore}</p>}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {items.map((it, i) => (
            <div key={it.label} className="wd-stat rounded-xl bg-surface-2 px-2 py-2.5" style={{ animationDelay: `${0.45 + i * 0.08}s` }}>
              <p className="text-[0.7rem] text-muted">{it.label}</p>
              <p className="text-lg font-semibold tabular-nums">{it.value}</p>
            </div>
          ))}
        </div>

        {missed.length > 0 && (
          <div className="mt-4 text-left">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Squares to practise</p>
            <div className="flex flex-wrap gap-1.5">
              {missed.slice(0, 16).map((sq) => (
                <span key={sq} className="rounded-full bg-danger-soft px-2.5 py-0.5 font-brand text-sm font-semibold text-danger">
                  {sq}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-[#f5c518]/40 bg-hint-soft px-4 py-3 text-left">
          <p className="mb-0.5 text-xs font-semibold tracking-wide text-hint uppercase">♞ Coach's note</p>
          <p className="text-[0.95rem] leading-relaxed">
            {loadingFeedback ? (
              <span className="text-muted italic">Looking at your session…</span>
            ) : (
              coachFeedback || 'Every round makes the board feel smaller. Keep going!'
            )}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="primary" size="lg" onClick={onAgain} className="w-full">
            <RotateCcw size={18} /> Play again
          </Button>
          <Button variant="ghost" onClick={onMenu} className="w-full">
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
