import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  GraduationCap,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Briefcase,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Job } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSelect: (job: Job) => void;
  onOpenEligibility?: (job: Job) => void;
  onToggleSave?: (jobId: string, newState: boolean) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved: initialIsSaved = false,
  onSelect,
  onOpenEligibility,
  onToggleSave,
}) => {
  const { isStudent, isAuthenticated, profile } = useAuth();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(initialIsSaved);
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !isStudent) {
      alert('Please log in as a student to save jobs to your profile.');
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        await apiRequest(`/api/student/saved-jobs/${job.id}`, { method: 'DELETE' });
        setSaved(false);
        onToggleSave?.(job.id, false);
      } else {
        await apiRequest(`/api/student/saved-jobs/${job.id}`, { method: 'POST' });
        setSaved(true);
        onToggleSave?.(job.id, true);
      }
    } catch (err) {
      console.error('Error toggling saved state', err);
    } finally {
      setSaving(false);
    }
  };

  const isExpired = new Date(job.applicationEndDate) < new Date();
  const isGovernment = job.jobType === 'GOVERNMENT';

  // Compute eligibility state if student has a profile
  let eligibilityStatus: 'Eligible' | 'May Be Eligible' | 'Not Eligible' = 'Eligible';
  if (profile) {
    const qualWeights: Record<string, number> = {
      '10th': 1,
      '12th': 2,
      'Diploma': 3,
      'Graduation': 4,
      'B.Tech': 4,
      'Post Graduation': 5,
    };
    const candQual = qualWeights[profile.highestQualification || ''] || 3;
    const jobQual = qualWeights[job.qualification] || 3;

    if (candQual < jobQual) {
      eligibilityStatus = 'Not Eligible';
    } else if (profile.age && (profile.age < job.minAge || profile.age > job.maxAge)) {
      eligibilityStatus = 'Not Eligible';
    } else if (job.branch && profile.branch && !job.branch.toLowerCase().includes(profile.branch.toLowerCase())) {
      eligibilityStatus = 'May Be Eligible';
    } else {
      eligibilityStatus = 'Eligible';
    }
  }

  return (
    <div
      onClick={() => onSelect(job)}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-700 dark:hover:border-amber-500/80 transition-all duration-200 hover:shadow-md group cursor-pointer relative flex flex-col justify-between"
    >
      <div>
        {/* Top Badges: Govt/Private, Verified, Published & Save Button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Government vs Private Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                isGovernment
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              }`}
            >
              {isGovernment ? <Building2 className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
              <span>{isGovernment ? t('badge.govt', 'Government') : t('badge.private', 'Private')}</span>
            </span>

            {/* Verified Label */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{t('badge.verified', 'Verified')}</span>
            </span>

            {/* Published Status */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>{t('badge.published', 'Published')}</span>
            </span>

            {/* Eligibility Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                eligibilityStatus === 'Eligible'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                  : eligibilityStatus === 'May Be Eligible'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>{eligibilityStatus}</span>
            </span>
          </div>

          {/* Dedicated Save Job Button */}
          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
              saved
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={saved ? 'Job Saved' : 'Save Job'}
          >
            {saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="hidden sm:inline">{t('card.saved', 'Saved')}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('card.save', 'Save Job')}</span>
              </>
            )}
          </button>
        </div>

        {/* Organization Name */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-400 mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">{job.organization?.name || 'Recruiting Authority'}</span>
        </div>

        {/* Job Title */}
        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
          {job.title}
        </h3>

        {/* Structured Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>{t('card.qualification', 'Qual')}:</strong> {job.qualification}
              {job.branch && ` (${job.branch})`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>{t('card.location', 'Location')}:</strong> {job.location || job.state?.name || (isGovernment ? 'Pan-India' : 'India')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>{t('card.vacancies', 'Vacancies')}:</strong> {job.vacancies}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={`truncate ${isExpired ? 'text-rose-600 font-bold' : ''}`}>
              <strong>{t('card.lastDate', 'Last Date')}:</strong> {job.applicationEndDate}
            </span>
          </div>

          {job.salary && (
            <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold pt-0.5">
              <span>₹ {job.salary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenEligibility?.(job);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('card.checkEligibility', 'Check Eligibility')}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(job);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <span>{t('card.viewDetails', 'View Details')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
