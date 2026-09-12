import React, { useEffect, useState } from 'react';
import {
  Building2,
  ExternalLink,
  Award,
  ChevronRight,
  ShieldCheck,
  FileText,
  Search,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Organization, Examination, Job } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface CentralGovernmentPageProps {
  onNavigate: (path: string) => void;
  onSelectExam: (examId: string) => void;
  onSelectJob: (job: Job) => void;
}

export const CentralGovernmentPage: React.FC<CentralGovernmentPageProps> = ({
  onNavigate,
  onSelectExam,
  onSelectJob,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/hierarchy/organizations?type=CENTRAL'),
      apiRequest('/api/hierarchy/exams'),
    ]).then(([orgsRes, examsRes]) => {
      if (orgsRes.success && orgsRes.organizations) {
        setOrganizations(orgsRes.organizations);
      }
      if (examsRes.success && examsRes.examinations) {
        setExaminations(examsRes.examinations);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: 'Government Jobs', path: '/government-jobs' },
          { label: 'Central Government' },
        ]}
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-xl border border-blue-800 shadow-md">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Government of India Premier Recruitments
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Central Government Commissions & Boards
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Official recruitment frameworks, national competitive examinations, and administrative services conducted under the Union Government of India.
            </p>
          </div>
        </div>

        {/* Commissions Grid */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-900 dark:text-amber-400" />
            National Recruiting Authorities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map((org) => {
              const orgExams = examinations.filter((e) => e.organizationId === org.id);

              return (
                <div
                  key={org.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-blue-700 dark:hover:border-amber-500 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Org Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-extrabold text-blue-900 dark:text-amber-400 uppercase tracking-wider block mb-1">
                          {org.shortName}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {org.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                        {org.type}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {org.description}
                    </p>

                    {/* Conducted Examinations List */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Conducted Public Examinations:
                      </span>

                      {orgExams.length > 0 ? (
                        <div className="space-y-2">
                          {orgExams.map((exam) => (
                            <div
                              key={exam.id}
                              onClick={() => onSelectExam(exam.id)}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 block">
                                    {exam.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Eligibility: {exam.qualification} | Age: {exam.minAge}-{exam.maxAge} Yrs
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Multiple national recruitment notifications published annually.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <a
                      href={org.officialWebsite}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors"
                    >
                      <span>Official Commission Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onNavigate(`/government-jobs?organizationId=${org.id}`)}
                      className="inline-flex items-center gap-1 font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <span>View Open Jobs</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
