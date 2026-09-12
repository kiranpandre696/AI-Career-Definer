import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  ExternalLink,
  GraduationCap,
  Clock,
  Filter,
  Layers,
  Sparkles,
  Share2,
  Check,
  Globe,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, StateEntity } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface PrivateJobsPageProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
}

export const PrivateJobsPage: React.FC<PrivateJobsPageProps> = ({
  onNavigate,
  onSelectJob,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [states, setStates] = useState<StateEntity[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [qualification, setQualification] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/jobs?jobType=PRIVATE&limit=500'),
      apiRequest('/api/hierarchy/states'),
    ]).then(([jobsRes, statesRes]) => {
      if (jobsRes.success && jobsRes.jobs) {
        setJobs(jobsRes.jobs);
      }
      if (statesRes.success && statesRes.states) {
        setStates(statesRes.states);
      }
      setLoading(false);
    });
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const term = query.toLowerCase();
    const skillsList = j.skillsRequired || j.skills || [];
    const matchesSearch =
      !query.trim() ||
      j.title.toLowerCase().includes(term) ||
      (j.companyName && j.companyName.toLowerCase().includes(term)) ||
      (j.department && j.department.toLowerCase().includes(term)) ||
      (j.location && j.location.toLowerCase().includes(term)) ||
      (j.state?.name && j.state.name.toLowerCase().includes(term)) ||
      skillsList.some((s) => s.toLowerCase().includes(term));

    const matchesState = !selectedStateId || j.stateId === selectedStateId;
    const matchesSector = !sector || j.sector === sector;
    const matchesMode = !workMode || j.workMode === workMode;
    const matchesQual = !qualification || j.qualification === qualification;

    return matchesSearch && matchesState && matchesSector && matchesMode && matchesQual;
  });

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Private Jobs' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 text-xs font-bold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            Corporate & Private Sector Employment across 28 States
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Private Industry Careers & State-wise Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Verified private openings across Information Technology, Banking & Finance, Core Engineering, Renewable Energy, and Pharmaceuticals in every Indian state.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, company, skill (Java, Python, CMM, GIS, SCADA)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* State Filter */}
            <select
              value={selectedStateId}
              onChange={(e) => setSelectedStateId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-medium"
            >
              <option value="">All Indian States (28 States)</option>
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.code ? `(${st.code})` : ''}
                </option>
              ))}
            </select>

            {/* Qualification Filter */}
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">All Qualifications</option>
              <option value="B.Tech">B.Tech / B.E</option>
              <option value="Diploma">Diploma (Polytechnic)</option>
              <option value="Graduation">Graduate Degree</option>
              <option value="12th">12th / Intermediate</option>
              <option value="10th">10th / Secondary</option>
            </select>

            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">All Work Modes</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredJobs.length}</strong> verified private career opportunities
            {selectedStateId && ` in ${states.find((s) => s.id === selectedStateId)?.name || 'Selected State'}`}
          </span>
          {selectedStateId && (
            <button
              onClick={() => setSelectedStateId('')}
              className="text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Clear state filter
            </button>
          )}
        </div>

        {/* Private Jobs List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading private job opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No private jobs matched your filters.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing the search text or state dropdown.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:border-purple-500 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                          {job.companyName || job.department || 'Corporate Employer'}
                        </span>
                        {job.state && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {job.state.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {job.title}
                      </h3>
                    </div>
                    {job.workMode && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                        {job.workMode}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {job.location && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {job.location}
                      </span>
                    )}
                    {job.qualification && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {job.qualification}
                      </span>
                    )}
                    {job.salary && (
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {job.branch && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">Eligibility:</strong> {job.branch}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills Chips */}
                  {((job.skillsRequired && job.skillsRequired.length > 0) || (job.skills && job.skills.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(job.skillsRequired || job.skills || []).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Apply by: {job.applicationEndDate || 'Open Recruitment'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectJob(job)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <a
                      href={job.officialApplicationUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply Officially</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
