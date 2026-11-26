// VCA Coach: the coach who chats while you play, with the academy's logo as
// his face and speech bubbles that pop in under him.

import React, { memo } from 'react';
import type { Mood } from '../services/coach';

export interface CoachMessage {
  id: number;
  text: string;
  mood: Mood;
}

const MOOD_BADGE: Record<Mood, string> = {
  happy: '😄',
  wow: '🤩',
  fire: '🔥',
  think: '🤔',
  oops: '😬',
  clock: '⏰',
};

/** The coach's face: the Venture Chess Academy logo, with a small mood badge. */
export const CoachAvatar = memo(function CoachAvatar({ mood, size = 48 }: { mood: Mood; size?: number }) {
  return (
    <span className="coach-avatar" style={{ width: size, height: size }} aria-hidden>
      <img src="/vca-logo.png" alt="" width={size} height={size} draggable={false} />
      <span key={mood} className="coach-mood pop-in">
        {MOOD_BADGE[mood]}
      </span>
    </span>
  );
});

function Typing() {
  return (
    <span className="coach-bubble coach-typing" aria-label="VCA Coach is typing">
      <i />
      <i />
      <i />
    </span>
  );
}

const CoachChat: React.FC<{ messages: CoachMessage[]; typing: boolean; accuracy: string }> = ({ messages, typing, accuracy }) => {
  const mood = messages[messages.length - 1]?.mood ?? 'happy';
  return (
    <section className="coach-chat hidden min-h-0 flex-1 flex-col rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line xl:flex" aria-label="VCA Coach, your coach">
      <header className="flex items-center gap-3">
        <CoachAvatar mood={mood} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-brand text-lg leading-tight font-semibold">VCA Coach</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-2 rounded-full bg-accent" aria-hidden /> Your coach, watching you play
          </p>
        </div>
        <span className="text-right text-xs text-muted">
          Accuracy
          <span className="block font-semibold text-fg tabular-nums">{accuracy}</span>
        </span>
      </header>

      {/* Newest at the bottom, like a chat. Older bubbles scroll off the top. */}
      <div className="relative mt-3 min-h-24 flex-1">
        <div className="absolute inset-0 flex flex-col justify-end gap-2 overflow-hidden" aria-live="polite">
          {messages.map((m, i) => (
            <p
              key={m.id}
              className={`coach-bubble ${i === messages.length - 1 ? 'coach-bubble-new' : ''}`}
              style={{ opacity: Math.max(0.45, 1 - (messages.length - 1 - i) * 0.18) }}
            >
              {m.text}
            </p>
          ))}
          {typing && <Typing />}
        </div>
      </div>
    </section>
  );
};

/** Phones: just the coach's latest line, next to his face. */
export function CoachLatest({ message }: { message?: CoachMessage }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2.5 xl:hidden" aria-live="polite">
      <CoachAvatar mood={message.mood} size={40} />
      <p key={message.id} className="coach-bubble coach-bubble-new flex-1">
        {message.text}
      </p>
    </div>
  );
}

export default memo(CoachChat);
