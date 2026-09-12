import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  GraduationCap,
  MapPin,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Award,
  BookOpen,
  Compass,
  User,
  ShieldCheck,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, ResumeJobMatchItem, ResumeSkillGapAnalysis, StudentResumeAnalysis } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface RecommendedJobsPageProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
  resumeId?: string;
}

export const RecommendedJobsPage: React.FC<RecommendedJobsPageProps> = ({
  onNavigate,
  onSelectJob,
  resumeId,
}) => {
  const { isAuthenticated, isStudent } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedResume, setConfirmedResume] = useState<StudentResumeAnalysis | null>(null);
  const [recommendedGovtJobs, setRecommendedGovtJobs] = useState<ResumeJobMatchItem[]>([]);
  const [recommendedPrivateJobs, setRecommendedPrivateJobs] = useState<ResumeJobMatchItem[]>([]);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<ResumeSkillGapAnalysis | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GOVERNMENT' | 'PRIVATE'>('ALL');
  const [savedJobIds, setSavedJobIds] = useState<Record<string, boolean>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Load saved bookmarks if authenticated
  useEffect(() => {
    if (isAuthenticated && isStudent) {
      apiRequest('/api/student/saved-jobs')
        .then((res) => {
          if (res.success && Array.isArray(res.savedJobs)) {
            const map: Record<string, boolean> = {};
            res.savedJobs.forEach((s: any) => {
              map[s.jobId] = true;
            });
            setSavedJobIds(map);
          }
        })
        .catch((err) => console.error('Error loading saved jobs:', err));
    }
  }, [isAuthenticated, isStudent]);

  // Main data-fetching pipeline
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Locate confirmed resume data
      let resumeData: Partial<StudentResumeAnalysis> | null = null;

      // A. Check query param resumeId or prop
      const activeResumeId = resumeId || new URLSearchParams(window.location.search).get('resumeId');
      if (activeResumeId) {
        const res = await apiRequest(`/api/resume/my-resume?resumeId=${encodeURIComponent(activeResumeId)}`);
        if (res.success && res.resume) {
          resumeData = res.resume;
        }
      }

      // B. If not loaded, check localStorage cache
      if (!resumeData) {
        try {
          const cached = localStorage.getItem('career_definer_confirmed_resume');
          if (cached) {
            resumeData = JSON.parse(cached);
          }
        } catch (e) {
          console.warn('LocalStorage parse issue:', e);
        }
      }

      // C. If still not loaded, check server profile's confirmed resume
      if (!resumeData && isAuthenticated) {
        const res = await apiRequest('/api/resume/my-resume');
        if (res.success && res.resume) {
          resumeData = res.resume;
        }
      }

      // D. If still no resume, try server recommend-jobs endpoint directly
      let recommendRes: any;
      if (resumeData) {
        setConfirmedResume(resumeData as StudentResumeAnalysis);
        recommendRes = await apiRequest('/api/resume/recommend-jobs', {
          method: 'POST',
          body: JSON.stringify({ confirmedResume: resumeData }),
        });
      } else {
        // Direct attempt via server's stored session
        recommendRes = await apiRequest('/api/resume/recommend-jobs');
      }

      if (recommendRes.success) {
        setRecommendedGovtJobs(recommendRes.recommendedGovernmentJobs || []);
        setRecommendedPrivateJobs(recommendRes.recommendedPrivateJobs || []);
        setSkillGapAnalysis(recommendRes.skillGapAnalysis || null);
        if (recommendRes.resumeUsed && !confirmedResume) {
          setConfirmedResume(recommendRes.resumeUsed);
        }
      } else {
        if (!resumeData) {
          // No resume available
          setConfirmedResume(null);
          setRecommendedGovtJobs([]);
          setRecommendedPrivateJobs([]);
        } else {
          setErrorMessage('Unable to load recommended jobs. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load recommended jobs:', err);
      setErrorMessage('Unable to load recommended jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resumeId, isAuthenticated]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Bookmark / Save Job handler
  const handleToggleSave = async (jobId: string) => {
    if (!isAuthenticated || !isStudent) {
      alert('Please log in with a student account to save jobs.');
      return;
    }

    setSavingJobId(jobId);
    const isSaved = savedJobIds[jobId];
    try {
      if (isSaved) {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'DELETE' });
        setSavedJobIds((prev) => ({ ...prev, [jobId]: false }));
      } else {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'POST' });
        setSavedJobIds((prev) => ({ ...prev, [jobId]: true }));
      }
    } catch (err) {
      console.error('Error toggling saved job', err);
    } finally {
      setSavingJobId(null);
    }
  };

  const totalMatches = recommendedGovtJobs.length + recommendedPrivateJobs.length;
  const filteredGovt = activeFilter === 'ALL' || activeFilter === 'GOVERNMENT' ? recommendedGovtJobs : [];
  const filteredPrivate = activeFilter === 'ALL' || activeFilter === 'PRIVATE' ? recommendedPrivateJobs : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'AI Resume Scanner', href: '/resume-matcher' },
            { label: 'Recommended Jobs', active: true },
          ]}
          onNavigate={onNavigate}
        />

        {/* Header Title Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified Match Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Recommended Jobs For Your Resume
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Tailored opportunities matched algorithmically against your confirmed academic qualification, degree, technical competencies, and location preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/resume-matcher')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Update Resume</span>
            </button>
            <button
              onClick={loadRecommendations}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Matches</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-800 dark:text-blue-300">
              <Sparkles className="w-7 h-7 animate-spin text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Finding jobs based on your resume...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Scanning live Government Gazettes, Recruiting Commissions, and Verified Corporate Tech portals against your confirmed qualifications.
            </p>
            <div className="w-64 max-w-full mx-auto bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-900 dark:bg-amber-500 h-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {/* ERROR STATE WITH RETRY */}
        {!loading && errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <AlertCircle className="w-12 h-12 mx-auto text-rose-600 dark:text-rose-400" />
            <h3 className="text-lg font-bold text-rose-950 dark:text-rose-200">
              {errorMessage}
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 max-w-md mx-auto">
              We experienced an issue connecting to the job recommendation database. Please verify your connection or retry.
            </p>
            <button
              onClick={loadRecommendations}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* EMPTY STATE: NO RESUME FOUND OR NO MATCHES */}
        {!loading && !errorMessage && totalMatches === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 sm:p-14 text-center space-y-6 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No exact job matches found for your resume yet.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                We could not find active vacancies that match your exact combination of qualification, branch, and skills in the current recruitment cycle. You can explore all published opportunities, adjust your profile credentials, or bridge missing skills with our guided career roadmap.
              </p>
            </div>

            {/* Useful Option Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
              <button
                onClick={() => onNavigate('/government-jobs')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>View All Government Jobs</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Browse UPSC, SSC, Railways, State PSC</p>
              </button>

              <button
                onClick={() => onNavigate('/private-jobs')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>View All Private Jobs</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Explore verified corporate tech hiring</p>
              </button>

              <button
                onClick={() => onNavigate('/resume-matcher')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Update Resume</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Re-upload or edit extracted details</p>
              </button>

              <button
                onClick={() => onNavigate('/candidate-portal')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Edit My Profile</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Update qualifications & state category</p>
              </button>

              <button
                onClick={() => onNavigate('/career-roadmap')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Improve Skills & Roadmap</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Get targeted learning milestones</p>
              </button>

              <button
                onClick={() => onNavigate('/exam-prep')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-600 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/50 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>View Exam Prep</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Prepare for UPSC, SSC & Banking</p>
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SECTION: CONFIRMED RESUME OVERVIEW & MATCH CARDS */}
        {!loading && !errorMessage && totalMatches > 0 && (
          <div className="space-y-6">
            {/* Confirmed Resume Summary Card */}
            {confirmedResume && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Confirmed Candidate Profile
                        </h2>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {confirmedResume.fullName !== 'Not mentioned in resume' ? confirmedResume.fullName : 'Aspirant Profile'} &bull; Recommendations computed using confirmed credentials
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('/resume-matcher')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span>Edit Confirmed Resume Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Qualification</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {confirmedResume.highestQualification || 'Graduation'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Degree & Branch</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {confirmedResume.branch || confirmedResume.degree || 'General'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Experience / Domicile</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {confirmedResume.workExperience || 'Fresher'} &bull; {confirmedResume.state || 'All-India'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Identified Skills</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {[
                        ...(confirmedResume.technicalSkills || []),
                        ...(confirmedResume.programmingLanguages || []),
                      ].slice(0, 3).join(', ') || 'General Studies'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  All Matches ({totalMatches})
                </button>
                <button
                  onClick={() => setActiveFilter('GOVERNMENT')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeFilter === 'GOVERNMENT'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Government Jobs ({recommendedGovtJobs.length})
                </button>
                <button
                  onClick={() => setActiveFilter('PRIVATE')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeFilter === 'PRIVATE'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Private Sector ({recommendedPrivateJobs.length})
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Ranked by statutory qualification and skill overlap score</span>
              </div>
            </div>

            {/* SECTION 1: RECOMMENDED GOVERNMENT JOBS */}
            {filteredGovt.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                      <span>Recommended Government Jobs ({filteredGovt.length})</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Recruiting commissions, public sector undertakings, and civil cadre posts evaluated against your confirmed qualification.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGovt.map((item) => {
                    const isSaved = savedJobIds[item.job.id];
                    return (
                      <div
                        key={item.job.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-700 dark:hover:border-amber-500 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Header badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900 uppercase">
                                Government
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.job.state || 'Central'}
                              </span>
                              {item.eligibilityStatus === 'ELIGIBLE' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                  ✓ Eligible
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                  Verify Criteria
                                </span>
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                                item.matchScore >= 80
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              }`}
                            >
                              {item.matchScore}% Match
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-blue-900 dark:text-blue-400">
                            {item.job.department || item.job.organization?.name || 'Recruiting Commission'}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                            {item.job.title}
                          </h3>

                          {/* Match Reason */}
                          {item.matchReason && (
                            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                              <strong className="text-blue-950 dark:text-blue-200">Why this job matches:</strong>{' '}
                              {item.matchReason}
                            </div>
                          )}

                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Qualification</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.qualification}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Branch / Stream</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.branch || 'Any Graduate'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.location || item.job.state || 'All-India'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pay Scale / Salary</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.salary || 'Standard Govt Scale'}</span>
                            </div>
                          </div>

                          {/* Matching Skills */}
                          {item.matchingSkills && item.matchingSkills.length > 0 && (
                            <div className="text-xs space-y-1">
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                                Matching Skills ({item.matchingSkills.length}):
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.matchingSkills.map((ms, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-900/60"
                                  >
                                    ✓ {ms}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Skills / Gaps */}
                          {item.missingSkills && item.missingSkills.length > 0 && (
                            <div className="text-xs space-y-1">
                              <div className="font-semibold text-amber-700 dark:text-amber-400 text-[11px]">
                                Suggested Focus / Syllabus Areas:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.missingSkills.map((ms, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-medium border border-amber-200 dark:border-amber-900/60"
                                  >
                                    ! {ms}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSave(item.job.id)}
                              disabled={savingJobId === item.job.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                isSaved
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                              <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>

                            {item.job.applicationUrl && (
                              <a
                                href={item.job.applicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-900 dark:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700"
                                title="Official Recruitment Application Portal"
                              >
                                <span>Official Apply</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <button
                            onClick={() => onSelectJob(item.job)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            <span>View Full Notice</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: RECOMMENDED PRIVATE JOBS */}
            {filteredPrivate.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                      <span>Recommended Private Sector Jobs ({filteredPrivate.length})</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Corporate engineering, software technology, and product roles matched against your confirmed technical skills.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPrivate.map((item) => {
                    const isSaved = savedJobIds[item.job.id];
                    return (
                      <div
                        key={item.job.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-600 dark:hover:border-indigo-500 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 uppercase">
                                Private Sector
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.job.location || 'India'}
                              </span>
                              {item.eligibilityStatus === 'ELIGIBLE' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                  ✓ Eligible
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                  Verify Criteria
                                </span>
                              )}
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 shrink-0">
                              {item.matchScore}% Match
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                            {item.job.company || item.job.companyName || 'Corporate Employer'}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                            {item.job.title}
                          </h3>

                          {/* Match Reason */}
                          {item.matchReason && (
                            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                              <strong className="text-indigo-950 dark:text-indigo-200">Why this job matches:</strong>{' '}
                              {item.matchReason}
                            </div>
                          )}

                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Qualification</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.qualification}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.location || 'Remote / Hybrid'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Salary / CTC</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.job.salary || 'Industry Standard'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.job.status || 'Active'}</span>
                            </div>
                          </div>

                          {/* Required & Matching Skills */}
                          {item.matchingSkills && item.matchingSkills.length > 0 && (
                            <div className="text-xs space-y-1">
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                                Matching Skills ({item.matchingSkills.length}):
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.matchingSkills.map((ms, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-900/60"
                                  >
                                    ✓ {ms}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSave(item.job.id)}
                              disabled={savingJobId === item.job.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                isSaved
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                              <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>

                            {item.job.applicationUrl && (
                              <a
                                href={item.job.applicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-indigo-200 dark:border-slate-700"
                                title="Official Corporate Careers Link"
                              >
                                <span>Apply Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <button
                            onClick={() => onSelectJob(item.job)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 3: SKILL GAP ANALYSIS & PREPARATION ROADMAP */}
            {skillGapAnalysis && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs mt-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Skill Gap Analysis & Preparation Guidance</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Algorithmic recommendations to bridge syllabus and industry competency gaps for maximum selection probability.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/career-roadmap')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View Full Interactive Roadmap</span>
                  </button>
                </div>

                {/* Critical Missing Skills */}
                {skillGapAnalysis.criticalMissingSkills && skillGapAnalysis.criticalMissingSkills.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Top In-Demand Skills Across Matching Vacancies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapAnalysis.criticalMissingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                        >
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Phases */}
                {skillGapAnalysis.recommendedPreparationPath && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {skillGapAnalysis.recommendedPreparationPath.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="font-bold text-blue-900 dark:text-blue-400 text-xs">
                          {phase.phase}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {phase.focus}
                        </p>
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <strong>Target Milestone:</strong> {phase.milestone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
