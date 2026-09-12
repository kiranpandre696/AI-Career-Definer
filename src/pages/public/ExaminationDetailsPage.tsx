import React, { useEffect, useState } from 'react';
import {
  Award,
  Building2,
  Calendar,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Table,
  Compass,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import {
  Examination,
  Organization,
  ExamGroup,
  PostService,
  Job,
  SyllabusSubject,
  ExamPattern,
  PreparationRoadmapPhase,
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { DynamicSyllabusView } from '../../components/exams/DynamicSyllabusView.tsx';
import { DynamicExamPatternView } from '../../components/exams/DynamicExamPatternView.tsx';
import { RoadmapView } from '../../components/exams/RoadmapView.tsx';
import { JobCard } from '../../components/jobs/JobCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface ExaminationDetailsPageProps {
  examId: string;
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
}

export const ExaminationDetailsPage: React.FC<ExaminationDetailsPageProps> = ({
  examId,
  onNavigate,
  onSelectJob,
}) => {
  const [exam, setExam] = useState<Examination | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [posts, setPosts] = useState<PostService[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [syllabusTree, setSyllabusTree] = useState<SyllabusSubject[]>([]);
  const [examPatterns, setExamPatterns] = useState<ExamPattern[]>([]);
  const [roadmap, setRoadmap] = useState<PreparationRoadmapPhase[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'pattern' | 'syllabus' | 'roadmap' | 'jobs'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/hierarchy/exams/${examId}`).then((res) => {
      if (res.success && res.examination) {
        setExam(res.examination);
        setOrganization(res.organization || null);
        setGroups(res.groups || []);
        setPosts(res.posts || []);
        setJobs(res.jobs || []);
        setSyllabusTree(res.syllabusTree || []);
        setExamPatterns(res.examPatterns || []);
        setRoadmap(res.roadmap || []);
      }
      setLoading(false);
    });
  }, [examId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Loading official examination dossier...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <Award className="w-12 h-12 mx-auto text-slate-400 mb-2" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Examination Not Found</h2>
        <p className="text-sm mt-1">The requested examination dossier does not exist or has been archived.</p>
        <button
          onClick={() => onNavigate('/examinations')}
          className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-bold"
        >
          Browse All Examinations
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Cadre Posts', icon: Award },
    { id: 'pattern', label: 'Dynamic Exam Pattern', icon: Table, count: examPatterns.length },
    { id: 'syllabus', label: 'Dynamic Syllabus', icon: BookOpen, count: syllabusTree.length },
    { id: 'roadmap', label: 'Preparation Roadmap', icon: Compass, count: roadmap.length },
    { id: 'jobs', label: 'Active Opportunities', icon: Briefcase, count: jobs.length },
  ];

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: 'Examinations', path: '/examinations' },
          ...(organization ? [{ label: organization.shortName, path: `/government-jobs?organizationId=${organization.id}` }] : []),
          { label: exam.name },
        ]}
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Exam Hero Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-amber-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  {organization?.name || 'Recruitment Commission'}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
                  {exam.examType}
                </span>
                <StatusBadge status={exam.status} type="job" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {exam.name} ({exam.shortName})
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {exam.description}
              </p>
            </div>

            {/* Official External Links */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              {exam.officialNotificationUrl && (
                <a
                  href={exam.officialNotificationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-md border border-blue-200 dark:border-slate-700 transition-colors"
                >
                  <span>Official Notification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {organization?.officialWebsite && (
                <a
                  href={organization.officialWebsite}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <span>Commission Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Eligibility & Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Min Qualification:</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{exam.qualification}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Age Bracket:</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {exam.minAge} to {exam.maxAge} Years
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md sm:col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Selection Process:</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                {exam.selectionProcess}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'border-blue-900 text-blue-900 dark:border-amber-500 dark:text-amber-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panes */}
        <div className="pt-2">
          {/* 1. OVERVIEW & POSTS / SERVICES TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Exam Groups if present */}
              {groups.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                    Examination Cadre Groups
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {groups.map((grp) => (
                      <div
                        key={grp.id}
                        className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
                      >
                        <span className="font-bold text-xs text-blue-900 dark:text-white block">
                          {grp.name}
                        </span>
                        {grp.description && (
                          <p className="text-[11px] text-slate-500 mt-1">{grp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts / Services Hierarchy */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                    Services & Posts Allocated Through {exam.shortName}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {posts.length} cadre posts configured
                  </span>
                </div>

                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">
                            {post.name}
                          </h4>
                          {post.paySalary && (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                              ₹ {post.paySalary}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {post.description}
                        </p>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          {post.responsibilities && (
                            <p className="text-slate-600 dark:text-slate-400">
                              <strong className="text-slate-800 dark:text-slate-200">Responsibilities:</strong>{' '}
                              {post.responsibilities}
                            </p>
                          )}
                          {post.careerGrowth && (
                            <p className="text-slate-600 dark:text-slate-400">
                              <strong className="text-slate-800 dark:text-slate-200">Career Hierarchy:</strong>{' '}
                              {post.careerGrowth}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                    Individual departmental cadres and service allocations will be listed here as officially notified.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. DYNAMIC EXAM PATTERN TAB */}
          {activeTab === 'pattern' && (
            <DynamicExamPatternView patterns={examPatterns} examName={exam.name} />
          )}

          {/* 3. DYNAMIC SYLLABUS TAB */}
          {activeTab === 'syllabus' && (
            <DynamicSyllabusView subjects={syllabusTree} examName={exam.name} />
          )}

          {/* 4. PREPARATION ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <RoadmapView phases={roadmap} examName={exam.name} />
          )}

          {/* 5. ACTIVE JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Active Recruitment Notifications for {exam.shortName}
                </h3>
                <span className="text-xs text-slate-500">{jobs.length} published notices</span>
              </div>

              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} onSelect={onSelectJob} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                  No active recruitment notifications for {exam.shortName} at the moment. Keep notifications enabled to receive official release alerts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
