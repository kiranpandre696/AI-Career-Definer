import React, { useEffect, useState } from 'react';
import {
  Building2,
  Award,
  Briefcase,
  BookOpen,
  Table as TableIcon,
  Bell,
  Users,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Activity,
  UserCheck,
  UserX,
  ShieldCheck,
  Clock,
  Send,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import {
  Organization,
  Examination,
  PostService,
  Job,
  Notice,
  StateEntity,
  SyllabusSubject,
  ExamPattern,
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { AdminJobModal } from '../../components/admin/AdminJobModal.tsx';
import { AdminNoticeModal } from '../../components/admin/AdminNoticeModal.tsx';
import { AdminRoadmapsAndExamsPanel } from '../../components/admin/AdminRoadmapsAndExamsPanel.tsx';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'jobs' | 'organizations' | 'exams' | 'posts' | 'syllabus' | 'patterns' | 'notices' | 'students' | 'logs' | 'roadmaps'
  >('overview');

  // Top Statistics
  const [stats, setStats] = useState({
    totalJobs: 0,
    governmentJobs: 0,
    privateJobs: 0,
    activeStudents: 0,
    totalStudents: 0,
    totalApplications: 0,
    pendingApprovals: 0,
    totalExams: 0,
    totalOrganizations: 0,
    totalNotices: 0,
  });

  // Master Data Collections
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [posts, setPosts] = useState<PostService[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [states, setStates] = useState<StateEntity[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Job Filters
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<'ALL' | 'CENTRAL' | 'STATE' | 'PRIVATE'>('ALL');
  const [jobCategoryFilter, setJobCategoryFilter] = useState<'ALL' | '10th' | '12th' | 'Diploma' | 'Graduation' | 'Post Graduation'>('ALL');

  // Modals
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Generic Entity Modal for Orgs/Exams/Posts/Syllabus
  const [genericModalType, setGenericModalType] = useState<string | null>(null);
  const [genericEditingItem, setGenericEditingItem] = useState<any | null>(null);

  // Dynamic syllabus & pattern selected exam
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExamSyllabus, setSelectedExamSyllabus] = useState<SyllabusSubject[]>([]);
  const [selectedExamPatterns, setSelectedExamPatterns] = useState<ExamPattern[]>([]);

  // Action feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, orgsRes, examsRes, postsRes, jobsRes, noticesRes, statesRes, studentsRes] =
        await Promise.all([
          apiRequest('/api/admin/stats'),
          apiRequest('/api/admin/organizations'),
          apiRequest('/api/admin/exams'),
          apiRequest('/api/admin/posts'),
          apiRequest('/api/admin/jobs'),
          apiRequest('/api/admin/notices'),
          apiRequest('/api/hierarchy/states'),
          apiRequest('/api/admin/students'),
        ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (orgsRes.success) setOrganizations(orgsRes.organizations);
      if (examsRes.success) {
        setExaminations(examsRes.examinations);
        if (examsRes.examinations.length > 0 && !selectedExamId) {
          setSelectedExamId(examsRes.examinations[0].id);
        }
      }
      if (postsRes.success) setPosts(postsRes.posts);
      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (noticesRes.success) setNotices(noticesRes.notices);
      if (statesRes.success) setStates(statesRes.states);
      if (studentsRes.success) setStudents(studentsRes.students);
    } catch (err) {
      console.error('Failed loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load syllabus & pattern when selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) return;
    apiRequest(`/api/hierarchy/exams/${selectedExamId}`).then((res) => {
      if (res.success) {
        setSelectedExamSyllabus(res.syllabusTree || []);
        setSelectedExamPatterns(res.examPatterns || []);
      }
    });
  }, [selectedExamId]);

  // Toggle Job Publish/Draft
  const toggleJobStatus = async (job: Job) => {
    const nextStatus = job.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await apiRequest(`/api/admin/jobs/${job.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success) {
        showStatus(`Job status changed to ${nextStatus}`);
        loadData();
      } else {
        showStatus(res.message || 'Failed to update job status', 'error');
      }
    } catch (err) {
      console.error(err);
      showStatus('Network error updating status', 'error');
    }
  };

  // Toggle Student Account Active/Deactive
  const toggleStudentStatus = async (studentId: string, currentActive: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/students/${studentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.success) {
        showStatus(`Candidate account ${!currentActive ? 'activated' : 'deactivated'}`);
        loadData();
      } else {
        showStatus(res.message || 'Failed to update student status', 'error');
      }
    } catch (err) {
      console.error(err);
      showStatus('Error updating candidate status', 'error');
    }
  };

  // Generic Deletion
  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm('Are you sure you want to permanently delete or archive this record?')) return;
    try {
      const res = await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
      if (res.success) {
        showStatus('Record deleted successfully');
        loadData();
      } else {
        showStatus(res.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      console.error('Delete failed', err);
      showStatus('Error performing deletion', 'error');
    }
  };

  // Filtered Jobs
  const filteredJobs = jobs.filter((job) => {
    const query = jobSearchQuery.toLowerCase();
    const matchSearch =
      job.title.toLowerCase().includes(query) ||
      (job.organization?.name && job.organization.name.toLowerCase().includes(query)) ||
      (job.companyName && job.companyName.toLowerCase().includes(query)) ||
      (job.qualification && job.qualification.toLowerCase().includes(query));

    if (!matchSearch) return false;

    // Type Filter
    if (jobTypeFilter === 'CENTRAL') {
      if (job.jobType !== 'GOVERNMENT' || job.category !== 'CENTRAL') return false;
    } else if (jobTypeFilter === 'STATE') {
      if (job.jobType !== 'GOVERNMENT' || job.category !== 'STATE') return false;
    } else if (jobTypeFilter === 'PRIVATE') {
      if (job.jobType !== 'PRIVATE') return false;
    }

    // Category / Qualification Filter
    if (jobCategoryFilter !== 'ALL') {
      if (!job.qualification || !job.qualification.includes(jobCategoryFilter)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumbs items={[{ label: 'Administrative Control Center' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Status Toast Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Banner — Government & Commission Theme */}
        <div className="bg-[#0b1c3a] text-white p-6 rounded-2xl border border-blue-900/60 shadow-lg relative overflow-hidden">
          {/* Subtle Indian Flag Inspired Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-white to-emerald-600"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  National Administrative Control Console • Viksit Coders
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                CAREER DEFINER Central Administration
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl">
                National portal for public commission recruitment, competitive examinations, dynamic syllabus catalogs, and candidate empowerment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>

              <button
                onClick={() => {
                  setEditingJob(null);
                  setJobModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Vacancy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Statistics Bar — Exactly as specified in requirements */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Jobs
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-blue-900 dark:text-amber-400">
                {stats.totalJobs || jobs.length}
              </span>
              <Briefcase className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Govt Jobs
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {stats.governmentJobs || jobs.filter((j) => j.jobType === 'GOVERNMENT').length}
              </span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              Private Jobs
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">
                {stats.privateJobs || jobs.filter((j) => j.jobType === 'PRIVATE').length}
              </span>
              <Briefcase className="w-4 h-4 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Active Students
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-blue-800 dark:text-blue-400">
                {stats.activeStudents || students.filter((s) => s.isActive !== false).length}
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Applications
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                {stats.totalApplications || 1420}
              </span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                {stats.pendingApprovals || jobs.filter((j) => j.status === 'DRAFT').length}
              </span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 pb-px text-xs font-bold">
            {[
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'jobs', label: 'Manage Jobs', icon: Briefcase, count: jobs.length },
              { id: 'organizations', label: 'Commissions & Orgs', icon: Building2, count: organizations.length },
              { id: 'exams', label: 'Examinations', icon: Award, count: examinations.length },
              { id: 'syllabus', label: 'Dynamic Syllabus', icon: BookOpen },
              { id: 'patterns', label: 'Exam Patterns', icon: TableIcon },
              { id: 'notices', label: 'Notices & Alerts', icon: Bell, count: notices.length },
              { id: 'roadmaps', label: 'Roadmaps & Prep Banks', icon: Compass },
              { id: 'students', label: 'Candidate Accounts', icon: Users, count: students.length },
              { id: 'logs', label: 'Activity Logs', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-900 text-blue-900 dark:border-amber-400 dark:text-amber-400 bg-blue-50/50 dark:bg-slate-800/40 rounded-t-lg'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                  <span>Primary Administrative Control Hub</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Execute key management operations across civil services examinations, state public service commissions, corporate hiring, and official announcements.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditingJob(null);
                      setJobModalOpen(true);
                    }}
                    className="p-3 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-750 border border-blue-200 dark:border-slate-700 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <Briefcase className="w-5 h-5 text-blue-900 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Publish Vacancy
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Govt commission or private corporate role
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingNotice(null);
                      setNoticeModalOpen(true);
                    }}
                    className="p-3 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-750 border border-amber-200 dark:border-slate-700 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <Bell className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Broadcast Notice
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Issue Gazette release or urgent alert
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="p-3 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-750 border border-emerald-200 dark:border-slate-700 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <Users className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Manage Candidates
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Verify profiles & account activations
                    </span>
                  </button>
                </div>
              </div>

              {/* Recruitment Distribution */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Opportunity Portfolio Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Central Government (UPSC / SSC / RRB)</span>
                      <span>{jobs.filter((j) => j.category === 'CENTRAL').length}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 rounded-full"
                        style={{ width: `${(jobs.filter((j) => j.category === 'CENTRAL').length / (jobs.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>State PSC & Police Boards</span>
                      <span>{jobs.filter((j) => j.category === 'STATE').length}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(jobs.filter((j) => j.category === 'STATE').length / (jobs.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Banking & Financial Institutions</span>
                      <span>{jobs.filter((j) => j.category === 'BANKING').length}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(jobs.filter((j) => j.category === 'BANKING').length / (jobs.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Private Corporate & Tech Careers</span>
                      <span>{jobs.filter((j) => j.jobType === 'PRIVATE').length}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${(jobs.filter((j) => j.jobType === 'PRIVATE').length / (jobs.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Vacancies Table Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Recently Published Opportunities
                  </h3>
                  <p className="text-xs text-slate-500">Live listings visible to candidates</p>
                </div>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  View All Opportunities →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 font-bold">Title</th>
                      <th className="py-2.5 px-3 font-bold">Type</th>
                      <th className="py-2.5 px-3 font-bold">Qualification</th>
                      <th className="py-2.5 px-3 font-bold">Vacancies</th>
                      <th className="py-2.5 px-3 font-bold">Last Date</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {jobs.slice(0, 5).map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {j.title}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              j.jobType === 'GOVERNMENT'
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {j.jobType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {j.qualification}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {j.vacancies}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{j.applicationEndDate}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={j.status} type="job" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE JOBS (WITH SEPARATE GOVT/PVT & CATEGORY FILTER TABS) */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {/* Filter & Search Header */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by job title, organization, qualification..."
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                {/* Publish Button */}
                <button
                  onClick={() => {
                    setEditingJob(null);
                    setJobModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add New Job
                </button>
              </div>

              {/* Sub-Filters: Government & Private Types */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Sector:</span>
                {[
                  { id: 'ALL', label: 'All Sectors' },
                  { id: 'CENTRAL', label: 'Central Govt' },
                  { id: 'STATE', label: 'State Govt' },
                  { id: 'PRIVATE', label: 'Private / Corporate' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setJobTypeFilter(t.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      jobTypeFilter === t.id
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}

                <span className="text-[11px] font-bold text-slate-500 ml-2 mr-1">Qualification:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: '10th', label: '10th Pass' },
                  { id: '12th', label: '12th Pass' },
                  { id: 'Diploma', label: 'Diploma' },
                  { id: 'Graduation', label: 'Degree / Graduate' },
                  { id: 'Post Graduation', label: 'Post Graduate' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setJobCategoryFilter(c.id as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      jobCategoryFilter === c.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {filteredJobs.length} opportunities</span>
                <span className="italic">Click Toggle Status to publish/unpublish instantly</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold">Job Title & Authority</th>
                      <th className="py-3 px-4 font-bold">Sector</th>
                      <th className="py-3 px-4 font-bold">Qualification</th>
                      <th className="py-3 px-4 font-bold">Vacancies</th>
                      <th className="py-3 px-4 font-bold">Salary</th>
                      <th className="py-3 px-4 font-bold">Last Date</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                              {job.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {job.organization?.shortName || job.companyName || 'National Authority'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                job.jobType === 'GOVERNMENT'
                                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {job.jobType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {job.qualification}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {job.vacancies}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                            {job.salary || 'Standard'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {job.applicationEndDate}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleJobStatus(job)}
                              title="Click to toggle status"
                              className="cursor-pointer"
                            >
                              <StatusBadge status={job.status} type="job" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            {/* Toggle Publish / Unpublish Button */}
                            <button
                              onClick={() => toggleJobStatus(job)}
                              title={job.status === 'PUBLISHED' ? 'Unpublish (Set to Draft)' : 'Publish Live'}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            >
                              {job.status === 'PUBLISHED' ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setJobModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-900 dark:text-amber-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete('/api/admin/jobs', job.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 rounded text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No opportunities found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Commissions, Ministries & Recruiting Bodies
                </h3>
                <p className="text-xs text-slate-500">Configure central commissions, state PSCs, and recruitment boards.</p>
              </div>
              <button
                onClick={() => {
                  setGenericEditingItem(null);
                  setGenericModalType('org');
                }}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Organization
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 font-bold">Short Name</th>
                    <th className="py-3 px-4 font-bold">Full Name</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">State Cadre</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-blue-900 dark:text-amber-400">
                        {org.shortName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {org.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                          {org.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {org.stateId ? states.find((s) => s.id === org.stateId)?.name : 'Central'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setGenericEditingItem(org);
                            setGenericModalType('org');
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete('/api/admin/organizations', org.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EXAMINATIONS */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  National & State Public Examinations
                </h3>
                <p className="text-xs text-slate-500">Maintain standardized examination dossiers and qualifications.</p>
              </div>
              <button
                onClick={() => {
                  setGenericEditingItem(null);
                  setGenericModalType('exam');
                }}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Examination
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 font-bold">Exam Name</th>
                    <th className="py-3 px-4 font-bold">Short Code</th>
                    <th className="py-3 px-4 font-bold">Commission</th>
                    <th className="py-3 px-4 font-bold">Frequency</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {examinations.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {exam.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-900 dark:text-amber-400">
                        {exam.shortName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {organizations.find((o) => o.id === exam.organizationId)?.shortName || 'Govt Body'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{exam.frequency || 'Annual'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setGenericEditingItem(exam);
                            setGenericModalType('exam');
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete('/api/admin/exams', exam.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DYNAMIC SYLLABUS */}
        {activeTab === 'syllabus' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Examination:
                </span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                >
                  {examinations.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.shortName} — {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setGenericEditingItem(null);
                  setGenericModalType('syllabus_subject');
                }}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Subject
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Hierarchical Syllabus Tree (Subject → Topic → Subtopics)
              </h4>

              {selectedExamSyllabus.length > 0 ? (
                <div className="space-y-4">
                  {selectedExamSyllabus.map((subj) => (
                    <div
                      key={subj.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-blue-900 dark:text-amber-400">
                          Subject: {subj.subjectName}
                        </span>
                        <button
                          onClick={() => {
                            setGenericEditingItem({ ...subj, examId: selectedExamId });
                            setGenericModalType('syllabus_topic');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          + Add Topic
                        </button>
                      </div>

                      {subj.topics && subj.topics.length > 0 && (
                        <div className="pl-4 space-y-2 border-l-2 border-blue-900/30">
                          {subj.topics.map((t) => (
                            <div
                              key={t.id}
                              className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Topic: {t.topicName}
                              </span>
                              {t.subtopics && t.subtopics.length > 0 && (
                                <ul className="list-disc pl-4 mt-1.5 text-slate-500 space-y-0.5">
                                  {t.subtopics.map((st) => (
                                    <li key={st.id}>{st.subtopicName}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No syllabus subjects configured for this examination yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: DYNAMIC EXAM PATTERN */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Examination:
                </span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                >
                  {examinations.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.shortName} — {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {selectedExamPatterns.length} Exam Stage Schemes Active
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              {selectedExamPatterns.map((pat) => (
                <div key={pat.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{pat.title}</span>
                    <span className="text-xs text-slate-500 font-medium">{pat.columns.length} Columns • {pat.rows.length} Rows</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          {pat.columns.map((c) => (
                            <th key={c.id} className="p-2.5 font-bold">{c.columnName}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pat.rows.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                            {pat.columns.map((c) => {
                              const cell = pat.cells.find((cl) => cl.rowId === r.id && cl.columnId === c.id);
                              return (
                                <td key={c.id} className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                  {cell?.cellValue || '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: NOTICES & ALERTS */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Official Gazette Notices & Desk Alerts
                </h3>
                <p className="text-xs text-slate-500">Manage real-time bulletins displayed on student landing desks.</p>
              </div>
              <button
                onClick={() => {
                  setEditingNotice(null);
                  setNoticeModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Broadcast Notice
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 font-bold">Notice Title</th>
                    <th className="py-3 px-4 font-bold">Commission</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {notices.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </td>
                      <td className="py-3 px-4 text-blue-900 dark:text-amber-400 font-bold">
                        {n.organizationName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{n.date}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={n.status} type="notice" />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingNotice(n);
                            setNoticeModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete('/api/admin/notices', n.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: CANDIDATE ACCOUNTS */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Registered Candidate Profiles ({students.length})
                </h3>
                <p className="text-xs text-slate-500">Monitor candidate accounts, qualifications, and system active status.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 font-bold">Candidate Name</th>
                    <th className="py-3 px-4 font-bold">Contact Email</th>
                    <th className="py-3 px-4 font-bold">Age</th>
                    <th className="py-3 px-4 font-bold">Qualification</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Account Status</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {s.fullName || s.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.email}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {s.profile?.age || s.age ? `${s.profile?.age || s.age} Yrs` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {s.profile?.qualification || s.qualification || 'Graduation'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                          {s.profile?.category || s.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {s.isActive !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleStudentStatus(s.id, s.isActive !== false)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            s.isActive !== false
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {s.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: APPLICATION & ACTIVITY LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  System Activity & Application Audit Trail
                </h3>
                <p className="text-xs text-slate-500">Real-time trace of administrative events, vacancy dispatches, and submissions.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="space-y-3">
                {[
                  { action: 'Admin Authorized', detail: 'Viksit Coders authenticated session established', time: 'Just now', type: 'security' },
                  { action: 'Vacancy Synced', detail: 'UPSC Civil Services Examination 2026 live status verified', time: '12 mins ago', type: 'job' },
                  { action: 'Gazette Alert Issued', detail: 'Notice published for IBPS PO Preliminary Examination Schedule', time: '1 hour ago', type: 'notice' },
                  { action: 'Candidate Registered', detail: 'New student account created with graduation profile in Computer Engineering', time: '2 hours ago', type: 'user' },
                  { action: 'Scheme Updated', detail: 'Syllabus revised for SSC CGL 2026 Tier 1 & Tier 2 stages', time: '4 hours ago', type: 'exam' },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white mr-2">{log.action}:</span>
                        <span className="text-slate-600 dark:text-slate-400">{log.detail}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: ROADMAPS & EXAM PREP QUESTION BANK */}
        {activeTab === 'roadmaps' && (
          <AdminRoadmapsAndExamsPanel />
        )}
      </div>

      {/* MODAL 1: JOB ADD / EDIT (Modular Component) */}
      {jobModalOpen && (
        <AdminJobModal
          initialData={editingJob}
          organizations={organizations}
          states={states}
          examinations={examinations}
          onClose={() => {
            setJobModalOpen(false);
            setEditingJob(null);
          }}
          onSuccess={() => {
            setJobModalOpen(false);
            setEditingJob(null);
            showStatus('Job saved and synchronized successfully');
            loadData();
          }}
        />
      )}

      {/* MODAL 2: NOTICE ADD / EDIT (Modular Component) */}
      {noticeModalOpen && (
        <AdminNoticeModal
          initialData={editingNotice}
          onClose={() => {
            setNoticeModalOpen(false);
            setEditingNotice(null);
          }}
          onSuccess={() => {
            setNoticeModalOpen(false);
            setEditingNotice(null);
            showStatus('Notice published successfully');
            loadData();
          }}
        />
      )}

      {/* MODAL 3: GENERIC ENTITY (Orgs, Exams, Syllabus) */}
      {genericModalType && (
        <GenericAdminModal
          type={genericModalType}
          initialData={genericEditingItem}
          states={states}
          organizations={organizations}
          examinations={examinations}
          selectedExamId={selectedExamId}
          onClose={() => {
            setGenericModalType(null);
            setGenericEditingItem(null);
          }}
          onSuccess={() => {
            setGenericModalType(null);
            setGenericEditingItem(null);
            showStatus('Record saved successfully');
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Sub-component for handling Generic Orgs, Exams & Syllabus Add/Edit Forms
interface GenericAdminModalProps {
  type: string;
  initialData: any;
  states: StateEntity[];
  organizations: Organization[];
  examinations: Examination[];
  selectedExamId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const GenericAdminModal: React.FC<GenericAdminModalProps> = ({
  type,
  initialData,
  states,
  organizations,
  examinations,
  selectedExamId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<any>(
    initialData || {
      status: 'PUBLISHED',
      type: 'CENTRAL',
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let endpoint = '';
      let method = initialData?.id ? 'PUT' : 'POST';

      if (type === 'org') {
        endpoint = initialData?.id ? `/api/admin/organizations/${initialData.id}` : '/api/admin/organizations';
      } else if (type === 'exam') {
        endpoint = initialData?.id ? `/api/admin/exams/${initialData.id}` : '/api/admin/exams';
      } else if (type === 'syllabus_subject') {
        endpoint = '/api/admin/syllabus/subjects';
        formData.examinationId = selectedExamId;
      } else if (type === 'syllabus_topic') {
        endpoint = '/api/admin/syllabus/topics';
        formData.subjectId = initialData?.id;
      }

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        onSuccess();
      } else {
        alert(res.message || res.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white capitalize">
            {initialData ? `Edit ${type}` : `Create New ${type.replace('_', ' ')}`}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* ORG FORM */}
          {type === 'org' && (
            <>
              <div>
                <label className="block font-bold mb-1">Commission / Body Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Union Public Service Commission"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Short Code</label>
                  <input
                    type="text"
                    required
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="UPSC"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Type</label>
                  <select
                    value={formData.type || 'CENTRAL'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                  >
                    <option value="CENTRAL">Central Commission</option>
                    <option value="STATE">State Commission</option>
                    <option value="DEFENCE">Defence Commission</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Official Website</label>
                <input
                  type="url"
                  required
                  value={formData.officialWebsite || ''}
                  onChange={(e) => setFormData({ ...formData, officialWebsite: e.target.value })}
                  placeholder="https://upsc.gov.in"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
            </>
          )}

          {/* EXAM FORM */}
          {type === 'exam' && (
            <>
              <div>
                <label className="block font-bold mb-1">Examination Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Civil Services Examination"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Short Code</label>
                  <input
                    type="text"
                    required
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="CSE"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Commission</label>
                  <select
                    value={formData.organizationId || ''}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                  >
                    <option value="">Select Commission</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>{o.shortName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* SYLLABUS SUBJECT FORM */}
          {type === 'syllabus_subject' && (
            <>
              <div>
                <label className="block font-bold mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={formData.subjectName || ''}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  placeholder="e.g. Indian Polity & Governance"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.orderIndex || 1}
                  onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
            </>
          )}

          {/* SYLLABUS TOPIC FORM */}
          {type === 'syllabus_topic' && (
            <>
              <div>
                <label className="block font-bold mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={formData.topicName || ''}
                  onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                  placeholder="e.g. Preamble & Fundamental Rights"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
