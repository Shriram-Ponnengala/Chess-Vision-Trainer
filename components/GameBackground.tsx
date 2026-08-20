import React from 'react';

const GameBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Deep Navy Blue Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08182f] via-[#0d223f] to-[#071527]" />

      {/* 8x8 Chessboard Overlay Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `conic-gradient(rgba(255, 255, 255, 0.07) 90deg, transparent 90deg 180deg, rgba(255, 255, 255, 0.07) 180deg 270deg, transparent 270deg)`,
          backgroundSize: '12.5% 12.5%',
        }}
      />

      {/* Atmospheric Radial Glow in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-blue-500/10 rounded-full blur-[140px]" />

      {/* Background SVG Artwork: Flight Paths, Chess Watermarks, Stars, Clouds, Coordinates */}
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1000 700"
      >
        <defs>
          {/* Golden Sparkle Star Symbol */}
          <g id="sparkle-star">
            <path 
              d="M0,-12 Q0,0 12,0 Q0,0 0,12 Q0,0 -12,0 Q0,0 0,-12 Z" 
              fill="#eab308" 
              opacity="0.9"
            />
            <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
          </g>

          {/* Small Sparkle Star */}
          <g id="sparkle-small">
            <path 
              d="M0,-7 Q0,0 7,0 Q0,0 0,7 Q0,0 -7,0 Q0,0 0,-7 Z" 
              fill="#fbbf24" 
              opacity="0.75"
            />
          </g>

          {/* Cloud Outline */}
          <g id="cloud-outline" stroke="#255285" strokeWidth="2.5" fill="none" opacity="0.35" strokeLinecap="round">
            <path d="M 0,20 A 16,16 0 0,1 24,6 A 22,22 0 0,1 56,12 A 18,18 0 0,1 76,20 A 12,12 0 0,1 70,30 L 10,30 A 10,10 0 0,1 0,20 Z" />
          </g>

          {/* Precision PAWN Vector (matching image 2 & 3) */}
          <g id="chess-pawn-detailed">
            {/* Circular Head */}
            <circle cx="0" cy="-56" r="18" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Collar Arc */}
            <path d="M -13,-34 C -7,-30 7,-30 13,-34" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Symmetrical Waisted Neck/Body */}
            <path d="M -11,-32 C -5,-14 -5,6 -18,22" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 11,-32 C 5,-14 5,6 18,22" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Upper Tier Base Plinth */}
            <rect x="-21" y="22" width="42" height="12" rx="3.5" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Lower Tier Base Plinth */}
            <rect x="-28" y="34" width="56" height="15" rx="4.5" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Precision KNIGHT Vector (Lichess style from reference image) */}
          <g id="chess-knight-detailed">
            {/* Base Plinths */}
            <rect x="-25" y="33" width="50" height="15" rx="4.5" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="-18" y="22" width="36" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Outer Head & Body Contour */}
            <path 
              d="M -14,22 C -24,-2 -25,-32 -18,-54 C -13,-68 2,-78 9,-84 L 24,-48 L 12,-36 C 10,-24 10,-8 13,22" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Eye Dot */}
            <circle cx="8.5" cy="-56" r="3.6" fill="currentColor" stroke="none" />
            
            {/* Inner Curved Contour Line */}
            <path 
              d="M -9,-38 C -4,-20 -4,-4 -11,8" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.8" 
              strokeLinecap="round" 
            />
          </g>
        </defs>

        {/* Left Coordinates (Ranks 8 to 1) */}
        <g fill="#254770" fontSize="22" fontWeight="700" fontFamily="'Outfit', sans-serif" opacity="0.8">
          <text x="26" y="48">8</text>
          <text x="26" y="132">7</text>
          <text x="26" y="218">6</text>
          <text x="26" y="304">5</text>
          <text x="26" y="390">4</text>
          <text x="26" y="476">3</text>
          <text x="26" y="562">2</text>
          <text x="26" y="648">1</text>
        </g>

        {/* Bottom Coordinates (Files a to h) */}
        <g fill="#254770" fontSize="22" fontWeight="700" fontFamily="'Outfit', sans-serif" opacity="0.8">
          <text x="105" y="682">a</text>
          <text x="220" y="682">b</text>
          <text x="335" y="682">c</text>
          <text x="445" y="682">d</text>
          <text x="555" y="682">e</text>
          <text x="670" y="682">f</text>
          <text x="785" y="682">g</text>
          <text x="895" y="682">h</text>
        </g>

        {/* Floating Watermark Chess Pieces */}
        <g fill="#3b82f6" opacity="0.07">
          <text x="175" y="140" fontSize="32">♛</text>
          <text x="295" y="520" fontSize="38">♝</text>
          <text x="600" y="200" fontSize="32">♟</text>
          <text x="565" y="490" fontSize="30">♟</text>
          <text x="810" y="130" fontSize="30">♟</text>
          <text x="830" y="270" fontSize="34">♜</text>
          <text x="705" y="590" fontSize="34">♝</text>
          <text x="175" y="420" fontSize="28">♟</text>
          <text x="770" y="325" fontSize="24">♟</text>
        </g>

        {/* Clouds */}
        <use href="#cloud-outline" x="75" y="25" />
        <use href="#cloud-outline" x="900" y="55" />
        <use href="#cloud-outline" x="155" y="495" />

        {/* Left Flight Path: Pawn -> Waypoint -> Knight */}
        <g>
          {/* Dashed curved flight trajectory */}
          <path 
            d="M 82,570 C 130,510 120,400 75,340 C 45,295 105,275 140,225" 
            stroke="#214b7c" 
            strokeWidth="3.2" 
            strokeDasharray="7,9" 
            fill="none" 
            opacity="0.9" 
          />
          {/* Flight Path Waypoint Dot */}
          <circle cx="122" cy="245" r="4.5" fill="#4d7bb2" opacity="0.85" />

          {/* Left Pawn (Image 2) */}
          <g transform="translate(82, 570) scale(1.18)" className="text-[#1a4473]">
            <use href="#chess-pawn-detailed" />
          </g>

          {/* Left Knight (Image 1) */}
          <g transform="translate(92, 175) scale(1.18)" className="text-[#1a4473]">
            <use href="#chess-knight-detailed" />
          </g>
        </g>

        {/* Right Flight Path: Pawn -> Airplane */}
        <g>
          {/* Dashed trail */}
          <path 
            d="M 880,570 C 825,560 765,490 820,470 C 935,450 930,300 880,240 C 865,220 890,190 940,165" 
            stroke="#214b7c" 
            strokeWidth="3.2" 
            strokeDasharray="7,9" 
            fill="none" 
            opacity="0.9" 
          />
          {/* Waypoint Dot */}
          <circle cx="828" cy="470" r="4.5" fill="#4d7bb2" opacity="0.85" />

          {/* Right Bottom Pawn (Image 3) */}
          <g transform="translate(880, 570) scale(1.18)" className="text-[#1a4473]">
            <use href="#chess-pawn-detailed" />
          </g>

          {/* Right Flying Airplane Silhouette */}
          <g transform="translate(935, 148) rotate(-28) scale(0.65)" fill="#1a4473">
            <path d="M 20,0 L 50,0 C 65,0 75,8 80,15 C 75,22 65,30 50,30 L 20,30 L 0,48 L -12,48 L -5,30 L -30,30 L -42,42 L -50,42 L -46,24 L -46,6 L -50,-12 L -42,-12 L -30,0 L -5,0 L -12,-18 L 0,-18 Z" />
          </g>
        </g>

        {/* Scattered 4-pointed Golden Sparkle Stars (as in reference images) */}
        <use href="#sparkle-star" x="280" y="125" />
        <use href="#sparkle-star" x="118" y="340" />
        <use href="#sparkle-star" x="195" y="580" />
        <use href="#sparkle-star" x="660" y="38" />
        <use href="#sparkle-star" x="835" y="395" />
        <use href="#sparkle-star" x="970" y="475" />
        <use href="#sparkle-small" x="765" y="630" />
        <use href="#sparkle-small" x="450" y="578" />
        <use href="#sparkle-small" x="70" y="260" />
        <use href="#sparkle-small" x="710" y="98" />
      </svg>
    </div>
  );
};

export default GameBackground;
