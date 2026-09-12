import React, { useEffect, useState } from 'react';
import {
  User,
  Bookmark,
  Sparkles,
  Bell,
  Save,
  CheckCircle2,
  Calendar,
  GraduationCap,
  MapPin,
  Briefcase,
  Layers,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Compass,
  BrainCircuit,
  Target,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, StudentProfile, StateEntity } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { JobCard } from '../../components/jobs/JobCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface StudentPortalProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
  initialTab?: 'profile' | 'matches' | 'saved' | 'notifications' | 'roadmap' | 'interview' | 'examPrep';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onNavigate, onSelectJob, initialTab }) => {
  const { user, updateProfileState } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'matches' | 'saved' | 'notifications' | 'roadmap' | 'interview' | 'examPrep'
  >(initialTab || 'profile');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [states, setStates] = useState<StateEntity[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<{ id: string; jobId: string; savedAt: string; job?: Job }[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    age: 22,
    gender: 'Male',
    category: 'GENERAL',
    stateId: '',
    qualification: 'Graduation',
    branch: 'Computer Science',
    institution: '',
    passingYear: 2025,
    careerInterests: '',
    emailNotifications: true,
  });

  useEffect(() => {
    Promise.all([
      apiRequest('/api/student/profile'),
      apiRequest('/api/hierarchy/states'),
      apiRequest('/api/student/saved-jobs'),
      apiRequest('/api/student/recommended-jobs'),
      apiRequest('/api/notices'),
    ]).then(([profRes, statesRes, savedRes, recRes, noticesRes]) => {
      if (statesRes.success && statesRes.states) {
        setStates(statesRes.states);
      }
      if (noticesRes?.success && noticesRes.notices) {
        setNotices(noticesRes.notices);
      }
      if (profRes.success && profRes.profile) {
        const p = profRes.profile;
        setProfile(p);
        setFormData({
          name: p.fullName || p.name || user?.fullName || '',
          phone: p.mobileNumber || p.phone || user?.mobileNumber || '',
          dateOfBirth: p.dateOfBirth || '',
          age: p.age || 22,
          gender: p.gender || 'Male',
          category: p.category || 'GENERAL',
          stateId: p.stateId || p.state || '',
          qualification: p.highestQualification || p.qualification || 'Graduation',
          branch: p.branchStream || p.branch || '',
          institution: p.institution || p.college || '',
          passingYear: p.passingYear || 2025,
          careerInterests: Array.isArray(p.interests) ? p.interests.join(', ') : (p.interests || ''),
          emailNotifications: p.emailNotifications !== false,
        });
      }
      if (savedRes.success && savedRes.savedJobs) {
        setSavedJobs(savedRes.savedJobs);
      }
      if (recRes.success && recRes.recommendedJobs) {
        setRecommendedJobs(recRes.recommendedJobs);
      }
      setLoading(false);
    });
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess(false);

    try {
      const res = await apiRequest('/api/student/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (res.success && res.profile) {
        setProfile(res.profile);
        updateProfileState(res.profile);
        setSaveSuccess(true);
        // Refresh recommended jobs with new profile
        const recRes = await apiRequest('/api/student/recommended-jobs');
        if (recRes.success && recRes.recommendedJobs) {
          setRecommendedJobs(recRes.recommendedJobs);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemoveSaved = async (jobId: string) => {
    try {
      await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'DELETE' });
      setSavedJobs((prev) => prev.filter((s) => s.jobId !== jobId));
    } catch (err) {
      console.error('Failed removing saved job', err);
    }
  };

  // Calculate profile completeness percentage
  const fields = [
    formData.name,
    formData.phone,
    formData.category,
    formData.stateId,
    formData.qualification,
    formData.branch,
    formData.institution,
    formData.passingYear,
    formData.careerInterests,
  ];
  const filledFields = fields.filter((f) => Boolean(f)).length;
  const completeness = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Candidate Dashboard' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Candidate Dashboard Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-900 text-amber-400 font-bold text-xl flex items-center justify-center border-2 border-amber-400/40 shadow-sm shrink-0">
              {formData.name ? formData.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Welcome, {formData.name || user?.fullName || user?.name || 'Aspirant'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Candidate ID: {user?.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {user?.email} • {formData.qualification} • {formData.category} Quota
              </p>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">Profile Completeness</span>
              <span className="font-extrabold text-blue-900 dark:text-amber-400">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Complete your profile for 100% accurate eligibility evaluations.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Aspirant Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'matches'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Matching Opportunities</span>
              {recommendedJobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-bold">
                  {recommendedJobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'saved'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Vacancies</span>
              {savedJobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                  {savedJobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Official Alerts</span>
              {notices.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                  {notices.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'roadmap'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>AI Career Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'interview'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>AI Mock Interview</span>
            </button>

            <button
              onClick={() => setActiveTab('examPrep')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'examPrep'
                  ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Exam Preparation</span>
            </button>
          </nav>
        </div>

        {/* Tab Panes */}
        <div>
          {/* TAB 1: ASPIRANT PROFILE & ACADEMICS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Candidate Academic & Reservation Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This profile information is used for automatic eligibility evaluations and job recommendations.
                  </p>
                </div>
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile Updated
                  </span>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Full Name (As per 10th Certificate)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Current Age (in Completed Years)
                    </label>
                    <input
                      type="number"
                      min={16}
                      max={65}
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* Social Reservation Category */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Social Category / Quota
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="GENERAL">General / Unreserved (UR)</option>
                      <option value="OBC">Other Backward Classes (OBC - Non-Creamy)</option>
                      <option value="SC">Scheduled Castes (SC)</option>
                      <option value="ST">Scheduled Tribes (ST)</option>
                      <option value="EWS">Economically Weaker Sections (EWS)</option>
                      <option value="PWD">Persons with Benchmark Disabilities (PwD)</option>
                    </select>
                  </div>

                  {/* Domicile State */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      State of Domicile / Residence
                    </label>
                    <select
                      value={formData.stateId}
                      onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="">Select Domicile State</option>
                      {states.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.isUnionTerritory ? '(UT)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Highest Qualification */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Highest Completed Educational Qualification
                    </label>
                    <select
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="10th">10th Standard / Matriculation</option>
                      <option value="12th">12th Standard / Intermediate / Higher Secondary</option>
                      <option value="Diploma">Diploma (Polytechnic / Technical)</option>
                      <option value="Graduation">Bachelor's Degree / Graduation (B.A / B.Com / B.Sc)</option>
                      <option value="B.Tech">B.Tech / B.E (Engineering)</option>
                      <option value="Post Graduation">Post Graduation / Master's (M.Tech / M.Sc / M.A)</option>
                    </select>
                  </div>

                  {/* Branch / Specialization */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Discipline / Branch / Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. Computer Science, Mechanical Engineering, Commerce"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* College / Institution */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      College / University / Institution
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Osmania University, Delhi University, IIT"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* Graduation / Passing Year */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Graduation / Passing Year
                    </label>
                    <input
                      type="number"
                      min={1990}
                      max={2035}
                      value={formData.passingYear}
                      onChange={(e) => setFormData({ ...formData, passingYear: Number(e.target.value) })}
                      placeholder="e.g. 2025"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* Career Interests */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Career Interests & Target Sectors
                    </label>
                    <input
                      type="text"
                      value={formData.careerInterests}
                      onChange={(e) => setFormData({ ...formData, careerInterests: e.target.value })}
                      placeholder="e.g. UPSC Civil Services, Banking & Finance, Defence, State PSC, Software & IT"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="notificationsToggle"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-900"
                    />
                    <label htmlFor="notificationsToggle" className="text-xs text-slate-600 dark:text-slate-400">
                      Notify me of matching government vacancies & exam calendar releases.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold rounded-md flex items-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Candidate Profile'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MATCHING OPPORTUNITIES */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Curated Opportunities Matching Your Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filtered dynamically based on your age ({formData.age} yrs), {formData.qualification} degree, and {formData.category} reservation.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {recommendedJobs.length} eligible notices
                </span>
              </div>

              {recommendedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recommendedJobs.map((job) => (
                    <JobCard key={job.id} job={job} onSelect={onSelectJob} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    No Exact Matches in Current Cycle
                  </h3>
                  <p className="max-w-md mx-auto">
                    Try adjusting your qualification in your Candidate Profile or browse the full All-India directory.
                  </p>
                  <button
                    onClick={() => onNavigate('/government-jobs')}
                    className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-bold"
                  >
                    Browse All Government Jobs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED JOBS */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                    Your Saved Bookmarks
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keep track of critical application deadlines and commission notices.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {savedJobs.length} notices bookmarked
                </span>
              </div>

              {savedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedJobs.map((item) => {
                    const job = item.job;
                    if (!job) return null;
                    return (
                      <div key={item.id} className="relative group">
                        <JobCard job={job} onSelect={onSelectJob} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSaved(item.jobId);
                          }}
                          className="absolute top-4 right-4 p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs space-y-3">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    No Vacancies Bookmarked Yet
                  </h3>
                  <p className="max-w-md mx-auto">
                    When browsing government recruitments, click "Save Job" on any card or details page to bookmark it for later review.
                  </p>
                  <button
                    onClick={() => onNavigate('/government-jobs')}
                    className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-bold cursor-pointer"
                  >
                    Explore Government Vacancies
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFICIAL NOTICES & RECRUITMENT ALERTS */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                    Official Gazettes, Examination Notices & Alerts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live updates from Central Ministries, State Public Service Commissions, and examination boards.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync Active
                </div>
              </div>

              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-blue-900 dark:text-blue-400">
                            {notice.organizationName || 'Commission Desk'}
                          </span>
                          <StatusBadge status={notice.status} type="notice" />
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {notice.date}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {notice.title}
                        </h4>
                        {notice.description && (
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                            {notice.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {notice.linkUrl && (
                          <a
                            href={notice.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open Source</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-400" />
                  <p>No active notices published yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI CAREER ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-600 dark:text-amber-400" />
                    AI Career Roadmaps & Learning Milestones
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step-by-step verified preparation paths customized to your qualifications and desired public or private roles.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/career-roadmap')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Launch Roadmap Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-700 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Public Commission Career Paths
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Target UPSC Civil Services, SSC CGL, Banking PO, or State PSCs with weekly breakdowns and recommended books.
                  </p>
                  <button
                    onClick={() => onNavigate('/career-roadmap?role=UPSC%20Civil%20Services')}
                    className="text-xs font-bold text-blue-800 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Civil Services Roadmap</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-purple-50/50 dark:bg-slate-800/40 border border-purple-100 dark:border-slate-700 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Private Sector & Tech Tracks
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    High-growth trajectories for Software Engineering, Data Science, and Financial Analyst careers with hands-on projects.
                  </p>
                  <button
                    onClick={() => onNavigate('/career-roadmap?role=Full%20Stack%20Developer')}
                    className="text-xs font-bold text-purple-800 dark:text-purple-300 hover:underline flex items-center gap-1"
                  >
                    <span>View Software Roadmap</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-emerald-50/50 dark:bg-slate-800/40 border border-emerald-100 dark:border-slate-700 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    AI Skill-Gap Diagnostics
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Compare your verified qualifications and skills against any target notification to uncover missing competencies.
                  </p>
                  <button
                    onClick={() => onNavigate('/career-roadmap')}
                    className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    <span>Run Diagnostic Scan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI MOCK INTERVIEW */}
          {activeTab === 'interview' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    AI Mock Interview Simulator & Viva Rehearsals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Practice with realistic voice and text conversational panel interviews tailored to Government Personality Tests and corporate rounds.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/mock-interview')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                    <span>Government Personality Test Track</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Simulates UPSC Board, State PSC Interview panels, and Bank PO Interviewers focusing on administrative decisions, constitutional awareness, and ethics.
                  </p>
                  <button
                    onClick={() => onNavigate('/mock-interview?role=UPSC%20Civil%20Services')}
                    className="px-3 py-1.5 bg-blue-900 text-white rounded-md text-xs font-bold cursor-pointer"
                  >
                    Simulate UPSC Board
                  </button>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Private Corporate & Tech Track</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Covers software architecture, data structures, scenario behavior, and HR cultural alignment with AI-evaluated clarity and tone scoring.
                  </p>
                  <button
                    onClick={() => onNavigate('/mock-interview?role=Software%20Engineer')}
                    className="px-3 py-1.5 bg-purple-700 text-white rounded-md text-xs font-bold cursor-pointer"
                  >
                    Simulate Tech Round
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GOVERNMENT EXAM PREPARATION */}
          {activeTab === 'examPrep' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Government Examination Preparation & Mock CBT Center
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Access verified recruitment exam patterns, interactive syllabus tracking, categorized question drills, and timed simulated tests.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/exam-prep')}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Open Exam Prep Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                  <div className="text-2xl font-extrabold text-blue-900 dark:text-amber-400">8+</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Commission Exams Catalog</div>
                  <p className="text-[11px] text-slate-500">UPSC, SSC CGL, IBPS PO, RRB NTPC, NDA, CDS</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                  <div className="text-2xl font-extrabold text-emerald-600">100%</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Syllabus Topic Coverage</div>
                  <p className="text-[11px] text-slate-500">Tier-wise mark schemes, cut-off records & official links</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                  <div className="text-2xl font-extrabold text-purple-600">CBT</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Timed Simulated Tests</div>
                  <p className="text-[11px] text-slate-500">Full exam interface with negative marking & instant analysis</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
