import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken, AuthenticatedRequest } from '../auth.ts';
import {
  GovernmentExamDetail,
  StudentExamStudyPlan,
  StudentExamSyllabusProgress,
  StudentMockTestAttempt,
  PracticeQuestion,
} from '../types.ts';

const router = Router();

function getGenAI(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    try {
      return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch {
      return null;
    }
  }
  return null;
}

// 1. Get all published Government Exams
router.get('/exams', (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'ALL';
    const query = (req.query.q as string) || '';

    const exams = db.getGovernmentExams(category, query);
    res.json({ success: true, count: exams.length, exams });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch government exams', error: err.message });
  }
});

// 2. Get detailed Exam Profile by ID
router.get('/exams/:id', (req: Request, res: Response) => {
  try {
    const exam = db.getGovernmentExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Government examination profile not found' });
    }

    // Also link any related live job notifications in CAREER DEFINER
    const relatedJobs = db
      .getJobs()
      .filter((j) => j.status === 'PUBLISHED' && (j.examinationId === exam.id || j.title.toLowerCase().includes(exam.shortName.toLowerCase())))
      .slice(0, 10);

    res.json({ success: true, exam, relatedJobs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam details', error: err.message });
  }
});

// 3. AI Personalized Study Plan Generator
router.post('/study-plan/generate', async (req: Request, res: Response) => {
  try {
    const {
      examId,
      examName,
      availableDailyHours = 4,
      targetMonths = 6,
      strongSubjects = [],
      weakSubjects = [],
      studentQualification,
    } = req.body;

    const targetExam = examId ? db.getGovernmentExamById(examId) : null;
    const name = targetExam ? targetExam.examName : examName || 'Government Competitive Examination';
    const hours = Number(availableDailyHours) || 4;
    const months = Number(targetMonths) || 6;

    const subjectsList = targetExam?.subjects || ['Quantitative Aptitude', 'Reasoning Ability', 'English Comprehension', 'General Awareness / Current Affairs'];

    const ai = getGenAI();

    if (ai) {
      const prompt = `You are the lead preparation strategist for CAREER DEFINER, guiding Indian civil, banking, railway, and defense aspirants.
Create a structured, scientifically balanced study plan for:

Exam: "${name}"
Available Daily Study Time: ${hours} hours per day
Preparation Window: ${months} months
Identified Strong Areas: ${strongSubjects.length ? strongSubjects.join(', ') : 'None specified'}
Identified Weak Areas: ${weakSubjects.length ? weakSubjects.join(', ') : 'None specified'}
Candidate Academic Background: ${studentQualification || 'Graduate'}
Exam Subjects: ${subjectsList.join(', ')}

Strict Rules:
1. Divide daily time into realistic subject blocks, with high priority allocated to weak areas.
2. Formulate 8-12 progressive study phases/milestones across the ${months} months.
3. Incorporate regular mock test frequency, revision cycles, and current affairs tracking.
4. Return strictly valid JSON with no markdown wrapping:
{
  "examName": "${name}",
  "dailySchedule": [
    {
      "timeSlot": "Morning (07:00 - 09:00)",
      "subject": "String",
      "activity": "Detailed study activity",
      "focusTip": "Key strategy"
    }
  ],
  "subjectWiseHours": [
    {
      "subject": "String",
      "weeklyHours": 8,
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "recommendedFocus": "Specific topics"
    }
  ],
  "milestonePlan": [
    {
      "month": 1,
      "phaseTitle": "Foundations & Concept Clarity",
      "targetTopics": ["Topic 1", "Topic 2"],
      "mockTestsGoal": "1 Diagnostic Mock Test",
      "expectedReadiness": "20%"
    }
  ],
  "weeklyRevisionStrategy": "Concrete 3-4 sentence revision rule",
  "mockTestStrategy": "How and when to take full-length vs sectional tests"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);

        return res.json({
          success: true,
          studyPlan: {
            examId: targetExam?.id || examId,
            examName: name,
            availableDailyHours: hours,
            targetMonths: months,
            ...parsed,
          },
          source: 'AI_PERSONALIZED',
        });
      } catch (aiErr) {
        console.warn('AI study plan generation failed, falling back to curated plan:', aiErr);
      }
    }

    // Fallback rule-based plan
    const fallbackPlan = {
      examId: targetExam?.id || examId,
      examName: name,
      availableDailyHours: hours,
      targetMonths: months,
      dailySchedule: [
        {
          timeSlot: 'Morning (07:00 - 08:30)',
          subject: 'Current Affairs & General Awareness',
          activity: 'Read national daily newspaper editorial, revise monthly government scheme compilations.',
          focusTip: 'Make 1-page condensed bullet notes on statutory committees and RBI/Govt directives.',
        },
        {
          timeSlot: 'Mid-Morning (10:00 - 12:00)',
          subject: weakSubjects[0] || 'Quantitative Aptitude',
          activity: 'Concept theory followed by 40 graded practice questions using formula handbook.',
          focusTip: 'Prioritize accuracy before speed; identify recurring calculation bottlenecks.',
        },
        {
          timeSlot: 'Afternoon (14:30 - 16:00)',
          subject: 'Reasoning Ability & Critical Logic',
          activity: 'Timed puzzle solving, seating arrangements, and logical syllogisms.',
          focusTip: 'Target solving 3 sets within 20 minutes under strict timer discipline.',
        },
        {
          timeSlot: 'Evening (18:00 - 19:30)',
          subject: 'English Comprehension & Vocabulary',
          activity: 'Reading comprehension passages, error spotting rules, and vocabulary in context.',
          focusTip: 'Focus on contextual tone and inference rather than rote dictionary memorization.',
        },
      ],
      subjectWiseHours: subjectsList.map((s, idx) => ({
        subject: s,
        weeklyHours: Math.max(4, Math.round((hours * 6) / subjectsList.length)),
        priority: idx === 0 ? 'HIGH' : idx === 1 ? 'HIGH' : 'MEDIUM',
        recommendedFocus: 'High-frequency exam pattern topics & previous years solved papers.',
      })),
      milestonePlan: [
        {
          month: 1,
          phaseTitle: 'Concept Clarity & Core Foundations',
          targetTopics: ['Basic Arithmetic & Vedic shortcuts', 'Grammar fundamentals', 'Constitution Basics'],
          mockTestsGoal: '1 Diagnostic Sectional Test per week',
          expectedReadiness: '25%',
        },
        {
          month: 2,
          phaseTitle: 'Intermediate Practice & Speed Building',
          targetTopics: ['Puzzles & Seating arrangement', 'Data Interpretation', 'Economy & Budget'],
          mockTestsGoal: '2 Sectional Tests per week',
          expectedReadiness: '50%',
        },
        {
          month: 3,
          phaseTitle: 'Full-Length Simulation & Error Rectification',
          targetTopics: ['Comprehensive previous year papers', 'Weak area error log remediation'],
          mockTestsGoal: '2 Full-Length Mock Tests per week with 2-hour post-test analysis',
          expectedReadiness: '85%',
        },
      ],
      weeklyRevisionStrategy:
        'Reserve Saturdays exclusively for consolidating weak topics identified during the week. Dedicate Sundays for 1 full-length simulated mock exam under strict timed conditions.',
      mockTestStrategy:
        'Begin with sectional diagnostics during Weeks 1-4. Transition to full-length timed tests 60 days before the exam date. Thoroughly analyze incorrect answers in an error log.',
    };

    res.json({
      success: true,
      studyPlan: fallbackPlan,
      source: 'CURATED_TEMPLATE',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate study plan', error: err.message });
  }
});

// 4. Get Practice Questions (Public or Filtered)
router.get('/questions', (req: Request, res: Response) => {
  try {
    const examId = req.query.examId as string;
    const subject = req.query.subject as string;
    const topic = req.query.topic as string;
    const difficulty = req.query.difficulty as string;
    const limit = Number(req.query.limit) || 20;

    const questions = db.getPracticeQuestions({
      examId,
      subject,
      topic,
      difficulty,
      limit,
    });

    res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch practice questions', error: err.message });
  }
});

// 5. Get Mock Tests
router.get('/mock-tests', (req: Request, res: Response) => {
  try {
    const examId = req.query.examId as string;
    const tests = db.getMockTests(examId);
    res.json({ success: true, count: tests.length, mockTests: tests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch mock tests', error: err.message });
  }
});

// 6. Get Single Mock Test with Questions
router.get('/mock-tests/:id', (req: Request, res: Response) => {
  try {
    const test = db.getMockTestById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }
    res.json({ success: true, mockTest: test });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch mock test', error: err.message });
  }
});

// ==========================================
// PROTECTED STUDENT ROUTES
// ==========================================

router.use(authenticateToken as any);

// 7. Submit Mock Test and Calculate Detailed Score
router.post('/mock-tests/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const test = db.getMockTestById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const { answers = {}, timeSpentSeconds = 0 } = req.body;
    const questions = test.questions || [];

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const userAnswersList: any[] = [];
    const sectionAnalysisMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marks: number }> = {};

    questions.forEach((q) => {
      const selectedOption = answers[q.id];
      const isAttempted = selectedOption !== undefined && selectedOption !== null && selectedOption !== '';
      const isCorrect = isAttempted && Number(selectedOption) === q.correctAnswerIndex;

      // Track section stats
      const sec = q.subject || 'General';
      if (!sectionAnalysisMap[sec]) {
        sectionAnalysisMap[sec] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, marks: 0 };
      }
      sectionAnalysisMap[sec].total += 1;

      if (!isAttempted) {
        unattemptedCount += 1;
        sectionAnalysisMap[sec].unattempted += 1;
      } else if (isCorrect) {
        correctCount += 1;
        sectionAnalysisMap[sec].correct += 1;
        sectionAnalysisMap[sec].marks += q.marks || 1;
      } else {
        incorrectCount += 1;
        sectionAnalysisMap[sec].incorrect += 1;
        sectionAnalysisMap[sec].marks -= q.negativeMarks || (test.negativeMarking ? 0.25 : 0);
      }

      userAnswersList.push({
        questionId: q.id,
        selectedOption: isAttempted ? Number(selectedOption) : null,
        isCorrect,
        timeTakenSeconds: 0,
      });
    });

    const marksPerCorrect = test.totalMarks / Math.max(questions.length, 1);
    const negativePerIncorrect = test.negativeMarking ? (test.negativeMarksPerWrong || 0.25) : 0;
    const rawScore = correctCount * marksPerCorrect - incorrectCount * negativePerIncorrect;
    const score = Math.max(0, Math.round(rawScore * 100) / 100);
    const percentage = Math.round((score / Math.max(test.totalMarks, 1)) * 100);

    const sectionBreakdown = Object.entries(sectionAnalysisMap).map(([sectionName, stats]) => ({
      sectionName,
      totalQuestions: stats.total,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unattempted: stats.unattempted,
      marks: Math.max(0, Math.round(stats.marks * 100) / 100),
      accuracyPercentage: stats.correct + stats.incorrect > 0
        ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
        : 0,
    }));

    // Weak areas identified from low accuracy sections
    const weakAreas = sectionBreakdown
      .filter((s) => s.accuracyPercentage < 60)
      .map((s) => s.sectionName);

    const recommendations = [
      weakAreas.length
        ? `Focus intensive revision on ${weakAreas.join(', ')} where accuracy fell below 60%.`
        : 'Solid performance across all tested sections. Focus on speed drills to improve time buffer.',
      'Review complete answer explanations for each wrong response to rectify underlying conceptual flaws.',
      'Maintain an error notebook to record questions missed due to calculation slips versus lack of formula recall.',
    ];

    const attempt: StudentMockTestAttempt = {
      id: `atmpt_${Date.now()}`,
      userId: req.user!.id,
      mockTestId: test.id,
      examName: test.examName,
      score,
      totalMarks: test.totalMarks,
      percentage,
      timeSpentSeconds,
      correctCount,
      incorrectCount,
      unattemptedCount,
      sectionBreakdown,
      weakAreas,
      recommendations,
      attemptedAt: new Date().toISOString(),
      userAnswers: userAnswersList,
    };

    db.recordMockTestAttempt(attempt);

    res.json({
      success: true,
      attempt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit mock test', error: err.message });
  }
});

// 8. Get Student Past Test Attempts
router.get('/student/attempts', (req: AuthenticatedRequest, res: Response) => {
  try {
    const examName = req.query.examName as string;
    const list = db.getStudentMockTestAttempts(req.user!.id, examName);
    res.json({ success: true, count: list.length, attempts: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch test attempts', error: err.message });
  }
});

// 9. Get & Save Student Study Plan
router.get('/student/study-plan/:examId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const plan = db.getStudentStudyPlan(req.user!.id, req.params.examId);
    res.json({ success: true, studyPlan: plan || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch study plan', error: err.message });
  }
});

router.post('/student/study-plan/save', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      examId,
      examName,
      availableDailyHours = 4,
      targetMonths = 6,
      dailySchedule = [],
      subjectWiseHours = [],
      milestonePlan = [],
      notes = '',
    } = req.body;

    if (!examId || !examName) {
      return res.status(400).json({ success: false, message: 'examId and examName are required' });
    }

    const saved = db.saveStudentStudyPlan({
      id: `plan_${req.user!.id}_${examId}`,
      userId: req.user!.id,
      examId,
      examName,
      availableDailyHours,
      targetMonths,
      dailySchedule,
      subjectWiseHours,
      milestonePlan,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Study plan saved to your profile', studyPlan: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save study plan', error: err.message });
  }
});

// 10. Get & Save Student Syllabus Tracking Checklist
router.get('/student/syllabus/:examId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const progress = db.getStudentSyllabusProgress(req.user!.id, req.params.examId);
    res.json({ success: true, progress: progress || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch syllabus progress', error: err.message });
  }
});

router.post('/student/syllabus/save', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, examName, completedTopics = [], completedSubtopics = [], overallPercentage = 0 } = req.body;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const saved = db.saveStudentSyllabusProgress({
      id: `syl_prog_${req.user!.id}_${examId}`,
      userId: req.user!.id,
      examId,
      examName: examName || 'Exam Syllabus',
      completedTopics,
      completedSubtopics,
      overallPercentage: Math.min(100, Math.max(0, Number(overallPercentage))),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Syllabus progress updated', progress: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save syllabus progress', error: err.message });
  }
});

export default router;
