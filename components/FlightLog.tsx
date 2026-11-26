// The results card, as a boarding pass for the round just flown: the flight
// number, the first and last squares as the route, the score, pace and pilot
// rank on the ticket, then a tear-off stub with the stats, the squares to
// practise and the coach's note.

import React, { useEffect, useState } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import type { Difficulty, GameStats, MoveHistory } from '../types';
import { coordinateToString } from '../constants';
import { Button } from './ui';
import { CoachAvatar } from './CoachChat';

const RANKS = [
  { name: 'Trainee', stars: 0 },
  { name: 'Co-pilot', stars: 1 },
  { name: 'Captain', stars: 2 },
  { name: 'Ace', stars: 3 },
];
const PACE_NAME: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Counts up from 0 to `to` over about a second. */
function useCountUp(to: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return n;
}

/** The coach's note written from the round itself (used when the AI note is off). */
function localNote(stats: GameStats, accuracy: number, missed: string[], isNewBest: boolean) {
  const parts: string[] = [];
  if (isNewBest) parts.push(`${stats.score} points: your best ever! 🎉`);
  else if (accuracy >= 90) parts.push('Super accurate flying! 🎯');
  else if (stats.hits >= 15) parts.push('Lots of safe landings today! 🛬');
  else parts.push('Every flight makes you a better pilot. ✈️');
  if (stats.maxStreak >= 10) parts.push(`A ${stats.maxStreak}-square streak is seriously impressive. 🔥`);
  else if (stats.maxStreak >= 5) parts.push(`You kept a ${stats.maxStreak}-square streak going. 🔥`);
  if (missed.length) parts.push(`Next time, watch out for ${missed.slice(0, 3).join(', ')}. 💪`);
  else if (stats.hits > 0) parts.push('No squares missed at all. Amazing! 💯');
  return parts.join(' ');
}

interface FlightLogProps {
  stats: GameStats;
  history: MoveHistory[];
  accuracy: number;
  stars: number;
  isNewBest: boolean;
  highScore: number;
  missed: string[];
  flightNo: number;
  coachFeedback: string;
  loadingFeedback: boolean;
  difficulty: Difficulty;
  onAgain: () => void;
  onMenu: () => void;
}

