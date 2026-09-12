import React, { useState } from 'react';
import {
  Search,
  User,
  Shield,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  LogOut,
  Bookmark,
  Bell,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch?: () => void;
  onOpenAuth?: (role?: 'STUDENT' | 'ADMIN') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSearch, onOpenAuth }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const navLinks = [
    { label: t('nav.home', 'Home'), path: '/' },
    { label: t('nav.govtJobs', 'Government Jobs'), path: '/government-jobs' },
    { label: t('nav.privateJobs', 'Private Jobs'), path: '/private-jobs' },
    { label: t('nav.examinations', 'Examinations'), path: '/examinations' },
    { label: 'AI Roadmap', path: '/career-roadmap' },
    { label: 'AI Mock Interview', path: '/mock-interview' },
    { label: 'Exam Prep', path: '/exam-prep' },
    { label: t('nav.guidance', 'Career Guidance'), path: '/career-guidance' },
    { label: t('nav.about', 'About'), path: '/about' },
    { label: t('nav.help', 'Help Desk'), path: '/help' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors overflow-hidden">
      {/* Tier 1: Main Brand & Utility Header Bar */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-[3.75rem] sm:min-h-[4.25rem] py-1.5 sm:py-2 gap-2">
          {/* Brand Logo & Tagline */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0 shrink"
            onClick={() => handleNav('/')}
            title="CAREER DEFINER - National Career Portal"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
              <BrandLogo size={28} className="drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg lg:text-xl tracking-tight text-blue-950 dark:text-white font-sans whitespace-nowrap">
                  CAREER <span className="text-amber-600 dark:text-amber-500">DEFINER</span>
                </span>
                <span className="hidden md:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  PORTAL
                </span>
              </div>
              <p className="hidden xl:block text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate max-w-[220px] 2xl:max-w-none">
                {t('brand.tagline', 'Define Your Career. Discover Your Future.')}
              </p>
            </div>
          </div>

          {/* Right Action Controls: Search, Theme, Auth & Mobile Toggle */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch || (() => handleNav('/government-jobs'))}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-md border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Search opportunities and examinations"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="hidden 2xl:inline font-normal">Search Jobs...</span>
            </button>

            {/* Theme Switcher Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title={`Theme: ${theme}`}
                aria-label="Switch visual theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-600" />
                )}
              </button>

              {themeDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border border-slate-200 dark:border-slate-700 text-xs z-50"
                  onMouseLeave={() => setThemeDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setTheme('light');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                      theme === 'light'
                        ? 'font-bold text-blue-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light Mode
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                      theme === 'dark'
                        ? 'font-bold text-blue-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark Mode
                  </button>
                  <button
                    onClick={() => {
                      setTheme('system');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                      theme === 'system'
                        ? 'font-bold text-blue-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> System Mode
                  </button>
                </div>
              )}
            </div>

            {/* Auth State Controls */}
            {isAuthenticated ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      isAdmin ? 'bg-amber-600' : 'bg-blue-800'
                    }`}
                  >
                    {isAdmin ? <Shield className="w-3.5 h-3.5" /> : user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] md:max-w-[130px] truncate">
                    {isAdmin ? 'Admin' : user?.fullName?.split(' ')[0] || 'Student'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-md shadow-xl py-1 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.fullName}</p>
                      <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {user?.role}
                      </span>
                    </div>

                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleNav('/admin')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-amber-500" /> Admin Dashboard
                        </button>
                        <button
                          onClick={() => handleNav('/settings')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" /> Settings
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleNav('/dashboard')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-600" /> Student Dashboard
                        </button>
                        <button
                          onClick={() => handleNav('/profile')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <User className="w-4 h-4 text-emerald-600" /> My Profile
                        </button>
                        <button
                          onClick={() => handleNav('/saved-jobs')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Bookmark className="w-4 h-4 text-amber-600" /> Saved Jobs
                        </button>
                        <button
                          onClick={() => handleNav('/notifications')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Bell className="w-4 h-4 text-purple-600" /> Notifications
                        </button>
                        <button
                          onClick={() => handleNav('/settings')}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" /> Settings
                        </button>
                      </>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1">
                      <button
                        onClick={async () => {
                          await logout();
                          setUserDropdownOpen(false);
                          onNavigate('/');
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Desktop & Tablet Guest Auth Buttons (visible on sm+ screens, guaranteed within bounds) */
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('nav.login', 'Login')}
                </button>
                <button
                  onClick={() => handleNav('/signup')}
                  className="px-2 sm:px-2.5 lg:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('nav.signup', 'Sign Up')}
                </button>
                <button
                  onClick={() => handleNav('/admin/login')}
                  className="flex items-center gap-1 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 text-xs font-bold text-slate-800 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-600/50 rounded-md shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  title="Official Administrator Authentication"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Dedicated Mobile Quick Auth Row (Visible on small mobile screens < sm like 390px when guest) */}
        {!isAuthenticated && (
          <div className="sm:hidden flex items-center justify-between gap-1.5 pt-1.5 pb-2 border-t border-slate-100 dark:border-slate-800 w-full">
            <button
              onClick={() => handleNav('/login')}
              className="flex-1 py-1.5 text-center text-xs font-semibold text-blue-900 dark:text-blue-300 bg-blue-50/70 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-md transition-colors cursor-pointer"
            >
              {t('nav.login', 'Login')}
            </button>
            <button
              onClick={() => handleNav('/signup')}
              className="flex-1 py-1.5 text-center text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              {t('nav.signup', 'Sign Up')}
            </button>
            <button
              onClick={() => handleNav('/admin/login')}
              className="flex-1 py-1.5 text-center text-xs font-bold text-slate-800 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-600/50 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Admin Login</span>
            </button>
          </div>
        )}
      </div>

      {/* Tier 2: Dedicated Navigation Bar for Desktop & Laptop Screens (lg+) */}
      <div className="hidden lg:block border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <nav className="flex items-center justify-start gap-1 py-1 overflow-x-auto w-full min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navLinks.map((link) => {
              const isActive =
                currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-blue-900 dark:text-amber-400 bg-blue-100/80 dark:bg-slate-800 font-bold shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Quick Matcher Accent Link in Navigation Bar */}
            <button
              onClick={() => handleNav('/resume-matcher')}
              className={`px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ml-auto ${
                currentPath.startsWith('/resume-matcher')
                  ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 font-bold'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>AI Matcher</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-5 space-y-1 text-sm shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-0.5">
            {navLinks.map((link) => {
              const isActive =
                currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-amber-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* AI Matcher in Drawer */}
            <button
              onClick={() => handleNav('/resume-matcher')}
              className={`w-full text-left px-3 py-2 rounded-md font-semibold text-sm flex items-center gap-2 cursor-pointer ${
                currentPath.startsWith('/resume-matcher')
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 font-bold'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>AI Matcher</span>
            </button>

            {/* Search Jobs in Drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSearch) onOpenSearch();
                else handleNav('/government-jobs');
              }}
              className="w-full text-left px-3 py-2 rounded-md font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Search Jobs</span>
            </button>
          </div>

          {/* Authentication & Portal Options in Drawer */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-1.5">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNav(isAdmin ? '/admin' : '/dashboard')}
                  className="w-full text-left px-3 py-2 rounded-md font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{isAdmin ? 'Admin Console' : 'Student Dashboard'}</span>
                </button>
                <button
                  onClick={() => handleNav('/settings')}
                  className="w-full text-left px-3 py-2 rounded-md font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    onNavigate('/');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNav('/login')}
                    className="w-full py-2 text-center text-xs font-semibold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-md cursor-pointer"
                  >
                    {t('nav.login', 'Login')}
                  </button>
                  <button
                    onClick={() => handleNav('/signup')}
                    className="w-full py-2 text-center text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md shadow-xs cursor-pointer"
                  >
                    {t('nav.signup', 'Sign Up')}
                  </button>
                </div>
                <button
                  onClick={() => handleNav('/admin/login')}
                  className="w-full py-2 px-3 text-center text-xs font-bold text-slate-800 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-600/50 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Official Admin Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
