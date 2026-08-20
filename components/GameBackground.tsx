import React from 'react';

const GameBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Deep Navy Blue Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08182f] via-[#0d223f] to-[#071527]" />

      {/* Finely Textured 8x8 Chessboard Overlay Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `conic-gradient(rgba(255, 255, 255, 0.08) 90deg, transparent 90deg 180deg, rgba(255, 255, 255, 0.08) 180deg 270deg, transparent 270deg)`,
          backgroundSize: '56px 56px',
        }}
      />

      {/* Atmospheric Radial Glow in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-blue-500/10 rounded-full blur-[120px]" />

      {/* Background SVG Artwork: Flight Paths, Chess Watermarks, Stars, Clouds, Coordinates */}
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1000 700"
      >
        <defs>
          {/* Golden Sparkle Star Symbol (Compact) */}
          <g id="sparkle-star">
            <path 
              d="M0,-6.5 Q0,0 6.5,0 Q0,0 0,6.5 Q0,0 -6.5,0 Q0,0 0,-6.5 Z" 
              fill="#eab308" 
              opacity="0.9"
            />
            <circle cx="0" cy="0" r="1.3" fill="#fef08a" />
          </g>

          {/* Small Sparkle Star */}
          <g id="sparkle-small">
            <path 
              d="M0,-4 Q0,0 4,0 Q0,0 0,4 Q0,0 -4,0 Q0,0 0,-4 Z" 
              fill="#fbbf24" 
              opacity="0.75"
            />
          </g>

          {/* Compact Cloud Outline */}
          <g id="cloud-outline" stroke="#255285" strokeWidth="1.8" fill="none" opacity="0.32" strokeLinecap="round">
            <path d="M 0,11 A 9,9 0 0,1 13,3 A 12,12 0 0,1 31,6 A 10,10 0 0,1 42,11 A 7,7 0 0,1 39,17 L 6,17 A 6,6 0 0,1 0,11 Z" />
          </g>

          {/* Compact Precision PAWN Vector */}
          <g id="chess-pawn-detailed">
            {/* Circular Head */}
            <circle cx="0" cy="-30" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Collar Arc */}
            <path d="M -7,-18 C -4,-16 4,-16 7,-18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Symmetrical Waisted Neck/Body */}
            <path d="M -6,-17 C -3,-8 -3,3 -9,11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 6,-17 C 3,-8 3,3 9,11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Upper Tier Base Plinth */}
            <rect x="-11" y="11" width="22" height="6.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Lower Tier Base Plinth */}
            <rect x="-15" y="17.5" width="30" height="8.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Compact Precision KNIGHT Vector (Lichess style) */}
          <g id="chess-knight-detailed">
            {/* Base Plinths */}
            <rect x="-14" y="17.5" width="28" height="8.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="-10" y="11" width="20" height="6.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Outer Head & Body Contour */}
            <path 
              d="M -8,11 C -14,-2 -14,-18 -10,-30 C -7,-38 1,-43 5,-47 L 14,-26 L 7,-20 C 6,-13 6,-4 8,11" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Eye Dot */}
            <circle cx="4.5" cy="-31" r="2" fill="currentColor" stroke="none" />
            
            {/* Inner Curved Contour Line */}
            <path 
              d="M -5,-21 C -2,-11 -2,-2 -6,4" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
          </g>
        </defs>

        {/* Left Coordinates (Ranks 8 to 1) - Compact & Elegant */}
        <g fill="#254770" fontSize="13" fontWeight="700" fontFamily="'Outfit', sans-serif" opacity="0.65">
          <text x="14" y="55">8</text>
          <text x="14" y="140">7</text>
          <text x="14" y="225">6</text>
          <text x="14" y="310">5</text>
          <text x="14" y="395">4</text>
          <text x="14" y="480">3</text>
          <text x="14" y="565">2</text>
          <text x="14" y="650">1</text>
        </g>

        {/* Bottom Coordinates (Files a to h) - Compact & Elegant */}
        <g fill="#254770" fontSize="13" fontWeight="700" fontFamily="'Outfit', sans-serif" opacity="0.65">
          <text x="95" y="688">a</text>
          <text x="210" y="688">b</text>
          <text x="325" y="688">c</text>
          <text x="440" y="688">d</text>
          <text x="555" y="688">e</text>
          <text x="670" y="688">f</text>
          <text x="785" y="688">g</text>
          <text x="900" y="688">h</text>
        </g>

        {/* Floating Watermark Chess Pieces - Reduced Size */}
        <g fill="#3b82f6" opacity="0.05">
          <text x="175" y="140" fontSize="18">♛</text>
          <text x="295" y="520" fontSize="20">♝</text>
          <text x="600" y="200" fontSize="18">♟</text>
          <text x="565" y="490" fontSize="16">♟</text>
          <text x="810" y="130" fontSize="16">♟</text>
          <text x="830" y="270" fontSize="19">♜</text>
          <text x="705" y="590" fontSize="19">♝</text>
          <text x="175" y="420" fontSize="15">♟</text>
          <text x="770" y="325" fontSize="14">♟</text>
        </g>

        {/* Clouds - Compact */}
        <use href="#cloud-outline" x="55" y="35" />
        <use href="#cloud-outline" x="915" y="65" />
        <use href="#cloud-outline" x="135" y="490" />

        {/* Left Flight Path: Pawn -> Waypoint -> Knight */}
        <g>
          {/* Dashed curved flight trajectory */}
          <path 
            d="M 58,580 C 95,530 85,420 52,360 C 32,320 75,300 105,255" 
            stroke="#214b7c" 
            strokeWidth="1.8" 
            strokeDasharray="4,5" 
            fill="none" 
            opacity="0.8" 
          />
          {/* Flight Path Waypoint Dot */}
          <circle cx="88" cy="275" r="2.8" fill="#4d7bb2" opacity="0.8" />

          {/* Left Pawn */}
          <g transform="translate(58, 580)" className="text-[#1a4473]">
            <use href="#chess-pawn-detailed" />
          </g>

          {/* Left Knight (Lichess design) */}
          <g transform="translate(68, 205)" className="text-[#1a4473]">
            <use href="#chess-knight-detailed" />
          </g>
        </g>

        {/* Right Flight Path: Pawn -> Airplane */}
        <g>
          {/* Dashed trail */}
          <path 
            d="M 915,580 C 875,570 835,510 870,490 C 945,475 940,330 905,280 C 895,265 910,230 945,210" 
            stroke="#214b7c" 
            strokeWidth="1.8" 
            strokeDasharray="4,5" 
            fill="none" 
            opacity="0.8" 
          />
          {/* Waypoint Dot */}
          <circle cx="875" cy="490" r="2.8" fill="#4d7bb2" opacity="0.8" />

          {/* Right Bottom Pawn */}
          <g transform="translate(915, 580)" className="text-[#1a4473]">
            <use href="#chess-pawn-detailed" />
          </g>

          {/* Right Flying Airplane Silhouette (Compact) */}
          <g transform="translate(945, 195) rotate(-28) scale(0.36)" fill="#1a4473">
            <path d="M 20,0 L 50,0 C 65,0 75,8 80,15 C 75,22 65,30 50,30 L 20,30 L 0,48 L -12,48 L -5,30 L -30,30 L -42,42 L -50,42 L -46,24 L -46,6 L -50,-12 L -42,-12 L -30,0 L -5,0 L -12,-18 L 0,-18 Z" />
          </g>
        </g>

        {/* Scattered 4-pointed Golden Sparkle Stars (Compact) */}
        <use href="#sparkle-star" x="250" y="115" />
        <use href="#sparkle-star" x="95" y="350" />
        <use href="#sparkle-star" x="165" y="590" />
        <use href="#sparkle-star" x="660" y="38" />
        <use href="#sparkle-star" x="850" y="395" />
        <use href="#sparkle-star" x="965" y="475" />
        <use href="#sparkle-small" x="780" y="630" />
        <use href="#sparkle-small" x="450" y="578" />
        <use href="#sparkle-small" x="50" y="270" />
        <use href="#sparkle-small" x="710" y="98" />
      </svg>
    </div>
  );
};

export default GameBackground;
