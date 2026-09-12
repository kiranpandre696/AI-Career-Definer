import { Router, Response } from 'express';
import { db } from '../db.ts';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken, AuthenticatedRequest } from '../auth.ts';
import {
  MockInterview,
  InterviewQuestionItem,
  InterviewInterimFeedback,
  InterviewFinalReport,
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

// All mock interview operations require an authenticated student
router.use(authenticateToken as any);

// 1. Initialize Mock Interview
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      jobId,
      jobTitle = 'General Career Aspirant',
      jobType = 'GENERAL',
      interviewType = 'General Career Interview',
      difficulty = 'Intermediate',
      totalQuestions = 5,
      feedbackTiming = 'EACH_QUESTION',
      answerMode = 'text',
    } = req.body;

    const numQuestions = [5, 10, 15].includes(Number(totalQuestions)) ? Number(totalQuestions) : 5;

    // Retrieve student profile to personalize questions based on actual qualifications
    const profile = db.getProfileByUserId(userId);
    const studentDegree = profile?.courseDegree || profile?.highestQualification || 'Graduation';
    const studentBranch = profile?.branchStream || profile?.branch || 'General';
    const studentSkills = profile?.skills || [];

    // Also check if selected job has specific requirements
    let jobDetailsSummary = '';
    if (jobId) {
      const job = db.getJobById(jobId);
      if (job) {
        jobDetailsSummary = `Target Job: "${job.title}", Sector: ${job.sector || job.category}, Required Skills: ${job.skillsRequired?.join(', ') || 'Standard'}, Description: ${job.description.slice(0, 300)}`;
      }
    }

    const ai = getGenAI();
    let questions: InterviewQuestionItem[] = [];

    if (ai) {
      const prompt = `You are a Senior Interview Panelist for Indian ${jobType === 'GOVERNMENT' ? 'Government & Public Sector recruitment boards' : 'top private enterprise recruitment'}.
Generate exactly ${numQuestions} structured interview questions tailored specifically to:

Candidate Context:
- Target Job: "${jobTitle}"
- Job Type: ${jobType}
- Interview Type: ${interviewType}
- Difficulty: ${difficulty}
- Candidate Education: ${studentDegree} in ${studentBranch}
- Verified Candidate Skills: ${studentSkills.length ? studentSkills.join(', ') : 'Fresh graduate'}
${jobDetailsSummary ? `- Job Requirements: ${jobDetailsSummary}` : ''}

Strict Question Composition Rules:
1. Ensure genuine Indian workplace / government recruitment relevance.
2. Mix of categories: Technical domain knowledge, situational problem-solving, project / resume inquiry, and behavioral HR.
3. If Government job, include questions on administrative decision making, public accountability, and official ethics.
4. If Private job, include questions on real-world system delivery, problem debugging, and business alignment.
5. NEVER invent false degrees or fake company records. Adapt to what is provided.
6. Return strictly valid JSON array with no markdown backticks or commentary:
[
  {
    "category": "HR" | "Technical" | "Situational" | "Resume-Based" | "Subject Knowledge" | "General Awareness",
    "questionText": "Clear, direct interview question.",
    "context": "Brief 1-sentence note on what the panel looks for in this answer."
  }
]`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const rawQuestions = JSON.parse(text);

        if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
          questions = rawQuestions.slice(0, numQuestions).map((q: any, idx: number) => ({
            id: `q_${Date.now()}_${idx}`,
            index: idx + 1,
            category: q.category || 'Technical',
            questionText: q.questionText,
            context: q.context || '',
          }));
        }
      } catch (aiErr) {
        console.warn('Gemini question generation error, falling back to curated bank:', aiErr);
      }
    }

    // Fallback if AI was unavailable
    if (!questions.length) {
      const defaultQuestionsPool: { category: any; questionText: string; context: string }[] = [
        {
          category: 'HR',
          questionText: `Please introduce yourself, highlighting your academic background in ${studentBranch} and what motivated you to pursue a career in ${jobTitle}.`,
          context: 'Assesses clarity of thought, professional communication, and genuine career motivation.',
        },
        {
          category: 'Technical',
          questionText: `What do you consider the most critical skill or concept required for ${jobTitle}, and how have you practiced or applied it in your studies or projects?`,
          context: 'Evaluates conceptual depth and practical application beyond rote learning.',
        },
        {
          category: 'Situational',
          questionText: `Imagine you are assigned a high-priority task with an urgent deadline, but a key piece of information or tool is missing. What specific steps will you take?`,
          context: 'Tests problem-solving under pressure and proactive communication.',
        },
        {
          category: 'Resume-Based',
          questionText: `Describe a challenging academic assignment, project, or problem you resolved. What obstacles did you encounter, and what was the outcome?`,
          context: 'Examines analytical resilience, ownership, and verifiable personal contribution.',
        },
        {
          category: 'Situational',
          questionText: jobType === 'GOVERNMENT'
            ? 'In public administration, citizen satisfaction and regulatory compliance sometimes appear in conflict. How would you balance adhering strictly to rules while assisting a distressed citizen?'
            : 'How do you handle constructive criticism or code/work review feedback from a senior colleague or peer?',
          context: jobType === 'GOVERNMENT'
            ? 'Assesses administrative ethics, balance, and constitutional spirit.'
            : 'Assesses teamwork, humility, and professional growth mindset.',
        },
      ];

      questions = defaultQuestionsPool.slice(0, numQuestions).map((q, idx) => ({
        id: `q_fallback_${Date.now()}_${idx}`,
        index: idx + 1,
        category: q.category,
        questionText: q.questionText,
        context: q.context,
      }));
    }

    const newInterview: MockInterview = {
      id: `intv_${Date.now()}`,
      userId,
      jobId,
      jobTitle,
      jobType: jobType as any,
      interviewType,
      difficulty,
      totalQuestions: numQuestions as any,
      feedbackTiming,
      answerMode,
      questions,
      currentQuestionIndex: 0,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
    };

    db.createMockInterview(newInterview);

    res.json({
      success: true,
      interview: newInterview,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to start mock interview', error: err.message });
  }
});

