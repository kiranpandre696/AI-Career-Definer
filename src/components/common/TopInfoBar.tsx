import React, { useEffect, useState } from 'react';
import { Bell, HelpCircle, ShieldCheck, Shield, Globe } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Notice } from '../../types.ts';
import { useLanguage, LanguageCode } from '../../context/LanguageContext.tsx';

interface TopInfoBarProps {
  onNavigate?: (route: string) => void;
}

export const TopInfoBar: React.FC<TopInfoBarProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiRequest('/api/notices').then((res) => {
      if (mounted && res.success && res.notices) {
        setNotices(res.notices);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (notices.length <= 1) return;
    const timer = setInterval(() => {
      setActiveNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [notices.length]);

  const currentNotice = notices[activeNoticeIndex];

  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Latest Update Ticker */}
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 sm:min-w-[240px]">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider border border-amber-500/30 whitespace-nowrap">
            <Bell className="w-3 h-3" />
            Updates
          </span>
          {currentNotice ? (
            <div className="truncate flex items-center gap-2">
              <span className="font-medium text-slate-200 truncate">{currentNotice.title}</span>
              <span className="text-slate-400 hidden sm:inline">({currentNotice.organizationName})</span>
              {currentNotice.status === 'NEW' && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                  NEW
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">
              Official reference portal for Central & State government examinations and career roadmaps
            </span>
          )}
        </div>

        {/* Right: Language Selection, Help Desk, and Admin Login */}
        <div className="flex items-center gap-3 text-slate-300 shrink-0">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Globe className="w-3 h-3 text-amber-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1 text-[11px] font-semibold cursor-pointer ${
                language === 'en' ? 'text-amber-400 font-bold underline' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setLanguage('te')}
              className={`px-1 text-[11px] font-semibold cursor-pointer ${
                language === 'te' ? 'text-amber-400 font-bold underline' : 'text-slate-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1 text-[11px] font-semibold cursor-pointer ${
                language === 'hi' ? 'text-amber-400 font-bold underline' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <button
            onClick={() => onNavigate?.('/help')}
            className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Help Desk</span>
          </button>

          <button
            onClick={() => onNavigate?.('/admin/login')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 transition-colors cursor-pointer text-[11px]"
            title="Official Administrator Authentication"
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
