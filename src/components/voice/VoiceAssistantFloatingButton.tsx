import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface VoiceAssistantFloatingButtonProps {
  onClick: () => void;
}

export const VoiceAssistantFloatingButton: React.FC<VoiceAssistantFloatingButtonProps> = ({
  onClick,
}) => {
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40">
      <button
        onClick={onClick}
        className="group flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full shadow-xl hover:shadow-2xl border-2 border-amber-400/60 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
        title="AI Voice Career Assistant - Ask in Telugu, Hindi, or English"
        aria-label="Open AI Voice Career Assistant"
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping" />
          <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight whitespace-nowrap">
              Voice Assistant
            </span>
            <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-400/30 text-amber-200 border border-amber-400/40">
              AI
            </span>
          </div>
          <span className="text-[10px] text-blue-200 font-medium whitespace-nowrap hidden sm:inline">
            Telugu • Hindi • English
          </span>
        </div>
      </button>
    </div>
  );
};
