// The in-game scoreboard, from hud-mockup.html: three panels side by side.
// Score: a big dark-green slab number on a checkerboard floor.
// Streak: a flame over the number, wrapped in gold laurels, on a floor.
// Time: the seconds inside a ring of 24 segments that switch off as time runs out.

import React, { memo } from 'react';

const SEGMENTS = 24; // one segment per 2.5 seconds of a 60-second round

function Laurel({ flip }: { flip?: boolean }) {
  return (
    <svg className="hud-laurel" viewBox="0 0 40 76" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M31 71C11 57 5 34 13 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="currentColor">
        <ellipse cx="12" cy="59" rx="4" ry="8" transform="rotate(-50 12 59)" />
        <ellipse cx="8" cy="46" rx="4" ry="8" transform="rotate(-62 8 46)" />
        <ellipse cx="8" cy="33" rx="4" ry="8" transform="rotate(-72 8 33)" />
        <ellipse cx="11" cy="21" rx="4" ry="8" transform="rotate(-45 11 21)" />
        <ellipse cx="18" cy="11" rx="4" ry="8" transform="rotate(-28 18 11)" />
      </g>
    </svg>
  );
}

function Flame() {
  return (
    <svg className="hud-flame" viewBox="0 0 40 48" aria-hidden>
      <path
        fill="currentColor"
        d="M22 1c2 11-8 13-5 23 2-4 6-6 8-11 8 8 12 15 10 23-2 8-8 12-16 12C8 48 2 41 3 32 4 23 12 18 13 9c5 4 6 8 6 12C24 15 25 9 22 1Z"
      />
      <path fill="#fff4dc" d="M20 28c4 5 7 7 6 12-1 4-4 6-8 5-4-1-6-4-5-8 1-3 4-5 7-9Z" />
    </svg>
  );
}

/** Segments around a circle; the first `lit` (clockwise from 12 o'clock) are on. */
const TimerRing = memo(function TimerRing({ lit, critical }: { lit: number; critical: boolean }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const seg = c / SEGMENTS;
  return (
    <svg viewBox="0 0 100 100" className="hud-ring" aria-hidden>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          className={i < lit ? (critical ? 'hud-seg hud-seg-crit' : 'hud-seg hud-seg-on') : 'hud-seg'}
          strokeDasharray={`${seg * 0.76} ${c}`}
          // Each segment starts at its own place round the ring, from the top, clockwise.
          transform={`rotate(${-90 + (i * 360) / SEGMENTS + (360 / SEGMENTS) * 0.12} 50 50)`}
        />
      ))}
    </svg>
  );
});

interface HudProps {
  score: number;
  streak: number;
  timeLeft: number;
  duration: number;
  /** Changes on every right answer: replays the score pop. */
  scoreKey?: number;
}

const Hud: React.FC<HudProps> = ({ score, streak, timeLeft, duration, scoreKey }) => {
  const critical = timeLeft <= 10;
  const lit = Math.ceil((Math.max(0, timeLeft) / duration) * SEGMENTS);
  const onFire = streak >= 5;
  return (
    <section className="hud" aria-label="Game stats">
      <div className="hud-metric">
        <h2 className="hud-label">Score</h2>
        <div key={scoreKey} className={`hud-score ${scoreKey ? 'bump' : ''}`} aria-live="off">
          {score}
        </div>
        <div className="hud-floor" aria-hidden />
      </div>

      <div className="hud-metric">
        <h2 className="hud-label">Streak</h2>
        <div className={`hud-streak ${streak === 0 ? 'hud-streak-cold' : ''} ${onFire ? 'hud-streak-fire' : ''}`}>
          <Flame />
          <div className="hud-laurels">
            <Laurel />
            <span key={streak} className={`hud-streak-value ${streak > 0 ? 'bump' : ''}`}>
              {streak}
            </span>
            <Laurel flip />
          </div>
        </div>
        <div className="hud-floor hud-floor-small" aria-hidden />
      </div>

      <div className="hud-metric">
        <h2 className="hud-label">Time</h2>
        <div
          className={`hud-timer ${critical ? 'hud-timer-crit' : ''}`}
          role="timer"
          aria-label={`${timeLeft} seconds remaining`}
        >
          <TimerRing lit={lit} critical={critical} />
          <span className="hud-time">
            {timeLeft}
            <small>s</small>
          </span>
        </div>
      </div>
    </section>
  );
};

export default memo(Hud);
