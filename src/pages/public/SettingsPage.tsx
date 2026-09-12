import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Lock,
  Shield,
  CheckCircle2,
  Sliders,
  Laptop,
  ArrowLeft,
  Volume2,
  Mail,
  Smartphone,
  Eye,
} from 'lucide-react';
import { useLanguage, LanguageCode } from '../../context/LanguageContext.tsx';

interface SettingsPageProps {
  onNavigate?: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { language, setLanguage, t } = useLanguage();

  // Dark / Light Theme
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light';
  });

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(() => {
    return localStorage.getItem('pref_email_alerts') !== 'false';
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return localStorage.getItem('pref_sms_alerts') === 'true';
  });
  const [examReminders, setExamReminders] = useState(() => {
    return localStorage.getItem('pref_exam_reminders') !== 'false';
  });
  const [admitCardAlerts, setAdmitCardAlerts] = useState(() => {
    return localStorage.getItem('pref_admit_alerts') !== 'false';
  });

  // Privacy State
  const [publicProfile, setPublicProfile] = useState(() => {
    return localStorage.getItem('pref_public_profile') === 'true';
  });
  const [analyticsConsent, setAnalyticsConsent] = useState(() => {
    return localStorage.getItem('pref_analytics') !== 'false';
  });

  const [savedBanner, setSavedBanner] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSavePreferences = () => {
    localStorage.setItem('pref_email_alerts', String(emailAlerts));
    localStorage.setItem('pref_sms_alerts', String(smsAlerts));
    localStorage.setItem('pref_exam_reminders', String(examReminders));
    localStorage.setItem('pref_admit_alerts', String(admitCardAlerts));
    localStorage.setItem('pref_public_profile', String(publicProfile));
    localStorage.setItem('pref_analytics', String(analyticsConsent));

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Preferences & System Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize display theme, national regional language, notifications, and security options.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {savedBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your preferences have been saved and applied across the entire portal.</span>
        </div>
      )}

      {/* 1. Theme Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Display Mode (Theme)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select your preferred visual appearance. Applies consistently across public pages, student portal, and admin dashboard.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-500" />
            <span className="text-xs">System Auto</span>
          </button>
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-900 dark:text-amber-400" />
          <span>Language Selection (భాష / भाषा)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select portal language. Updating this immediately updates navigation headers, section headings, buttons, and labels across the whole website.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              language === 'en'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Official Default</div>
              <div className="text-sm font-extrabold mt-0.5">English</div>
            </div>
            {language === 'en' && <CheckCircle2 className="w-4 h-4 text-blue-900 dark:text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('te')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              language === 'te'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Regional (AP / TS)</div>
              <div className="text-sm font-extrabold mt-0.5">తెలుగు (Telugu)</div>
            </div>
            {language === 'te' && <CheckCircle2 className="w-4 h-4 text-blue-900 dark:text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              language === 'hi'
                ? 'border-blue-900 dark:border-amber-500 bg-blue-50/70 dark:bg-slate-800 text-blue-950 dark:text-white font-bold ring-2 ring-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">National (हिन्दी)</div>
              <div className="text-sm font-extrabold mt-0.5">हिन्दी (Hindi)</div>
            </div>
            {language === 'hi' && <CheckCircle2 className="w-4 h-4 text-blue-900 dark:text-amber-400" />}
          </button>
        </div>
      </div>

      {/* 3. Notification Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-900 dark:text-amber-400" />
          <span>Notification Preferences</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage how CAREER DEFINER alerts you to recruitment publications, syllabus revisions, and key dates.
        </p>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Notifications</div>
                <div className="text-[11px] text-slate-500">Receive summary alerts for new jobs matching your educational qualification</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">SMS Alerts for Deadlines</div>
                <div className="text-[11px] text-slate-500">Urgent SMS 48 hours prior to application close for saved opportunities</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Exam Date Reminders</div>
                <div className="text-[11px] text-slate-500">Official schedule announcements for Preliminary and Mains exams</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={examReminders}
              onChange={(e) => setExamReminders(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Privacy Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-900 dark:text-amber-400" />
          <span>Privacy Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Control your candidate profile visibility and analytical telemetry.
        </p>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Allow Verified Recruiters to View Match Profile</div>
              <div className="text-[11px] text-slate-500">Allows authorized partner public sector and corporate recruiters to view your extracted qualification skills</div>
            </div>
            <input
              type="checkbox"
              checked={publicProfile}
              onChange={(e) => setPublicProfile(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Anonymous Academic Analytics</div>
              <div className="text-[11px] text-slate-500">Contribute anonymized skill gap telemetry to improve national curriculum suggestions</div>
            </div>
            <input
              type="checkbox"
              checked={analyticsConsent}
              onChange={(e) => setAnalyticsConsent(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          className="py-2.5 px-6 bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
        >
          Save All Preferences
        </button>
      </div>
    </div>
  );
};
