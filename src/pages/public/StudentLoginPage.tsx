import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface StudentLoginPageProps {
  onNavigate: (path: string) => void;
  initialEmail?: string;
  registeredSuccess?: boolean;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({
  onNavigate,
  initialEmail = '',
  registeredSuccess = false,
}) => {
  const { login, isAuthenticated, isStudent, isAdmin } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    registeredSuccess ? 'Account created successfully! Please enter your password to sign in.' : null
  );

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Check URL params for post-registration notification
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (registeredSuccess) setSuccessNotice('Account created successfully! Please enter your password to sign in.');

    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setSuccessNotice('Account created successfully! Please enter your password to sign in.');
      const prefillEmail = params.get('email');
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
    }
  }, [initialEmail, registeredSuccess]);

  // If already authenticated as student, offer redirect to dashboard
  if (isAuthenticated) {
    if (isAdmin) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Admin Account Active
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You are logged in as an administrator.
          </p>
          <button
            onClick={() => onNavigate('/admin')}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Go to Admin Dashboard
          </button>
        </div>
      );
    }
    if (isStudent) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            You are Already Signed In
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Welcome back to your candidate portal.
          </p>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Go to Student Dashboard
          </button>
        </div>
      );
    }
  }

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        // Redirect the student to the Student Dashboard
        onNavigate('/dashboard');
      } else {
        setErrorMessage(
          res.error || 'Invalid email address or password. Please verify and try again.'
        );
      }
    } catch (err: any) {
      setErrorMessage('A network error occurred. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        onNavigate={onNavigate}
        items={[
          { label: 'Home', path: '/' },
          { label: 'Candidate Login' },
        ]}
      />

      <div className="max-w-md mx-auto mt-6">
        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white border-b-2 border-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <BrandLogo size={42} />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
                  CAREER DEFINER • Candidate Portal
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Candidate Login
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sign in to manage your bookmarks, applications & recommendations
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Registration Success Notification Banner */}
            {successNotice && (
              <div
                id="login-success-notice"
                className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3 animate-in fade-in"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Account Created</h4>
                  <p className="mt-1">{successNotice}</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div
                id="login-error-alert"
                className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 animate-in fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Authentication Failed</h4>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Field: Email Address */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Registered Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-lg focus:outline-hidden focus:ring-2 transition-colors ${
                      fieldErrors.email
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-900 focus:ring-blue-900/20'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Field: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Password <span className="text-rose-600">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="Enter your account password"
                    className={`w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-lg focus:outline-hidden focus:ring-2 transition-colors ${
                      fieldErrors.password
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-900 focus:ring-blue-900/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <button
                id="btn-student-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link to Signup */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Don't have a candidate account yet?{' '}
                <button
                  id="link-to-student-register"
                  onClick={() => onNavigate('/signup')}
                  className="font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer ml-1"
                >
                  Register Now
                </button>
              </p>

              {/* Link to Admin Login */}
              <div className="pt-2">
                <button
                  id="link-to-admin-console"
                  onClick={() => onNavigate('/admin/login')}
                  className="text-[11px] text-slate-500 hover:text-blue-900 dark:hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Administrative Staff Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
