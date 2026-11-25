// The training board, drawn like the Chess OS board: a wood frame with the
// coordinates in it, Lichess's brown squares, and marks for right and wrong taps.
// The coordinate to find falls down the middle of the board as a token.

import React, { memo, useEffect, useRef } from 'react';
import PlaneSprite from './PlaneSprite';
import { FILES, RANKS, coordinateToString } from '../constants';
import type { Coordinate } from '../types';

export type SquareMark = 'hit' | 'miss' | 'answer';
export type DropStatus = 'falling' | 'landing' | 'crash';

export interface PointsChip {
  id: number;
  coord: Coordinate;
  text: string;
  good: boolean;
}

interface BoardProps {
  onSquare?: (coord: Coordinate) => void;
  disabled?: boolean;
  /** The coordinate being asked for, with how far it has fallen (0–100). */
  drop?: { id: number; target: Coordinate; progress: number; status: DropStatus; dest?: Coordinate } | null;
  marks?: Record<string, SquareMark>;
  points?: PointsChip | null;
  /** Changes on every 5-in-a-row: replays the star burst. */
  burstId?: number;
  /** Changes on every wrong tap: replays the shake. */
  shakeId?: number;
  paused?: boolean;
}

/** Centre of a square, in % of the board. */
export function squareCentre(c: Coordinate) {
  return {
    x: (FILES.indexOf(c.file) + 0.5) * 12.5,
    y: (RANKS.indexOf(c.rank) + 0.5) * 12.5,
  };
}

const BURST = ['⭐', '✨', '🌟', '⭐', '✨', '🌟', '⭐', '✨'];

const Squares = memo(function Squares({
  onSquare,
  disabled,
  marks,
}: Pick<BoardProps, 'onSquare' | 'disabled' | 'marks'>) {
  return (
    <>
      {RANKS.map((rank, r) =>
        FILES.map((file, f) => {
          const name = `${file}${rank}`;
          const mark = marks?.[name];
          const light = (f + r) % 2 === 0;
          return (
            <button
              key={name}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => {
                // Pointer-down, not click: on a speed drill the 100ms of a full click matters.
                if (e.button !== 0) return;
                onSquare?.({ file, rank });
              }}
              aria-label={`Square ${name}`}
              className={`cb-square ${light ? 'cb-light' : 'cb-dark'} ${mark ? `cb-mark-${mark}` : ''}`}
            >
              {mark === 'answer' && <span className="cb-label">{name}</span>}
              {mark === 'hit' && (
                <span className="fx-tick" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })
      )}
    </>
  );
});

const DEBRIS = [
  { dx: -46, dy: -38, r: -120, c: '#f97a12' },
  { dx: 44, dy: -42, r: 160, c: '#06a29b' },
  { dx: -52, dy: 18, r: 90, c: '#06a29b' },
  { dx: 50, dy: 26, r: -150, c: '#f97a12' },
  { dx: -12, dy: -58, r: 200, c: '#fbefd6' },
  { dx: 14, dy: 54, r: -90, c: '#f97a12' },
];

/** Fire, a white flash, smoke and bits of plane flying off. */
function Boom({ delay }: { delay: number }) {
  return (
    <span className="boom" style={{ ['--delay' as string]: `${delay}s` }} aria-hidden>
      <span className="boom-flash" />
      <svg viewBox="0 0 120 120" className="boom-fire">
        <polygon points="60,2 70,36 100,14 84,48 118,52 86,70 108,100 72,86 62,118 50,86 16,104 36,72 2,58 36,46 18,14 50,36" fill="#ff5a1f" />
        <polygon points="60,18 67,42 88,28 77,52 102,58 78,68 92,90 68,80 60,102 52,80 30,92 43,68 18,58 43,50 32,28 53,42" fill="#ffb21f" />
        <polygon points="60,36 65,50 78,44 71,57 86,62 70,66 76,80 63,72 58,86 53,72 42,78 49,66 34,60 49,55 43,44 55,50" fill="#fff3b0" />
      </svg>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`boom-smoke boom-smoke-${i}`} />
      ))}
      {DEBRIS.map((d, i) => (
        <span
          key={i}
          className="boom-bit"
          style={{
            background: d.c,
            ['--dx' as string]: `${d.dx}%`,
            ['--dy' as string]: `${d.dy}%`,
            ['--r' as string]: `${d.r}deg`,
          }}
        />
      ))}
    </span>
  );
}

function Drop({ target, progress, status, dest }: NonNullable<BoardProps['drop']>) {
  const top = -6 + progress * 1.06; // from just above the top edge to the bottom edge
  // Where it ends up: the right square when landing, the tapped square when it was wrong.
  const goal = status === 'landing' ? target : status === 'crash' ? dest : undefined;
  const end = goal ? squareCentre(goal) : null;
  // Nose points down; turn it towards the square it flies to.
  const turn = end ? (-Math.atan2(end.x - 50, end.y - top) * 180) / Math.PI : 0;
  const cls = status === 'landing' ? 'drop-landing' : status === 'crash' ? (dest ? 'drop-fly drop-crash' : 'drop-crash') : 'drop-falling';
  return (
    <div
      className={`drop ${cls}`}
      style={{
        left: end ? `${end.x}%` : '50%',
        top: end ? `${end.y}%` : `${top}%`,
      }}
      aria-hidden
    >
      <div className="plane" style={{ transform: `rotate(${turn}deg)` }}>
        <PlaneSprite label={coordinateToString(target)} />
      </div>
      {status === 'crash' && <Boom delay={dest ? 0.28 : 0} />}
    </div>
  );
}

const Board: React.FC<BoardProps> = ({
  onSquare,
  disabled,
  drop,
  marks,
  points,
  burstId = 0,
  shakeId = 0,
  paused = false,
}) => {
  // Shake on a wrong tap, without re-creating the board (that would replay every other effect).
  const frameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!shakeId || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    frameRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 240, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' }
    );
  }, [shakeId]);

  return (
    <div
      ref={frameRef}
      className="cb-frame"
      data-paused={paused}
    >
      <div className="cb-board" role="grid" aria-label="Chessboard">
        <Squares onSquare={onSquare} disabled={disabled} marks={marks} />

        {drop && <Drop key={drop.id} {...drop} />}

        {points && (
          <span
            key={points.id}
            className="fx-points"
            style={{
              left: `${squareCentre(points.coord).x}%`,
              top: `${squareCentre(points.coord).y}%`,
              background: points.good ? '#2f9e4f' : '#d63a2f',
            }}
            aria-hidden
          >
            {points.text}
          </span>
        )}

        {burstId > 0 && (
          <div key={`burst-${burstId}`} className="pointer-events-none absolute inset-0 z-40" aria-hidden>
            {BURST.map((e, i) => {
              const angle = (i / BURST.length) * 2 * Math.PI + 0.3;
              return (
                <span
                  key={i}
                  className="win-burst text-[6cqw]"
                  style={{
                    ['--tx' as string]: `${Math.cos(angle) * 36}cqw`,
                    ['--ty' as string]: `${Math.sin(angle) * 36}cqw`,
                    animationDelay: `${(i % 3) * 0.06}s`,
                  }}
                >
                  {e}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Coordinates on all four sides of the frame. */}
      {(['left', 'right'] as const).map((side) => (
        <div key={side} className={`cb-ranks cb-ranks-${side}`} aria-hidden>
          {RANKS.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      ))}
      {(['top', 'bottom'] as const).map((side) => (
        <div key={side} className={`cb-files cb-files-${side}`} aria-hidden>
          {FILES.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
