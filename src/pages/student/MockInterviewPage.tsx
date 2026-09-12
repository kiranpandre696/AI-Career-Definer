import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mic,
  MicOff,
  Send,
  SkipForward,
  Award,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  FileText,
  ShieldCheck,
  Building,
  UserCheck,
  BookOpen,
  ArrowRight,
  History,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  MockInterview,
  InterviewQuestionItem,
  InterviewInterimFeedback,
  InterviewFinalReport,
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface MockInterviewPageProps {
  onNavigate: (path: string) => void;
  initialRole?: string;
}

export const MockInterviewPage: React.FC<MockInterviewPageProps> = ({ onNavigate, initialRole }) => {
  const { user, profile, isAuthenticated } = useAuth();

  // Screen modes: 'SETUP' | 'ACTIVE_INTERVIEW' | 'REPORT' | 'HISTORY'
  const [screenMode, setScreenMode] = useState<'SETUP' | 'ACTIVE_INTERVIEW' | 'REPORT' | 'HISTORY'>('SETUP');

  // Setup Form States
  const [jobTitle, setJobTitle] = useState(initialRole || 'Probationary Officer / Junior Specialist');
  const [jobType, setJobType] = useState<'GOVERNMENT' | 'PRIVATE' | 'GENERAL'>('GOVERNMENT');
  const [interviewType, setInterviewType] = useState('Technical & Situational Interview');
  const [difficulty, setDifficulty] = useState<'Entry Level' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState<5 | 10 | 15>(5);
  const [feedbackTiming, setFeedbackTiming] = useState<'EACH_QUESTION' | 'END_OF_INTERVIEW'>('EACH_QUESTION');
  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');

  // Active Interview Session State
  const [currentInterview, setCurrentInterview] = useState<MockInterview | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [interimFeedback, setInterimFeedback] = useState<InterviewInterimFeedback | null>(null);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Past interview history state
  const [historyList, setHistoryList] = useState<MockInterview[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Question Timer
  useEffect(() => {
    let timer: any;
    if (screenMode === 'ACTIVE_INTERVIEW' && currentInterview && !submittingAnswer) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - questionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screenMode, currentInterview, questionStartTime, submittingAnswer]);

  // Load history when viewing history tab
  useEffect(() => {
    if (screenMode === 'HISTORY' && isAuthenticated) {
      fetchHistory();
    }
  }, [screenMode, isAuthenticated]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiRequest('/api/interview/student/history');
      if (res.success && res.interviews) {
        setHistoryList(res.interviews);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start Voice Recognition (Web Speech API)
  const toggleListening = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswerText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  // 1. Start Interview
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to your student candidate account to conduct personalized mock interviews.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const res = await apiRequest('/api/interview/start', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          jobType,
          interviewType,
          difficulty,
          totalQuestions,
          feedbackTiming,
          answerMode,
        }),
      });

      if (res.success && res.interview) {
        setCurrentInterview(res.interview);
        setCurrentQIndex(0);
        setUserAnswerText('');
        setInterimFeedback(null);
        setQuestionStartTime(Date.now());
        setElapsedSeconds(0);
        setScreenMode('ACTIVE_INTERVIEW');
      }
    } catch (err) {
      console.error('Failed to start mock interview:', err);
      alert('Could not start mock interview session. Please verify connection.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // 2. Submit Single Answer
  const handleSubmitAnswer = async () => {
    if (!currentInterview) return;
    if (!userAnswerText.trim()) {
      alert('Please provide an answer or click Skip if you wish to pass this question.');
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    setSubmittingAnswer(true);
    try {
      const res = await apiRequest(`/api/interview/${currentInterview.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionIndex: currentQIndex,
          answerText: userAnswerText.trim(),
          answerDurationSeconds: elapsedSeconds,
        }),
      });

      if (res.success) {
        if (currentInterview.feedbackTiming === 'EACH_QUESTION' && res.interimFeedback) {
          setInterimFeedback(res.interimFeedback);
        } else {
          advanceToNextQuestion(res.isLastQuestion, res.nextQuestionIndex);
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Move to next question after reviewing interim feedback
  const handleAcknowledgeInterimAndProceed = () => {
    const isLast = currentQIndex >= (currentInterview?.questions.length || 0) - 1;
    setInterimFeedback(null);
    if (isLast) {
      handleCompleteInterview();
    } else {
      setCurrentQIndex((prev) => prev + 1);
      setUserAnswerText('');
      setQuestionStartTime(Date.now());
      setElapsedSeconds(0);
    }
  };

  // 3. Skip Question
  const handleSkipQuestion = async () => {
    if (!currentInterview) return;

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    setSubmittingAnswer(true);
    try {
      const res = await apiRequest(`/api/interview/${currentInterview.id}/skip`, {
        method: 'POST',
        body: JSON.stringify({
          questionIndex: currentQIndex,
        }),
      });

      if (res.success) {
        advanceToNextQuestion(res.isLastQuestion, res.nextQuestionIndex);
      }
    } catch (err) {
      console.error('Skip error:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const advanceToNextQuestion = (isLast: boolean, nextIdx: number) => {
    if (isLast || currentQIndex >= (currentInterview?.questions.length || 0) - 1) {
      handleCompleteInterview();
    } else {
      setCurrentQIndex(nextIdx);
      setUserAnswerText('');
      setInterimFeedback(null);
      setQuestionStartTime(Date.now());
      setElapsedSeconds(0);
    }
  };

  // 4. Complete Interview and Generate Final Report
  const handleCompleteInterview = async () => {
    if (!currentInterview) return;
    setSubmittingAnswer(true);
    try {
      const res = await apiRequest(`/api/interview/${currentInterview.id}/complete`, {
        method: 'POST',
      });

      if (res.success && res.interview) {
        setCurrentInterview(res.interview);
        setScreenMode('REPORT');
      }
    } catch (err) {
      console.error('Complete interview error:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Delete an interview from history
  const handleDeleteInterview = async (id: string) => {
    if (!confirm('Are you sure you want to remove this interview session?')) return;
    try {
      const res = await apiRequest(`/api/interview/student/${id}`, { method: 'DELETE' });
      if (res.success) {
        setHistoryList((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Delete interview error:', err);
    }
  };

  const activeQuestion = currentInterview?.questions[currentQIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: 'Candidate Portal', path: '/candidate-portal' },
            { label: 'AI Mock Interview' },
          ]}
          onNavigate={onNavigate}
        />

        {/* Feature Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-blue-800/60 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <BrainCircuit className="w-3.5 h-3.5" />
                Adaptive AI Recruitment Panel Simulator
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AI Mock Interview Panel
              </h1>
              <p className="text-xs sm:text-sm text-blue-200">
                Simulate realistic interviews for Indian Government services and leading private technology companies.
                Receive objective scoring across 6 key performance dimensions and STAR structure guidance.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {screenMode !== 'SETUP' && (
                <button
                  onClick={() => {
                    setCurrentInterview(null);
                    setScreenMode('SETUP');
                  }}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors cursor-pointer"
                >
                  New Simulation
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => setScreenMode(screenMode === 'HISTORY' ? 'SETUP' : 'HISTORY')}
                  className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 text-white text-xs font-bold rounded-lg border border-blue-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  {screenMode === 'HISTORY' ? 'Back to Setup' : 'My Past Interviews'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: INTERVIEW SETUP FORM */}
        {/* ========================================================= */}
        {screenMode === 'SETUP' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Configure Your Interview Session
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize target role, commission sector, question categories, and live feedback preference.
              </p>
            </div>

            <form onSubmit={handleStartInterview} className="space-y-5">
              {/* Target Job Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Job Role / Recruitment Post *
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Bank PO, Assistant Section Officer, Software Engineer, Police SI"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Popular roles:</span>
                  {[
                    'IBPS Probationary Officer',
                    'SSC CGL Assistant Section Officer',
                    'Full Stack Software Developer',
                    'State PSC Administrative Officer',
                    'Data Analyst',
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setJobTitle(role)}
                      className="text-[11px] font-medium text-blue-900 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sector & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Sector Classification
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GOVERNMENT">🏛️ Government / Public Sector</option>
                    <option value="PRIVATE">🏢 Private Sector Enterprise</option>
                    <option value="GENERAL">🌐 General Career Simulation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Interview Panel Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Entry Level">Entry Level (Fresh Graduates)</option>
                    <option value="Intermediate">Intermediate (Standard Recruitment)</option>
                    <option value="Advanced">Advanced (High-Competition Board)</option>
                  </select>
                </div>
              </div>

              {/* Interview Type & Question Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Interview Focus Category
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Technical & Situational Interview">Comprehensive Technical & Situational</option>
                    <option value="HR & Behavioral Interview">HR & Personality Assessment</option>
                    <option value="Resume & Project Deep Dive">Resume & Project Experience Inquiry</option>
                    <option value="Public Administration & Ethics">Administrative Ethics & Citizen Services</option>
                    <option value="General Awareness & Current Affairs">Current Affairs & Economic Policy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Questions
                  </label>
                  <select
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value) as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Questions (10 mins)</option>
                    <option value={10}>10 Questions (20 mins)</option>
                    <option value={15}>15 Questions (30 mins)</option>
                  </select>
                </div>
              </div>

              {/* Feedback Timing & Answer Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Feedback Delivery Mode
                  </label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackTiming"
                        checked={feedbackTiming === 'EACH_QUESTION'}
                        onChange={() => setFeedbackTiming('EACH_QUESTION')}
                        className="text-blue-600"
                      />
                      <span>Immediate Guidance (After each question)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackTiming"
                        checked={feedbackTiming === 'END_OF_INTERVIEW'}
                        onChange={() => setFeedbackTiming('END_OF_INTERVIEW')}
                        className="text-blue-600"
                      />
                      <span>Realistic Board Simulation (Report at the end)</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Answering Preference
                  </label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="answerMode"
                        checked={answerMode === 'text'}
                        onChange={() => setAnswerMode('text')}
                        className="text-blue-600"
                      />
                      <span>Typed Text Response (with real-time counter)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="answerMode"
                        checked={answerMode === 'voice'}
                        onChange={() => setAnswerMode('voice')}
                        className="text-blue-600"
                      />
                      <span>Voice Input (Speech-to-Text via Microphone)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adaptive AI dynamically crafts questions based on your background.
                </div>

                <button
                  type="submit"
                  disabled={submittingAnswer}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {submittingAnswer ? 'Assembling Interview Panel...' : 'Launch Interview Session'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ACTIVE INTERVIEW SESSION */}
        {/* ========================================================= */}
        {screenMode === 'ACTIVE_INTERVIEW' && currentInterview && activeQuestion && (
          <div className="space-y-6">
            {/* Top Navigation & Status */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded-lg">
                  Question {currentQIndex + 1} of {currentInterview.questions.length}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {currentInterview.jobTitle}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                </div>

                <button
                  onClick={handleCompleteInterview}
                  className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                >
                  End & Evaluate
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300">
                    Category: {activeQuestion.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Difficulty: {currentInterview.difficulty}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  "{activeQuestion.questionText}"
                </h3>
                {activeQuestion.context && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <strong>Panel Evaluation Focus:</strong> {activeQuestion.context}
                  </p>
                )}
              </div>

              {/* Interim Feedback View (if active after question answer) */}
              {interimFeedback ? (
                <div className="bg-blue-50/70 dark:bg-blue-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Instant AI Evaluator Feedback
                    </span>
                    <span className="text-[11px] text-slate-500">Question {currentQIndex + 1} Review</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> What Went Well:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                        {interimFeedback.goodPoints.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Opportunities to Improve:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                        {interimFeedback.improvements.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {interimFeedback.betterAnswerStructure && (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-bold text-blue-950 dark:text-blue-300 block mb-1">
                        Recommended Answer Structure:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {interimFeedback.betterAnswerStructure}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAcknowledgeInterimAndProceed}
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    Proceed to Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Answer Input Area */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Your Response:
                    </label>

                    {/* Microphone Toggle */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        isListening
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isListening ? 'Recording... (Click to stop)' : 'Speak Answer'}
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={userAnswerText}
                    onChange={(e) => setUserAnswerText(e.target.value)}
                    placeholder="Structure your answer clearly. State your direct viewpoint, provide real examples from your coursework or projects, and describe the outcome..."
                    className="w-full p-4 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Words: {userAnswerText.trim() ? userAnswerText.trim().split(/\s+/).length : 0} • Characters: {userAnswerText.length}
                    </span>
                    <span>Aim for 60-150 words for structured delivery</span>
                  </div>

                  {/* Submit / Skip Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSkipQuestion}
                      disabled={submittingAnswer}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <SkipForward className="w-4 h-4" /> Skip Question
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={submittingAnswer || !userAnswerText.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingAnswer ? 'Evaluating Answer...' : currentQIndex === currentInterview.questions.length - 1 ? 'Submit & Complete' : 'Submit Answer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FINAL EVALUATION REPORT */}
        {/* ========================================================= */}
        {screenMode === 'REPORT' && currentInterview && currentInterview.finalReport && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded-md">
                  Official Session Evaluation
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Interview Performance Report
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role: {currentInterview.jobTitle} • {currentInterview.difficulty} • Attempted: {currentInterview.finalReport.attemptedCount} of {currentInterview.questions.length} questions
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-3xl font-black text-blue-900 dark:text-amber-400">
                    {currentInterview.finalReport.overallScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Overall Readiness
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Key Performance Dimensions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Core Evaluated Dimensions (6 Categories)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(currentInterview.finalReport.performanceAnalysis).map(([key, data]) => {
                  const labelMap: Record<string, string> = {
                    communication: 'Communication Clarity',
                    technicalKnowledge: 'Technical & Domain Grasp',
                    confidenceIndicators: 'Confidence Indicators*',
                    answerRelevance: 'Answer Relevance',
                    problemSolving: 'Problem Solving Logic',
                    overallPreparation: 'Overall Preparation Depth',
                  };

                  const metric = data as { score: number; feedback: string };
                  return (
                    <div
                      key={key}
                      className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {labelMap[key] || key}
                        </span>
                        <span className="text-xs font-extrabold text-blue-900 dark:text-amber-400">
                          {metric.score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-700 dark:bg-blue-500 h-full rounded-full"
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {metric.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                * Note: Confidence is measured from sentence structure and assertiveness in transcription; it does not represent physiological or emotional tracking.
              </p>
            </div>

            {/* Actionable Improvement Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Recommended Topics to Revise
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {currentInterview.finalReport.improvementSuggestions.topicsToRevise.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Recommended Career Roadmap Modules
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {currentInterview.finalReport.improvementSuggestions.recommendedRoadmapModules.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Question by Question Review */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Question-by-Question Detailed Review ({currentInterview.questions.length})
              </h3>

              <div className="space-y-3">
                {currentInterview.questions.map((q: InterviewQuestionItem) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Q{q.index}: {q.questionText}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase shrink-0 ${
                          q.skipped
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {q.skipped ? 'Skipped' : 'Attempted'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <strong>Your Stated Answer:</strong>{' '}
                      {q.userAnswer ? q.userAnswer : <span className="italic text-slate-400">No answer provided</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setCurrentInterview(null);
                  setScreenMode('SETUP');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start Another Simulation
              </button>

              <button
                onClick={() => onNavigate('/career-roadmap')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Open Recommended Career Roadmap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Educational Disclaimer */}
            <div className="p-3 bg-amber-50 dark:bg-slate-800/80 rounded-lg text-[11px] text-amber-900 dark:text-amber-300/90 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{currentInterview.finalReport.disclaimer}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: PAST INTERVIEW HISTORY */}
        {/* ========================================================= */}
        {screenMode === 'HISTORY' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Mock Interview History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track your evaluation scores, communication metrics, and performance over time.
                </p>
              </div>

              <button
                onClick={() => setScreenMode('SETUP')}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Launch New Interview
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="w-7 h-7 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading past interviews...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No Mock Interviews Completed Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Take your first simulated interview to benchmark your communication and technical knowledge.
                </p>
                <button
                  onClick={() => setScreenMode('SETUP')}
                  className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Start First Interview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors bg-slate-50/40 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                          {item.jobType}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.jobTitle}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {item.interviewType} • {item.questions.length} Questions • {item.difficulty}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {item.finalReport && (
                        <div className="text-right">
                          <div className="text-xl font-black text-blue-900 dark:text-amber-400">
                            {item.finalReport.overallScore}/100
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Evaluated Score
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setCurrentInterview(item);
                          setScreenMode('REPORT');
                        }}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        View Report
                      </button>

                      <button
                        onClick={() => handleDeleteInterview(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
