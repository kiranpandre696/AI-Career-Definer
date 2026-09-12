import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { apiRequest } from '../../lib/api.ts';
import { StateEntity } from '../../types.ts';

interface StudentSignupPageProps {
  onNavigate: (path: string) => void;
}

export const StudentSignupPage: React.FC<StudentSignupPageProps> = ({ onNavigate }) => {
  const { register, isAuthenticated, isStudent, isAdmin } = useAuth();

  // Core Required Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Optional Academic & Profile Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [careerInterests, setCareerInterests] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  // States List for Domicile
  const [states, setStates] = useState<StateEntity[]>([]);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    apiRequest('/api/hierarchy/states').then((res) => {
      if (res.success && res.states) {
        setStates(res.states);
      }
    }).catch(() => {});
  }, []);

  // If already authenticated as student, offer redirect to dashboard
  if (isAuthenticated) {
    if (isAdmin) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Admin Account Active
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You are currently authenticated as an administrator.
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
            You are Already Logged In
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Access your student profile, saved vacancies, and recommendations.
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

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Password and Confirm Password must match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        mobileNumber: mobileNumber.trim(),
        qualification: qualification.trim() || undefined,
        branch: branch.trim() || undefined,
        college: college.trim() || undefined,
        graduationYear: graduationYear.trim() ? Number(graduationYear.trim()) : undefined,
        state: selectedState.trim() || undefined,
        careerInterests: careerInterests.trim() || undefined,
        role: 'STUDENT',
      });

      if (res.success) {
        setSuccessMessage(
          'Account created successfully! Welcome to CAREER DEFINER. Redirecting to your Student Dashboard...'
        );
        // Clear sensitive inputs
        setPassword('');
        setConfirmPassword('');

        // Redirect directly to student dashboard
        setTimeout(() => {
          onNavigate('/dashboard');
        }, 1200);
      } else {
        setErrorMessage(
          res.error ||
            'Unable to complete registration. Please check your details and try again.'
        );
      }
    } catch (err: any) {
      setErrorMessage('A network error occurred. Please try again in a few moments.');
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
          { label: 'Student Registration' },
        ]}
      />

      <div className="max-w-lg mx-auto mt-6">
        {/* Registration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Header Banner with Gov Blue & Saffron accent */}
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
                  Student Registration
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Create your free candidate account to access government & private job alerts
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div
                id="signup-success-alert"
                className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3 animate-in fade-in"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Account Created Successfully</h4>
                  <p className="mt-1">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                id="signup-error-alert"
                className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 animate-in fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Registration Incomplete</h4>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Field 1: Full Name */}
              <div>
                <label
                  htmlFor="signup-fullname"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    disabled={loading}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                      }
                    }}
                    placeholder="e.g. Ramesh Kumar / Ananya Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-lg focus:outline-hidden focus:ring-2 transition-colors ${
                      fieldErrors.fullName
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-900 focus:ring-blue-900/20'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
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

              {/* Field 3: Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
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
                    placeholder="Minimum 6 characters"
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
                {fieldErrors.password ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Must be at least 6 characters.
                  </p>
                )}
              </div>

              {/* Field 4: Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-lg focus:outline-hidden focus:ring-2 transition-colors ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-900 focus:ring-blue-900/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Optional Field: Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signup-mobile"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mobile Number
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-mobile"
                    type="tel"
                    disabled={loading}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:border-blue-900 focus:ring-blue-900/20 transition-colors"
                  />
                </div>
              </div>

              {/* Collapsible Optional Academic & Career Details Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Education & Career Details
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Optional • You can complete this anytime in My Profile
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {showOptionalDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {showOptionalDetails && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                    {/* Qualification & Branch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="signup-qualification"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Education Qualification
                        </label>
                        <select
                          id="signup-qualification"
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                        >
                          <option value="">Select Qualification (Optional)</option>
                          <option value="10th">10th Standard / Matriculation</option>
                          <option value="12th">12th Standard / Intermediate</option>
                          <option value="Diploma">Diploma / Polytechnic</option>
                          <option value="Graduation">Graduation / Bachelor's Degree</option>
                          <option value="B.Tech">B.Tech / B.E.</option>
                          <option value="Post Graduation">Post Graduation / Master's Degree</option>
                          <option value="Doctorate">Doctorate / Ph.D</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-branch"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Branch / Discipline
                        </label>
                        <input
                          id="signup-branch"
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g. CSE, Civil, Commerce, Arts"
                          className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                        />
                      </div>
                    </div>

                    {/* College & Passing Year */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="signup-college"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          College / University
                        </label>
                        <input
                          id="signup-college"
                          type="text"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          placeholder="e.g. Osmania University / IIT"
                          className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="signup-graduation-year"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Graduation Year
                        </label>
                        <input
                          id="signup-graduation-year"
                          type="number"
                          min="1990"
                          max="2035"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          placeholder="e.g. 2025"
                          className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                        />
                      </div>
                    </div>

                    {/* State of Domicile */}
                    <div>
                      <label
                        htmlFor="signup-state"
                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        State of Domicile
                      </label>
                      <select
                        id="signup-state"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                      >
                        <option value="">Select State (Optional)</option>
                        {states.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Career Interests */}
                    <div>
                      <label
                        htmlFor="signup-career-interests"
                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Career Interests
                      </label>
                      <input
                        id="signup-career-interests"
                        type="text"
                        value={careerInterests}
                        onChange={(e) => setCareerInterests(e.target.value)}
                        placeholder="e.g. UPSC, Banking, IT Software, Railways, Teaching"
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:border-blue-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Register Button */}
              <button
                id="btn-student-register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Notice on Role Separation */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-900 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                Student accounts provide instant access to personalized exam alerts, vacancy bookmarks, and AI resume matching. Staff with administrative credentials must use the separate Admin Login.
              </span>
            </div>

            {/* Link to Login */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Already have a student account?{' '}
                <button
                  id="link-to-student-login"
                  onClick={() => onNavigate('/login')}
                  className="font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer ml-1"
                >
                  Sign In to Candidate Portal
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
