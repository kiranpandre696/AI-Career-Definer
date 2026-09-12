import React from 'react';

/**
 * National Tricolour Strip for CAREER DEFINER
 * Official Colors in exact horizontal order:
 * 1. Saffron (Top) - #FF9933 / #FF671F
 * 2. White (Middle) - #FFFFFF
 * 3. India Green (Bottom) - #138808 / #046A38
 *
 * Elegant, thin, responsive, placed at the topmost position of the entire application.
 */
export const TricolorStrip: React.FC = () => {
  return (
    <div
      id="national-tricolor-strip"
      className="w-full flex flex-col select-none pointer-events-none sticky top-0 z-50 shadow-xs"
      role="presentation"
      aria-label="National Flag Tricolour Accent"
    >
      {/* 1. Saffron (Top) */}
      <div className="h-[2.5px] w-full bg-[#FF9933]" />
      {/* 2. White (Middle) */}
      <div className="h-[2px] w-full bg-[#FFFFFF]" />
      {/* 3. India Green (Bottom) */}
      <div className="h-[2.5px] w-full bg-[#138808]" />
    </div>
  );
};
