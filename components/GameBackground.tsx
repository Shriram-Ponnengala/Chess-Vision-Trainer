import React from 'react';

const GameBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Warm Cream Academy Canvas (Brand Manual: #FDF0E4) */}
      <div className="absolute inset-0 bg-[#FDF0E4]" />

      {/* Subtle, soft ambient vignette */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(circle at 50% 45%, #FFFFFF 0%, #FDF0E4 65%, #F4E2D0 100%)',
        }}
      />

      {/* Minimalist, clean geometric chess linework grid */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4A2018 1px, transparent 1px),
            linear-gradient(to bottom, #4A2018 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Elegant, quiet chess watermark vectors (Academy character) */}
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          {/* Subtle Academy Star */}
          <g id="vca-subtle-star">
            <path 
              d="M0,-8 Q0,0 8,0 Q0,0 0,8 Q0,0 -8,0 Q0,0 0,-8 Z" 
              fill="#C8854A" 
              opacity="0.35"
            />
          </g>
          {/* Subtle Small Dot */}
          <circle id="vca-subtle-dot" cx="0" cy="0" r="2.5" fill="#2D4A6B" opacity="0.15" />
        </defs>

        {/* Top-Left Academy Watermark Motifs */}
        <g transform="translate(100, 120)" stroke="#2D4A6B" strokeWidth="1.5" fill="none" opacity="0.08">
          <circle cx="0" cy="0" r="32" strokeDasharray="3 3" />
          <path d="M-15,0 L15,0 M0,-15 L0,15" />
        </g>
        <use href="#vca-subtle-star" x="160" y="80" />
        <use href="#vca-subtle-dot" x="220" y="140" />

        {/* Top-Right Academy Watermark Motifs */}
        <g transform="translate(1100, 140)" stroke="#2D4A6B" strokeWidth="1.5" fill="none" opacity="0.08">
          {/* Clean Knight profile watermark */}
          <path d="M -16,20 C -22,8 -20,-10 -15,-22 C -12,-28 -4,-32 2,-36 L 10,-20 L 5,-15 C 4,-8 4,0 6,20 Z" />
          <circle cx="1" cy="-24" r="1.5" fill="#2D4A6B" />
        </g>
        <use href="#vca-subtle-star" x="1020" y="180" />
        <use href="#vca-subtle-dot" x="1080" y="240" />

        {/* Bottom-Left Watermark */}
        <g transform="translate(120, 680)" stroke="#4A2018" strokeWidth="1.5" fill="none" opacity="0.06">
          <rect x="-24" y="-24" width="48" height="48" rx="8" />
          <circle cx="0" cy="0" r="12" />
        </g>
        <use href="#vca-subtle-star" x="200" y="710" />

        {/* Bottom-Right Watermark */}
        <g transform="translate(1060, 660)" stroke="#C8854A" strokeWidth="1.5" fill="none" opacity="0.1">
          <circle cx="0" cy="0" r="40" strokeDasharray="4 4" />
          <circle cx="0" cy="0" r="24" />
        </g>
        <use href="#vca-subtle-star" x="980" y="620" />
      </svg>
    </div>
  );
};

export default React.memo(GameBackground);
