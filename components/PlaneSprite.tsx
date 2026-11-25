// The falling plane, drawn from the design the academy chose: a flat orange and
// teal plane seen from above, nose down, with the square name in big black
// letters on a cream band across the fuselage. Drawn in SVG so the name can change.

import React, { memo } from 'react';

const INK = '#141210';
const ORANGE = '#ff6200';
const TEAL = '#039693';
const CREAM = '#fbefd2';

const FUSELAGE = 'M116 60 L122 8 Q129 1 136 8 L142 60 C158 74 166 104 166 128 C166 170 148 210 129 240 C110 210 92 170 92 128 C92 104 100 74 116 60 Z';
const WING = 'M94 101 L16 113 Q2 116 3 128 Q4 139 17 142 L94 160 Z';
const STABILISER = 'M118 30 L79 33 Q70 34 71 41 Q72 46 78 48 L114 60 Z';

function Side() {
  return (
    <>
      <path d={STABILISER} fill={TEAL} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <g clipPath="url(#plane-wing)">
        <path d={WING} fill={TEAL} />
        <rect x="0" y="90" width="56" height="80" fill={ORANGE} />
      </g>
      <path d={WING} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  );
}

const PlaneSprite = memo(function PlaneSprite({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 258 244" className="plane-svg" role="img" aria-label={`Plane to ${label}`}>
      <defs>
        <clipPath id="plane-wing">
          <path d={WING} />
        </clipPath>
        <clipPath id="plane-body">
          <path d={FUSELAGE} />
        </clipPath>
      </defs>

      <Side />
      <g transform="translate(258 0) scale(-1 1)">
        <Side />
      </g>

      {/* Fuselage with the cream name band and the teal cockpit */}
      <path d={FUSELAGE} fill={ORANGE} />
      <g clipPath="url(#plane-body)">
        <path d="M88 84 Q129 76 170 84 V166 Q129 174 88 166 Z" fill={CREAM} />
      </g>
      <path d={FUSELAGE} fill="none" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <path
        d="M110 183 H148 Q153 183 151.5 188 L145 202 Q140 211 129 211 Q118 211 113 202 L106.5 188 Q105 183 110 183 Z"
        fill={TEAL}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* The square name: heavy capitals that fill the band */}
      <text
        x="129"
        y="125"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily='"Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif'
        fontWeight="900"
        fontSize="66"
        textLength="66"
        lengthAdjust="spacingAndGlyphs"
        fill={INK}
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
});

export default PlaneSprite;
