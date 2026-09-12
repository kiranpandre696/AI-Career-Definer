import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  defaultRole?: 'STUDENT' | 'ADMIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  defaultRole = 'STUDENT',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>(defaultRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [qualification, setQualification] = useState('Graduation');
  const [category, setCategory] = useState('GENERAL');
  const [age, setAge] = useState(22);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and Confirm Password do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email.trim().toLowerCase(), password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else {
        const res = await register({
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          fullName: name.trim(),
          name: name.trim(),
          role: 'STUDENT',
          qualification,
          category,
          age,
        });
        if (res.success) {
          setSuccessMsg('Account created successfully! Please sign in with your password.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoType: 'student' | 'admin') => {
    if (demoType === 'admin') {
      setEmail('admin@careerdefiner.gov.in');
      setPassword('admin123');
      setRole('ADMIN');
      setMode('login');
    } else {
      setEmail('student@careerdefiner.in');
      setPassword('student123');
      setRole('STUDENT');
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="portal-header-gradient text-white p-5 flex items-center justify-between border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/95 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <BrandLogo size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">CAREER DEFINER</h3>
              <p className="text-[11px] text-slate-300">
                {mode === 'login' ? 'Official Portal Login' : 'Aspirant Account Registration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-2.5 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900 dark:text-amber-300">Quick Test Sign In:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDemo('student')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-bold hover:bg-amber-100 cursor-pointer"
            >
              Candidate Demo
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-2 py-0.5 rounded bg-blue-900 text-white font-bold hover:bg-blue-800 cursor-pointer"
            >
              Admin Demo
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              New Aspirant Registration
            </button>
          </div>

          {successMsg && (
            <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
            {mode === 'register' && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Highest Qual.
                    </label>
                    <select
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                    >
                      <option value="10th">10th</option>
                      <option value="12th">12th</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Graduation">Graduation</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="Post Graduation">PG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min={16}
                      max={65}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Category Quota
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                  >
                    <option value="GENERAL">General / Unreserved</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="PWD">PwD</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold rounded-md shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Portal' : 'Create Aspirant Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
