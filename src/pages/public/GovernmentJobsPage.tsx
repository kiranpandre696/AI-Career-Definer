import React, { useEffect, useState } from 'react';
import {
  Building2,
  Filter,
  Search,
  MapPin,
  GraduationCap,
  Calendar,
  Layers,
  X,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, StateEntity, Organization, QualificationLevel } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { JobCard } from '../../components/jobs/JobCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { EligibilityCheckerModal } from '../../components/jobs/EligibilityCheckerModal.tsx';

interface GovernmentJobsPageProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
  initialQuery?: string;
  initialQualification?: string;
}

export const GovernmentJobsPage: React.FC<GovernmentJobsPageProps> = ({
  onNavigate,
  onSelectJob,
  initialQuery = '',
  initialQualification = '',
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [states, setStates] = useState<StateEntity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<'ALL' | 'CENTRAL' | 'STATE'>('ALL');
  const [stateId, setStateId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [qualification, setQualification] = useState<string>(initialQualification);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [eligibilityJob, setEligibilityJob] = useState<Job | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Fetch filter reference options
    Promise.all([
      apiRequest('/api/hierarchy/states'),
      apiRequest('/api/hierarchy/organizations?type=CENTRAL'),
      apiRequest('/api/hierarchy/organizations?type=STATE'),
    ]).then(([statesRes, centralRes, stateOrgsRes]) => {
      if (statesRes.success && statesRes.states) setStates(statesRes.states);
      const allOrgs = [
        ...(centralRes.organizations || []),
        ...(stateOrgsRes.organizations || []),
      ];
      setOrganizations(allOrgs);
    });
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('jobType', 'GOVERNMENT');
      params.set('page', String(page));
      params.set('limit', '12');

      if (query.trim()) params.set('q', query.trim());
      if (category !== 'ALL') params.set('category', category);
      if (stateId) params.set('stateId', stateId);
      if (organizationId) params.set('organizationId', organizationId);
      if (qualification) params.set('qualification', qualification);

      const res = await apiRequest(`/api/jobs?${params.toString()}`);
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed fetching jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [category, stateId, organizationId, qualification, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setQuery('');
    setCategory('ALL');
    setStateId('');
    setOrganizationId('');
    setQualification('');
    setPage(1);
  };

  const hasActiveFilters =
    query || category !== 'ALL' || stateId || organizationId || qualification;

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Government Jobs' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Government Recruitment Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Verified recruitment notices across Central Ministries, Public Service Commissions, Railways, and State Cadres.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-md flex items-center border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Official Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {/* Top Row: Search & Sector Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Central vs State Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md self-start">
              <button
                onClick={() => { setCategory('ALL'); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  category === 'ALL'
                    ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Vacancies
              </button>
              <button
                onClick={() => { setCategory('CENTRAL'); setPage(1); setStateId(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  category === 'CENTRAL'
                    ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Central Government
              </button>
              <button
                onClick={() => { setCategory('STATE'); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  category === 'STATE'
                    ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                State Government
              </button>
            </div>

            {/* Keyword Search Field */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by post, commission, qualification, keyword..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-md text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* State Domicile Filter */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                State / UT Cadre
              </label>
              <select
                value={stateId}
                onChange={(e) => { setStateId(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="">All States / All India</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.isUnionTerritory ? '(UT)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Recruiting Commission Filter */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Recruiting Commission
              </label>
              <select
                value={organizationId}
                onChange={(e) => { setOrganizationId(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.shortName} ({org.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Qualification Filter */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Minimum Qualification
              </label>
              <select
                value={qualification}
                onChange={(e) => { setQualification(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="">Any Qualification</option>
                <option value="10th">10th Standard / Matriculation</option>
                <option value="12th">12th Standard / Intermediate</option>
                <option value="Diploma">Diploma (Polytechnic)</option>
                <option value="Graduation">Graduation (Degree)</option>
                <option value="B.Tech">B.Tech / B.E</option>
                <option value="Post Graduation">Post Graduation / Master's</option>
              </select>
            </div>

            {/* Clear All Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Found <strong className="text-slate-900 dark:text-white">{totalCount}</strong> government recruitment notices
          </span>
          {loading && (
            <span className="flex items-center gap-1 text-blue-900 dark:text-amber-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading official updates...
            </span>
          )}
        </div>

        {/* Results Content */}
        {jobs.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={onSelectJob}
                  onOpenEligibility={(j) => setEligibilityJob(j)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Commission</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Recruitment Title</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Category</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Qual.</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Vacancies</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Last Date</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-center">Status</th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-blue-900 dark:text-blue-400 block truncate max-w-[140px]">
                            {job.organization?.shortName || job.organization?.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {job.state?.name || 'Central Cadre'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white">
                          <span className="line-clamp-1">{job.title}</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <StatusBadge status={job.category} type="category" />
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {job.qualification}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {job.vacancies}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {job.applicationEndDate}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={job.status} type="job" />
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => setEligibilityJob(job)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                          >
                            Check
                          </button>
                          <button
                            onClick={() => onSelectJob(job)}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 dark:bg-slate-800 dark:text-amber-400 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              No Government Notifications Match the Criteria
            </h3>
            <p className="text-xs max-w-md mx-auto">
              Try removing some filter restrictions or clearing the search keyword to browse all available public opportunities.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 text-xs font-bold text-blue-900 dark:text-amber-400 bg-blue-50 dark:bg-slate-800 rounded-md cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-40 cursor-pointer"
            >
              Previous Page
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-40 cursor-pointer"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Eligibility Modal */}
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
