import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { setSession } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Invalid admin username or password.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.success && response.token && response.user) {
        setSuccessMessage('Administrator authorization verified. Redirecting...');
        setSession(response.token, response.user);
        setTimeout(() => {
          onNavigate('/admin');
        }, 500);
      } else {
        setErrorMessage(response.message || 'Invalid admin username or password.');
      }
    } catch (err: any) {
      setErrorMessage('Invalid admin username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* National Crest & Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border-2 border-slate-200 dark:border-slate-800 p-2 mx-auto">
            <BrandLogo size={64} className="drop-shadow-sm" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-blue-950 dark:text-white">
                CAREER <span className="text-amber-600 dark:text-amber-500">DEFINER</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                GOVT PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Define Your Career. Discover Your Future.
            </p>
          </div>
        </div>

        {/* Official Card Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Official Security Header Stripe */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 px-6 py-4 border-b border-amber-500/40 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Admin Login</h1>
                <p className="text-[11px] text-slate-300">National Administrative Console</p>
              </div>
            </div>
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase font-semibold">
              Restricted
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Admin Username"
                    autoComplete="username"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Log In to Admin Console</span>
                  </>
                )}
              </button>
            </form>

            {/* Statutory Notice */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Authorized departmental personnel only. All access attempts are cryptographically authenticated and logged with institutional audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Back navigation buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-amber-400 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </button>

          <button
            onClick={() => onNavigate('/candidate-portal')}
            className="flex items-center gap-1.5 text-blue-900 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            <span>Candidate / Student Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