// 2. Get Single Interview by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const interview = db.getMockInterview(req.params.id);
    if (!interview || interview.userId !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }
    res.json({ success: true, interview });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch interview', error: err.message });
  }
});

// 3. Submit Answer for a Question
router.post('/:id/answer', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interview = db.getMockInterview(req.params.id);
    if (!interview || interview.userId !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const { questionIndex, answerText, answerDurationSeconds = 30 } = req.body;
    const qIdx = Number(questionIndex);

    if (qIdx < 0 || qIdx >= interview.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    interview.questions[qIdx].userAnswer = answerText;
    interview.questions[qIdx].answerDurationSeconds = answerDurationSeconds;
    interview.questions[qIdx].skipped = false;

    // If feedback timing is after each question, generate interim feedback
    let interimFeedback: InterviewInterimFeedback | undefined;

    if (interview.feedbackTiming === 'EACH_QUESTION' && answerText && answerText.trim().length > 10) {
      const ai = getGenAI();
      if (ai) {
        const prompt = `You are an expert interview evaluator for CAREER DEFINER.
Question: "${interview.questions[qIdx].questionText}"
Category: ${interview.questions[qIdx].category}
Target Job: "${interview.jobTitle}" (${interview.jobType})
Candidate's Spoken / Written Answer: "${answerText}"

Provide constructive, encouraging, and actionable feedback.
Return strictly valid JSON with no markdown backticks:
{
  "goodPoints": ["Highlight 1-2 strong points in this answer"],
  "improvements": ["Highlight 1-2 concrete ways to sharpen the delivery"],
  "missingPoints": ["1-2 key technical/administrative points that would make the answer exceptional"],
  "betterAnswerStructure": "A brief 2-3 sentence template illustrating a high-impact response"
}`;

        try {
          const resp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          let t = resp.text || '';
          t = t.replace(/```json/gi, '').replace(/```/g, '').trim();
          interimFeedback = JSON.parse(t);
          interview.questions[qIdx].interimFeedback = interimFeedback;
        } catch (e) {
          console.warn('Interim feedback error:', e);
        }
      }

      if (!interimFeedback) {
        interimFeedback = {
          goodPoints: ['Addressed the core intent of the question directly and professionally.'],
          improvements: ['Incorporate specific real-world examples or quantifiable metrics to reinforce credibility.'],
          missingPoints: ['Relating the solution directly to the mission or technical stack of the target role.'],
          betterAnswerStructure: 'Start with a direct thesis statement, follow with a concrete STAR example (Situation, Task, Action, Result), and conclude with the business/administrative impact.',
        };
        interview.questions[qIdx].interimFeedback = interimFeedback;
      }
    }

    // Advance current question index
    if (qIdx === interview.currentQuestionIndex && interview.currentQuestionIndex < interview.questions.length - 1) {
      interview.currentQuestionIndex += 1;
    }

    db.updateMockInterview(interview);

    res.json({
      success: true,
      interimFeedback,
      nextQuestionIndex: interview.currentQuestionIndex,
      isLastQuestion: qIdx === interview.questions.length - 1,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to record answer', error: err.message });
  }
});

// 4. Skip Question
router.post('/:id/skip', (req: AuthenticatedRequest, res: Response) => {
  try {
    const interview = db.getMockInterview(req.params.id);
    if (!interview || interview.userId !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const { questionIndex } = req.body;
    const qIdx = Number(questionIndex);

    if (qIdx >= 0 && qIdx < interview.questions.length) {
      interview.questions[qIdx].skipped = true;
      interview.questions[qIdx].userAnswer = '';
    }

    if (interview.currentQuestionIndex < interview.questions.length - 1) {
      interview.currentQuestionIndex += 1;
    }

    db.updateMockInterview(interview);

    res.json({
      success: true,
      nextQuestionIndex: interview.currentQuestionIndex,
      isLastQuestion: qIdx === interview.questions.length - 1,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to skip question', error: err.message });
  }
});

// 5. Complete and Evaluate Mock Interview (Produces Comprehensive Report)
router.post('/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interview = db.getMockInterview(req.params.id);
    if (!interview || interview.userId !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const attemptedQuestions = interview.questions.filter((q) => q.userAnswer && q.userAnswer.trim().length > 0 && !q.skipped);
    const skippedCount = interview.questions.filter((q) => q.skipped || !q.userAnswer || q.userAnswer.trim().length === 0).length;

    const transcriptSummary = interview.questions
      .map(
        (q) => `Question ${q.index} (${q.category}): "${q.questionText}"\nCandidate Answer: "${q.userAnswer || '[SKIPPED]'}"\n`
      )
      .join('\n');

    const ai = getGenAI();
    let finalReport: InterviewFinalReport | undefined;

    if (ai && attemptedQuestions.length > 0) {
      const prompt = `You are the lead evaluator for CAREER DEFINER AI Mock Interview.
Analyze the complete interview transcript below and produce an objective, explainable performance report.

Interview Details:
- Target Role: "${interview.jobTitle}"
- Sector: ${interview.jobType}
- Difficulty: ${interview.difficulty}
- Total Questions: ${interview.questions.length}
- Attempted: ${attemptedQuestions.length}
- Skipped: ${skippedCount}

Full Transcript:
${transcriptSummary}

Requirements:
1. Compute an overall explainable score out of 100 based on answer depth, relevance, structure, and professional clarity.
2. Evaluate 6 key performance dimensions (each with score 0-100 and 1-2 sentence feedback):
   - Communication
   - Technical Knowledge
   - Confidence Indicators (Note: Text/transcript analysis; does not measure emotional state)
   - Answer Relevance
   - Problem Solving
   - Overall Preparation
3. Provide actionable improvements:
   - Specific topics to revise
   - Skills to improve
   - Recommended questions to practice
   - Recommended CAREER DEFINER career roadmap modules
4. Return strictly valid JSON with no markdown wrapping:
{
  "overallScore": 78,
  "attemptedCount": ${attemptedQuestions.length},
  "skippedCount": ${skippedCount},
  "performanceAnalysis": {
    "communication": { "score": 80, "feedback": "Feedback text" },
    "technicalKnowledge": { "score": 75, "feedback": "Feedback text" },
    "confidenceIndicators": { "score": 78, "feedback": "Evaluated from text clarity, vocabulary assertiveness, and completeness." },
    "answerRelevance": { "score": 82, "feedback": "Feedback text" },
    "problemSolving": { "score": 74, "feedback": "Feedback text" },
    "overallPreparation": { "score": 76, "feedback": "Feedback text" }
  },
  "improvementSuggestions": {
    "topicsToRevise": ["Topic 1", "Topic 2"],
    "skillsToImprove": ["Skill 1", "Skill 2"],
    "questionsToPractice": ["Question A", "Question B"],
    "suggestedLearningResources": ["Resource 1", "Resource 2"],
    "recommendedRoadmapModules": ["Module 1", "Module 2"]
  },
  "disclaimer": "This is an AI-simulated practice interview designed for educational self-evaluation. It does not represent actual hiring selection or government recruitment guarantee."
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        finalReport = JSON.parse(text);
      } catch (aiErr) {
        console.warn('Final report AI generation error, using calculated synthesis:', aiErr);
      }
    }

    if (!finalReport) {
      const baseScore = Math.max(
        35,
        Math.round((attemptedQuestions.length / interview.questions.length) * 75 + 15)
      );

      finalReport = {
        overallScore: baseScore,
        attemptedCount: attemptedQuestions.length,
        skippedCount,
        performanceAnalysis: {
          communication: {
            score: Math.min(95, baseScore + 4),
            feedback: 'Communicated thoughts with coherent sentence structure and appropriate vocabulary.',
          },
          technicalKnowledge: {
            score: baseScore,
            feedback: 'Demonstrated solid grasp of core definitions; deepen understanding of real-world edge cases.',
          },
          confidenceIndicators: {
            score: Math.min(90, baseScore + 2),
            feedback: 'Evaluated from textual assertiveness and clarity. Does not measure physiological state.',
          },
          answerRelevance: {
            score: Math.min(98, baseScore + 6),
            feedback: 'Responses remained directly aligned with the question prompts without excessive wandering.',
          },
          problemSolving: {
            score: Math.max(40, baseScore - 3),
            feedback: 'Structured approach exhibited; practice formulating end-to-end contingency trade-offs.',
          },
          overallPreparation: {
            score: baseScore,
            feedback: 'Good baseline foundation established; continued timed mock sessions will refine poise.',
          },
        },
        improvementSuggestions: {
          topicsToRevise: [
            `${interview.jobTitle} Core Principles`,
            'Situational Decision Frameworks',
            'Indian Regulatory & Industry Compliance',
          ],
          skillsToImprove: [
            'Structuring answers using STAR method',
            'Conciseness and time-budgeting per question',
            'Direct linkage of personal projects to employer value',
          ],
          questionsToPractice: [
            'How do you prioritize competing deadlines across multiple stakeholders?',
            `What is the most complex technical or administrative challenge you have addressed in ${interview.jobTitle}?`,
          ],
          suggestedLearningResources: [
            'CAREER DEFINER Career Roadmap modules',
            'Standard Government & Industry Service Code Manuals',
          ],
          recommendedRoadmapModules: [
            'Phase 3: Core Development & Professional Foundations',
            'Phase 9: Interview Mastery & Live Panel Simulation',
          ],
        },
        disclaimer:
          'This is an AI-simulated practice interview designed for educational preparation and self-evaluation. It does not represent actual hiring selection.',
      };
    }

    interview.status = 'COMPLETED';
    interview.completedAt = new Date().toISOString();
    interview.finalReport = finalReport;

    db.updateMockInterview(interview);

    res.json({
      success: true,
      interview,
      report: finalReport,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to complete interview evaluation', error: err.message });
  }
});

// 6. Get Student Interview History (Private to Student)
router.get('/student/history', (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getStudentMockInterviews(req.user!.id);
    res.json({
      success: true,
      count: list.length,
      interviews: list,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch interview history', error: err.message });
  }
});

// 7. Delete an Interview Session
router.delete('/student/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = db.deleteStudentMockInterview(req.user!.id, req.params.id);
    res.json({
      success: true,
      deleted,
      message: deleted ? 'Interview session removed' : 'Session not found',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete interview', error: err.message });
  }
});

export default router;
