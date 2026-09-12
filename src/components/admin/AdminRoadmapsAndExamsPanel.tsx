import React, { useState, useEffect } from 'react';
import {
  Compass,
  GraduationCap,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { CareerRoadmap, GovernmentExamDetail, PracticeQuestion, MockTest } from '../../types.ts';

export const AdminRoadmapsAndExamsPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'ROADMAPS' | 'EXAMS' | 'QUESTIONS' | 'TESTS'>('ROADMAPS');

  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [exams, setExams] = useState<GovernmentExamDetail[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for creating new Roadmap
  const [showAddRoadmapModal, setShowAddRoadmapModal] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('');
  const [newRoadmapSector, setNewRoadmapSector] = useState<'GOVERNMENT' | 'PRIVATE' | 'BOTH'>('GOVERNMENT');
  const [newRoadmapCategory, setNewRoadmapCategory] = useState('Banking & Finance');
  const [newRoadmapOverview, setNewRoadmapOverview] = useState('');

  // Form states for creating new Question
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQSubject, setNewQSubject] = useState('Quantitative Aptitude');
  const [newQTopic, setNewQTopic] = useState('Arithmetic');
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subTab === 'ROADMAPS') {
        const res = await apiRequest('/api/roadmaps');
        if (res.success && res.roadmaps) setRoadmaps(res.roadmaps);
      } else if (subTab === 'EXAMS') {
        const res = await apiRequest('/api/exam-prep/exams');
        if (res.success && res.exams) setExams(res.exams);
      } else if (subTab === 'QUESTIONS') {
        const res = await apiRequest('/api/exam-prep/questions?limit=50');
        if (res.success && res.questions) setQuestions(res.questions);
      } else if (subTab === 'TESTS') {
        const res = await apiRequest('/api/exam-prep/mock-tests');
        if (res.success && res.mockTests) setMockTests(res.mockTests);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career roadmap?')) return;
    try {
      const res = await apiRequest(`/api/admin/roadmaps/${id}`, { method: 'DELETE' });
      if (res.success) {
        setRoadmaps((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice question?')) return;
    try {
      const res = await apiRequest(`/api/admin/exam-prep/questions/${id}`, { method: 'DELETE' });
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/admin/roadmaps', {
        method: 'POST',
        body: JSON.stringify({
          title: newRoadmapTitle,
          sector: newRoadmapSector,
          category: newRoadmapCategory,
          overview: newRoadmapOverview || `Curated roadmap for ${newRoadmapTitle} career aspirants.`,
          suitableJobRoles: [newRoadmapTitle],
          importantSkills: ['Core Aptitude', 'Domain Knowledge', 'Interview Communication'],
          growthOpportunities: 'Entry Level -> Senior Officer -> Lead Specialist',
          learningPhases: [
            {
              phaseNumber: 1,
              name: 'Educational Foundations',
              description: 'Clear baseline degree requirements and fundamentals.',
              skills: ['Foundational Concepts'],
              tasks: ['Review qualification syllabus', 'Identify core references'],
            },
            {
              phaseNumber: 2,
              name: 'Core & Practical Preparation',
              description: 'Master specialized skills and problem-solving.',
              skills: ['Advanced Problem Solving'],
              tasks: ['Solve standard question sets', 'Undertake real-world projects'],
            },
          ],
          timelinePlans: [
            {
              durationMonths: 3,
              weeks: [
                {
                  weekNumber: 1,
                  title: 'Orientation and Base Concepts',
                  topics: ['Overview', 'Syllabus breakdown'],
                  practiceTasks: ['Complete chapter 1', 'Solve diagnostic test'],
                  suggestedProjects: [],
                  expectedOutcome: 'Clear understanding of examination/interview standard.',
                },
              ],
            },
          ],
        }),
      });

      if (res.success) {
        setShowAddRoadmapModal(false);
        setNewRoadmapTitle('');
        setNewRoadmapOverview('');
        fetchData();
      }
    } catch (err) {
      console.error('Create roadmap error:', err);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/admin/exam-prep/questions', {
        method: 'POST',
        body: JSON.stringify({
          subject: newQSubject,
          topic: newQTopic,
          questionText: newQText,
          options: newQOptions.filter((o) => o.trim()),
          correctAnswerIndex: newQCorrect,
          explanation: newQExplanation || 'Verified official solution.',
          difficulty: newQDifficulty,
          marks: 1,
          negativeMarks: 0.25,
        }),
      });

      if (res.success) {
        setShowAddQuestionModal(false);
        setNewQText('');
        setNewQExplanation('');
        setNewQOptions(['', '', '', '']);
        fetchData();
      }
    } catch (err) {
      console.error('Create question error:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Career Roadmaps, Question Banks & Mock Tests Management
          </h2>
          <p className="text-xs text-slate-500">
            Control master roadmap curriculums, competitive exam question banks, and simulated test papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'ROADMAPS', label: `Career Roadmaps (${roadmaps.length})`, icon: Compass },
          { id: 'EXAMS', label: `Exams Catalog (${exams.length})`, icon: GraduationCap },
          { id: 'QUESTIONS', label: `Question Bank (${questions.length})`, icon: HelpCircle },
          { id: 'TESTS', label: `Mock Tests (${mockTests.length})`, icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-900 text-white dark:bg-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: ROADMAPS */}
      {subTab === 'ROADMAPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Curated Roadmap Blueprints
            </span>
            <button
              onClick={() => setShowAddRoadmapModal(true)}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Roadmap
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmaps.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                      {r.sector}
                    </span>
                    <span className="text-xs text-slate-400">{r.learningPhases?.length || 10} Phases</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                    {r.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{r.overview}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Category: {r.category}
                  </span>
                  <button
                    onClick={() => handleDeleteRoadmap(r.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    title="Delete Roadmap"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: EXAMS */}
      {subTab === 'EXAMS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                    {ex.category}
                  </span>
                  <span className="text-xs text-slate-400">{ex.frequency}</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {ex.examName} ({ex.shortName})
                </h4>
                <p className="text-[11px] text-slate-500">
                  {ex.conductingOrganization} • {ex.examPattern?.length || 0} Tiers
                </p>
                <div className="text-[10px] text-slate-400">
                  Eligibility: {ex.eligibility.educationQualification}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PRACTICE QUESTIONS */}
      {subTab === 'QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Exam Practice Questions
            </span>
            <button
              onClick={() => setShowAddQuestionModal(true)}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-400">
                    Q{idx + 1} • {q.subject} ({q.topic})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">
                      {q.difficulty}
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">
                  {q.questionText}
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={oIdx === q.correctAnswerIndex ? 'font-bold text-emerald-600' : ''}
                    >
                      ({String.fromCharCode(65 + oIdx)}) {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: MOCK TESTS */}
      {subTab === 'TESTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockTests.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 uppercase">
                {t.tierStage}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</h4>
              <p className="text-xs text-slate-500">
                Exam: {t.examName} • {t.durationMinutes} Mins • {t.totalMarks} Marks
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Roadmap */}
      {showAddRoadmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Career Roadmap</h3>
            <form onSubmit={handleCreateRoadmap} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Roadmap Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intelligence Bureau ACIO, Data Scientist"
                  value={newRoadmapTitle}
                  onChange={(e) => setNewRoadmapTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold block mb-1">Sector</label>
                  <select
                    value={newRoadmapSector}
                    onChange={(e) => setNewRoadmapSector(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="GOVERNMENT">Government</option>
                    <option value="PRIVATE">Private</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={newRoadmapCategory}
                    onChange={(e) => setNewRoadmapCategory(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={newRoadmapOverview}
                  onChange={(e) => setNewRoadmapOverview(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoadmapModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Create Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Practice Question */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Practice Question</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold block mb-1">Subject</label>
                  <select
                    value={newQSubject}
                    onChange={(e) => setNewQSubject(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Reasoning Ability">Reasoning Ability</option>
                    <option value="English Comprehension">English Comprehension</option>
                    <option value="General Awareness">General Awareness</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Topic</label>
                  <input
                    type="text"
                    value={newQTopic}
                    onChange={(e) => setNewQTopic(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Question Text *</label>
                <textarea
                  rows={2}
                  required
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold block">Options (A, B, C, D)</label>
                {newQOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={newQCorrect === idx}
                      onChange={() => setNewQCorrect(idx)}
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...newQOptions];
                        next[idx] = e.target.value;
                        setNewQOptions(next);
                      }}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Explanation & Solution</label>
                <textarea
                  rows={2}
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