const FlightLog: React.FC<FlightLogProps> = ({
  stats,
  history,
  accuracy,
  stars,
  isNewBest,
  highScore,
  missed,
  flightNo,
  coachFeedback,
  loadingFeedback,
  difficulty,
  onAgain,
  onMenu,
}) => {
  const score = useCountUp(stats.score);
  const rank = RANKS[stars];
  const from = history[0] ? coordinateToString(history[0].target) : 'a1';
  const to = history.length ? coordinateToString(history[history.length - 1].target) : 'h8';
  const right = history.filter((h) => h.wasCorrect);
  const avg = right.length ? right.reduce((a, h) => a + h.timeTakenMs, 0) / right.length / 1000 : null;
  const code = `VCA ${String(flightNo).padStart(3, '0')}`;
  const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const note = coachFeedback || localNote(stats, accuracy, missed, isNewBest);

  const stub = [
    { label: 'Landings', value: stats.hits, tone: 'text-accent' },
    { label: 'Crashes', value: stats.misses, tone: stats.misses ? 'text-danger' : '' },
    { label: 'Best run', value: `🔥${stats.maxStreak}`, tone: '' },
    { label: 'Accuracy', value: stats.hits + stats.misses ? `${accuracy}%` : '–', tone: '' },
  ];

  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-label={`Flight report: ${stats.score} points`} className="flight-log wd-card my-auto w-full max-w-md">
        {/* ── The ticket ── */}
        <div className="ticket-top bg-surface">
          <header className="flex items-center justify-between bg-accent px-5 py-3.5 text-white dark:text-[#10261a]">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase opacity-80">Venture Chess Air</p>
              <p className="mt-0.5 font-brand text-xl leading-tight font-semibold">Flight report ✈️</p>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase opacity-80">Flight · {date}</p>
              <p className="mt-0.5 font-brand text-lg leading-tight font-semibold tabular-nums">{code}</p>
            </div>
          </header>

          {/* Route: the first square asked to the last one. */}
          <div className="flex items-center gap-3 px-5 pt-4">
            <div>
              <p className="ticket-label">From</p>
              <p className="font-brand text-3xl leading-none font-semibold">{from}</p>
              <p className="mt-0.5 text-xs text-muted">Take-off</p>
            </div>
            <div className="route relative h-6 flex-1" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-progress-off" />
              <span className="route-plane absolute top-1/2 text-lg">✈️</span>
            </div>
            <div className="text-right">
              <p className="ticket-label">To</p>
              <p className="font-brand text-3xl leading-none font-semibold">{to}</p>
              <p className="mt-0.5 text-xs text-muted">Landed</p>
            </div>
          </div>

          <div className="grid grid-cols-[1.4fr_1fr_1.2fr] items-end gap-3 px-5 pt-4 pb-5">
            <div>
              <p className="ticket-label">Score</p>
              <p className="hud-score mt-1 text-[3.25rem]!">{score}</p>
            </div>
            <div>
              <p className="ticket-label">Pace</p>
              <p className="mt-1 font-brand text-lg leading-tight font-semibold">{PACE_NAME[difficulty]}</p>
            </div>
            <div>
              <p className="ticket-label">Pilot rank</p>
              <p className="mt-1 font-brand text-lg leading-tight font-semibold text-hint">{rank.name}</p>
              <p className="text-sm leading-none" aria-label={`${stars} of 3 stars`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`wd-star inline-block ${i < stars ? 'text-[#f5c518]' : 'text-progress-off'}`} style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                    ★
                  </span>
                ))}
              </p>
            </div>
          </div>

          {isNewBest ? (
            <p className="pop-in mx-5 mb-5 flex items-center justify-center gap-1.5 rounded-full bg-hint-soft py-1.5 text-sm font-semibold text-hint">
              <Trophy size={15} /> New personal best!
            </p>
          ) : (
            highScore > 0 && (
              <p className="mx-5 mb-5 text-center text-xs text-muted">
                Your best: <span className="font-semibold text-fg tabular-nums">{highScore}</span>
                {highScore > stats.score && <> · {highScore - stats.score} points to beat it</>}
              </p>
            )
          )}
        </div>

        {/* ── Tear-off stub ── */}
        <div className="ticket-stub bg-surface">
          <div className="mx-4 border-t-2 border-dashed border-progress-off" />
          <div className="grid grid-cols-4 gap-2 px-5 pt-4 text-center">
            {stub.map((s, i) => (
              <div key={s.label} className="wd-stat" style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
                <p className="ticket-label">{s.label}</p>
                <p className={`mt-1 font-brand text-xl leading-none font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {missed.length > 0 && (
            <div className="px-5 pt-4">
              <p className="ticket-label">Practise these</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {missed.slice(0, 12).map((sq) => (
                  <span key={sq} className="rounded-full bg-danger-soft px-2.5 py-0.5 font-brand text-sm font-semibold text-danger">
                    {sq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* The coach's note: the AI note when it's on, otherwise one written from the round. */}
          <div className="flex items-start gap-2.5 px-5 pt-4">
            <CoachAvatar mood={stars >= 2 ? 'fire' : stars === 1 ? 'happy' : 'think'} size={40} />
            <p className="coach-bubble coach-bubble-new flex-1 text-left">
              {loadingFeedback && !coachFeedback ? <span className="text-muted italic">Writing your flight notes…</span> : note}
            </p>
          </div>

          {/* Barcode, with the flight code and average speed under it. */}
          <div className="px-5 pt-4" aria-hidden>
            <div className="barcode h-9 rounded-sm" />
            <p className="mt-1 flex justify-between text-[0.65rem] tracking-[0.18em] text-muted uppercase tabular-nums">
              <span>{code}</span>
              <span>{avg !== null ? `Avg ${avg.toFixed(1)}s per square` : 'Square Trainer'}</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
            <Button variant="primary" size="lg" onClick={onAgain} className="w-full">
              <RotateCcw size={18} /> Fly again
            </Button>
            <Button variant="ghost" onClick={onMenu} className="w-full">
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightLog;
