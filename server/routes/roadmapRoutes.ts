import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken, AuthenticatedRequest } from '../auth.ts';
import { CareerRoadmap, StudentRoadmapProgress, MissingSkillDetail } from '../types.ts';

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

// 1. Get all published roadmaps with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const sector = (req.query.sector as string) || 'ALL';
    const category = (req.query.category as string) || 'ALL';
    const query = (req.query.q as string) || '';

    const roadmaps = db.getRoadmaps(sector, category, query);
    res.json({ success: true, count: roadmaps.length, roadmaps });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch career roadmaps', error: err.message });
  }
});

// 2. Get single roadmap by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const roadmap = db.getRoadmapById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Career roadmap not found' });
    }
    res.json({ success: true, roadmap });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch roadmap details', error: err.message });
  }
});

// 3. AI Personalized Roadmap Generator
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      targetCareer,
      customGoal,
      qualification,
      branch,
      existingSkills = [],
      preferredSector = 'BOTH',
      durationMonths = 3,
      resumeExtractedData,
    } = req.body;

    const careerGoal = targetCareer || customGoal || 'Software Developer';
    const duration = [1, 3, 6, 12].includes(Number(durationMonths)) ? Number(durationMonths) : 3;

    // Check if an existing curated roadmap matches the goal
    const matchedCurated = db.getRoadmaps().find(
      (r) =>
        r.title.toLowerCase().includes(careerGoal.toLowerCase()) ||
        careerGoal.toLowerCase().includes(r.title.toLowerCase())
    );

    const ai = getGenAI();

    if (ai) {
      const prompt = `You are the chief career counselor for CAREER DEFINER, an AI-powered smart career guidance portal for Indian students.
Generate a structured, personalized career roadmap for the following student profile:

- Target Career Goal: "${careerGoal}"
- Preferred Sector: ${preferredSector} (Government / Private / Both)
- Student Qualification: ${qualification || 'Undergraduate'}
- Branch/Stream: ${branch || 'General'}
- Existing Skills (verified from student profile & resume): ${existingSkills.length ? existingSkills.join(', ') : 'Basic computer literacy'}
- Duration of Learning Timeline: ${duration} Months
${resumeExtractedData ? `- Additional Resume Context: ${JSON.stringify(resumeExtractedData)}` : ''}

Strict Rules:
1. Provide realistic, Indian industry and government-aligned career milestones.
2. Build 10 sequential phases:
   Phase 1: Current Qualification & Educational Foundation
   Phase 2: Required Basic Knowledge & Fundamentals
   Phase 3: Core Skills
   Phase 4: Advanced Skills
   Phase 5: Practical Projects
   Phase 6: Certifications
   Phase 7: Internship / Practical Experience
   Phase 8: Job Preparation & Resume Optimization
   Phase 9: Interview Preparation (Technical & HR)
   Phase 10: Job Application & Continuous Growth
3. Provide a detailed weekly plan for ${duration} months (${duration === 1 ? '4 weeks' : duration === 3 ? '12 weeks' : duration === 6 ? '12 representative multi-week blocks' : '12 representative multi-week blocks'}).
4. Clearly emphasize that completing the roadmap does not guarantee employment.
5. Return strictly valid JSON with no markdown wrapping or preamble matching this structure:
{
  "title": "${careerGoal}",
  "category": "String (e.g. Information Technology, Civil Administration, Banking)",
  "sector": "${preferredSector}",
  "targetQualification": "String",
  "importantSkills": ["Skill 1", "Skill 2", ...],
  "suitableJobRoles": ["Role 1", "Role 2", ...],
  "growthOpportunities": "String explaining career progression ladder",
  "overview": "Comprehensive 2-3 paragraph overview",
  "learningPhases": [
    {
      "phaseNumber": 1,
      "name": "Phase Name",
      "description": "Phase detail",
      "skills": ["Skill A", "Skill B"],
      "tasks": ["Task 1", "Task 2"],
      "certifications": ["Cert 1"],
      "projects": ["Project 1"]
    }
  ],
  "weeklyPlan": [
    {
      "weekNumber": 1,
      "title": "Week Title",
      "topics": ["Topic 1", "Topic 2"],
      "skills": ["Skill A"],
      "practiceTasks": ["Task 1", "Task 2"],
      "suggestedProjects": ["Optional Project"],
      "expectedOutcome": "Measurable outcome"
    }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text || '';
        // Strip markdown backticks
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(text);

        const generatedRoadmap: CareerRoadmap = {
          id: `rdmp_gen_${Date.now()}`,
          title: parsed.title || careerGoal,
          category: parsed.category || 'Professional Career',
          sector: ['GOVERNMENT', 'PRIVATE', 'BOTH'].includes(parsed.sector) ? parsed.sector : 'BOTH',
          targetQualification: parsed.targetQualification || qualification || 'Graduation',
          importantSkills: parsed.importantSkills || ['Problem Solving', 'Domain Expertise'],
          suitableJobRoles: parsed.suitableJobRoles || [careerGoal],
          growthOpportunities: parsed.growthOpportunities || 'Entry Level -> Intermediate Specialist -> Senior Leader',
          overview: parsed.overview || `Personalized career roadmap designed for ${careerGoal}.`,
          learningPhases: parsed.learningPhases || (matchedCurated ? matchedCurated.learningPhases : []),
          timelinePlans: [
            {
              durationMonths: duration as any,
              weeks: parsed.weeklyPlan || [],
            },
          ],
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Cache in memory DB
        db.saveRoadmap(generatedRoadmap);

        return res.json({
          success: true,
          roadmap: generatedRoadmap,
          source: 'AI_PERSONALIZED',
        });
      } catch (aiErr) {
        console.warn('Gemini roadmap generation failed, falling back to curated template:', aiErr);
      }
    }

    // Fallback: use matched curated roadmap or adapt default
    if (matchedCurated) {
      const specificTimeline = matchedCurated.timelinePlans.find((t) => t.durationMonths === duration) ||
        matchedCurated.timelinePlans[0];

      return res.json({
        success: true,
        roadmap: {
          ...matchedCurated,
          timelinePlans: [specificTimeline],
        },
        source: 'CURATED_TEMPLATE',
      });
    }

    // Fallback generic Software Developer / Analyst
    const defaultRoadmap = db.getRoadmaps()[0];
    const defaultTimeline = defaultRoadmap.timelinePlans.find((t) => t.durationMonths === duration) ||
      defaultRoadmap.timelinePlans[0];

    return res.json({
      success: true,
      roadmap: {
        ...defaultRoadmap,
        title: careerGoal,
        timelinePlans: [defaultTimeline],
      },
      source: 'FALLBACK_TEMPLATE',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate career roadmap', error: err.message });
  }
});

// 4. Real Skill-Gap Analysis
router.post('/skill-gap', async (req: Request, res: Response) => {
  try {
    const { studentSkills = [], targetCareer = '', targetJobId = '' } = req.body;

    let targetRequiredSkills: string[] = [];
    let jobTitle = targetCareer;

    if (targetJobId) {
      const job = db.getJobById(targetJobId);
      if (job) {
        targetRequiredSkills = job.skillsRequired || [];
        jobTitle = job.title;
      }
    }

    if (!targetRequiredSkills.length) {
      const roadmap = db.getRoadmaps().find((r) =>
        r.title.toLowerCase().includes(targetCareer.toLowerCase()) ||
        targetCareer.toLowerCase().includes(r.title.toLowerCase())
      );
      if (roadmap) {
        targetRequiredSkills = roadmap.importantSkills;
      } else {
        targetRequiredSkills = [
          'Core Domain Knowledge',
          'Analytical Problem Solving',
          'Verbal & Written Communication',
          'Modern Software / Tools',
          'Industry Compliance & Documentation',
        ];
      }
    }

    // Identify which skills student already possesses (case-insensitive substring match)
    const normalizedStudentSkills = studentSkills.map((s: string) => s.toLowerCase().trim());
    const existingSkillsMatched: string[] = [];
    const missingSkillNames: string[] = [];

    targetRequiredSkills.forEach((reqSkill) => {
      const lower = reqSkill.toLowerCase();
      const hasMatch = normalizedStudentSkills.some(
        (stSkill: string) => stSkill.includes(lower) || lower.includes(stSkill)
      );
      if (hasMatch) {
        existingSkillsMatched.push(reqSkill);
      } else {
        missingSkillNames.push(reqSkill);
      }
    });

    const ai = getGenAI();
    let missingSkillsDetails: MissingSkillDetail[] = [];

    if (ai && missingSkillNames.length > 0) {
      const prompt = `You are a skill gap analysis engine for CAREER DEFINER.
Target Career Role: "${jobTitle}"
Student Existing Skills: ${studentSkills.join(', ') || 'None declared'}
Missing Skills Required: ${missingSkillNames.join(', ')}

For each missing skill, produce a concrete structured recommendation.
Return strictly valid JSON with no markdown wrapping:
[
  {
    "skill": "Name of missing skill",
    "priority": "HIGH" | "MEDIUM" | "RECOMMENDED",
    "explanation": "Concrete explanation of how this skill is used in ${jobTitle}",
    "whyImportant": "Why employers or government recruiting commissions evaluate this skill",
    "suggestedLearningTopics": ["Topic 1", "Topic 2", "Topic 3"],
    "practiceActivity": "One actionable hands-on practice activity or mini-project to build this skill",
    "relatedJobs": ["Related Role 1", "Related Role 2"]
  }
]`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let text = response.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        missingSkillsDetails = JSON.parse(text);
      } catch (e) {
        console.warn('AI skill gap parsing failed, using rule-based synthesis:', e);
      }
    }

    // Fallback if AI was unavailable or had empty details
    if (!missingSkillsDetails.length) {
      missingSkillsDetails = missingSkillNames.map((skill, idx) => ({
        skill,
        priority: idx === 0 ? 'HIGH' : idx < 3 ? 'MEDIUM' : 'RECOMMENDED',
        explanation: `Essential skill for ${jobTitle} to ensure operational proficiency and accurate task delivery.`,
        whyImportant: `Recruiters and selection boards evaluate ${skill} during technical and practical screening.`,
        suggestedLearningTopics: [`${skill} Fundamentals`, `Applied ${skill} Workflows`, `Industry Best Practices`],
        practiceActivity: `Complete a 3-hour self-paced practical exercise implementing ${skill} in a simulated scenario.`,
        relatedJobs: [jobTitle, 'Associate Specialist'],
      }));
    }

    res.json({
      success: true,
      targetRole: jobTitle,
      existingSkills: existingSkillsMatched,
      skillsYouNeed: targetRequiredSkills,
      missingSkills: missingSkillsDetails,
      readinessPercentage: Math.round(
        (existingSkillsMatched.length / Math.max(targetRequiredSkills.length, 1)) * 100
      ),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Skill gap analysis failed', error: err.message });
  }
});

// ==========================================
// STUDENT SAVED ROADMAP PROGRESS (PROTECTED)
// ==========================================

router.use(authenticateToken as any);

// Get student all saved roadmaps
router.get('/student/all', (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getStudentAllRoadmaps(req.user!.id);
    res.json({ success: true, count: list.length, roadmaps: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch student roadmaps', error: err.message });
  }
});

// Get single student roadmap progress
router.get('/student/:roadmapId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const progress = db.getStudentRoadmapProgress(req.user!.id, req.params.roadmapId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'No saved progress for this roadmap' });
    }
    res.json({ success: true, progress });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch roadmap progress', error: err.message });
  }
});

// Save or update student progress
router.post('/student/save', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      roadmapId,
      careerTitle,
      durationMonths = 3,
      completedTasks = [],
      completedModules = [],
      notes = '',
      progressPercentage = 0,
      currentStage = 'Getting Started',
      customGoal,
      existingSkills = [],
      skillsYouNeed = [],
      missingSkills = [],
    } = req.body;

    if (!roadmapId || !careerTitle) {
      return res.status(400).json({ success: false, message: 'roadmapId and careerTitle are required' });
    }

    const saved = db.saveStudentRoadmapProgress({
      id: `std_rdmp_${req.user!.id}_${roadmapId}`,
      userId: req.user!.id,
      roadmapId,
      careerTitle,
      durationMonths: Number(durationMonths) as any,
      completedTasks,
      completedModules,
      notes,
      progressPercentage: Math.min(100, Math.max(0, Number(progressPercentage))),
      currentStage,
      customGoal,
      existingSkills,
      skillsYouNeed,
      missingSkills,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Roadmap progress saved successfully', progress: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save roadmap progress', error: err.message });
  }
});

// Delete saved roadmap
router.delete('/student/:roadmapId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = db.deleteStudentRoadmap(req.user!.id, req.params.roadmapId);
    res.json({ success: true, deleted, message: deleted ? 'Roadmap removed from your profile' : 'Not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete roadmap', error: err.message });
  }
});

export default router;
