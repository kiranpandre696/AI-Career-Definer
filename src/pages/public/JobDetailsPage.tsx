import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  GraduationCap,
  Briefcase,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Share2,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { EligibilityCheckerModal } from '../../components/jobs/EligibilityCheckerModal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface JobDetailsPageProps {
  jobId: string;
  onNavigate: (path: string) => void;
  onSelectExam?: (examId: string) => void;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({
  jobId,
  onNavigate,
  onSelectExam,
}) => {
  const { isStudent, isAuthenticated } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/jobs/${jobId}`).then((res) => {
      if (res.success && res.job) {
        setJob(res.job);
      }
      setLoading(false);
    });

    // Check if saved by student
    if (isAuthenticated && isStudent) {
      apiRequest('/api/student/saved-jobs').then((res) => {
        if (res.success && res.savedJobs) {
          const exists = res.savedJobs.some((s: any) => s.jobId === jobId);
          setIsSaved(exists);
        }
      });
    }
  }, [jobId, isAuthenticated, isStudent]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated || !isStudent) {
      alert('Please log in with a student account to save job notices to your profile.');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'DELETE' });
        setIsSaved(false);
      } else {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'POST' });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Loading verified recruitment record...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-2" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Opportunity Notice Not Found</h2>
        <p className="text-sm mt-1">This recruitment notice may have closed or been moved.</p>
        <button
          onClick={() => onNavigate('/government-jobs')}
          className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-bold"
        >
          Return to Government Jobs Directory
        </button>
      </div>
    );
  }

  const isExpired = new Date(job.applicationEndDate) < new Date();

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: 'Government Jobs', path: '/government-jobs' },
          ...(job.organization
            ? [{ label: job.organization.shortName, path: `/government-jobs?organizationId=${job.organization.id}` }]
            : []),
          { label: job.title },
        ]}
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Job Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.category} type="category" />
                <StatusBadge status={job.status} type="job" />
                {job.state && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {job.state.name} Cadre
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-amber-400">
                <Building2 className="w-4 h-4" />
                <span>{job.organization?.name}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {job.title}
              </h1>

              {job.department && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allocated Department: <strong className="text-slate-800 dark:text-slate-200">{job.department}</strong>
                </p>
              )}
            </div>

            {/* Save & Share Actions */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleShare}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                title="Share Job Notice"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Share'}</span>
              </button>

              <button
                onClick={handleSaveToggle}
                disabled={saving}
                className={`px-3.5 py-2 rounded-md border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-600" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Saved to Profile' : 'Save Job'}</span>
              </button>
            </div>
          </div>

          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Total Vacancies</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                {job.vacancies}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Pay Scale / Salary</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block truncate">
                {job.salary ? `₹ ${job.salary}` : 'As per 7th CPC'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Application Deadline</span>
              <span className={`text-base font-extrabold mt-0.5 block truncate ${isExpired ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {job.applicationEndDate}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Cadre / Quota</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
                {job.category === 'CENTRAL' ? 'All India Quota' : (job.state?.name || 'State Cadre')}
              </span>
            </div>
          </div>

          {/* Interactive Eligibility Quick Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  Instant Candidate Eligibility Evaluator
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Check if your age, graduation degree, branch, and domicile state satisfy this notice.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEligibilityModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              Evaluate My Eligibility
            </button>
          </div>
        </div>

        {/* Detailed Sections Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Recruitment Specification & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Qualification & Age Criteria Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                Educational Qualification & Age Limit
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Qualification Required:
                  </span>
                  <p className="text-slate-900 dark:text-white text-sm font-extrabold">
                    {job.qualification}
                  </p>
                  {job.branch && (
                    <p className="text-slate-500 mt-1">
                      Preferred Branch / Discipline: <strong>{job.branch}</strong>
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Permissible Age Range:
                  </span>
                  <p className="text-slate-900 dark:text-white text-sm font-extrabold">
                    {job.minAge || 18} to {job.maxAge || 42} Years
                  </p>
                  <p className="text-slate-500 mt-1">
                    * Standard age relaxations applicable for SC/ST/OBC/EWS/PwD as per government rules.
                  </p>
                </div>
              </div>

              {job.description && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Official Notice Overview
                  </h3>
                  <p>{job.description}</p>
                </div>
              )}
            </div>

            {/* Selection Process & Timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                Selection Process & Stages
              </h2>

              <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                {job.selectionProcess}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Registration Start:</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {job.applicationStartDate}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Closing Date:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {job.applicationEndDate}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Examination Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {job.examDate || 'To be announced officially'}
                  </span>
                </div>
              </div>
            </div>

            {/* Examination Link if connected */}
            {job.examinationId && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-amber-400 block mb-0.5">
                    Structured Syllabus & Pattern
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {job.examination?.name || 'Examination Framework'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View complete paper-wise dynamic syllabus, question patterns, and topper roadmaps.
                  </p>
                </div>

                <button
                  onClick={() => onSelectExam?.(job.examinationId!)}
                  className="px-4 py-2 text-xs font-bold text-blue-900 dark:text-amber-400 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 rounded-md border border-blue-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  View Exam Dossier
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Official Sources & Application Guidance */}
          <div className="space-y-6">
            {/* Official Source Links Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Official Sources
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                Always submit applications strictly through official recruiting portals. Never pay fees on third-party sites.
              </p>

              <div className="space-y-3 pt-2">
                {/* Apply Officially Button */}
                <a
                  href={job.officialApplicationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-extrabold text-white bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-md transition-all text-center"
                >
                  <span>Apply Officially</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Notification PDF Link */}
                {job.officialNotificationUrl && (
                  <a
                    href={job.officialNotificationUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Download Official Notification</span>
                  </a>
                )}

                {/* Organization Commission Portal */}
                {job.organization?.officialWebsite && (
                  <a
                    href={job.organization.officialWebsite}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-blue-900 dark:text-blue-400 hover:underline"
                  >
                    <span>Visit {job.organization.shortName} Commission Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Verification Advisory</span>
              </div>
              <p>
                Career Definer is an independent career guidance and employment information platform. It is not an official Government of India, State Government, UPSC, SSC, APPSC or other government website. Users should verify recruitment details, eligibility, dates and application information from the official notification or official government website.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showEligibilityModal && (
        <EligibilityCheckerModal
          job={job}
          isOpen={showEligibilityModal}
          onClose={() => setShowEligibilityModal(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
