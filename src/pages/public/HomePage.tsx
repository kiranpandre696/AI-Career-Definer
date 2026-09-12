import React, { useEffect, useState } from 'react';
import {
  Search,
  Building2,
  BookOpen,
  Award,
  Layers,
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Table,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, Notice, Organization, Examination, QualificationLevel } from '../../types.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { JobCard } from '../../components/jobs/JobCard.tsx';
import { EligibilityCheckerModal } from '../../components/jobs/EligibilityCheckerModal.tsx';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
  onOpenVoiceAssistant?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectJob, onOpenVoiceAssistant }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityJob, setEligibilityJob] = useState<Job | null>(null);
  const [selectedQualFilter, setSelectedQualFilter] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadHomeData = async () => {
      try {
        const [jobsRes, noticesRes] = await Promise.all([
          apiRequest('/api/jobs?limit=8&status=PUBLISHED'),
          apiRequest('/api/notices'),
        ]);

        if (mounted) {
          if (jobsRes.success && jobsRes.jobs) {
            setLatestJobs(jobsRes.jobs);
          }
          if (noticesRes.success && noticesRes.notices) {
            setNotices(noticesRes.notices.slice(0, 6));
          }
        }
      } catch (err) {
        console.error('Failed loading homepage data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/government-jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/government-jobs');
    }
  };

  const quickAccessItems = [
    { label: 'Government Jobs', icon: Building2, path: '/government-jobs', color: 'text-blue-900 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Government Exams', icon: Award, path: '/examinations', color: 'text-amber-800 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Central Government', icon: ShieldCheck, path: '/government-jobs/central', color: 'text-indigo-800 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'State Government', icon: Layers, path: '/government-jobs/states', color: 'text-emerald-800 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Private Jobs', icon: Briefcase, path: '/private-jobs', color: 'text-purple-800 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Eligibility Checker', icon: CheckCircle2, path: '/government-jobs', color: 'text-teal-800 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Syllabus Finder', icon: BookOpen, path: '/examinations', color: 'text-rose-800 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Exam Pattern', icon: Table, path: '/examinations', color: 'text-cyan-800 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { label: 'Career Roadmaps', icon: Compass, path: '/career-guidance', color: 'text-orange-800 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  ];

  const qualificationPills = [
    { label: 'Jobs After 10th', qual: '10th' },
    { label: 'Jobs After 12th', qual: '12th' },
    { label: 'Jobs After Diploma', qual: 'Diploma' },
    { label: 'Jobs After Graduation', qual: 'Graduation' },
    { label: 'Jobs After B.Tech', qual: 'B.Tech' },
  ];

  const displayedJobs = selectedQualFilter
    ? latestJobs.filter((j) => {
        if (j.qualification === selectedQualFilter) return true;
        if (selectedQualFilter === 'Graduation' && ['B.Tech', 'B.Sc', 'B.Com', 'B.A'].includes(j.qualification)) return true;
        return false;
      })
    : latestJobs;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section with Official Deep Blue Aesthetic */}
      <section className="relative portal-header-gradient text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-lg border-b border-amber-500/30">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-600/40 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>National Employment & Public Service Information Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans max-w-3xl mx-auto">
            Find the Right Career. <br />
            <span className="text-amber-400">Discover the Right Opportunity.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Explore government examinations, services, posts, private jobs, eligibility, syllabus and preparation guidance in one place.
          </p>

          {/* Central Main Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden border-2 border-amber-500/80 p-1">
              <div className="pl-3 pr-2 text-slate-400">
                <Search className="w-5 h-5 text-blue-900 dark:text-amber-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, exams (UPSC, SSC, APPSC, RRB), posts or qualification..."
                className="w-full py-2.5 px-2 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 bg-transparent focus:outline-hidden"
              />
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-md text-sm transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* AI Voice Career Assistant Quick Launch Banner */}
          {onOpenVoiceAssistant && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/40 text-amber-300 hover:text-white border border-amber-400/40 text-xs font-bold transition-all shadow-sm cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center shrink-0">
                  <Mic className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
                <span>Ask Career Questions by Voice (తెలుగు • हिन्दी • English)</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Quick Qualification Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-300 font-semibold mr-1">Direct Filters:</span>
            {qualificationPills.map((pill) => (
              <button
                key={pill.qual}
                onClick={() => onNavigate(`/government-jobs?qualification=${pill.qual}`)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Quick Access Grid (9 Modules) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-900 dark:text-amber-400" />
              Quick Access Portals
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Direct access to all platform sectors and tools
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  className="flex items-center gap-3 p-3.5 sm:p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
                >
                  <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 transition-colors truncate">
                      {item.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Explore official database
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Two-Column Section: Important Notices & Latest Updates */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Important Notices (1 col on large screens) */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                  Important Notices
                </h3>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Official Desk
                </span>
              </div>

              <div className="space-y-3">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-bold text-blue-900 dark:text-blue-400 truncate">
                        {notice.organizationName}
                      </span>
                      <StatusBadge status={notice.status} type="notice" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {notice.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {notice.date}
                      </span>
                      {notice.linkUrl && (
                        <a
                          href={notice.linkUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-blue-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-center">
              <button
                onClick={() => onNavigate('/government-jobs')}
                className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All Announcements & Notifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Government Table: Latest Opportunities (2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Latest Recruitment Opportunities
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified central and state government vacancy advertisements
                </p>
              </div>

              {/* Qualification quick pills */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  onClick={() => setSelectedQualFilter(null)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    selectedQualFilter === null
                      ? 'bg-blue-900 text-white dark:bg-amber-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  All
                </button>
                {qualificationPills.map((pill) => (
                  <button
                    key={pill.qual}
                    onClick={() =>
                      setSelectedQualFilter(selectedQualFilter === pill.qual ? null : pill.qual)
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      selectedQualFilter === pill.qual
                        ? 'bg-blue-900 text-white dark:bg-amber-600 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {pill.qual}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Opportunities Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Commission / Organization
                      </th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Recruitment Post / Exam
                      </th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Qual.
                      </th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Last Date
                      </th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">
                        Status
                      </th>
                      <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {displayedJobs.length > 0 ? (
                      displayedJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-blue-900 dark:text-blue-400 block truncate max-w-[150px]">
                              {job.organization?.shortName || job.organization?.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {job.category === 'CENTRAL' ? 'Central Govt' : (job.state?.name || 'State Govt')}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                              {job.title}
                            </span>
                            {job.vacancies && (
                              <span className="text-[11px] text-slate-500">
                                {job.vacancies} Vacancies
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                              {job.qualification}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {job.applicationEndDate}
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <StatusBadge status={job.status} type="job" />
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => onSelectJob(job)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 dark:bg-slate-800 dark:text-amber-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                          No active job notices match the selected qualification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing {displayedJobs.length} of {latestJobs.length} active opportunities
                </span>
                <button
                  onClick={() => onNavigate('/government-jobs')}
                  className="font-bold text-blue-900 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Full Job Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Card Grid for In-depth Exploration */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Featured Career Pathways
              </h3>
              <p className="text-xs text-slate-500">
                Direct links to premier recruitment examinations and preparation frameworks
              </p>
            </div>
            <button
              onClick={() => onNavigate('/examinations')}
              className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              All Exams <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => onNavigate('/examinations/exam_upsc_cse')}
              className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-400">UPSC CSE</span>
                <StatusBadge status="CENTRAL" type="category" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400">
                Civil Services Examination (IAS / IPS / IFS)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                India's premier administrative service recruitment covering Preliminary, Mains, and Personality Test stages.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-amber-400">
                <span>View Syllabus & Pattern</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('/examinations/exam_ssc_cgl')}
              className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-400">SSC CGL</span>
                <StatusBadge status="CENTRAL" type="category" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400">
                Combined Graduate Level Examination
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                Group 'B' and Group 'C' posts across Central Ministries including Income Tax Inspector, ASO, and Central Excise.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-amber-400">
                <span>View Syllabus & Pattern</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('/government-jobs/states/st_ap')}
              className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400">APPSC Group-I / II</span>
                <StatusBadge status="STATE" type="category" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400">
                Andhra Pradesh Public Service Commission
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                State Civil Services recruitment for Deputy Collectors, DSPs, Commercial Tax Officers, and Assistant Section Officers.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-amber-400">
                <span>View State Cadres</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Eligibility Modal if triggered */}
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
