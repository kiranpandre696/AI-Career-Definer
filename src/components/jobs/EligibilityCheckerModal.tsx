import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, EligibilityResult, QualificationLevel } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface EligibilityCheckerModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const EligibilityCheckerModal: React.FC<EligibilityCheckerModalProps> = ({
  job,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user, profile } = useAuth();

  const [age, setAge] = useState<number | ''>('');
  const [qualification, setQualification] = useState<QualificationLevel>('Graduation');
  const [branch, setBranch] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill from student profile if available
      if (profile) {
        if (profile.dateOfBirth) {
          const birthYear = new Date(profile.dateOfBirth).getFullYear();
          const currentYear = new Date().getFullYear();
          setAge(currentYear - birthYear);
        }
        if (profile.highestQualification) {
          setQualification(profile.highestQualification);
        }
        if (profile.branchStream) {
          setBranch(profile.branchStream);
        }
        if (profile.state) {
          setState(profile.state);
        }
      }
      runCheck();
    }
  }, [isOpen, profile]);

  const runCheck = async (customAge?: number, customQual?: QualificationLevel, customState?: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/jobs/${job.id}/check-eligibility`, {
        method: 'POST',
        body: JSON.stringify({
          age: customAge !== undefined ? customAge : (age || undefined),
          qualification: customQual || qualification,
          branch: branch || undefined,
          state: customState || state || undefined,
        }),
      });

      if (res.success) {
        setResult(res as unknown as EligibilityResult);
      }
    } catch (err) {
      console.error('Eligibility check failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full my-8 overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-base sm:text-lg tracking-tight">Official Eligibility Evaluator</h2>
              <p className="text-xs text-slate-400">{job.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Official Criteria Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Prescribed Qual:</span>
              <span className="font-bold text-slate-900 dark:text-white">{job.qualification}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Permissible Age:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {job.minAge || 18} - {job.maxAge || 42} Yrs
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Cadre / State:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {job.category === 'CENTRAL' ? 'All India' : (job.state?.name || 'State Specific')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Job Category:</span>
              <span className="font-bold text-slate-900 dark:text-white">{job.category}</span>
            </div>
          </div>

          {/* Interactive Candidate Parameters Input */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Profile Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Age (Years)
                </label>
                <input
                  type="number"
                  min="16"
                  max="65"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setAge(val);
                    if (val) runCheck(Number(val));
                  }}
                  placeholder="e.g. 23"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Highest Qualification
                </label>
                <select
                  value={qualification}
                  onChange={(e) => {
                    const val = e.target.value as QualificationLevel;
                    setQualification(val);
                    runCheck(undefined, val);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="10th">10th Standard / Matriculation</option>
                  <option value="12th">12th Standard / Intermediate</option>
                  <option value="Diploma">Diploma (Polytechnic)</option>
                  <option value="Graduation">Graduation (Degree)</option>
                  <option value="B.Tech">B.Tech / B.E</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="B.Com">B.Com</option>
                  <option value="B.A">B.A</option>
                  <option value="Post Graduation">Post Graduation / Master's</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Branch / Stream (Optional)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State of Domicile
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    runCheck(undefined, undefined, e.target.value);
                  }}
                  placeholder="e.g. Andhra Pradesh, Telangana"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => runCheck()}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-blue-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-calculate Status
              </button>
            </div>
          </div>

          {/* Results Card */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Evaluation Verdict
                </span>
                <StatusBadge status={result.overallStatus} type="eligibility" />
              </div>

              {/* Criteria List */}
              <div className="space-y-2.5">
                {result.criteriaResults.map((crit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      crit.status === 'PASS'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                        : crit.status === 'FAIL'
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {crit.status === 'PASS' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : crit.status === 'FAIL' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">{crit.name}</span>
                      <p className="mt-0.5 leading-relaxed">{crit.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Missing Fields Prompt */}
              {result.missingFields.length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Incomplete Candidate Profile:
                  </p>
                  <p className="mt-0.5">
                    Evaluation is based on partial inputs ({result.missingFields.join(', ')}).
                    {!user && ' Log in or sign up to save your credentials.'}
                  </p>
                </div>
              )}

              {/* Mandatory Official Disclaimer Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Official Disclaimer:</strong> {result.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {job.officialNotificationUrl && (
              <a
                href={job.officialNotificationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 rounded-md border border-blue-300 dark:border-blue-800 transition-colors"
              >
                <span>Read Official Notification</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <a
              href={job.officialApplicationUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-md shadow-xs transition-colors"
            >
              <span>Apply Officially</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
