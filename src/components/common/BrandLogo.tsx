import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  withContainer?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
  withContainer = false,
}) => {
  let dimension = 40;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs':
        dimension = 20;
        break;
      case 'sm':
        dimension = 28;
        break;
      case 'md':
        dimension = 40;
        break;
      case 'lg':
        dimension = 52;
        break;
      case 'xl':
        dimension = 68;
        break;
      case '2xl':
        dimension = 84;
        break;
    }
  }

  const svgContent = (
    <svg
      viewBox="0 0 200 200"
      width={dimension}
      height={dimension}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      aria-label="CAREER DEFINER Official Logo"
    >
      <defs>
        {/* Cap & Tassel Gradient */}
        <linearGradient id="brandCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f2452" />
        </linearGradient>

        {/* Star Glow / Gradient */}
        <linearGradient id="brandStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Aspirant Student Blue Gradient */}
        <linearGradient id="brandStudentGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        {/* Left Upper Book Wing (Vibrant Green) */}
        <linearGradient id="brandGreenLightL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>

        {/* Right Upper Book Wing (Vibrant Green) */}
        <linearGradient id="brandGreenLightR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>

        {/* Lower Green Leaves (Emerald) */}
        <linearGradient id="brandGreenDeep" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Bottom Crescent Foundation (Cyan / Azure) */}
        <linearGradient id="brandCrescentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* 1. Golden Star at Top Right (Aspiration / Success) */}
      <g transform="translate(162, 36)">
        <polygon
          points="0,-22 6.5,-8 21.5,-6 10.5,4.5 13.5,19 0,11.5 -13.5,19 -10.5,4.5 -21.5,-6 -6.5,-8"
          fill="url(#brandStarGrad)"
        />
      </g>

      {/* 2. Bottom Cyan/Azure Foundation Arc (Career & Global Base) */}
      <path
        d="M 24 135 C 40 168, 70 190, 100 190 C 130 190, 160 168, 176 135 C 158 162, 130 178, 100 178 C 70 178, 42 162, 24 135 Z"
        fill="url(#brandCrescentGrad)"
      />

      {/* 3. Lower Symmetrical Green Leaf Accents */}
      <path
        d="M 50 144 C 70 164, 88 175, 99 184 C 94 172, 80 156, 62 142 Z"
        fill="url(#brandGreenDeep)"
      />
      <path
        d="M 150 144 C 130 164, 112 175, 101 184 C 106 172, 120 156, 138 142 Z"
        fill="url(#brandGreenDeep)"
      />

      {/* 4. Left Flanking Book Wing (Education / Growth) */}
      <path
        d="M 76 112 C 60 90, 36 82, 18 90 C 12 110, 24 132, 48 144 C 64 134, 73 124, 76 112 Z"
        fill="url(#brandGreenLightL)"
      />
      <path
        d="M 28 92 C 40 102, 54 114, 70 125 C 60 134, 48 138, 38 134 C 28 126, 24 110, 28 92 Z"
        fill="url(#brandGreenDeep)"
        opacity="0.85"
      />

      {/* 5. Right Flanking Book Wing (Education / Growth) */}
      <path
        d="M 124 112 C 140 90, 164 82, 182 90 C 188 110, 176 132, 152 144 C 136 134, 127 124, 124 112 Z"
        fill="url(#brandGreenLightR)"
      />
      <path
        d="M 172 92 C 160 102, 146 114, 130 125 C 140 134, 152 138, 162 134 C 172 126, 176 110, 172 92 Z"
        fill="url(#brandGreenDeep)"
        opacity="0.85"
      />

      {/* 6. Student Aspirant Body & Outstretched Arm */}
      <path
        d="M 80 114 C 70 126, 68 144, 78 160 C 88 172, 96 178, 100 180 C 104 178, 112 172, 122 160 C 132 144, 130 126, 120 114 C 114 122, 107 128, 100 128 C 93 128, 86 122, 80 114 Z"
        fill="url(#brandStudentGrad)"
      />

      {/* Dynamically Raised Right Arm Reaching to the Star */}
      <path
        d="M 116 118 C 124 104, 138 82, 154 62 C 158 57, 161 54, 164 53 C 163 58, 157 69, 148 84 C 138 100, 126 120, 118 128 Z"
        fill="url(#brandStudentGrad)"
      />

      {/* Student Head */}
      <circle cx="100" cy="90" r="23" fill="url(#brandStudentGrad)" />

      {/* 7. Academic Graduation Cap (Mortarboard) */}
      <path
        d="M 84 56 C 84 56, 100 66, 116 56 L 116 50 C 100 58, 84 50, 84 50 Z"
        fill="#0f2452"
      />
      <polygon
        points="100,24 146,46 100,64 54,46"
        fill="url(#brandCapGrad)"
        stroke="#0f2452"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="46" r="3.5" fill="#f59e0b" />
      <path
        d="M 100 46 C 118 48, 132 54, 134 68"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="132,68 136,68 135,76 133,76" fill="#f59e0b" />
    </svg>
  );

  if (!withContainer) {
    return svgContent;
  }

  return (
    <div
      className="rounded-xl bg-white dark:bg-slate-800 p-1.5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0"
      style={{ width: dimension + 10, height: dimension + 10 }}
    >
      {svgContent}
    </div>
  );
};

export default BrandLogo;
