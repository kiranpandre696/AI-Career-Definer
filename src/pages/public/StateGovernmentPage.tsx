import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Building2,
  ExternalLink,
  ChevronRight,
  Layers,
  Award,
  Search,
  Briefcase,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StateEntity, Organization, Examination, Job } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { JobCard } from '../../components/jobs/JobCard.tsx';
import { EligibilityCheckerModal } from '../../components/jobs/EligibilityCheckerModal.tsx';

interface StateGovernmentPageProps {
  onNavigate: (path: string) => void;
  onSelectExam: (examId: string) => void;
  onSelectJob: (job: Job) => void;
  initialStateId?: string;
}

export const StateGovernmentPage: React.FC<StateGovernmentPageProps> = ({
  onNavigate,
  onSelectExam,
  onSelectJob,
  initialStateId,
}) => {
  const [states, setStates] = useState<StateEntity[]>([]);
  const [selectedState, setSelectedState] = useState<StateEntity | null>(null);
  const [stateOrganizations, setStateOrganizations] = useState<Organization[]>([]);
  const [stateExams, setStateExams] = useState<Examination[]>([]);
  const [stateJobs, setStateJobs] = useState<Job[]>([]);
  const [searchState, setSearchState] = useState('');
  const [eligibilityJob, setEligibilityJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/hierarchy/states').then((res) => {
      if (res.success && res.states) {
        setStates(res.states);
        // Default to AP or initial
        const target = initialStateId
          ? res.states.find((s: StateEntity) => s.id === initialStateId)
          : res.states.find((s: StateEntity) => s.id === 'st_ap') || res.states[0];
        if (target) {
          setSelectedState(target);
        }
      }
      setLoading(false);
    });
  }, [initialStateId]);

  useEffect(() => {
    if (!selectedState) return;

    // Load orgs, exams and jobs for this state
    Promise.all([
      apiRequest(`/api/hierarchy/organizations?type=STATE&stateId=${selectedState.id}`),
      apiRequest(`/api/jobs?category=STATE&stateId=${selectedState.id}&status=PUBLISHED`),
      apiRequest('/api/hierarchy/exams'),
    ]).then(([orgsRes, jobsRes, examsRes]) => {
      if (orgsRes.success && orgsRes.organizations) {
        setStateOrganizations(orgsRes.organizations);
      }
      if (jobsRes.success && jobsRes.jobs) {
        setStateJobs(jobsRes.jobs);
      }
      if (examsRes.success && examsRes.examinations) {
        // filter exams belonging to these state orgs
        const orgIds = new Set((orgsRes.organizations || []).map((o: Organization) => o.id));
        const filteredExams = examsRes.examinations.filter((e: Examination) => orgIds.has(e.organizationId));
        setStateExams(filteredExams);
      }
    });
  }, [selectedState]);

  const filteredStates = states.filter((s) =>
    s.name.toLowerCase().includes(searchState.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: 'Government Jobs', path: '/government-jobs' },
          { label: 'State Government Services', path: '/government-jobs/states' },
          ...(selectedState ? [{ label: selectedState.name }] : []),
        ]}
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-xl border border-slate-800 shadow-md">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <MapPin className="w-3.5 h-3.5" />
              State Public Service Cadres & Commissions
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              State Government Recruitments & Examinations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Browse civil service commissions, Group-I, Group-II, Group-IV departmental vacancies, and police recruitments across all 28 Indian States and 8 Union Territories.
            </p>
          </div>
        </div>

        {/* State Selection Layout: Left Sidebar List / Right Active State Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: States & UTs Directory (1 col) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4 max-h-[700px] flex flex-col">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Select State or Union Territory
              </h2>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  placeholder="Filter states..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-y-auto space-y-1 pr-1 flex-1">
              {filteredStates.map((st) => {
                const isSelected = selectedState?.id === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedState(st)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900 text-white dark:bg-amber-600 font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{st.name}</span>
                    {st.isUnionTerritory && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        UT
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 3 Columns: Selected State Profile & Recruitments */}
          <div className="lg:col-span-3 space-y-6">
            {selectedState && (
              <>
                {/* State Title Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {selectedState.isUnionTerritory ? 'Union Territory of India' : 'State Cadre Recruitment'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Code: {selectedState.code}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {selectedState.name} Public Services
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Cadres under the state constitutional commission and departmental selection boards.
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate(`/government-jobs?stateId=${selectedState.id}`)}
                    className="px-4 py-2 text-xs font-bold text-blue-900 dark:text-amber-400 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-md border border-blue-200 dark:border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Filter All {selectedState.name} Jobs
                  </button>
                </div>

                {/* State Commission Card */}
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                    State Recruiting Commissions & Authorities
                  </h3>

                  {stateOrganizations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stateOrganizations.map((org) => (
                        <div
                          key={org.id}
                          className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-xs text-blue-900 dark:text-amber-400">
                                {org.shortName}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {org.name}
                              </h4>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                              STATE
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                            {org.description}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <a
                              href={org.officialWebsite}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <span>Official Website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => onNavigate(`/examinations?organizationId=${org.id}`)}
                              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                            >
                              View Examinations
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      The State Public Service Commission directory and departmental authorities for {selectedState.name} are maintained in the central database. Check active vacancy advertisements below.
                    </div>
                  )}
                </div>

                {/* State Examinations & Groups (e.g. Group-I, Group-II) */}
                {stateExams.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                      Key State Public Examinations
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stateExams.map((exam) => (
                        <div
                          key={exam.id}
                          onClick={() => onSelectExam(exam.id)}
                          className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-blue-900 dark:text-amber-400">
                              {exam.shortName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {exam.qualification}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400">
                            {exam.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {exam.description}
                          </p>
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-amber-400">
                            <span>Syllabus & Exam Pattern</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* State Open Recruitment Notices */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                      Active Vacancy Notices in {selectedState.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {stateJobs.length} open announcements
                    </span>
                  </div>

                  {stateJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stateJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onSelect={onSelectJob}
                          onOpenEligibility={(j) => setEligibilityJob(j)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                      No active recruitment advertisements currently listed for {selectedState.name}. Check back frequently or configure notifications in your student profile.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {eligibilityJob && (
        <EligibilityCheckerModal
          job={eligibilityJob}
          isOpen={Boolean(eligibilityJob)}
          onClose={() => setEligibilityJob(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
