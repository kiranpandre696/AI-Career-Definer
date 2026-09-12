import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  FileCheck,
  AlertCircle,
  Award,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Target,
  Send,
  Save,
  HelpCircle,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  GovernmentExamDetail,
  PracticeQuestion,
  MockTest,
  StudentMockTestAttempt,
  StudentExamStudyPlan,
  Job,
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface ExamPreparationPageProps {
  onNavigate: (path: string) => void;
  onSelectJob?: (job: Job) => void;
}

export const ExamPreparationPage: React.FC<ExamPreparationPageProps> = ({ onNavigate, onSelectJob }) => {
  const { user, profile, isAuthenticated } = useAuth();

  // Mode: 'DIRECTORY' | 'EXAM_DETAILS' | 'PRACTICE' | 'MOCK_TEST' | 'STUDY_PLAN'
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PRACTICE' | 'MOCK_TEST' | 'STUDY_PLAN'>('DIRECTORY');

  // Exam list & Selected Exam
  const [exams, setExams] = useState<GovernmentExamDetail[]>([]);
  const [selectedExam, setSelectedExam] = useState<GovernmentExamDetail | null>(null);
  const [examCategory, setExamCategory] = useState<'ALL' | 'CENTRAL' | 'STATE'>('ALL');
  const [examSearch, setExamSearch] = useState('');
  const [loadingExams, setLoadingExams] = useState(true);

  // Syllabus Checklist state
  const [completedSubtopics, setCompletedSubtopics] = useState<string[]>([]);
  const [savingSyllabus, setSavingSyllabus] = useState(false);

  // Practice Questions state
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceSubject, setPracticeSubject] = useState<string>('ALL');
  const [practiceDifficulty, setPracticeDifficulty] = useState<string>('ALL');
  const [userSelectedAnswers, setUserSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Mock Tests & Live Test Simulation state
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(3600);
  const [currentTestQIndex, setCurrentTestQIndex] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResultAttempt, setTestResultAttempt] = useState<StudentMockTestAttempt | null>(null);

  // AI Study Plan Generator state
  const [studyPlanExam, setStudyPlanExam] = useState<string>('IBPS PO Prelims & Mains');
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [weakSubject, setWeakSubject] = useState<string>('Quantitative Aptitude');
  const [strongSubject, setStrongSubject] = useState<string>('Reasoning Ability');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [savedPlanSuccess, setSavedPlanSuccess] = useState<boolean>(false);

  // Fetch initial exams
  useEffect(() => {
    fetchExams();
  }, [examCategory]);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await apiRequest(`/api/exam-prep/exams?category=${examCategory}`);
      if (res.success && res.exams) {
        setExams(res.exams);
        if (!selectedExam && res.exams.length > 0) {
          setSelectedExam(res.exams[0]);
          loadStudentSyllabus(res.exams[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  // Load student syllabus completion progress
  const loadStudentSyllabus = async (examId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await apiRequest(`/api/exam-prep/student/syllabus/${examId}`);
      if (res.success && res.progress) {
        setCompletedSubtopics(res.progress.completedSubtopics || []);
      } else {
        setCompletedSubtopics([]);
      }
    } catch {
      setCompletedSubtopics([]);
    }
  };

  // Load practice questions
  useEffect(() => {
    if (activeTab === 'PRACTICE') {
      fetchPracticeQuestions();
    }
  }, [activeTab, practiceSubject, practiceDifficulty, selectedExam]);

  const fetchPracticeQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const examParam = selectedExam ? selectedExam.id : '';
      const res = await apiRequest(
        `/api/exam-prep/questions?examId=${examParam}&subject=${practiceSubject}&difficulty=${practiceDifficulty}&limit=25`
      );
      if (res.success && res.questions) {
        setPracticeQuestions(res.questions);
      }
    } catch (err) {
      console.error('Error fetching practice questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Load Mock Tests
  useEffect(() => {
    if (activeTab === 'MOCK_TEST') {
      fetchMockTests();
    }
  }, [activeTab, selectedExam]);

  const fetchMockTests = async () => {
    try {
      const examParam = selectedExam ? selectedExam.id : '';
      const res = await apiRequest(`/api/exam-prep/mock-tests?examId=${examParam}`);
      if (res.success && res.mockTests) {
        setMockTests(res.mockTests);
      }
    } catch (err) {
      console.error('Error fetching mock tests:', err);
    }
  };

  // Toggle syllabus subtopic completion
  const handleToggleSubtopic = (subtopic: string) => {
    setCompletedSubtopics((prev) =>
      prev.includes(subtopic) ? prev.filter((s) => s !== subtopic) : [...prev, subtopic]
    );
  };

  const getSyllabusForExam = (exam: GovernmentExamDetail | null) => {
    if (!exam) return [];
    if (exam.syllabus && Array.isArray(exam.syllabus) && exam.syllabus.length > 0) {
      return exam.syllabus;
    }
    const subjects = exam.subjects || ['General Studies', 'General Aptitude', 'Subject Knowledge'];
    return subjects.map((subj) => ({
      subjectName: subj,
      weightagePercentage: Math.round(100 / Math.max(subjects.length, 1)),
      topics: [
        {
          topicName: `${subj} - Core Modules`,
          subtopics: [
            `${subj} - Fundamental Principles & Concepts`,
            `${subj} - High-Yield Applications & Problem Solving`,
            `${subj} - Previous Year Question Formats`,
            `${subj} - Speed, Accuracy & Mock Drills`,
          ],
        },
      ],
    }));
  };

  // Save syllabus progress
  const handleSaveSyllabusProgress = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save your syllabus tracking checklist.');
      return;
    }
    if (!selectedExam) return;

    setSavingSyllabus(true);
    try {
      const syllabusList = getSyllabusForExam(selectedExam);
      const allSubtopics = syllabusList.flatMap((s: any) => (s?.topics || []).flatMap((t: any) => t?.subtopics || []));
      const percentage = Math.round((completedSubtopics.length / Math.max(allSubtopics.length, 1)) * 100);

      await apiRequest('/api/exam-prep/student/syllabus/save', {
        method: 'POST',
        body: JSON.stringify({
          examId: selectedExam.id,
          examName: selectedExam.examName,
          completedSubtopics,
          overallPercentage: percentage,
        }),
      });
      alert('Syllabus progress successfully saved to your profile.');
    } catch (err) {
      console.error('Error saving syllabus:', err);
    } finally {
      setSavingSyllabus(false);
    }
  };

  // Launch Simulated Mock Test
  const handleStartMockTest = (test: MockTest) => {
    setActiveTest(test);
    setTestAnswers({});
    setMarkedForReview({});
    setCurrentTestQIndex(0);
    setTestTimeRemaining(test.durationMinutes * 60);
    setTestResultAttempt(null);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  // Live countdown timer for active test
  useEffect(() => {
    let interval: any;
    if (activeTest && testTimeRemaining > 0 && !testResultAttempt) {
      interval = setInterval(() => {
        setTestTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTest, testTimeRemaining, testResultAttempt]);

  // Submit Mock Test
  const handleSubmitTest = async () => {
    if (!activeTest) return;
    if (!isAuthenticated) {
      alert('Please sign in to submit and track your mock test evaluation score.');
      return;
    }

    setSubmittingTest(true);
    try {
      const timeSpent = activeTest.durationMinutes * 60 - testTimeRemaining;
      const res = await apiRequest(`/api/exam-prep/mock-tests/${activeTest.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: testAnswers,
          timeSpentSeconds: Math.max(timeSpent, 10),
        }),
      });

      if (res.success && res.attempt) {
        setTestResultAttempt(res.attempt);
      }
    } catch (err) {
      console.error('Submit test error:', err);
      alert('Failed to submit test. Please check connection.');
    } finally {
      setSubmittingTest(false);
    }
  };

  // Generate AI Study Plan
  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingPlan(true);
    try {
      const res = await apiRequest('/api/exam-prep/study-plan/generate', {
        method: 'POST',
        body: JSON.stringify({
          examId: selectedExam?.id,
          examName: studyPlanExam,
          availableDailyHours: dailyHours,
          targetMonths,
          weakSubjects: [weakSubject],
          strongSubjects: [strongSubject],
          studentQualification: profile?.courseDegree || 'Graduation',
        }),
      });

      if (res.success && res.studyPlan) {
        setGeneratedPlan(res.studyPlan);
      }
    } catch (err) {
      console.error('Study plan generation error:', err);
      alert('Could not generate plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Save generated study plan
  const handleSaveStudyPlan = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save this study plan to your profile.');
      return;
    }
    if (!generatedPlan) return;

    setSavingPlan(true);
    try {
      const res = await apiRequest('/api/exam-prep/student/study-plan/save', {
        method: 'POST',
        body: JSON.stringify(generatedPlan),
      });
      if (res.success) {
        setSavedPlanSuccess(true);
        setTimeout(() => setSavedPlanSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save study plan error:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  // Computed safe syllabus items
  const activeSyllabus = useMemo(() => {
    return getSyllabusForExam(selectedExam);
  }, [selectedExam]);

  // Safe all subtopics
  const allSubtopics = useMemo(() => {
    return activeSyllabus.flatMap((s: any) => (s?.topics || []).flatMap((t: any) => t?.subtopics || []));
  }, [activeSyllabus]);

  const allSubtopicsCount = Math.max(allSubtopics.length, 1);
  const syllabusPercent = Math.min(100, Math.round((completedSubtopics.length / allSubtopicsCount) * 100));

  // Safe exam patterns
  const activeExamPattern = useMemo(() => {
    if (!selectedExam) return [];
    if (selectedExam.examPattern && Array.isArray(selectedExam.examPattern) && selectedExam.examPattern.length > 0) {
      return selectedExam.examPattern;
    }
    if (selectedExam.examStages && Array.isArray(selectedExam.examStages) && selectedExam.examStages.length > 0) {
      return selectedExam.examStages.map((stg: any) => ({
        stageName: stg.name || `Stage ${stg.stageNumber}`,
        examType: stg.type || 'Objective CBT',
        totalMarks: stg.marks || 100,
        durationMinutes: typeof stg.duration === 'number' ? stg.duration : 60,
        negativeMarking: true,
        negativeMarksPerWrong: 0.25,
        sections: (selectedExam.subjects || []).map((sub: string) => ({
          name: sub,
          questions: 25,
          marks: 25,
        })),
      }));
    }
    return [
      {
        stageName: 'Stage 1: Preliminary Examination',
        examType: 'Objective CBT',
        totalMarks: 100,
        durationMinutes: 60,
        negativeMarking: true,
        negativeMarksPerWrong: 0.25,
      },
      {
        stageName: 'Stage 2: Main Examination',
        examType: 'Objective & Descriptive',
        totalMarks: 200,
        durationMinutes: 180,
        negativeMarking: true,
        negativeMarksPerWrong: 0.25,
      },
    ];
  }, [selectedExam]);

  // Safe eligibility
  const examEligibility = useMemo(() => {
    if (!selectedExam) {
      return {
        minAge: 18,
        maxAge: 32,
        educationQualification: 'Graduation Degree',
        nationality: 'Citizen of India',
      };
    }
    const minAge = typeof selectedExam.eligibility === 'object' && (selectedExam.eligibility as any)?.minAge
      ? (selectedExam.eligibility as any).minAge
      : selectedExam.ageRequirement?.min || 18;
    const maxAge = typeof selectedExam.eligibility === 'object' && (selectedExam.eligibility as any)?.maxAge
      ? (selectedExam.eligibility as any).maxAge
      : selectedExam.ageRequirement?.max || 32;
    const educationQualification = typeof selectedExam.eligibility === 'object' && (selectedExam.eligibility as any)?.educationQualification
      ? (selectedExam.eligibility as any).educationQualification
      : typeof selectedExam.eligibility === 'string'
      ? selectedExam.eligibility
      : 'Bachelor’s Degree in any discipline';
    const nationality = typeof selectedExam.eligibility === 'object' && (selectedExam.eligibility as any)?.nationality
      ? (selectedExam.eligibility as any).nationality
      : 'Citizen of India';

    return { minAge, maxAge, educationQualification, nationality };
  }, [selectedExam]);

  // Safe recommended books
  const activeRecommendedBooks = useMemo(() => {
    if (selectedExam?.recommendedBooks && Array.isArray(selectedExam.recommendedBooks) && selectedExam.recommendedBooks.length > 0) {
      return selectedExam.recommendedBooks;
    }
    return [
      { title: 'Quantitative Aptitude for Competitive Examinations', author: 'Dr. R.S. Aggarwal', subject: 'Quantitative Aptitude' },
      { title: 'A Modern Approach to Verbal & Non-Verbal Reasoning', author: 'Dr. R.S. Aggarwal', subject: 'Reasoning Ability' },
      { title: 'Objective General English', author: 'S.P. Bakshi (Arihant)', subject: 'English Language' },
      { title: 'General Knowledge & Current Affairs Yearbook', author: 'Lucent Publications', subject: 'General Awareness' },
    ];
  }, [selectedExam]);

  // Safe previous year cutoffs
  const activePreviousCutoffs = useMemo(() => {
    if (selectedExam?.previousYearCutoffs && Array.isArray(selectedExam.previousYearCutoffs) && selectedExam.previousYearCutoffs.length > 0) {
      return selectedExam.previousYearCutoffs;
    }
    return [
      { year: '2025', stage: 'Prelims / Tier-I', totalMarks: 100, generalCutoff: '68.50', obcCutoff: '65.25' },
      { year: '2024', stage: 'Prelims / Tier-I', totalMarks: 100, generalCutoff: '65.75', obcCutoff: '62.00' },
      { year: '2023', stage: 'Prelims / Tier-I', totalMarks: 100, generalCutoff: '63.25', obcCutoff: '60.50' },
    ];
  }, [selectedExam]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Examinations', path: '/examinations' },
            { label: 'Government Exam Preparation' },
          ]}
          onNavigate={onNavigate}
        />

        {/* Feature Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-blue-800/60 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <GraduationCap className="w-3.5 h-3.5" />
                Verified Indian Recruitment Exam Center • SIH 2026
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Government Exam Preparation Portal
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                Central & State recruitment exam patterns, comprehensive syllabus checklists, previous year cut-off benchmarks, formula banks, and full-length timed mock tests.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('STUDY_PLAN')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> AI Study Timetable
              </button>
              <button
                onClick={() => setActiveTab('MOCK_TEST')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4" /> Take Timed Mock Test
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 flex overflow-x-auto shadow-xs">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'DIRECTORY'
                ? 'bg-blue-900 text-white dark:bg-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Exam Profiles & Syllabus
          </button>
          <button
            onClick={() => setActiveTab('PRACTICE')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'PRACTICE'
                ? 'bg-blue-900 text-white dark:bg-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Practice Question Bank
          </button>
          <button
            onClick={() => setActiveTab('MOCK_TEST')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'MOCK_TEST'
                ? 'bg-blue-900 text-white dark:bg-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Simulated Mock Tests
          </button>
          <button
            onClick={() => setActiveTab('STUDY_PLAN')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'STUDY_PLAN'
                ? 'bg-blue-900 text-white dark:bg-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Study Plan Generator
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: EXAM DIRECTORY & DETAILED PROFILE */}
        {/* ========================================================= */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-6">
            {/* Filter & Exam Selector Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level:</span>
                {(['ALL', 'CENTRAL', 'STATE'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExamCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      examCategory === cat
                        ? 'bg-blue-900 text-white dark:bg-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Exams' : cat === 'CENTRAL' ? '🏛️ Central (UPSC/SSC/IBPS)' : '📍 State PSCs'}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter exams (e.g. CGL, PO, SI)..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Cards of Exams */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {exams
                .filter(
                  (e) =>
                    !examSearch ||
                    e.examName.toLowerCase().includes(examSearch.toLowerCase()) ||
                    e.shortName.toLowerCase().includes(examSearch.toLowerCase())
                )
                .map((exam) => {
                  const isSelected = selectedExam?.id === exam.id;
                  return (
                    <button
                      key={exam.id}
                      onClick={() => {
                        setSelectedExam(exam);
                        loadStudentSyllabus(exam.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1 inline-block">
                          {exam.category}
                        </span>
                        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2">
                          {exam.shortName || exam.examName}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 truncate">
                        {exam.conductingOrganization}
                      </p>
                    </button>
                  );
                })}
            </div>

            {/* Selected Exam Profile Details */}
            {selectedExam && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                        {selectedExam.category} LEVEL
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Frequency: {selectedExam.frequency || 'Annual Cycle'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {selectedExam.examName} ({selectedExam.shortName})
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span>Conducting Commission: <strong>{selectedExam.conductingOrganization}</strong></span>
                      •
                      <a
                        href={selectedExam.officialWebsite || selectedExam.officialWebsiteUrl || 'https://www.india.gov.in'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Official Commission Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setStudyPlanExam(selectedExam.examName);
                        setActiveTab('STUDY_PLAN');
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Generate Timetable
                    </button>
                    <button
                      onClick={() => setActiveTab('PRACTICE')}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Practice Questions
                    </button>
                  </div>
                </div>

                {/* Eligibility Summary Cards */}
                <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Age Bracket
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {examEligibility.minAge} to {examEligibility.maxAge} Years
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Standard age relaxations apply for SC/ST/OBC/EWS
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Education Required
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {examEligibility.educationQualification}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Recognized University or equivalent
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nationality & Domicile
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {examEligibility.nationality}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Local state reservation where applicable
                    </p>
                  </div>
                </div>

                {/* Multi-Tier Exam Pattern */}
                <div className="px-6 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Official Multi-Stage Examination Pattern
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeExamPattern.map((tier: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300">
                            {tier.stageName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {tier.examType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Marks:</span>
                            <span className="font-bold">{tier.totalMarks} Marks</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-bold">{tier.durationMinutes} Minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Negative Marking:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {tier.negativeMarking ? `Yes (${tier.negativeMarksPerWrong || 0.25} mark penalty)` : 'No'}
                            </span>
                          </div>
                        </div>

                        {tier.sections && tier.sections.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              Sectional Allocation:
                            </span>
                            <div className="space-y-1">
                              {tier.sections.map((sec: any, sIdx: number) => (
                                <div key={sIdx} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                                  <span>{sec.name}</span>
                                  <span>{sec.questions} Qs / {sec.marks} Marks</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Syllabus Checklist with Completion Bar */}
                <div className="px-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Interactive Syllabus Tracker & Checklist
                      </h3>
                      <p className="text-xs text-slate-500">
                        Mark off subtopics as you complete them to track readiness ({completedSubtopics.length} of {allSubtopicsCount} subtopics finished)
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSyllabusProgress}
                      disabled={savingSyllabus}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Save className="w-3.5 h-3.5 inline mr-1" />
                      {savingSyllabus ? 'Saving...' : 'Save Checklist Progress'}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${syllabusPercent}%` }}
                    />
                  </div>

                  {/* Subject Accordions */}
                  <div className="space-y-3">
                    {activeSyllabus.map((subj: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                          <span>{subj.subjectName}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            Weightage: {subj.weightagePercentage}%
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {(subj.topics || []).map((top: any, tIdx: number) => (
                            <div
                              key={tIdx}
                              className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5"
                            >
                              <span className="text-xs font-bold text-blue-950 dark:text-blue-300 block">
                                {top.topicName}
                              </span>
                              <div className="space-y-1">
                                {(top.subtopics || []).map((sub: string, sbIdx: number) => {
                                  const isChecked = completedSubtopics.includes(sub);
                                  return (
                                    <label
                                      key={sbIdx}
                                      className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-900 dark:hover:text-blue-300"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleSubtopic(sub)}
                                        className="mt-0.5 rounded text-blue-600 cursor-pointer"
                                      />
                                      <span className={isChecked ? 'line-through text-slate-400' : ''}>
                                        {sub}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Books & Cutoffs Grid */}
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified Recommended Books */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Standard Recommended Reference Literature
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {activeRecommendedBooks.map((book: any, bIdx: number) => (
                        <div key={bIdx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {book.title}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Author: {book.author} • Subject: {book.subject}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previous Year Cutoffs */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-amber-600" /> Previous Year Qualifying Cut-Off Benchmarks
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {activePreviousCutoffs.map((cut: any, cIdx: number) => (
                        <div key={cIdx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Recruitment Cycle {cut.year} ({cut.stage})
                            </span>
                            <span className="text-[11px] text-slate-500">Total Marks: {cut.totalMarks}</span>
                          </div>
                          <div className="flex gap-2 text-right">
                            <span className="text-[11px] font-bold px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                              UR: {cut.generalCutoff}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                              OBC: {cut.obcCutoff}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRACTICE QUESTION BANK */}
        {/* ========================================================= */}
        {activeTab === 'PRACTICE' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Exam Practice Question Bank
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Curated questions mirroring current Indian recruitment formats with detailed explanatory solutions.
                </p>
              </div>

              {/* Subject & Difficulty filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={practiceSubject}
                  onChange={(e) => setPracticeSubject(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                >
                  <option value="ALL">All Subjects</option>
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="Reasoning Ability">Reasoning Ability</option>
                  <option value="English Comprehension">English Comprehension</option>
                  <option value="General Awareness">General Awareness</option>
                </select>

                <select
                  value={practiceDifficulty}
                  onChange={(e) => setPracticeDifficulty(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {loadingQuestions ? (
              <div className="text-center py-12">
                <div className="w-7 h-7 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading practice questions...</p>
              </div>
            ) : practiceQuestions.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No questions found matching your filter criteria.</p>
                <button
                  onClick={() => {
                    setPracticeSubject('ALL');
                    setPracticeDifficulty('ALL');
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-900 text-white rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {practiceQuestions.map((q, idx) => {
                  const selectedOpt = userSelectedAnswers[q.id];
                  const isRevealed = revealedAnswers[q.id];
                  const hasAnswered = selectedOpt !== undefined;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-blue-900 dark:text-blue-400">
                          Question {idx + 1} • {q.subject} ({q.topic})
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              q.difficulty === 'HARD'
                                ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                                : q.difficulty === 'MEDIUM'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            +{q.marks || 1} / -{q.negativeMarks || 0.25}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.questionText}
                      </h4>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          const isCorrect = optIdx === q.correctAnswerIndex;

                          let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400';
                          if (hasAnswered || isRevealed) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold';
                            } else if (isOptionSelected && !isCorrect) {
                              btnStyle = 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-300 font-bold';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() =>
                                setUserSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                            >
                              <span>
                                <strong className="mr-2">({String.fromCharCode(65 + optIdx)})</strong> {opt}
                              </span>
                              {(hasAnswered || isRevealed) && isCorrect && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Solution toggle & Explanation */}
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() =>
                            setRevealedAnswers((prev) => ({ ...prev, [q.id]: !isRevealed }))
                          }
                          className="text-xs font-bold text-blue-900 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {isRevealed ? 'Hide Explanation' : 'View Correct Answer & Explanation'}
                        </button>
                      </div>

                      {isRevealed && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                          <span className="font-bold text-blue-950 dark:text-blue-300 block">
                            Correct Answer: ({String.fromCharCode(65 + q.correctAnswerIndex)}) {q.options[q.correctAnswerIndex]}
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SIMULATED TIMED MOCK TESTS */}
        {/* ========================================================= */}
        {activeTab === 'MOCK_TEST' && (
          <div className="space-y-6">
            {!activeTest ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Available Simulated Mock Tests
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Take full-length timed tests strictly calibrated to official negative marking and section time distributions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockTests.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-blue-400 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                          {test.tierStage}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {test.durationMinutes} Minutes
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {test.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Exam: {test.examName} • {test.totalMarks} Total Marks • {test.questionIds.length} Questions
                      </p>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          {test.negativeMarking ? `Negative marking (-${test.negativeMarksPerWrong})` : 'No penalty'}
                        </span>
                        <button
                          onClick={() => handleStartMockTest(test)}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          Launch Test <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : testResultAttempt ? (
              /* Test Results / Attempt Analysis */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded">
                      Mock Test Evaluation Completed
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {testResultAttempt.examName} Performance
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-blue-900 dark:text-amber-400">
                      {testResultAttempt.score}
                      <span className="text-xs font-normal text-slate-400">/{testResultAttempt.totalMarks}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Calculated Score (with negative marking)
                    </span>
                  </div>
                </div>

                {/* Accuracy Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <span className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                      {testResultAttempt.correctCount}
                    </span>
                    <span className="text-xs text-emerald-950 dark:text-emerald-400 block font-semibold">Correct</span>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900">
                    <span className="text-xl font-bold text-red-800 dark:text-red-300">
                      {testResultAttempt.incorrectCount}
                    </span>
                    <span className="text-xs text-red-950 dark:text-red-400 block font-semibold">Incorrect</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                      {testResultAttempt.unattemptedCount}
                    </span>
                    <span className="text-xs text-slate-500 block font-semibold">Unattempted</span>
                  </div>
                </div>

                {/* Section Breakdown */}
                {testResultAttempt.sectionBreakdown && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Section-Wise Accuracy Analysis
                    </h3>
                    <div className="space-y-2">
                      {(testResultAttempt.sectionBreakdown || []).map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{sec.sectionName}</span>
                            <span className="text-[11px] text-slate-500">
                              {sec.correct} Correct • {sec.incorrect} Incorrect • {sec.unattempted} Passed
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-900 dark:text-amber-400 block">
                              {sec.accuracyPercentage}% Accuracy
                            </span>
                            <span className="text-[10px] text-slate-500">Marks: {sec.marks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corrective Recommendations */}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> AI Diagnostics & Weak Area Remediation
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {(testResultAttempt.recommendations || []).map((rec, rIdx) => (
                      <li key={rIdx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTest(null)}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to Mock Tests
                  </button>
                  <button
                    onClick={() => setActiveTab('STUDY_PLAN')}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Generate Targeted Study Plan
                  </button>
                </div>
              </div>
            ) : (
              /* Live Test Simulation View */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Timer & Meta Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300">
                      {activeTest.title}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Question {currentTestQIndex + 1} of {activeTest.questions?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-xs font-bold rounded-lg border border-red-200 dark:border-red-900">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(testTimeRemaining / 60)}:{(testTimeRemaining % 60).toString().padStart(2, '0')}
                    </div>

                    <button
                      onClick={handleSubmitTest}
                      disabled={submittingTest}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {submittingTest ? 'Submitting...' : 'Submit Test'}
                    </button>
                  </div>
                </div>

                {/* Current Question */}
                {activeTest.questions && activeTest.questions[currentTestQIndex] && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        Section: {activeTest.questions[currentTestQIndex].subject}
                      </span>
                      <span className="text-xs text-slate-400">
                        Marks: +{activeTest.questions[currentTestQIndex].marks || 1} / -{activeTest.questions[currentTestQIndex].negativeMarks || 0.25}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      {activeTest.questions[currentTestQIndex].questionText}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2 pt-2">
                      {activeTest.questions[currentTestQIndex].options.map((opt, oIdx) => {
                        const qId = activeTest.questions![currentTestQIndex].id;
                        const isChosen = testAnswers[qId] === oIdx;

                        return (
                          <button
                            key={oIdx}
                            onClick={() =>
                              setTestAnswers((prev) => ({ ...prev, [qId]: oIdx }))
                            }
                            className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 font-bold text-blue-950 dark:text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>
                              <strong className="mr-2">({String.fromCharCode(65 + oIdx)})</strong> {opt}
                            </span>
                            {isChosen && <Check className="w-4 h-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setCurrentTestQIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentTestQIndex === 0}
                        className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                      >
                        Previous Question
                      </button>

                      <button
                        onClick={() =>
                          setCurrentTestQIndex((prev) =>
                            Math.min((activeTest.questions?.length || 1) - 1, prev + 1)
                          )
                        }
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
                      >
                        {currentTestQIndex === (activeTest.questions?.length || 1) - 1
                          ? 'Review & Submit'
                          : 'Next Question'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AI STUDY PLAN GENERATOR */}
        {/* ========================================================= */}
        {activeTab === 'STUDY_PLAN' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Personalized Competitive Exam Study Strategist
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generate an hour-by-hour daily preparation timetable aligned to your available hours, weak areas, and revision cycles.
              </p>
            </div>

            <form onSubmit={handleGenerateStudyPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Examination
                  </label>
                  <input
                    type="text"
                    required
                    value={studyPlanExam}
                    onChange={(e) => setStudyPlanExam(e.target.value)}
                    placeholder="e.g. SSC CGL 2026, IBPS PO, APPSC Group-I"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Preparation Window
                  </label>
                  <select
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 Months (Accelerated Revision)</option>
                    <option value={6}>6 Months (Standard Preparation)</option>
                    <option value={12}>12 Months (Comprehensive Foundation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Available Study Time Per Day
                  </label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2}>2 Hours/day (Working Candidates)</option>
                    <option value={4}>4 Hours/day (Balanced Routine)</option>
                    <option value={6}>6 Hours/day (Full-time Aspirant)</option>
                    <option value={8}>8 Hours/day (Intensive Bootcamp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Weak Area (High Priority)
                  </label>
                  <select
                    value={weakSubject}
                    onChange={(e) => setWeakSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Reasoning Ability">Reasoning Ability & Puzzles</option>
                    <option value="English Comprehension">English Comprehension & Grammar</option>
                    <option value="General Awareness">General Awareness & Economy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Strong Subject (Speed Revision)
                  </label>
                  <select
                    value={strongSubject}
                    onChange={(e) => setStrongSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Reasoning Ability">Reasoning Ability</option>
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="English Comprehension">English Comprehension</option>
                    <option value="General Awareness">General Awareness</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generatingPlan}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {generatingPlan ? 'Calculating Optimal Schedule...' : 'Generate Daily Timetable'}
                </button>
              </div>
            </form>

            {/* Generated Plan Display */}
            {generatedPlan && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Customized Daily Schedule ({generatedPlan.availableDailyHours} Hours/day)
                  </h3>
                  <button
                    onClick={handleSaveStudyPlan}
                    disabled={savingPlan}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer self-start sm:self-auto"
                  >
                    <Save className="w-3.5 h-3.5 inline mr-1" />
                    {savedPlanSuccess ? 'Saved to Profile!' : savingPlan ? 'Saving...' : 'Save Plan'}
                  </button>
                </div>

                {/* Daily Schedule Slots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generatedPlan.dailySchedule?.map((slot: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold text-blue-900 dark:text-blue-300">
                        <span>{slot.timeSlot}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {slot.subject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{slot.activity}</p>
                      {slot.focusTip && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                          Tip: {slot.focusTip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Milestone Targets */}
                {generatedPlan.milestonePlan && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Monthly Milestone Targets
                    </h4>
                    <div className="space-y-2">
                      {(generatedPlan.milestonePlan || []).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Month {m.month}: {m.phaseTitle}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Goal: {m.mockTestsGoal}
                            </span>
                          </div>
                          <span className="font-bold text-blue-900 dark:text-amber-400">
                            {m.expectedReadiness} Readiness
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
