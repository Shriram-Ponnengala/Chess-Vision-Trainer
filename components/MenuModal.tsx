import React from 'react';
import { Volume2, VolumeX, Timer } from 'lucide-react';
import { Difficulty } from '../types';

interface MenuModalProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onStart: () => void;
  highScore: number;
}

const MenuModal: React.FC<MenuModalProps> = ({
  difficulty,
  setDifficulty,
  isMuted,
  setIsMuted,
  onStart,
  highScore,
}) => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto px-3 select-none">
      {/* Outer Card with layered drop shadow and rounded corners */}
      <div className="relative bg-[#fff8ef] rounded-[2rem] sm:rounded-[2.25rem] p-4 sm:p-5 md:p-6 shadow-[0_20px_50px_rgba(5,20,40,0.65),0_8px_20px_rgba(5,20,40,0.4),inset_0_2px_4px_#ffffff] border-[2.5px] border-[#fffdfa]/90 overflow-hidden">
        
        {/* Subtle Watermark Chess Texture in card background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ctext x='15' y='45' font-size='32' fill='%230f233f'%3E♞%3C/text%3E%3Ctext x='75' y='105' font-size='36' fill='%230f233f'%3E♜%3C/text%3E%3Ctext x='80' y='35' font-size='24' fill='%230f233f'%3E♟%3C/text%3E%3Ctext x='15' y='100' font-size='28' fill='%230f233f'%3E♝%3C/text%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px',
          }}
        />

        {/* Top-Left Embossed Audio Toggle Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fffdfa] hover:bg-white shadow-[0_2px_5px_rgba(0,0,0,0.08),inset_0_1.5px_2px_#ffffff] border border-[#ecd9c6] flex items-center justify-center transition-all duration-200 active:scale-90 z-20 group"
        >
          {isMuted ? (
            <VolumeX size={15} className="text-[#a08268] group-hover:text-[#4a2018]" />
          ) : (
            <Volume2 size={15} className="text-[#10233e] group-hover:text-[#c8854a]" />
          )}
        </button>

        {/* Top Illustration: Dotted Flight Arc + Clouds + Jet Airplane */}
        <div className="relative w-full h-[72px] sm:h-[80px] flex items-center justify-center overflow-visible mt-0.5">
          {/* Dotted Flight Trail */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M 60,85 C 130,25 210,15 295,42" 
              stroke="#b5c6d8" 
              strokeWidth="2.5" 
              strokeDasharray="5,6" 
              strokeLinecap="round"
            />
            {/* Small Gold Twinkling Stars */}
            <path d="M 125,28 Q 125,34 131,34 Q 125,34 125,40 Q 125,34 119,34 Q 125,34 125,28 Z" fill="#f59e0b" />
            <path d="M 285,30 Q 285,35 290,35 Q 285,35 285,40 Q 285,35 280,35 Q 285,35 285,30 Z" fill="#f59e0b" />
          </svg>

          {/* Fluffy White Clouds */}
          <div className="absolute left-[33%] top-[38%] pointer-events-none opacity-85 scale-90">
            <svg width="70" height="35" viewBox="0 0 70 35" fill="none">
              <path d="M 10,25 A 12,12 0 0,1 28,12 A 16,16 0 0,1 52,15 A 12,12 0 0,1 65,26 L 6,26 A 6,6 0 0,1 10,25 Z" fill="#ffffff" />
              <path d="M 10,25 A 12,12 0 0,1 28,12 A 16,16 0 0,1 52,15 A 12,12 0 0,1 65,26" stroke="#f1e5d5" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute right-[28%] top-[48%] pointer-events-none opacity-85 scale-65">
            <svg width="70" height="35" viewBox="0 0 70 35" fill="none">
              <path d="M 10,25 A 12,12 0 0,1 28,12 A 16,16 0 0,1 52,15 A 12,12 0 0,1 65,26 L 6,26 A 6,6 0 0,1 10,25 Z" fill="#ffffff" />
            </svg>
          </div>

          {/* Stylized Jet Plane banking right */}
          <div className="relative -rotate-[16deg] translate-y-[-2px] translate-x-[10px] filter drop-shadow-[0_6px_10px_rgba(15,35,63,0.22)]">
            <svg width="105" height="52" viewBox="0 0 120 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* White Airplane Fuselage */}
              <path 
                d="M 15,22 C 30,17 75,15 102,23 C 112,26 114,31 104,34 C 80,38 35,39 18,34 C 12,32 10,24 15,22 Z" 
                fill="#ffffff" 
                stroke="#0d223f" 
                strokeWidth="2.5" 
              />
              {/* Airplane Cockpit Windows */}
              <path 
                d="M 96,23 C 104,26 106,29 98,31 L 93,31 C 92,27 94,24 96,23 Z" 
                fill="#0d223f" 
              />
              {/* Cabin Windows Row (dots) */}
              <g fill="#0d223f">
                <circle cx="84" cy="27" r="1.8" />
                <circle cx="76" cy="27" r="1.8" />
                <circle cx="68" cy="27" r="1.8" />
                <circle cx="60" cy="27" r="1.8" />
                <circle cx="52" cy="27" r="1.8" />
                <circle cx="44" cy="27" r="1.8" />
              </g>

              {/* Yellow cheatline stripe along body */}
              <path 
                d="M 32,30 Q 65,30 94,30" 
                stroke="#f59e0b" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />

              {/* Tail Vertical Stabilizer */}
              <path 
                d="M 12,23 L 4,4 C 2,1 6,0 12,3 L 30,20 Z" 
                fill="#0d223f" 
                stroke="#0d223f" 
                strokeWidth="2" 
              />
              <path d="M 6,6 L 14,14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

              {/* Main Wing (Navy Blue) */}
              <path 
                d="M 44,28 L 30,48 C 28,51 32,53 37,51 L 65,32 Z" 
                fill="#0d223f" 
                stroke="#0d223f" 
                strokeWidth="2" 
              />
              {/* Jet Engine Nacelle (Yellow / Golden) */}
              <rect x="42" y="40" width="18" height="9" rx="4.5" fill="#f59e0b" stroke="#0d223f" strokeWidth="1.8" />
              <ellipse cx="44" cy="44.5" rx="2.5" ry="3.5" fill="#0d223f" />

              {/* Upper Wing (Back) */}
              <path 
                d="M 60,17 L 72,4 C 74,2 77,3 76,7 L 68,17 Z" 
                fill="#0d223f" 
              />
            </svg>
          </div>
        </div>

        {/* Main Title Section */}
        <div className="text-center mt-0">
          {/* COORDINATE */}
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-black text-[#0d223f] tracking-tight uppercase leading-[0.95] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.08)]">
            COORDINATE
          </h1>

          {/* TRAINER with stylized golden wings */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-1">
            {/* Left Golden Wing */}
            <svg width="26" height="16" viewBox="0 0 34 20" fill="none" className="shrink-0">
              <rect x="0" y="2" width="28" height="4.5" rx="2.25" fill="#f59e0b" />
              <rect x="6" y="8" width="24" height="4.5" rx="2.25" fill="#f59e0b" />
              <rect x="14" y="14" width="18" height="4.5" rx="2.25" fill="#f59e0b" />
            </svg>

            {/* TRAINER 3D Extruded Text */}
            <span 
              className="text-3xl sm:text-4xl md:text-[45px] font-black uppercase tracking-wider leading-none"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 45%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0px 2.5px 0px #b45309) drop-shadow(0px 5px 8px rgba(180,83,9,0.3))',
              }}
            >
              TRAINER
            </span>

            {/* Right Golden Wing */}
            <svg width="26" height="16" viewBox="0 0 34 20" fill="none" className="shrink-0 scale-x-[-1]">
              <rect x="0" y="2" width="28" height="4.5" rx="2.25" fill="#f59e0b" />
              <rect x="6" y="8" width="24" height="4.5" rx="2.25" fill="#f59e0b" />
              <rect x="14" y="14" width="18" height="4.5" rx="2.25" fill="#f59e0b" />
            </svg>
          </div>

          {/* Dark Navy Ribbon Banner */}
          <div className="relative inline-flex items-center justify-center my-1 max-w-full">
            {/* Left Ribbon Swallowtail */}
            <div 
              className="w-3.5 sm:w-4 h-6 sm:h-7 bg-[#091b33] shrink-0"
              style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }}
            />
            {/* Center Ribbon Body */}
            <div className="bg-[#0c213d] text-white font-black text-[9.5px] sm:text-[11px] tracking-[0.14em] uppercase px-3 sm:px-4 py-1 shadow-[0_3px_8px_rgba(12,33,61,0.35)] border-y border-[#1c3658] whitespace-nowrap">
              MASTER THE CHESSBOARD AT JET SPEED!
            </div>
            {/* Right Ribbon Swallowtail */}
            <div 
              className="w-3.5 sm:w-4 h-6 sm:h-7 bg-[#091b33] shrink-0"
              style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
            />
          </div>
        </div>

        {/* Divider with Center Star */}
        <div className="flex items-center justify-center gap-2.5 my-2">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#d4a373] to-[#d4a373]" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#d4a373] to-[#d4a373]" />
        </div>

        {/* Sub-Header: Target Icon + FIND THE RIGHT SQUARE */}
        <div className="flex items-center justify-center gap-2.5 mb-2.5 sm:mb-3">
          {/* Target Icon with Dart Hit */}
          <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 relative">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="17" stroke="#0d223f" strokeWidth="4" fill="#ffffff" />
              <circle cx="20" cy="20" r="10" stroke="#0d223f" strokeWidth="3" fill="#ffffff" />
              <circle cx="20" cy="20" r="4.5" fill="#f59e0b" />
              {/* Dart sticking in */}
              <line x1="28" y1="12" x2="20" y2="20" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
              <polygon points="34,6 28,12 31,15 37,9" fill="#f59e0b" />
              <polygon points="30,4 28,12 25,9 27,1" fill="#fcd34d" />
            </svg>
          </div>

          <div className="text-left">
            <h2 className="text-[#0d223f] font-black text-xs sm:text-sm md:text-base tracking-tight uppercase leading-tight">
              FIND THE RIGHT SQUARE
            </h2>
            <p className="text-[#486581] font-semibold text-[10px] sm:text-[11px]">
              How fast can you do it?
            </p>
          </div>
        </div>

        {/* Difficulty Selection Cards (EASY, MEDIUM, HARD) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
          
          {/* 1. EASY Card */}
          <button
            type="button"
            onClick={() => setDifficulty('easy')}
            className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              difficulty === 'easy'
                ? 'bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-white shadow-[0_5px_0_#15803d,0_8px_14px_rgba(22,163,74,0.4)] translate-y-[-2px] border-2 border-[#bbf7d0]'
                : 'bg-[#f7fbf7] hover:bg-[#edf7ee] text-[#166534] border-2 border-[#86efac]/80 shadow-[0_2.5px_0_#bbf7d0]'
            }`}
          >
            {/* Sprout Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 sm:w-6 sm:h-6 ${difficulty === 'easy' ? 'text-white' : 'text-[#16a34a]'}`}>
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-13" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" fill={difficulty === 'easy' ? '#ffffff' : '#22c55e'} />
                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" fill={difficulty === 'easy' ? '#ffffff' : '#22c55e'} />
              </svg>
            </div>
            <span className={`font-black text-xs sm:text-sm uppercase tracking-wide leading-tight ${difficulty === 'easy' ? 'text-white' : 'text-[#14532d]'}`}>
              EASY
            </span>
            <span className={`text-[9px] sm:text-[10px] font-semibold tracking-tight ${difficulty === 'easy' ? 'text-green-100' : 'text-[#4b6b4e]'}`}>
              Find squares
            </span>
          </button>

          {/* 2. MEDIUM Card (Highlighted in mockup) */}
          <button
            type="button"
            onClick={() => setDifficulty('medium')}
            className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              difficulty === 'medium'
                ? 'bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] text-white shadow-[0_5px_0_#b45309,0_10px_16px_rgba(217,119,6,0.45)] translate-y-[-2px] border-2 border-[#fef08a]'
                : 'bg-[#fffbf0] hover:bg-[#fff7e0] text-[#b45309] border-2 border-[#fcd34d] shadow-[0_2.5px_0_#fde68a]'
            }`}
          >
            {/* Lightning Bolt Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 sm:w-6 sm:h-6 ${difficulty === 'medium' ? 'text-white' : 'text-[#f59e0b]'}`}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className={`font-black text-xs sm:text-sm uppercase tracking-wide leading-tight ${difficulty === 'medium' ? 'text-white' : 'text-[#92400e]'}`}>
              MEDIUM
            </span>
            <span className={`text-[9px] sm:text-[10px] font-semibold tracking-tight ${difficulty === 'medium' ? 'text-amber-100' : 'text-[#8c532d]'}`}>
              Find faster
            </span>
          </button>

          {/* 3. HARD Card */}
          <button
            type="button"
            onClick={() => setDifficulty('hard')}
            className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              difficulty === 'hard'
                ? 'bg-gradient-to-b from-[#f87171] to-[#dc2626] text-white shadow-[0_5px_0_#991b1b,0_8px_14px_rgba(220,38,38,0.4)] translate-y-[-2px] border-2 border-[#fecaca]'
                : 'bg-[#fff8f8] hover:bg-[#ffeef0] text-[#991b1b] border-2 border-[#fca5a5] shadow-[0_2.5px_0_#fecaca]'
            }`}
          >
            {/* Flame Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 sm:w-6 sm:h-6 ${difficulty === 'hard' ? 'text-white' : 'text-[#ef4444]'}`}>
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
              </svg>
            </div>
            <span className={`font-black text-xs sm:text-sm uppercase tracking-wide leading-tight ${difficulty === 'hard' ? 'text-white' : 'text-[#7f1d1d]'}`}>
              HARD
            </span>
            <span className={`text-[9px] sm:text-[10px] font-semibold tracking-tight ${difficulty === 'hard' ? 'text-red-100' : 'text-[#804a4a]'}`}>
              Beat the clock
            </span>
          </button>

        </div>

        {/* Best Record / Time Pill Bar */}
        <div className="w-full bg-[#f2e6d6] border border-[#e5d2be] rounded-xl py-1.5 px-3.5 mb-2.5 sm:mb-3 flex items-center justify-center gap-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="w-5 h-5 rounded-full bg-[#0d223f] flex items-center justify-center shrink-0">
            <Timer size={11} className="text-[#fef08a]" />
          </div>
          <span className="text-[#0d223f] font-extrabold text-[10px] sm:text-[11px] md:text-xs tracking-wider uppercase">
            {highScore > 0 ? `BEAT YOUR BEST SCORE: ${highScore} PTS` : 'BEAT YOUR BEST TIME'}
          </span>
        </div>

        {/* Big 3D "TAKE OFF!" CTA Button */}
        <button
          type="button"
          onClick={onStart}
          className="group relative w-full bg-gradient-to-b from-[#fbb724] via-[#f59e0b] to-[#d97706] text-white rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-5 shadow-[0_5px_0_#b45309,0_10px_18px_rgba(180,83,9,0.38)] border-t border-[#fef08a]/60 flex items-center justify-center gap-2.5 transition-all duration-150 hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#b45309,0_4px_8px_rgba(180,83,9,0.3)]"
        >
          {/* Left Wing Accent */}
          <span className="hidden sm:inline-block font-black text-amber-200/80 tracking-tighter text-base select-none">
            ═
          </span>

          {/* Airplane Icon taking off */}
          <div className="shrink-0 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              <path d="M 21,16 L 21,14 L 13,9 L 13,3.5 C 13,2.67 12.33,2 11.5,2 C 10.67,2 10,2.67 10,3.5 L 10,9 L 2,14 L 2,16 L 10,13.5 L 10,19 L 8,20.5 L 8,22 L 11.5,21 L 15,22 L 15,20.5 L 13,19 L 13,13.5 L 21,16 Z" />
            </svg>
          </div>

          {/* Text */}
          <span 
            className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wider text-white"
            style={{
              textShadow: '0 2px 3px rgba(180, 83, 9, 0.6), 0 1px 0 #b45309',
            }}
          >
            TAKE OFF!
          </span>

          {/* Right Wing Accent */}
          <span className="hidden sm:inline-block font-black text-amber-200/80 tracking-tighter text-base select-none">
            ═
          </span>
        </button>

      </div>
    </div>
  );
};

export default MenuModal;
