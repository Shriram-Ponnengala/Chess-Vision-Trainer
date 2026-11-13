import React from 'react';
import { Volume2, VolumeX, Trophy, Play, Compass, ShieldAlert, Sparkles } from 'lucide-react';
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
    <div className="relative w-full max-w-[440px] mx-auto px-4 select-none">
      {/* VCA Educational Academy Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_36px_rgba(45,74,107,0.12),0_2px_8px_rgba(74,32,24,0.06)] border border-[#4A2018]/10 overflow-hidden text-[#4A2018]">
        
        {/* Subtle Brand Accent Stripe at Top */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#2D4A6B] via-[#C8854A] to-[#FFD447]" />

        {/* Top Header Row: Brand Identity & Sound Toggle */}
        <div className="flex items-center justify-between mb-5 pt-1">
          {/* VCA Brand Lockup */}
          <div className="flex items-center gap-2.5">
            {/* VCA Crest Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#2D4A6B] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Clean Knight Outline */}
                <path d="M19 20H5V18C5 18 6 15 8 13C6 11 6 7 9 4C11 2 14 3 14 5C14 6 13 8 16 9C18 9.5 19 12 19 14V20Z" fill="#FDF0E4" stroke="#FDF0E4" strokeWidth="1" />
                <circle cx="10.5" cy="7.5" r="1" fill="#2D4A6B" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2D4A6B] leading-tight">
                Venture Chess Academy
              </div>
              <div className="text-[10px] font-semibold tracking-wide text-[#C8854A]">
                Small Steps. Big Players.
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-9 h-9 rounded-xl bg-[#FDF0E4] hover:bg-[#F5E2CF] text-[#2D4A6B] border border-[#C8854A]/20 flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            {isMuted ? (
              <VolumeX size={16} className="text-[#4A2018]/50" />
            ) : (
              <Volume2 size={16} className="text-[#2D4A6B]" />
            )}
          </button>
        </div>

        {/* Hero Hook: Simple & Clean Title */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-[#FDF0E4] text-[#2D4A6B] text-[11px] font-bold tracking-wider uppercase mb-2 border border-[#2D4A6B]/10">
            Interactive Speed Drill
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D4A6B] tracking-tight leading-tight">
            Coordinate Trainer
          </h1>
          <p className="text-xs sm:text-sm text-[#4A2018]/70 font-medium max-w-[320px] mx-auto mt-1.5 leading-relaxed">
            Spot the incoming coordinate and tap the matching square on the board before it lands.
          </p>
        </div>

        {/* Difficulty Selection: Clean Segmented Cards */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-[#4A2018]/80 mb-2">
            <span className="uppercase tracking-wider text-[11px] text-[#2D4A6B]">Select Pace</span>
            <span className="text-[11px] font-medium text-[#4A2018]/60">60-second challenge</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* EASY */}
            <button
              type="button"
              onClick={() => setDifficulty('easy')}
              className={`relative rounded-2xl p-3 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border ${
                difficulty === 'easy'
                  ? 'bg-[#2D4A6B] text-white border-[#2D4A6B] shadow-md shadow-[#2D4A6B]/20'
                  : 'bg-[#FDF0E4]/60 hover:bg-[#FDF0E4] text-[#4A2018] border-[#4A2018]/10'
              }`}
            >
              <Compass size={18} className={`mb-1.5 ${difficulty === 'easy' ? 'text-[#FFD447]' : 'text-[#2D4A6B]'}`} />
              <span className="font-extrabold text-xs uppercase tracking-wide">
                Easy
              </span>
              <span className={`text-[10px] mt-0.5 font-medium ${difficulty === 'easy' ? 'text-white/80' : 'text-[#4A2018]/60'}`}>
                Relaxed
              </span>
            </button>

            {/* MEDIUM (Recommended / Default) */}
            <button
              type="button"
              onClick={() => setDifficulty('medium')}
              className={`relative rounded-2xl p-3 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border ${
                difficulty === 'medium'
                  ? 'bg-[#2D4A6B] text-white border-[#2D4A6B] shadow-md shadow-[#2D4A6B]/20'
                  : 'bg-[#FDF0E4]/60 hover:bg-[#FDF0E4] text-[#4A2018] border-[#4A2018]/10'
              }`}
            >
              <Sparkles size={18} className={`mb-1.5 ${difficulty === 'medium' ? 'text-[#FFD447]' : 'text-[#C8854A]'}`} />
              <span className="font-extrabold text-xs uppercase tracking-wide">
                Medium
              </span>
              <span className={`text-[10px] mt-0.5 font-medium ${difficulty === 'medium' ? 'text-white/80' : 'text-[#4A2018]/60'}`}>
                Standard
              </span>
            </button>

            {/* HARD */}
            <button
              type="button"
              onClick={() => setDifficulty('hard')}
              className={`relative rounded-2xl p-3 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border ${
                difficulty === 'hard'
                  ? 'bg-[#2D4A6B] text-white border-[#2D4A6B] shadow-md shadow-[#2D4A6B]/20'
                  : 'bg-[#FDF0E4]/60 hover:bg-[#FDF0E4] text-[#4A2018] border-[#4A2018]/10'
              }`}
            >
              <ShieldAlert size={18} className={`mb-1.5 ${difficulty === 'hard' ? 'text-[#FFD447]' : 'text-[#E94B35]'}`} />
              <span className="font-extrabold text-xs uppercase tracking-wide">
                Hard
              </span>
              <span className={`text-[10px] mt-0.5 font-medium ${difficulty === 'hard' ? 'text-white/80' : 'text-[#4A2018]/60'}`}>
                Fast Reflex
              </span>
            </button>
          </div>
        </div>

        {/* High Score / Best Achievement Banner */}
        <div className="flex items-center justify-center gap-2 bg-[#FDF0E4] rounded-xl py-2 px-3.5 mb-5 border border-[#C8854A]/20">
          <Trophy size={15} className="text-[#C8854A] shrink-0" />
          <span className="text-[11px] font-semibold text-[#4A2018]">
            Academy Record:
          </span>
          <span className="text-xs font-black text-[#2D4A6B] tabular-nums">
            {highScore > 0 ? `${highScore} pts` : 'No score yet'}
          </span>
        </div>

        {/* Primary Action Button: Clean Caramel Academy CTA */}
        <button
          type="button"
          onClick={onStart}
          className="w-full bg-[#C8854A] hover:bg-[#B67338] active:scale-[0.98] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-[#C8854A]/25 flex items-center justify-center gap-2.5 transition-all duration-150"
        >
          <Play size={18} className="fill-white" />
          <span className="tracking-wide uppercase">Start Training</span>
        </button>

        {/* Clean Footer Subtext */}
        <p className="text-center text-[10px] font-medium text-[#4A2018]/50 mt-4">
          Visual learning system designed for chess mastery
        </p>

      </div>
    </div>
  );
};

export default MenuModal;
