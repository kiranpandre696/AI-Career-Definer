import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { GoogleGenAI } from '@google/genai';
import { verifyToken } from '../auth.ts';
import { Job, Examination, CareerRoadmap, StudentProfile, StudentResumeAnalysis } from '../types.ts';

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

// Optional auth helper to enrich context with logged-in user profile & confirmed resume
function getOptionalUserId(req: Request): string | null {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  if (typeof authHeader !== 'string') return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// ==========================================
// CONTROLLED RETRIEVAL FUNCTIONS
// ==========================================

export function searchGovernmentJobs(params: {
  query?: string;
  qualification?: string;
  state?: string;
  limit?: number;
}): Job[] {
  const allJobs = db.getJobs().filter((j) => j.jobType === 'GOVERNMENT');
  const q = (params.query || '').toLowerCase();
  const qual = (params.qualification || '').toLowerCase();
  const state = (params.state || '').toLowerCase();

  return allJobs
    .filter((j) => {
      let match = true;
      if (q) {
        const text = `${j.title} ${j.department} ${j.qualification} ${j.branch || ''} ${j.description}`.toLowerCase();
        if (!text.includes(q)) match = false;
      }
      if (qual && j.qualification && !j.qualification.toLowerCase().includes(qual) && !qual.includes(j.qualification.toLowerCase())) {
        match = false;
      }
      if (state && j.category === 'STATE' && j.stateId && !j.stateId.toLowerCase().includes(state)) {
        match = false;
      }
      return match;
    })
    .slice(0, params.limit || 5);
}

export function searchPrivateJobs(params: {
  query?: string;
  qualification?: string;
  skills?: string[];
  limit?: number;
}): Job[] {
  const allJobs = db.getJobs().filter((j) => j.jobType === 'PRIVATE');
  const q = (params.query || '').toLowerCase();

  return allJobs
    .filter((j) => {
      let match = true;
      if (q) {
        const text = `${j.title} ${j.companyName || ''} ${(j as any).industry || ''} ${j.skillsRequired?.join(' ') || ''} ${j.qualification}`.toLowerCase();
        if (!text.includes(q)) match = false;
      }
      return match;
    })
    .slice(0, params.limit || 5);
}

export function getExamDetails(idOrName: string): Examination | undefined {
  const exams = db.getExaminations();
  const q = idOrName.toLowerCase();
  return exams.find(
    (e) => e.id === idOrName || e.name.toLowerCase().includes(q) || (e.shortName && e.shortName.toLowerCase().includes(q))
  );
}

export function getExamSyllabus(examId: string) {
  const tree = db.getSyllabusTree(examId);
  const subjectTopics = tree.map((sub) => ({
    subject: sub.name,
    topics: (sub.topics || []).map((t) => t.name),
  }));
  return subjectTopics;
}

export function getCareerRoadmap(sectorOrId: string): CareerRoadmap | undefined {
  const roadmaps = db.getRoadmaps();
  const q = sectorOrId.toLowerCase();
  return roadmaps.find((r) => r.id === sectorOrId || r.sector.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
}

export function getWebsiteNavigationInfo() {
  return [
    { title: 'Home', path: '/', description: 'Career Definer main landing and gateway portal' },
    { title: 'Government Jobs', path: '/government-jobs', description: 'Central & State Government jobs with verified notices' },
    { title: 'Central Government Jobs', path: '/central-government', description: 'UPSC, SSC, Railways, Banking, Defense jobs' },
    { title: 'State Government Jobs', path: '/state-government', description: 'State PSC and department recruitment across 28+ states' },
    { title: 'Private Jobs', path: '/private-jobs', description: 'Industry and corporate openings across technology, banking, core' },
    { title: 'AI Resume Scanner', path: '/student/resume-matcher', description: 'Multi-page document OCR, quality check, and job matching' },
    { title: 'AI Career Roadmap', path: '/career-roadmap', description: 'Milestone-based roadmaps for government & corporate domains' },
    { title: 'Government Exam Preparation', path: '/exam-prep', description: 'Official syllabus, previous year questions, and practice mock tests' },
    { title: 'Examinations Directory', path: '/examinations', description: 'Complete catalog of UPSC, SSC, State PSC exams and eligibility' },
    { title: 'AI Mock Interview', path: '/student/mock-interview', description: 'Real-time AI behavioral and technical interview practice' },
    { title: 'Candidate Portal & Saved Jobs', path: '/student/portal', description: 'Manage student profile, saved jobs, and test attempts' },
    { title: 'Settings', path: '/settings', description: 'Language and display preferences' },
    { title: 'Help & Support', path: '/help', description: 'FAQs and guidance on using Career Definer' },
    { title: 'About Career Definer', path: '/about', description: 'Mission and platform details' },
  ];
}

// ==========================================
// SPECIALIZED CATEGORY ROUTING
// ==========================================

export type CareerCategory =
  | 'Career Guidance'
  | 'Government Jobs'
  | 'Private Jobs'
  | 'Resume Analysis'
  | 'Career Roadmap'
  | 'Government Exam Preparation'
  | 'AI Mock Interview'
  | 'Website Navigation'
  | 'Skill Development'
  | 'General Education Guidance'
  | 'Non-Career';

export function routeQuestionCategory(query: string): CareerCategory {
  const q = query.toLowerCase();

  // Out of scope detection
  const nonCareerKeywords = [
    'recipe', 'cook', 'cooking', 'movie', 'actor', 'cricket score', 'football score',
    'joke', 'weather', 'song', 'lyrics', 'restaurant', 'astrology', 'horoscope',
    'dating', 'fashion trend', 'crypto trading', 'casino', 'betting'
  ];
  if (nonCareerKeywords.some((nk) => q.includes(nk))) {
    return 'Non-Career';
  }

  if (q.includes('navigate') || q.includes('where is') || q.includes('how do i find') || q.includes('page') || q.includes('how to go to') || q.includes('website link') || q.includes('open')) {
    return 'Website Navigation';
  }
  if (q.includes('resume') || q.includes('cv') || q.includes('ocr') || q.includes('scan resume') || q.includes('upload resume') || q.includes('extract details')) {
    return 'Resume Analysis';
  }
  if (q.includes('roadmap') || q.includes('pathway') || q.includes('step by step') || q.includes('phases') || q.includes('milestone')) {
    return 'Career Roadmap';
  }
  if (q.includes('interview') || q.includes('mock interview') || q.includes('hr question') || q.includes('technical interview') || q.includes('introduce yourself')) {
    return 'AI Mock Interview';
  }
  if (q.includes('syllabus') || q.includes('exam pattern') || q.includes('mock test') || q.includes('question paper') || q.includes('pyq') || q.includes('prep') || q.includes('examination') || q.includes('upsc') || q.includes('ssc') || q.includes('ibps') || q.includes('rrb') || q.includes('appsc') || q.includes('tspsc') || q.includes('bpsc') || q.includes('mppsc')) {
    return 'Government Exam Preparation';
  }
  if (q.includes('govt job') || q.includes('government job') || q.includes('sarkari') || q.includes('public sector') || q.includes('central govt') || q.includes('state govt') || q.includes('gazette') || q.includes('vacancy')) {
    return 'Government Jobs';
  }
  if (q.includes('private job') || q.includes('it job') || q.includes('corporate') || q.includes('software engineer') || q.includes('startup') || q.includes('company') || q.includes('mnc') || q.includes('off campus')) {
    return 'Private Jobs';
  }
  if (q.includes('skill') || q.includes('learn') || q.includes('course') || q.includes('certification') || q.includes('swayam') || q.includes('nptel') || q.includes('programming') || q.includes('python') || q.includes('java')) {
    return 'Skill Development';
  }
  if (q.includes('after 10th') || q.includes('after 12th') || q.includes('after graduation') || q.includes('after btech') || q.includes('higher studies') || q.includes('college') || q.includes('degree') || q.includes('diploma') || q.includes('course selection')) {
    return 'General Education Guidance';
  }

  return 'Career Guidance';
}

// Action button generator based on question & category
function getActionButtonsForCategory(category: CareerCategory, query: string): Array<{ label: string; path: string }> {
  const buttons: Array<{ label: string; path: string }> = [];

  switch (category) {
    case 'Government Exam Preparation':
      buttons.push({ label: 'Open Government Exam Preparation', path: '/exam-prep' });
      buttons.push({ label: 'Explore Examinations Directory', path: '/examinations' });
      break;
    case 'Resume Analysis':
      buttons.push({ label: 'Open AI Resume Scanner', path: '/student/resume-matcher' });
      buttons.push({ label: 'View Recommended Jobs', path: '/student/resume-matcher' });
      buttons.push({ label: 'Update My Profile', path: '/student/portal' });
      break;
    case 'Government Jobs':
      buttons.push({ label: 'Explore Government Jobs', path: '/government-jobs' });
      buttons.push({ label: 'Central Government Jobs', path: '/central-government' });
      buttons.push({ label: 'State Government Jobs', path: '/state-government' });
      break;
    case 'Private Jobs':
      buttons.push({ label: 'Explore Private Jobs', path: '/private-jobs' });
      buttons.push({ label: 'Upload Resume for Job Matching', path: '/student/resume-matcher' });
      break;
    case 'Career Roadmap':
      buttons.push({ label: 'View Career Roadmaps', path: '/career-roadmap' });
      buttons.push({ label: 'Exam Preparation', path: '/exam-prep' });
      break;
    case 'AI Mock Interview':
      buttons.push({ label: 'Start AI Mock Interview', path: '/student/mock-interview' });
      buttons.push({ label: 'Practice Questions', path: '/exam-prep' });
      break;
    case 'Website Navigation':
      buttons.push({ label: 'Government Jobs', path: '/government-jobs' });
      buttons.push({ label: 'Private Jobs', path: '/private-jobs' });
      buttons.push({ label: 'AI Resume Scanner', path: '/student/resume-matcher' });
      buttons.push({ label: 'Exam Preparation', path: '/exam-prep' });
      break;
    case 'Skill Development':
      buttons.push({ label: 'AI Resume Scanner', path: '/student/resume-matcher' });
      buttons.push({ label: 'Career Roadmaps', path: '/career-roadmap' });
      break;
    case 'General Education Guidance':
    case 'Career Guidance':
    default:
      buttons.push({ label: 'Explore Government Jobs', path: '/government-jobs' });
      buttons.push({ label: 'AI Career Roadmap', path: '/career-roadmap' });
      buttons.push({ label: 'AI Resume Scanner', path: '/student/resume-matcher' });
      break;
  }

  return buttons.slice(0, 3);
}

// Redirect message for non-career queries
function getNonCareerRedirect(lang: string) {
  if (lang === 'te') {
    return {
      text: 'నేను కెరీర్ డిఫైనర్ AI కెరీర్ అసిస్టెంట్‌ని. నేను విద్య, కెరీర్, ఉద్యోగాలు మరియు పరీక్షల తయారీకి సంబంధించిన ప్రశ్నలకు సహాయం చేస్తాను. దయచేసి కెరీర్‌కు సంబంధించిన ప్రశ్న అడగండి.',
      audioSummary: 'నేను కెరీర్ డిఫైనర్ AI కెరీర్ అసిస్టెంట్‌ని. నేను విద్య, కెరీర్, ఉద్యోగాలు మరియు పరీక్షల తయారీకి సహాయం చేస్తాను. దయచేసి కెరీర్‌కు సంబంధించిన ప్రశ్న అడగండి.',
    };
  }
  if (lang === 'hi') {
    return {
      text: 'मैं करियर डिफाइनर का AI करियर असिस्टेंट हूँ। मैं शिक्षा, करियर, नौकरी और परीक्षा की तैयारी से संबंधित प्रश्नों में मदद करता हूँ। कृपया करियर से जुड़ा प्रश्न पूछें।',
      audioSummary: 'मैं करियर डिफाइनर का AI करियर असिस्टेंट हूँ। मैं शिक्षा, करियर, नौकरी और परीक्षा की तैयारी में मदद करता हूँ। कृपया करियर से जुड़ा प्रश्न पूछें।',
    };
  }
  return {
    text: "I am Career Definer's AI Career Assistant. I mainly help with education, careers, jobs, and exam preparation. Please ask me a career-related question.",
    audioSummary: "I am Career Definer's AI Career Assistant. I mainly help with education, careers, jobs, and exam preparation. Please ask me a career-related question.",
  };
}

/**
 * POST /api/voice-assistant/ask
 * AI Voice Career Assistant with 10 specialized categories, website knowledge,
 * controlled database retrieval, multilingual STT/TTS support, and navigation buttons.
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { message, language = 'en', studentProfile } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message query is required' });
    }

    const userId = getOptionalUserId(req);
    const profile: StudentProfile | null = studentProfile || (userId ? db.getProfileByUserId(userId) : null);
    const confirmedResume: StudentResumeAnalysis | undefined = userId ? db.getResumeByUserId(userId) : undefined;

    // 1. Detect Category
    const category = routeQuestionCategory(message);

    // 2. Strict Scope Boundary
    if (category === 'Non-Career') {
      const redirect = getNonCareerRedirect(language);
      return res.json({
        success: true,
        category,
        text: redirect.text,
        audioSummary: redirect.audioSummary,
        matchedJobs: [],
        matchedExams: [],
        actionButtons: [
          { label: 'Explore Government Jobs', path: '/government-jobs' },
          { label: 'AI Resume Scanner', path: '/student/resume-matcher' },
          { label: 'Exam Preparation', path: '/exam-prep' },
        ],
        language,
      });
    }

    // 3. Controlled Database Retrieval
    const matchedGovtJobs = searchGovernmentJobs({
      query: message,
      qualification: profile?.highestQualification || confirmedResume?.highestQualification,
      state: profile?.state || confirmedResume?.state,
      limit: 3,
    });

    const matchedPrivateJobs = searchPrivateJobs({
      query: message,
      qualification: profile?.highestQualification || confirmedResume?.highestQualification,
      limit: 3,
    });

    const combinedMatchedJobs = [...matchedGovtJobs, ...matchedPrivateJobs].slice(0, 4);

    // Examinations retrieval
    const allExams = db.getExaminations();
    const queryLower = message.toLowerCase();
    const matchedExams = allExams
      .filter((e) => {
        return (
          e.name.toLowerCase().includes(queryLower) ||
          (e.shortName && e.shortName.toLowerCase().includes(queryLower)) ||
          (e.qualification && queryLower.includes(e.qualification.toLowerCase()))
        );
      })
      .slice(0, 3);

    // Syllabus context if user asks about a specific exam
    let syllabusContext = '';
    if (matchedExams.length > 0) {
      const examSyllabus = getExamSyllabus(matchedExams[0].id);
      if (examSyllabus.length > 0) {
        syllabusContext = `Exam Syllabus for ${matchedExams[0].name}: ${examSyllabus.map(s => `${s.subject} (${s.topics.slice(0, 3).join(', ')})`).join('; ')}`;
      }
    }

    // Action buttons for website navigation
    const actionButtons = getActionButtonsForCategory(category, message);

    // Student background context
    const studentContextParts: string[] = [];
    if (profile) {
      studentContextParts.push(`Name: ${profile.fullName || 'Candidate'}, Qualification: ${profile.highestQualification || 'Graduation'}, Branch: ${profile.branchStream || profile.branch || 'General'}, State: ${profile.state || 'India'}`);
    }
    if (confirmedResume) {
      studentContextParts.push(`Confirmed Resume: Skills: ${confirmedResume.technicalSkills.slice(0, 5).join(', ')}, Degree: ${confirmedResume.degree}, Career Interests: ${confirmedResume.careerInterests}`);
    }
    const studentContext = studentContextParts.length > 0 ? studentContextParts.join(' | ') : 'Aspirant seeking career guidance';

    // Website navigation directory
    const websiteNav = getWebsiteNavigationInfo();

    const ai = getGenAI();
    const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];

    if (ai) {
      const languageInstructions: Record<string, string> = {
        te: `You MUST reply in fluent, grammatically pure, natural TELUGU (తెలుగు లిపి). Provide clear, supportive, and practical career guidance for Indian students. Use Telugu script for the entire response. Include common exam abbreviations like (UPSC, SSC, IBPS, RRB) in brackets where helpful. Do NOT use fake recruitment dates.`,
        hi: `You MUST reply in fluent, natural HINDI (हिंदी देवनागरी लिपि). Provide clear, encouraging, and actionable career guidance for Indian students. Use Devanagari script for the entire response. Include exam acronyms like (UPSC, SSC, IBPS, RRB) in brackets where helpful. Do NOT use fake recruitment dates.`,
        en: `You MUST reply in fluent, professional, supportive ENGLISH. Provide structured, practical career guidance tailored to Indian students, government examinations, and corporate recruitment.`,
      };

      const langRule = languageInstructions[language] || languageInstructions.en;

      const prompt = `
You are the Official Specialized AI Voice Career Assistant for "CAREER DEFINER" (an Indian Smart Career Guidance & Job Discovery Platform).

User Query: "${message}"
Detected Category: "${category}"
Target Language: "${language}"
${langRule}

CONTEXT FROM REAL WEBSITE DATABASE:
- Student Context: ${studentContext}
- Matched Real Jobs in DB: ${combinedMatchedJobs.map(j => `"${j.title}" (${j.jobType}, Org/Company: ${j.department || j.companyName}, Qual: ${j.qualification})`).join('; ') || 'General jobs available across sectors'}
- Matched Real Exams in DB: ${matchedExams.map(e => `"${e.name} (${e.shortName})"`).join('; ') || 'UPSC Civil Services, SSC CGL, IBPS PO, RRB NTPC'}
- ${syllabusContext || 'Standard examination patterns include General Studies, Aptitude, Reasoning, and Domain Knowledge.'}
- Website Sections & Links: ${websiteNav.map(n => `${n.title} (${n.path})`).join('; ')}

GUIDELINES:
1. Ground your advice in REAL career opportunities, educational eligibility, and official examination structures.
2. If the user asks about website features or navigation, guide them directly to the exact Career Definer section (e.g. AI Resume Scanner at /student/resume-matcher, Exam Preparation at /exam-prep, Government Jobs at /government-jobs).
3. Do NOT invent dates or fake recruitment notifications.
4. Structure the text with a clear, engaging heading and bullet points in Markdown.
5. Provide an "audioSummary": a natural, spoken 2 to 4 sentence summary in the SAME language (${language}) that will be read aloud through Text-To-Speech. It must sound conversational, clear, motivating, and fluent. DO NOT include greetings like "Welcome to Career Definer". Answer the user's question directly.

Output Format: Return ONLY a valid JSON object matching:
{
  "text": "Detailed structured answer in markdown format in ${language}...",
  "audioSummary": "2-4 sentences spoken audio summary in ${language}..."
}
      `.trim();

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });

          const raw = response.text || '';
          const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);

          if (parsed.text && parsed.text.trim()) {
            return res.json({
              success: true,
              category,
              text: parsed.text,
              audioSummary: parsed.audioSummary || parsed.text.slice(0, 200),
              matchedJobs: combinedMatchedJobs,
              matchedExams,
              actionButtons,
              language,
            });
          }
        } catch (geminiErr: any) {
          console.warn(`Voice assistant model ${modelName} notice:`, geminiErr.message || geminiErr);
        }
      }
    }

    // Curated domain-aware fallback (NEVER generic welcome message)
    const fallback = getCuratedVoiceResponse(message, category, language, combinedMatchedJobs, matchedExams, profile, confirmedResume);

    return res.json({
      success: true,
      category,
      text: fallback.text,
      audioSummary: fallback.audioSummary,
      matchedJobs: combinedMatchedJobs,
      matchedExams,
      actionButtons,
      language,
    });
  } catch (error: any) {
    console.error('Voice Assistant API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice query',
      error: error.message,
    });
  }
});

function getCuratedVoiceResponse(
  query: string,
  category: CareerCategory,
  lang: string,
  matchedJobs: Job[],
  matchedExams: Examination[],
  profile?: StudentProfile | null,
  confirmedResume?: StudentResumeAnalysis
) {
  const q = query.toLowerCase();

  // B.Com / Commerce queries
  if (q.includes('b.com') || q.includes('bcom') || q.includes('commerce') || q.includes('accounts') || q.includes('accounting')) {
    if (lang === 'te') {
      return {
        text: `### B.Com గ్రాడ్యుయేట్లకు ప్రభుత్వ ఉద్యోగ అవకాశాలు\n\nమీరు **B.Com** పూర్తి చేసినట్లయితే మీకు బ్యాంకింగ్, అకౌంటింగ్ మరియు ప్రభుత్వ పరిపాలనా రంగాలలో అద్భుతమైన ప్రభుత్వ ఉద్యోగాలు ఉన్నాయి:\n\n1. **బ్యాంకింగ్ రిక్రూట్‌మెంట్ (IBPS & SBI):**\n   * **IBPS PO / Clerk & SBI PO / Clerk:** వాణిజ్య విద్యార్థులకు ఫైనాన్షియల్ అవేర్‌నెస్ మరియు న్యూమరికల్ ఎబిలిటీలో ఉన్న పట్టు వల్ల బ్యాంక్ పరీక్షల్లో అత్యధిక అవకాశాలు ఉంటాయి.\n   * **RBI అసిస్టెంట్ & గ్రేడ్-B ఆఫీసర్:** రిజర్వ్ బ్యాంక్ ఆఫ్ ఇండియాలో అత్యున్నత కెరీర్.\n\n2. **స్టాఫ్ సెలక్షన్ కమిషన్ (SSC CGL):**\n   * **అసిస్టెంట్ ఆడిట్ ఆఫీసర్ (AAO) & అసిస్టెంట్ అకౌంట్స్ ఆఫీసర్:** B.Com డిగ్రీ ఉన్నవారికి అత్యంత ప్రతిష్టాత్మకమైన గెజిటెడ్ పోస్టులు.\n   * **జూనియర్ స్టాటిస్టికల్ ఆఫీసర్ (JSO) & టాక్స్ అసిస్టెంట్ (CBDT/CBIC).**\n\n3. **రైల్వే రిక్రూట్‌మెంట్ బోర్డ్ (RRB NTPC):**\n   * జూనియర్ అకౌంట్స్ అసిస్టెంట్ కమ్ టైపిస్ట్, సీనియర్ కమర్షియల్ కమ్ టికెట్ క్లర్క్.\n\n4. **రాష్ట్ర పబ్లిక్ సర్వీస్ కమిషన్ (APPSC / TSPSC):**\n   * గ్రూప్ 1, గ్రూప్ 2 అసిస్టెంట్ కమర్షియల్ టాక్స్ ఆఫీసర్ (ACTO), సబ్-ట్రెజరీ ఆఫీసర్.\n\n*సిఫార్సు:* ఈ పరీక్షల పూర్తి సిలబస్ మరియు మోడల్ పేపర్స్ కోసం మా పోర్టల్‌లోని **Exam Preparation** విభాగాన్ని సందర్శించండి.`,
        audioSummary: `B.Com పూర్తి చేసిన వారికి IBPS మరియు SBI బ్యాంక్ ఆఫీసర్, SSC CGL ఆడిట్ ఆఫీసర్ మరియు రైల్వే అకౌంట్స్ అసిస్టెంట్ ఉద్యోగాలు ఉత్తమమైనవి. మా పోర్టల్‌లోని ఎగ్జామ్ ప్రిపరేషన్ విభాగంలో పూర్తి సిలబస్ చూడవచ్చు.`,
      };
    }
    if (lang === 'hi') {
      return {
        text: `### B.Com स्नातकों के लिए प्रमुख सरकारी नौकरियां\n\n**B.Com** पूरा करने के बाद आपके पास बैंकिंग, वित्त और सरकारी लेखा विभागों में शीर्ष अवसर हैं:\n\n1. **बैंकिंग क्षेत्र (IBPS & SBI):**\n   * IBPS PO/Clerk, SBI PO/Clerk और RBI असिस्टेंट पद वाणिज्य छात्रों के लिए सर्वश्रेष्ठ हैं।\n\n2. **कर्मचारी चयन आयोग (SSC CGL):**\n   * असिस्टेंट ऑडिट ऑफिसर (AAO) और असिस्टेंट अकाउंट्स ऑफिसर (राजपत्रित पद)।\n   * टैक्स असिस्टेंट (CBDT और CBIC) तथा अकाउंटेंट।\n\n3. **रेलवे (RRB NTPC):**\n   * जूनियर अकाउंट्स असिस्टेंट और सीनियर कमर्शियल क्लर्क।\n\n4. **राज्य लोक सेवा आयोग:**\n   * राज्य ट्रेजरी और वाणिज्यिक कर अधिकारी पद।\n\n*सलाह:* परीक्षा पैटर्न और सिलेबस के लिए पोर्टल के **Exam Preparation** अनुभाग का उपयोग करें।`,
        audioSummary: `B.Com स्नातकों के लिए IBPS और SBI बैंक पीओ, SSC CGL में असिस्टेंट ऑडिट ऑफिसर और रेलवे अकाउंट्स क्लर्क की सरकारी नौकरियां सबसे उपयुक्त हैं।`,
      };
    }
    return {
      text: `### Government Job Opportunities for B.Com Graduates\n\nWith a **B.Com** degree, your background in accounting, economics, and business equips you for several high-ranking government roles:\n\n1. **Banking Examinations (IBPS & SBI):**\n   * **IBPS PO / Clerk & SBI PO / Clerk:** Direct entry into public sector banking with favorable aptitude alignment.\n   * **RBI Assistant & RBI Grade B:** High-prestige central banking careers.\n\n2. **Staff Selection Commission (SSC CGL):**\n   * **Assistant Audit Officer (AAO) & Assistant Accounts Officer:** The highest-paying Group 'B' Gazetted posts in SSC CGL.\n   * **Tax Assistant (CBDT/CBIC) & Junior Statistical Officer (JSO).**\n\n3. **Railway Recruitment Board (RRB NTPC):**\n   * Junior Accounts Assistant cum Typist, Senior Commercial Clerk.\n\n4. **State Public Service Commissions (APPSC, TSPSC, BPSC, etc.):**\n   * Assistant Commercial Tax Officer (ACTO), Sub-Treasury Officer, Divisional Accounts Officer.\n\n*Recommended Step:* Explore syllabus and mock tests in our **Exam Preparation** (/exam-prep) section.`,
      audioSummary: `For B.Com graduates, prime government opportunities include IBPS and SBI Bank PO, SSC CGL Assistant Audit Officer, and Railway Accounts positions. You can explore these syllabi in our Exam Prep section.`,
    };
  }

  // 10th Pass / Secondary queries
  if (q.includes('10th') || q.includes('ssc pass') || q.includes('matriculation') || q.includes('10 va')) {
    if (lang === 'te') {
      return {
        text: `### 10వ తరగతి అర్హతతో ప్రభుత్వ ఉద్యోగాలు\n\n10వ తరగతి ఉత్తీర్ణులైన విద్యార్థులకు అందుబాటులో ఉన్న ముఖ్య ప్రభుత్వ ఉద్యోగ రంగాలు:\n\n1. **SSC MTS & హవల్దార్:** కేంద్ర ప్రభుత్వ మంత్రిత్వ శాఖలలో మల్టీ టాస్కింగ్ స్టాఫ్.\n2. **రైల్వే రిక్రూట్‌మెంట్ సెల్ (RRC Group D):** ట్రాక్ మెయింటెనెన్స్, అసిస్టెంట్ పాయింట్స్‌మెన్.\n3. **ఇండియా పోస్ట్ GDS (గ్రామీణ డాక్ సేవక్):** బ్రాంచ్ పోస్ట్ మాస్టర్ (పరీక్ష లేకుండా 10వ తరగతి మార్కుల ఆధారంగా ఎంపిక).\n4. **డిఫెన్స్ సర్వీసెస్:** ఇండియన్ ఆర్మీ అగ్నివీర్ జనరల్ డ్యూటీ (GD), నేవీ MR.\n5. **రాష్ట్ర పోలీస్ కానిస్టేబుల్:** అర్హత వయస్సు మరియు ఫిజికల్ టెస్టుల ఆధారంగా.`,
        audioSummary: `10వ తరగతి అర్హతతో SSC MTS, రైల్వే గ్రూప్ D, ఇండియా పోస్ట్ GDS మరియు ఇండియన్ ఆర్మీ అగ్నివీర్ ఉద్యోగాలు అందుబాటులో ఉన్నాయి.`,
      };
    }
    if (lang === 'hi') {
      return {
        text: `### 10वीं पास के लिए प्रमुख सरकारी नौकरियां\n\n1. **SSC MTS एवं हवलदार:** केंद्र सरकार के विभिन्न मंत्रालयों में पद।\n2. **रेलवे ग्रुप D (RRC Group D):** रेलवे में 1 लाख से अधिक रिक्तियां।\n3. **इंडिया पोस्ट GDS:** बिना परीक्षा 10वीं मेरिट पर चयन।\n4. **सेना भर्ती:** भारतीय सेना अग्निवीर जनरल ड्यूटी।\n5. **राज्य पुलिस कांस्टेबल:** फिजिकल टेस्ट और लिखित परीक्षा।`,
        audioSummary: `10वीं पास उम्मीदवारों के लिए SSC MTS, रेलवे ग्रुप D, इंडिया पोस्ट GDS और आर्मी अग्निवीर मुख्य सरकारी अवसर हैं।`,
      };
    }
    return {
      text: `### Government Jobs for 10th Pass Candidates\n\n1. **SSC MTS & Havaldar:** Central government ministries multi-tasking staff.\n2. **Railway Group D (RRC):** Track maintainer, helper, pointsman.\n3. **India Post GDS:** Merit-based direct recruitment without written examination.\n4. **Defence Services:** Indian Army Agniveer GD, Indian Navy MR.\n5. **State Police:** Constable and Home Guard positions.`,
      audioSummary: `Top government jobs for 10th pass candidates include SSC MTS, Railway Group D, India Post GDS, and Indian Army Agniveer recruitment.`,
    };
  }

  // 12th Pass / Intermediate queries
  if (q.includes('12th') || q.includes('intermediate') || q.includes('inter pass') || q.includes('10+2')) {
    if (lang === 'te') {
      return {
        text: `### 12వ తరగతి / ఇంటర్మీడియట్ విద్యార్థులకు కెరీర్ మార్గాలు\n\n1. **SSC CHSL:** లోయర్ డివిజన్ క్లర్క్ (LDC), జూనియర్ సెక్రటేరియట్ అసిస్టెంట్ (JSA), డాటా ఎంట్రీ ఆపరేటర్ (DEO).\n2. **నేషనల్ డిఫెన్స్ అకాడమీ (NDA):** ఆర్మీ, నేవీ, ఎయిర్‌ఫోర్స్‌లో లెఫ్టినెంట్ గ్రేడ్ కమిషన్డ్ ఆఫీసర్ పోస్టులు.\n3. **రైల్వే అసిస్టెంట్ లోకో పైలట్ (ALP) & టెక్నీషియన్:** MPC అర్హతతో.\n4. **డిఫెన్స్ ఎయిర్‌ఫోర్స్ అగ్నివీర్ వాయు:** నాన్-కమిషన్డ్ ఎయిర్‌మెన్ టెక్నికల్ మరియు నాన్-టెక్నికల్.\n5. **రాష్ట్ర పోలీస్ కానిస్టేబుల్ & ఫారెస్ట్ బీట్ ఆఫీసర్.**`,
        audioSummary: `ఇంటర్మీడియట్ పూర్తి చేసిన వారికి SSC CHSL, NDA రక్షణ దళాలు, రైల్వే అసిస్టెంట్ లోకో పైలట్ మరియు పోలీస్ కానిస్టేబుల్ ఉద్యోగాలు అందుబాటులో ఉన్నాయి.`,
      };
    }
    if (lang === 'hi') {
      return {
        text: `### 12वीं पास छात्रों के लिए सरकारी नौकरियां\n\n1. **SSC CHSL:** लोअर डिविजन क्लर्क (LDC) और डेटा एंट्री ऑपरेटर (DEO)।\n2. **NDA (UPSC):** भारतीय सेना, नौसेना और वायु सेना में ऑफिसर पद।\n3. **रेलवे ALP एवं टेक्नीशियन:** 10+2 गणित/भौतिकी उत्तीर्ण छात्रों हेतु।\n4. **अग्निवीर वायु एवं नेवी:** रक्षा सेवाओं में तकनीकी पद।\n5. **राज्य पुलिस कांस्टेबल भर्ती।**`,
        audioSummary: `12वीं उत्तीर्ण छात्रों के लिए SSC CHSL, UPSC NDA, रेलवे टेक्नीशियन और पुलिस कांस्टेबल प्रमुख अवसर हैं।`,
      };
    }
    return {
      text: `### Career Opportunities for 12th Pass Candidates\n\n1. **SSC CHSL:** LDC, JSA, and Data Entry Operator (DEO) in Central Ministries.\n2. **UPSC NDA:** Officer-cadre commissioning in Indian Army, Navy, and Air Force.\n3. **Railway Assistant Loco Pilot & Technician:** For 10+2 science/math backgrounds.\n4. **Agniveer Air Force & Navy:** Technical ground and flight duty trades.\n5. **State Police Constables & Stenographers.**`,
      audioSummary: `For 12th pass students, top opportunities include SSC CHSL, UPSC NDA, Railway ALP, and state police constable positions.`,
    };
  }

  // B.Tech / Engineering / CSE queries
  if (q.includes('b.tech') || q.includes('btech') || q.includes('engineering') || q.includes('cse') || q.includes('software')) {
    if (lang === 'te') {
      return {
        text: `### ఇంజనీరింగ్ / B.Tech అభ్యర్థులకు కెరీర్ అవకాశాలు\n\n1. **సాఫ్ట్‌వేర్ & ప్రైవేట్ టెక్నాలజీ రంగం:**\n   * ఫుల్ స్టాక్ డెవలప్‌మెంట్ (React, Node.js, Python), క్లౌడ్ (AWS/GCP), డేటా ఇంజనీరింగ్.\n   * మా పోర్టల్‌లోని **AI Resume Scanner** ద్వారా మీ టెక్నికల్ స్కిల్స్‌ను విశ్లేషించి ప్రైవేట్ ఉద్యోగాలకు సరిచూడండి.\n2. **GATE & PSU రిక్రూట్‌మెంట్:**\n   * ISRO, DRDO, IOCL, ONGC, NTPC, BHEL లో సైంటిస్ట్/ఇంజనీర్ ఉద్యోగాలు.\n3. **ప్రభుత్వ ఇంజనీరింగ్ సర్వీసెస్:**\n   * SSC JE (జూనియర్ ఇంజనీర్), RRB JE, APPSC/TSPSC అసిస్టెంట్ ఎగ్జిక్యూటివ్ ఇంజనీర్ (AEE).`,
        audioSummary: `B.Tech అభ్యర్థులకు ప్రైవేట్ సాఫ్ట్‌వేర్ సంస్థలు, గేట్ ద్వారా కేంద్ర ప్రభుత్వ PSUలు, అలాగే SSC JE మరియు రైల్వే ఇంజనీర్ ఉద్యోగాలు అందుబాటులో ఉన్నాయి.`,
      };
    }
    if (lang === 'hi') {
      return {
        text: `### B.Tech एवं इंजीनियरिंग छात्रों के लिए करियर विकल्प\n\n1. **निजी आईटी उद्योग:** सॉफ्टवेयर डेवलपमेंट, क्लाउड कंप्यूटिंग और डेटा साइंस।\n2. **GATE और PSU भर्तियां:** ISRO, DRDO, IOCL, NTPC में एग्जीक्यूटिव इंजीनियर।\n3. **सरकारी तकनीकी नौकरियां:** SSC JE, RRB JE और राज्य इंजीनियरिंग सेवाएं।`,
        audioSummary: `B.Tech स्नातकों के लिए निजी आईटी कंपनियों, GATE द्वारा PSU और SSC JE में शानदार अवसर उपलब्ध हैं।`,
      };
    }
    return {
      text: `### Career Tracks for B.Tech & Engineering Graduates\n\n1. **Software & Tech Careers:** Full-stack development, cloud architecture, and data engineering. Use our **AI Resume Scanner** to match your technical skills.\n2. **GATE & Public Sector Undertakings (PSUs):** Scientist/Engineer posts in ISRO, DRDO, IOCL, ONGC, and NTPC.\n3. **Government Engineering Cadres:** SSC JE, Railway RRB JE, and State Assistant Executive Engineer (AEE) examinations.`,
      audioSummary: `Engineering graduates can pursue private software engineering, PSU executive roles through GATE, and technical government posts like SSC JE and RRB JE.`,
    };
  }

  // Banking / Bank PO queries
  if (q.includes('bank') || q.includes('ibps') || q.includes('sbi')) {
    if (lang === 'te') {
      return {
        text: `### బ్యాంకింగ్ పరీక్షల పూర్తి గైడెన్స్ (IBPS & SBI)\n\nబ్యాంకింగ్ రంగంలో ఉద్యోగం సాధించడానికి ప్రిపరేషన్ ప్రణాళిక:\n\n1. **పరీక్షల విభాగాలు:**\n   * **ప్రిలిమ్స్:** క్వాంటిటేటివ్ ఆప్టిట్యూడ్ (35 Q), రీజనింగ్ ఎబిలిటీ (35 Q), ఇంగ్లీష్ లాంగ్వేజ్ (30 Q) - 60 నిమిషాలు.\n   * **మెయిన్స్:** రీజనింగ్ & కంప్యూటర్ ఆప్టిట్యూడ్, డేటా అనాలిసిస్ & ఇంటర్‌ప్రిటేషన్, జనరల్/బ్యాంకింగ్ అవేర్‌నెస్, ఇంగ్లీష్ డిస్క్రిప్టివ్ టెస్ట్.\n2. **ముఖ్యమైన చిట్కాలు:** రోజుకు కనీసం 2 స్పీడ్ మాక్ టెస్టులు సాధన చేయడం మరియు తాజా 6 నెలల బ్యాంకింగ్ కరెంట్ అఫైర్స్ చదవడం.\n3. **మా వెబ్‌సైట్ సౌకర్యం:** /exam-prep విభాగంలో బ్యాంకింగ్ సిలబస్ మరియు ప్రాక్టీస్ మాక్ టెస్టులు అందుబాటులో ఉన్నాయి.`,
        audioSummary: `బ్యాంకింగ్ పరీక్షల కోసం క్వాంట్స్, రీజనింగ్ మరియు తాజా బ్యాంకింగ్ అవేర్‌నెస్‌పై పట్టు సాధించాలి. మా ఎగ్జామ్ ప్రిపరేషన్ పేజీలో పూర్తి సిలబస్ అందుబాటులో ఉంది.`,
      };
    }
    return {
      text: `### Banking Examination Preparation Roadmap (IBPS / SBI PO & Clerk)\n\n1. **Structure:** Prelims (Quant, Reasoning, English - 100 marks) followed by Mains (Data Analysis, Reasoning, General/Banking Awareness, English Descriptive).\n2. **Key Focus Areas:** Speed calculation, puzzle solving, and regular study of the past 6 months of financial news.\n3. **Platform Resources:** Visit our **Exam Preparation** section (/exam-prep) for sectional breakdown and pattern details.`,
      audioSummary: `Banking exams require dedicated focus on Quantitative Aptitude, Logical Reasoning, and current banking awareness. Explore our Exam Prep section for detailed patterns.`,
    };
  }

  // SSC CGL queries
  if (q.includes('ssc') || q.includes('cgl')) {
    if (lang === 'te') {
      return {
        text: `### SSC CGL పరీక్షా విధానం మరియు సిలబస్ వివరాలు\n\nస్టాఫ్ సెలక్షన్ కమిషన్ (SSC CGL) కేంద్ర ప్రభుత్వ గ్రూప్ B మరియు గ్రూప్ C పోస్టుల కోసం నిర్వహించే అతిపెద్ద పరీక్ష:\n\n* **టైర్ 1 (కంప్యూటర్ బేస్డ్ టెస్ట్):** 100 ప్రశ్నలు (200 మార్కులు) - జనరల్ ఇంటెలిజెన్స్ (25), జనరల్ అవేర్‌నెస్ (25), క్వాంటిటేటివ్ ఆప్టిట్యూడ్ (25), ఇంగ్లీష్ కాంప్రహెన్షన్ (25).\n* **టైర్ 2:** గణిత శాస్త్రం, రీజనింగ్, ఇంగ్లీష్ లాంగ్వేజ్, జనరల్ స్టడీస్ మరియు కంప్యూటర్ నాలెడ్జ్ మాడ్యూల్.\n* **సిఫార్సు:** మా **Exam Preparation** (/exam-prep) విభాగంలో SSC CGL అధికారిక సిలబస్ మరియు గత ప్రశ్నపత్రాలు లభిస్తాయి.`,
        audioSummary: `SSC CGL లో టైర్ 1 మరియు టైర్ 2 పరీక్షలు ఉంటాయి. క్వాంట్స్, రీజనింగ్, జనరల్ అవేర్‌నెస్ మరియు ఇంగ్లీష్ ముఖ్యమైన విభాగాలు. పూర్తి సిలబస్ మా పోర్టల్‌లో అందుబాటులో ఉంది.`,
      };
    }
    return {
      text: `### SSC CGL Examination Architecture & Syllabus\n\n* **Tier 1:** 100 Questions (200 Marks) covering Reasoning (25), General Awareness (25), Quantitative Aptitude (25), and English (25).\n* **Tier 2:** Mathematics, Reasoning, English, General Awareness, and mandatory Computer Proficiency Module.\n* **Resource:** Access our full breakdown in the **Exam Preparation** section (/exam-prep).`,
      audioSummary: `SSC CGL evaluates Reasoning, Quantitative Aptitude, English, and General Awareness across two tiers. Detailed syllabus is available in our Exam Prep module.`,
    };
  }

  // Resume analysis / Resume Scanner queries
  if (q.includes('resume') || q.includes('cv') || q.includes('scanner') || q.includes('matcher')) {
    if (lang === 'te') {
      return {
        text: `### AI Resume Scanner ఫీచర్ వినియోగం\n\nమా పోర్టల్‌లోని **AI Resume Scanner** మీ కెరీర్‌కు ఎలా సహాయపడుతుంది:\n\n1. **కంప్లీట్ ఎక్స్‌ట్రాక్షన్:** మీ రెజ్యూమ్ PDF లేదా Word ఫైల్‌ను అప్‌లోడ్ చేసినప్పుడు, AI మీ విద్యార్హతలు, టెక్నికల్ స్కిల్స్, ప్రాజెక్టులు మరియు అనుభవాన్ని పూర్తి వివరాలతో సేకరిస్తుంది.\n2. **రివ్యూ & ఎడిట్:** ఎక్స్‌ట్రాక్ట్ చేసిన వివరాలు కరెక్ట్‌గా ఉన్నాయో లేదో మీరు పరిశీలించి అవసరమైతే మార్పులు చేసుకోవచ్చు.\n3. **ధృవీకరణ & జాబ్ మ్యాచింగ్:** మీరు వివరాలను ధృవీకరించిన వెంటనే, డేటాబేస్‌లోని ప్రభుత్వ మరియు ప్రైవేట్ ఉద్యోగాలతో అర్హత శాతాన్ని లెక్కించి రికమండ్ చేస్తుంది.\n\n*లింక్:* వెంటనే **AI Resume Scanner** (/student/resume-matcher) పేజీకి వెళ్లి మీ రెజ్యూమ్ అప్‌లోడ్ చేయండి.`,
        audioSummary: `మా AI Resume Scanner లో మీ రెజ్యూమ్ అప్‌లోడ్ చేసి వివరాలు సమీక్షించిన తర్వాత, మీ అర్హతకు తగిన ప్రభుత్వ మరియు ప్రైవేట్ ఉద్యోగ రికమండేషన్లు పొందవచ్చు.`,
      };
    }
    return {
      text: `### Utilizing the AI Resume Scanner\n\n1. **Multi-Page Document Analysis:** Upload your resume (PDF, DOCX, or text) to accurately extract education, skills, projects, and certifications without mock data.\n2. **Student Confirmation:** Review all extracted fields and edit any details before proceeding.\n3. **Verified Job Matching:** Once confirmed, the system matches your profile against active Government and Private opportunities.\n\n*Action:* Navigate to the **AI Resume Scanner** at \`/student/resume-matcher\`.`,
      audioSummary: `Upload your resume on our AI Resume Scanner page to extract and confirm your verified qualifications, then discover tailored government and private jobs.`,
    };
  }

  // Default structured career advisory
  if (lang === 'te') {
    return {
      text: `### కెరీర్ గైడెన్స్ మరియు అవకాశాల వివరాలు (${category})\n\nమీ ప్రశ్న **"${query}"** కు సంబంధించిన సమగ్ర సమాచారం:\n\n* **అర్హత ఆధారిత అవకాశాలు:** గ్రాడ్యుయేషన్, ఇంటర్ లేదా డిప్లొమా పూర్తి చేసిన విద్యార్థులకు కేంద్ర ప్రభుత్వంలో UPSC, SSC, IBPS, RRB మరియు రాష్ట్ర ప్రభుత్వ సర్వీసుల్లో పలు ఉద్యోగ అవకాశాలు ఉన్నాయి.\n* **సిద్ధం కావాల్సిన రంగాలు:** జనరల్ స్టడీస్, క్వాంటిటేటివ్ ఆప్టిట్యూడ్, రీజనింగ్ మరియు కమ్యూనికేషన్ స్కిల్స్ లో నైపుణ్యం సాధించండి.\n* **పోర్టల్ సేవలు:** మా **Government Jobs** విభాగంలో నోటిఫికేషన్లు, **AI Resume Scanner** ద్వారా వ్యక్తిగత ఉద్యోగ సరిపోలిక మరియు **Exam Prep** లో పూర్తి సిలబస్ పొందవచ్చు.`,
      audioSummary: `మీ కెరీర్ ప్రశ్నకు కేంద్ర మరియు రాష్ట్ర ప్రభుత్వ సర్వీసులు, అలాగే ప్రైవేట్ టెక్నాలజీ విభాగాల్లో చక్కని అవకాశాలు ఉన్నాయి. పూర్తి వివరాల కోసం మా జాబ్స్ మరియు ఎగ్జామ్ ప్రిపరేషన్ విభాగాలను సందర్శించండి.`,
    };
  }

  if (lang === 'hi') {
    return {
      text: `### करियर मार्गदर्शन एवं अवसर (${category})\n\nआपके प्रश्न **"${query}"** के संदर्भ में महत्वपूर्ण जानकारी:\n\n* **प्रमुख अवसर:** स्नातक और तकनीकी डिग्री धारकों के लिए UPSC, SSC, बैंकिंग और रेलवे में विभिन्न स्तरों पर भर्तियां उपलब्ध हैं।\n* **तैयारी रणनीति:** सामान्य अध्ययन, करंट अफेयर्स, रीजनिंग और मात्रात्मक योग्यता पर नियमित ध्यान केंद्रित करें।\n* **पोर्टल सुविधाएं:** **Government Jobs** अनुभाग में सत्यापित रिक्तियां और **AI Resume Scanner** में अपनी प्रोफाइल का मिलान देखें।`,
      audioSummary: `आपके प्रश्न के अनुसार विभिन्न सरकारी और निजी क्षेत्रों में कई करियर विकल्प उपलब्ध हैं। विस्तृत जानकारी के लिए हमारे जॉब्स और एग्जाम प्रेप अनुभाग देखें।`,
    };
  }

  return {
    text: `### Career Guidance & Opportunities (${category})\n\nRegarding **"${query}"**, here is the structured guidance:\n\n* **Key Avenues:** Depending on your qualification, competitive pathways include UPSC, Staff Selection Commission (SSC), Banking (IBPS/SBI), Railways (RRB), and corporate private technology hiring.\n* **Preparation Essentials:** Focus consistently on Quantitative Aptitude, Logical Reasoning, General Awareness, and domain fundamentals.\n* **Platform Features:** Explore active notifications in **Government Jobs** (/government-jobs) and analyze your resume in the **AI Resume Scanner** (/student/resume-matcher).`,
    audioSummary: `Based on your query, verified career opportunities exist in civil services, banking, railways, and technical sectors. Explore our Government Jobs and Exam Prep sections for complete details.`,
  };
}

export default router;
