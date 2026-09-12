import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Award,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Save,
  Printer,
  RotateCcw,
  Target,
  GraduationCap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { CareerRoadmap, RoadmapPhase, WeeklyPlanItem, MissingSkillDetail } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface CareerRoadmapPageProps {
  onNavigate: (path: string) => void;
  targetCareerProp?: string;
}

export const CareerRoadmapPage: React.FC<CareerRoadmapPageProps> = ({ onNavigate, targetCareerProp }) => {
  const { user, profile, isAuthenticated } = useAuth();

  // State
  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<'ALL' | 'GOVERNMENT' | 'PRIVATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Timeline selector: 1, 3, 6, 12 months
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6 | 12>(3);

  // Active view: 'OVERVIEW' | 'PHASES' | 'WEEKLY' | 'SKILL_GAP' | 'AI_GENERATOR'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PHASES' | 'WEEKLY' | 'SKILL_GAP'>('OVERVIEW');

  // Expanded weekly accordions
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true, 2: true });

  // Completed tasks checklist state (local & persistent)
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Generator Modal / Section
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoal, setAiGoal] = useState(targetCareerProp || '');
  const [aiQualification, setAiQualification] = useState(profile?.courseDegree || 'Graduation');
  const [aiBranch, setAiBranch] = useState(profile?.branchStream || 'General');
  const [aiSector, setAiSector] = useState<'GOVERNMENT' | 'PRIVATE' | 'BOTH'>('BOTH');
  const [aiDuration, setAiDuration] = useState<1 | 3 | 6 | 12>(3);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Skill Gap Analysis State
  const [skillGapLoading, setSkillGapLoading] = useState(false);
  const [skillGapResult, setSkillGapResult] = useState<{
    targetRole: string;
    existingSkills: string[];
    skillsYouNeed: string[];
    missingSkills: MissingSkillDetail[];
    readinessPercentage: number;
  } | null>(null);

  // Load curated roadmaps
  useEffect(() => {
    fetchRoadmaps();
  }, [sectorFilter]);

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/roadmaps?sector=${sectorFilter}`);
      if (res.success && res.roadmaps) {
        setRoadmaps(res.roadmaps);
        if (!selectedRoadmap && res.roadmaps.length > 0) {
          const defaultRoadmap = targetCareerProp
            ? res.roadmaps.find((r: CareerRoadmap) => r.title.toLowerCase().includes(targetCareerProp.toLowerCase())) || res.roadmaps[0]
            : res.roadmaps[0];
          setSelectedRoadmap(defaultRoadmap);
          loadStudentProgress(defaultRoadmap.id);
        }
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load student saved progress if authenticated
  const loadStudentProgress = async (roadmapId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await apiRequest(`/api/roadmaps/student/${roadmapId}`);
      if (res.success && res.progress) {
        setCompletedTasks(res.progress.completedTasks || []);
        if (res.progress.durationMonths) {
          setSelectedDuration(res.progress.durationMonths);
        }
      } else {
        setCompletedTasks([]);
      }
    } catch {
      setCompletedTasks([]);
    }
  };

  const handleSelectRoadmap = (roadmap: CareerRoadmap) => {
    setSelectedRoadmap(roadmap);
    loadStudentProgress(roadmap.id);
    setSkillGapResult(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Toggle task completion
  const handleToggleTask = (taskKey: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskKey) ? prev.filter((k) => k !== taskKey) : [...prev, taskKey]
    );
  };

  // Save progress to server
  const handleSaveProgress = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save your personal learning progress.');
      return;
    }
    if (!selectedRoadmap) return;

    setSavingProgress(true);
    try {
      // Calculate completion percentage based on total weekly practice tasks
      const currentPlan = selectedRoadmap.timelinePlans?.find((t) => t.durationMonths === selectedDuration) || selectedRoadmap.timelinePlans?.[0];
      const allTasks = currentPlan?.weeks?.flatMap((w) => w.practiceTasks || []) || [];
      const totalCount = Math.max(allTasks.length, 1);
      const percentage = Math.round((completedTasks.length / totalCount) * 100);

      const res = await apiRequest('/api/roadmaps/student/save', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId: selectedRoadmap.id,
          careerTitle: selectedRoadmap.title,
          durationMonths: selectedDuration,
          completedTasks,
          progressPercentage: Math.min(100, percentage),
          currentStage: percentage === 100 ? 'Completed' : percentage > 50 ? 'Advanced Stage' : 'Active Preparation',
          existingSkills: profile?.skills || [],
          skillsYouNeed: selectedRoadmap.importantSkills,
        }),
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save progress error:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  // Generate AI Customized Roadmap
  const handleGenerateAiRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) return;

    setGeneratingAi(true);
    try {
      const res = await apiRequest('/api/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetCareer: aiGoal.trim(),
          qualification: aiQualification,
          branch: aiBranch,
          preferredSector: aiSector,
          durationMonths: aiDuration,
          existingSkills: profile?.skills || [],
        }),
      });

      if (res.success && res.roadmap) {
        setSelectedRoadmap(res.roadmap);
        setSelectedDuration(aiDuration);
        setShowAiModal(false);
        setActiveTab('OVERVIEW');
        setCompletedTasks([]);
      }
    } catch (err) {
      console.error('AI roadmap generation error:', err);
      alert('Could not generate AI roadmap. Please check connection.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Run Real Skill Gap Analysis
  const handleRunSkillGap = async () => {
    if (!selectedRoadmap) return;
    setSkillGapLoading(true);
    try {
      const res = await apiRequest('/api/roadmaps/skill-gap', {
        method: 'POST',
        body: JSON.stringify({
          studentSkills: profile?.skills || [],
          targetCareer: selectedRoadmap.title,
        }),
      });
      if (res.success) {
        setSkillGapResult(res);
        setActiveTab('SKILL_GAP');
      }
    } catch (err) {
      console.error('Skill gap error:', err);
    } finally {
      setSkillGapLoading(false);
    }
  };

  // Current active timeline plan
  const activeTimelinePlan = selectedRoadmap?.timelinePlans?.find((t) => t.durationMonths === selectedDuration) || selectedRoadmap?.timelinePlans?.[0];

  // Calculate current progress %
  const totalTasks = activeTimelinePlan?.weeks?.flatMap((w) => w.practiceTasks || []) || [];
  const currentProgressPercent = totalTasks.length > 0 ? Math.min(100, Math.round((completedTasks.length / totalTasks.length) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Career Guidance', path: '/career-guidance' },
            { label: 'AI Career Roadmap' },
          ]}
          onNavigate={onNavigate}
        />

        {/* Feature Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-blue-800/60 shadow-lg">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                AI Smart Career Guidance Engine • SIH 2026
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AI Career Roadmap & Skill Gap Analyzer
              </h1>
              <p className="text-sm text-blue-200 leading-relaxed">
                Step-by-step personalized learning paths for Indian Government examinations and top Private Sector roles.
                Calibrated to your verified degree, resume skills, and realistic recruitment timelines.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => setShowAiModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Custom AI Roadmap
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-lg border border-white/20 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>

        {/* Curated Roadmaps Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" /> Sector:
            </span>
            {(['ALL', 'GOVERNMENT', 'PRIVATE'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  sectorFilter === sec
                    ? 'bg-blue-900 text-white dark:bg-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {sec === 'ALL' ? 'All Roles' : sec === 'GOVERNMENT' ? '🏛️ Government' : '🏢 Private Tech'}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roadmaps, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Curated Roadmaps Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {roadmaps
            .filter(
              (r) =>
                !searchQuery ||
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.importantSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map((roadmap) => {
              const isSelected = selectedRoadmap?.id === roadmap.id;
              return (
                <button
                  key={roadmap.id}
                  onClick={() => handleSelectRoadmap(roadmap)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase mb-1.5 ${
                        roadmap.sector === 'GOVERNMENT'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                          : roadmap.sector === 'PRIVATE'
                          ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {roadmap.sector}
                    </span>
                    <h3 className="font-bold text-xs line-clamp-2 text-slate-900 dark:text-white">
                      {roadmap.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                    <span>{roadmap.learningPhases.length} Phases</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </p>
                </button>
              );
            })}
        </div>

        {/* Active Roadmap View Container */}
        {selectedRoadmap && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header / Meta Bar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {selectedRoadmap.category}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Target: {selectedRoadmap.targetQualification}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {selectedRoadmap.title}
                  </h2>
                </div>

                {/* Timeline Selector Buttons: 1, 3, 6, 12 Months */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Plan:
                    </span>
                    {([1, 3, 6, 12] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedDuration(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedDuration === m
                            ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {m}M
                      </button>
                    ))}
                  </div>

                  {/* Save Progress Button */}
                  <button
                    onClick={handleSaveProgress}
                    disabled={savingProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saveSuccess ? 'Saved!' : savingProgress ? 'Saving...' : 'Save Progress'}
                  </button>
                </div>
              </div>

              {/* Progress Summary Bar */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="w-full sm:w-1/2">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      Preparation Progress ({completedTasks.length} of {totalTasks.length} tasks completed)
                    </span>
                    <span className="text-blue-900 dark:text-blue-400 font-bold">{currentProgressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${currentProgressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunSkillGap}
                    disabled={skillGapLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" />
                    {skillGapLoading ? 'Analyzing...' : 'Run Skill Gap Analysis'}
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'OVERVIEW'
                    ? 'border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                Career Overview & Roles
              </button>
              <button
                onClick={() => setActiveTab('PHASES')}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'PHASES'
                    ? 'border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                10 Sequential Phases
              </button>
              <button
                onClick={() => setActiveTab('WEEKLY')}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'WEEKLY'
                    ? 'border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Weekly Timetable ({selectedDuration} Months)
              </button>
              <button
                onClick={() => {
                  setActiveTab('SKILL_GAP');
                  if (!skillGapResult) handleRunSkillGap();
                }}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'SKILL_GAP'
                    ? 'border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Target className="w-4 h-4" />
                Skill Gap Analysis
              </button>
            </div>

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Career Blueprint Overview
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedRoadmap.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Suitable Job Roles */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-300 flex items-center gap-1.5 mb-3">
                      <Briefcase className="w-4 h-4" /> Suitable Job Roles in India
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoadmap.suitableJobRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Important Skills */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-3">
                      <Award className="w-4 h-4" /> Core Evaluated Competencies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoadmap.importantSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Growth Opportunities */}
                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-4 h-4" /> Career Progression & Ladder
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                    {selectedRoadmap.growthOpportunities}
                  </p>
                </div>

                {/* Practical Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('PHASES')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    View 10 Sequential Phases <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate(`/mock-interview?role=${encodeURIComponent(selectedRoadmap.title)}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Practice AI Mock Interview for this Role
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: 10 SEQUENTIAL PHASES */}
            {activeTab === 'PHASES' && (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300">
                  <strong>Structured Indian Career Progression Architecture:</strong> Every career milestone is organized into 10 sequential phases ensuring comprehensive preparation from foundational knowledge through live employment.
                </div>

                <div className="space-y-4 mt-6">
                  {selectedRoadmap.learningPhases.map((phase: RoadmapPhase) => (
                    <div
                      key={phase.phaseNumber}
                      className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-900 text-white dark:bg-blue-600 font-extrabold text-sm flex items-center justify-center shrink-0">
                          {phase.phaseNumber}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {phase.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Phase {phase.phaseNumber} of 10
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {phase.description}
                          </p>

                          {/* Skills pill */}
                          {phase.skills.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-2">
                                Targeted Skills:
                              </span>
                              {phase.skills.map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded mr-1.5 text-slate-800 dark:text-slate-200"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Practical Tasks */}
                          {phase.tasks.length > 0 && (
                            <div className="mt-2 space-y-1 bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Action Items & Milestones:
                              </span>
                              {phase.tasks.map((t, idx) => {
                                const taskKey = `${selectedRoadmap.id}_phase_${phase.phaseNumber}_t_${idx}`;
                                const isDone = completedTasks.includes(taskKey);
                                return (
                                  <label
                                    key={idx}
                                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-900 dark:hover:text-blue-300"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      onChange={() => handleToggleTask(taskKey)}
                                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={isDone ? 'line-through text-slate-400' : ''}>{t}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: WEEKLY TIMETABLE */}
            {activeTab === 'WEEKLY' && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Curated Schedule for {selectedDuration} Months ({activeTimelinePlan?.weeks.length || 0} Modules)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Step-by-step weekly objectives. Mark items as completed to track your personal learning journey.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allWeeks = activeTimelinePlan?.weeks.map((w) => w.weekNumber) || [];
                        const obj: Record<number, boolean> = {};
                        allWeeks.forEach((w) => (obj[w] = true));
                        setExpandedWeeks(obj);
                      }}
                      className="px-2.5 py-1 text-xs text-blue-900 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => setExpandedWeeks({})}
                      className="px-2.5 py-1 text-xs text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeTimelinePlan?.weeks.map((week: WeeklyPlanItem) => {
                    const isOpen = Boolean(expandedWeeks[week.weekNumber]);
                    return (
                      <div
                        key={week.weekNumber}
                        className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedWeeks((prev) => ({ ...prev, [week.weekNumber]: !isOpen }))
                          }
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                              W{week.weekNumber}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {week.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {week.topics.slice(0, 3).join(' • ')}
                              </p>
                            </div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700/60 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                            {/* Topics */}
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">
                                Core Topics:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {week.topics.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Practice Tasks Checklist */}
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">
                                Action Checklist:
                              </span>
                              <div className="space-y-1.5">
                                {week.practiceTasks.map((task, idx) => {
                                  const taskKey = `${selectedRoadmap.id}_w_${week.weekNumber}_t_${idx}`;
                                  const isChecked = completedTasks.includes(taskKey);
                                  return (
                                    <label
                                      key={idx}
                                      className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleTask(taskKey)}
                                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span className={isChecked ? 'line-through text-slate-400' : ''}>
                                        {task}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Expected Outcome */}
                            {week.expectedOutcome && (
                              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-300">
                                <strong>Expected Outcome:</strong> {week.expectedOutcome}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: SKILL GAP ANALYSIS */}
            {activeTab === 'SKILL_GAP' && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      Skill Gap Comparator for "{selectedRoadmap.title}"
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evaluates your profile & verified resume skills against market & commission benchmarks.
                    </p>
                  </div>
                  <button
                    onClick={handleRunSkillGap}
                    disabled={skillGapLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-run Comparison
                  </button>
                </div>

                {skillGapLoading ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Comparing profile skills against recruitment criteria...</p>
                  </div>
                ) : skillGapResult ? (
                  <div className="space-y-6">
                    {/* Readiness Bar */}
                    <div className="p-5 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-300">
                          Current Role Readiness Benchmark
                        </span>
                        <span className="text-lg font-black text-blue-900 dark:text-amber-400">
                          {skillGapResult.readinessPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-700 dark:bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${skillGapResult.readinessPercentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                        You have verified {skillGapResult.existingSkills.length} of {skillGapResult.skillsYouNeed.length} required competencies.
                      </p>
                    </div>

                    {/* Missing Skills Granular Cards */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                        Missing Skills & Structured Remediation ({skillGapResult.missingSkills.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillGapResult.missingSkills.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                {item.skill}
                              </h5>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                  item.priority === 'HIGH'
                                    ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                                    : item.priority === 'MEDIUM'
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                    : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                }`}
                              >
                                {item.priority} Priority
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.explanation}
                            </p>

                            <div className="text-[11px] bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                Recommended Action:
                              </span>
                              <p className="text-slate-600 dark:text-slate-400">{item.practiceActivity}</p>
                            </div>

                            {item.suggestedLearningTopics.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {item.suggestedLearningTopics.map((top, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium"
                                  >
                                    {top}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Employment Disclaimer Bar */}
            <div className="p-4 bg-amber-50/50 dark:bg-slate-900/90 border-t border-amber-200/50 dark:border-slate-800 text-[11px] text-amber-900 dark:text-amber-300/80 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Official Career Guidance Notice:</strong> Roadmaps and timetables are advisory frameworks curated to prepare students for competitive Indian recruitment. Completion of study phases does not constitute guarantee of selection or official placement.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Roadmap Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Generate Custom AI Career Roadmap
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateAiRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Career / Examination / Dream Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RBI Grade B Officer, Cloud DevOps Engineer, Sub-Inspector"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Qualification
                  </label>
                  <input
                    type="text"
                    value={aiQualification}
                    onChange={(e) => setAiQualification(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Discipline
                  </label>
                  <input
                    type="text"
                    value={aiBranch}
                    onChange={(e) => setAiBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Sector
                  </label>
                  <select
                    value={aiSector}
                    onChange={(e) => setAiSector(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BOTH">Government & Private</option>
                    <option value="GOVERNMENT">Government Only</option>
                    <option value="PRIVATE">Private Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Timeline Duration
                  </label>
                  <select
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value) as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 Month (Crash Plan)</option>
                    <option value={3}>3 Months (Standard)</option>
                    <option value={6}>6 Months (Comprehensive)</option>
                    <option value={12}>12 Months (Deep Foundation)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAi}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {generatingAi ? 'Generating Personalized Plan...' : 'Generate Roadmap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
