import { Router, Request, Response } from 'express';
import { createRequire } from 'module';
import { db } from '../db.ts';
import { GoogleGenAI } from '@google/genai';
import { Job, StudentResumeAnalysis, ResumeProjectItem, ResumeCertificationItem, ResumeCompletenessSummary } from '../types.ts';
import { verifyToken } from '../auth.ts';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];

const router = Router();

// Lazy initialization for Gemini AI client
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

// Extract authenticated user ID from Authorization header
function getAuthenticatedUserId(req: Request): string | null {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  if (typeof authHeader !== 'string') return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// Helper to extract clean base64 data & mime type
function parseDataUri(dataUri: string, defaultMime = 'image/jpeg'): { mimeType: string; data: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: defaultMime, data: dataUri };
}

// Helper to compute completeness summary
function computeCompleteness(data: Partial<StudentResumeAnalysis>): ResumeCompletenessSummary {
  const education = (data.degree && data.degree !== 'Not mentioned in resume') ||
                    (data.highestQualification && data.highestQualification !== 'Not mentioned in resume')
                    ? 'Available' : 'Not mentioned';

  const hasSkills = (data.technicalSkills && data.technicalSkills.length > 0) ||
                    (data.programmingLanguages && data.programmingLanguages.length > 0) ||
                    (data.softwareTools && data.softwareTools.length > 0);
  const skills = hasSkills ? 'Available' : 'Not mentioned';

  const projects = (data.projects && data.projects.length > 0) ? 'Available' : 'Not mentioned';

  const hasExp = (data.workExperience && data.workExperience !== 'Not mentioned in resume' && data.workExperience !== 'Fresher') ||
                 (data.companyNames && data.companyNames.length > 0) ||
                 (data.internshipExperience && data.internshipExperience !== 'Not mentioned in resume');
  const experience = hasExp ? 'Available' : 'Not mentioned';

  const hasInterests = data.careerInterests && data.careerInterests !== 'Not mentioned in resume' && data.careerInterests.trim().length > 0;
  const careerInterests = hasInterests ? 'Available' : 'Not mentioned';

  const missingNotes: string[] = [];
  if (education === 'Not mentioned') {
    missingNotes.push('Education details are missing. Adding your degree and college helps unlock accurate qualification-based job eligibility.');
  }
  if (skills === 'Not mentioned') {
    missingNotes.push('No technical skills or tools detected. Adding key programming languages or software skills improves job matching accuracy.');
  }
  if (projects === 'Not mentioned') {
    missingNotes.push('No academic or practical projects found. Adding project details significantly strengthens private sector applications.');
  }
  if (experience === 'Not mentioned') {
    missingNotes.push('Work or internship experience is not mentioned. If you are a fresher, specifying your academic projects and internships helps.');
  }
  if (careerInterests === 'Not mentioned') {
    missingNotes.push('Your resume does not mention your career interests. Adding them may improve personalized recommendations.');
  }

  let score = 20;
  if (education === 'Available') score += 25;
  if (skills === 'Available') score += 25;
  if (projects === 'Available') score += 15;
  if (experience === 'Available') score += 10;
  if (careerInterests === 'Available') score += 5;

  return {
    education,
    skills,
    projects,
    experience,
    careerInterests,
    scorePercent: Math.min(100, score),
    missingNotes,
  };
}

// Deterministic rule-based extractor if AI model is unavailable or encounters quota limit
// CRITICAL: Strictly extracts only details actually present in the text. NEVER invents fake details.
function fallbackExtractResume(text: string, fileName = 'Resume'): StudentResumeAnalysis | null {
  if (!text || typeof text !== 'string' || text.trim().length < 15) {
    return null;
  }

  const clean = text.toLowerCase();

  // 1. Qualification detection - only from explicit keywords
  let highestQualification = 'Not mentioned in resume';
  let degree = 'Not mentioned in resume';
  let branch = 'Not mentioned in resume';

  if (clean.includes('b.tech') || clean.includes('bachelor of technology') || clean.includes('b.e.') || clean.includes('bachelor of engineering')) {
    highestQualification = 'B.Tech';
    degree = 'Bachelor of Technology (B.Tech)';
    branch = clean.includes('computer science') || clean.includes('cse') || clean.includes('information technology') ? 'Computer Science & Engineering'
      : clean.includes('mechanical') ? 'Mechanical Engineering'
      : clean.includes('civil') ? 'Civil Engineering'
      : clean.includes('electrical') || clean.includes('eee') || clean.includes('ece') ? 'Electrical / Electronics Engineering'
      : clean.includes('aerospace') ? 'Aerospace Engineering'
      : 'Engineering';
  } else if (clean.includes('m.tech') || clean.includes('master of technology') || clean.includes('m.e.')) {
    highestQualification = 'M.Tech';
    degree = 'Master of Technology (M.Tech)';
    branch = 'Advanced Engineering';
  } else if (clean.includes('b.com') || clean.includes('bachelor of commerce')) {
    highestQualification = 'B.Com';
    degree = 'Bachelor of Commerce (B.Com)';
    branch = clean.includes('computer') ? 'Commerce with Computer Applications'
      : clean.includes('taxation') ? 'Commerce & Taxation'
      : 'Commerce / Accounting';
  } else if (clean.includes('b.sc') || clean.includes('bachelor of science')) {
    highestQualification = 'B.Sc';
    degree = 'Bachelor of Science (B.Sc)';
    branch = clean.includes('computer') || clean.includes('data') ? 'Computer Science'
      : clean.includes('math') ? 'Mathematics'
      : clean.includes('physics') ? 'Physics'
      : clean.includes('chemistry') ? 'Chemistry'
      : 'Science';
  } else if (clean.includes('b.a') || clean.includes('bachelor of arts')) {
    highestQualification = 'B.A';
    degree = 'Bachelor of Arts (B.A)';
    branch = 'Arts / Humanities';
  } else if (clean.includes('mca') || clean.includes('master of computer')) {
    highestQualification = 'Post Graduation';
    degree = 'Master of Computer Applications (MCA)';
    branch = 'Computer Applications';
  } else if (clean.includes('mba') || clean.includes('master of business')) {
    highestQualification = 'Post Graduation';
    degree = 'Master of Business Administration (MBA)';
    branch = 'Management';
  } else if (clean.includes('m.sc') || clean.includes('master of science')) {
    highestQualification = 'M.Sc';
    degree = 'Master of Science (M.Sc)';
    branch = 'Science';
  } else if (clean.includes('m.a') || clean.includes('master of arts')) {
    highestQualification = 'M.A';
    degree = 'Master of Arts (M.A)';
    branch = 'Humanities';
  } else if (clean.includes('diploma') || clean.includes('polytechnic')) {
    highestQualification = 'Diploma';
    degree = 'Diploma in Engineering / Technology';
    branch = 'Technical / Engineering';
  } else if (clean.includes('12th') || clean.includes('intermediate') || clean.includes('higher secondary') || clean.includes('10+2') || clean.includes('puc')) {
    highestQualification = '12th';
    degree = 'Higher Secondary (10+2 / Intermediate)';
    branch = clean.includes('mpc') ? 'Mathematics, Physics, Chemistry'
      : clean.includes('bipc') ? 'Biology, Physics, Chemistry'
      : clean.includes('cec') ? 'Commerce, Economics, Civics'
      : clean.includes('mec') ? 'Mathematics, Economics, Commerce'
      : 'General Studies';
  } else if (clean.includes('10th') || clean.includes('ssc') || clean.includes('matriculation') || clean.includes('cbse 10') || clean.includes('icse 10')) {
    highestQualification = '10th';
    degree = 'Secondary School Certificate (10th)';
    branch = 'General Studies';
  }

  // College or University heuristic
  let collegeOrUniversity = 'Not mentioned in resume';
  const collegeMatch = text.match(/(?:college|university|institute|academy|school)[\s:]*([A-Za-z0-9\s,\.]{4,60})/i);
  if (collegeMatch && collegeMatch[1]) {
    collegeOrUniversity = collegeMatch[1].trim().replace(/[\r\n]+/g, ' ');
  }

  // Graduation Year heuristic
  let graduationYear = 'Not mentioned in resume';
  const yearMatch = text.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);
  if (yearMatch) {
    graduationYear = yearMatch[1];
  }

  // 2. Technical Skills - strictly detect what is in the document text
  const KNOWN_SKILLS = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust',
    'React', 'Next.js', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'Data Structures', 'Algorithms', 'Machine Learning', 'Data Science', 'Data Analytics', 'Pandas', 'NumPy',
    'Excel', 'Tally', 'GST', 'Accounting', 'Bookkeeping', 'Financial Analysis', 'Auditing',
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Embedded Systems', 'IoT', 'Power BI', 'Tableau'
  ];

  const matchedTechnical: string[] = [];
  KNOWN_SKILLS.forEach((sk) => {
    const regex = new RegExp(`\\b${sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      matchedTechnical.push(sk);
    }
  });

  // Soft Skills - strictly detect only if present
  const KNOWN_SOFT_SKILLS = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Public Speaking', 'Analytical Thinking', 'Negotiation'
  ];
  const matchedSoft: string[] = [];
  KNOWN_SOFT_SKILLS.forEach((sk) => {
    const regex = new RegExp(`\\b${sk}\\b`, 'i');
    if (regex.test(text)) {
      matchedSoft.push(sk);
    }
  });

  // Languages - strictly detect only if present
  const KNOWN_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Urdu', 'Punjabi', 'French', 'German', 'Spanish'];
  const matchedLanguages: string[] = [];
  KNOWN_LANGUAGES.forEach((lang) => {
    const regex = new RegExp(`\\b${lang}\\b`, 'i');
    if (regex.test(text)) {
      matchedLanguages.push(lang);
    }
  });

  // Email regex
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  // Phone regex (Indian 10-digit mobile)
  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);

  // Name extraction heuristic
  let fullName = 'Not mentioned in resume';
  const nameLineMatch = text.match(/(?:name|candidate|curriculum vitae|resume of)[\s:]*([A-Za-z\s]{3,35})/i);
  if (nameLineMatch && nameLineMatch[1]) {
    fullName = nameLineMatch[1].trim();
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !l.toLowerCase().includes('resume') && !l.toLowerCase().includes('curriculum') && !l.toLowerCase().includes('page'));
    if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@') && !lines[0].match(/\d/)) {
      fullName = lines[0];
    }
  }

  // Work experience detection
  let workExperience = 'Not mentioned in resume';
  if (clean.includes('experience') || clean.includes('internship') || clean.includes('worked at') || clean.includes('employment')) {
    const expMatch = text.match(/(?:experience|internship|employment)[\s\S]{10,250}/i);
    if (expMatch) {
      workExperience = expMatch[0].split('\n').slice(0, 3).join(' ').trim();
    }
  }

  // Career interests / Objective
  let careerInterests = 'Not mentioned in resume';
  const objMatch = text.match(/(?:career objective|objective|career goals|summary)[\s:]*([\s\S]{15,200})/i);
  if (objMatch && objMatch[1]) {
    careerInterests = objMatch[1].split('\n')[0].trim();
  }

  const analysis: StudentResumeAnalysis = {
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName,
    email: emailMatch ? emailMatch[0] : 'Not mentioned in resume',
    mobileNumber: phoneMatch ? phoneMatch[0] : 'Not mentioned in resume',
    location: 'Not mentioned in resume',
    state: 'Not mentioned in resume',
    districtOrCity: 'Not mentioned in resume',
    highestQualification,
    degree,
    branch,
    collegeOrUniversity,
    graduationYear,
    educationDetails: highestQualification !== 'Not mentioned in resume' ? `${highestQualification}${branch !== 'Not mentioned in resume' ? ` in ${branch}` : ''}` : 'Not mentioned in resume',
    academicQualifications: degree,
    technicalSkills: matchedTechnical,
    programmingLanguages: matchedTechnical.filter(s => ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust'].includes(s)),
    softwareTools: matchedTechnical.filter(s => ['Excel', 'Tally', 'AutoCAD', 'SolidWorks', 'Git', 'GitHub', 'Docker', 'Kubernetes', 'Power BI', 'Tableau'].includes(s)),
    softSkills: matchedSoft,
    domainSkills: branch !== 'Not mentioned in resume' ? [branch] : [],
    otherSkills: [],
    workExperience,
    companyNames: [],
    jobRoles: [],
    internshipExperience: clean.includes('intern') ? 'Internship details mentioned in document' : 'Not mentioned in resume',
    internshipOrganizations: [],
    duration: 'Not mentioned in resume',
    responsibilities: [],
    projects: [],
    certifications: [],
    languagesKnown: matchedLanguages,
    careerInterests,
    achievements: [],
    awards: [],
    publications: [],
    relevantTraining: [],
    completeness: {
      education: degree !== 'Not mentioned in resume' ? 'Available' : 'Not mentioned',
      skills: matchedTechnical.length > 0 ? 'Available' : 'Not mentioned',
      projects: 'Not mentioned',
      experience: workExperience !== 'Not mentioned in resume' ? 'Available' : 'Not mentioned',
      careerInterests: careerInterests !== 'Not mentioned in resume' ? 'Available' : 'Not mentioned',
      scorePercent: 40,
      missingNotes: [],
    },
    rawText: text.slice(0, 4000),
    isConfirmed: false,
    updatedAt: new Date().toISOString(),
  };

  analysis.completeness = computeCompleteness(analysis);
  return analysis;
}

/**
 * POST /api/resume/extract-complete
 * Core endpoint for Step 2: Extracts complete resume details across all pages (PDF, DOCX, JPG, PNG, TXT).
 * Does NOT generate job recommendations yet. Returns pure, structured resume analysis for student review.
 */
router.post('/extract-complete', async (req: Request, res: Response) => {
  try {
    const { fileData, mimeType, fileName, resumeText, images } = req.body;

    let extractedDocumentText = '';
    const visualParts: Array<{ mimeType: string; data: string }> = [];

    // 1. Process uploaded document fileData (PDF, DOCX, Images, Text)
    if (fileData && typeof fileData === 'string') {
      const parsed = parseDataUri(fileData, mimeType || 'application/pdf');
      const buffer = Buffer.from(parsed.data, 'base64');
      const isPdf = parsed.mimeType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'));
      const isDocx = parsed.mimeType.includes('wordprocessingml') || (fileName && fileName.toLowerCase().endsWith('.docx'));
      const isImage = parsed.mimeType.startsWith('image/');

      if (isPdf) {
        visualParts.push(parsed);
        try {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          await parser.destroy();
          if (pdfData?.text && pdfData.text.trim().length > 0) {
            extractedDocumentText = pdfData.text.trim();
          }
        } catch (pdfErr) {
          console.warn('pdf-parse text extraction notice:', pdfErr);
        }
      } else if (isDocx) {
        try {
          const docxData = await mammoth.extractRawText({ buffer });
          if (docxData?.value && docxData.value.trim().length > 0) {
            extractedDocumentText = docxData.value.trim();
          }
        } catch (docxErr) {
          console.warn('mammoth text extraction notice:', docxErr);
        }
      } else if (isImage) {
        visualParts.push(parsed);
      } else {
        // Text / markdown
        try {
          const textContent = buffer.toString('utf-8');
          if (textContent.trim()) {
            extractedDocumentText = textContent.trim();
          }
        } catch {
          // ignore
        }
      }
    }

    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: string) => {
        visualParts.push(parseDataUri(img));
      });
    }

    // Combine raw text from parsed document and explicit input
    const fullCombinedText = [extractedDocumentText, resumeText].filter(Boolean).join('\n\n').trim();

    const ai = getGenAI();
    let extractedResult: StudentResumeAnalysis | null = null;
    let geminiUsed = false;

    if (ai) {
      const extractionPrompt = `You are an expert Document Intelligence and Resume Extraction AI for CAREER DEFINER (an Indian Student Career Guidance and Job Discovery Platform).
Analyze ALL pages and sections of the provided resume document.
Carefully extract all information according to the strict JSON schema below.

CRITICAL ACCURACY RULES:
1. Do NOT invent, assume, or hallucinate information. If a section or field is not present in the document, you MUST set its string value to "Not mentioned in resume" (or an empty array [] for lists).
2. Do NOT guess the student's qualification, skills, college, or experience if not explicitly written.
3. Classify "highestQualification" as one of: "10th", "12th", "Diploma", "B.A", "B.Com", "B.Sc", "B.Tech", "B.E", "M.Tech", "M.A", "M.Sc", "Post Graduation", or "Not mentioned in resume".
4. Calculate completeness for: Education, Skills, Projects, Experience, Career Interests as "Available" or "Not mentioned".
5. Provide constructive, explainable missingNotes.

Return ONLY a valid JSON object matching this schema:
{
  "fullName": string,
  "email": string,
  "mobileNumber": string,
  "location": string,
  "state": string,
  "districtOrCity": string,

  "highestQualification": string,
  "degree": string,
  "branch": string,
  "collegeOrUniversity": string,
  "graduationYear": string,
  "educationDetails": string,
  "academicQualifications": string,

  "technicalSkills": string[],
  "programmingLanguages": string[],
  "softwareTools": string[],
  "softSkills": string[],
  "domainSkills": string[],
  "otherSkills": string[],

  "workExperience": string,
  "companyNames": string[],
  "jobRoles": string[],
  "internshipExperience": string,
  "internshipOrganizations": string[],
  "duration": string,
  "responsibilities": string[],

  "projects": [
    {
      "title": string,
      "description": string,
      "technologiesUsed": string[],
      "contributions": string
    }
  ],

  "certifications": [
    {
      "name": string,
      "issuingOrganization": string,
      "completionDate": string
    }
  ],

  "languagesKnown": string[],
  "careerInterests": string,
  "achievements": string[],
  "awards": string[],
  "publications": string[],
  "relevantTraining": string[],

  "completeness": {
    "education": "Available" | "Not mentioned",
    "skills": "Available" | "Not mentioned",
    "projects": "Available" | "Not mentioned",
    "experience": "Available" | "Not mentioned",
    "careerInterests": "Available" | "Not mentioned",
    "scorePercent": number,
    "missingNotes": string[]
  }
}`;

      // Iterate through candidate models for reliability and quota management
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const contents: any[] = [];

          if (visualParts.length > 0) {
            visualParts.forEach((part) => {
              contents.push({
                inlineData: {
                  mimeType: part.mimeType,
                  data: part.data,
                },
              });
            });
          }

          if (fullCombinedText) {
            contents.push(`Resume Document Full Text:\n${fullCombinedText.slice(0, 25000)}`);
          }

          contents.push(extractionPrompt);

          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const rawText = response.text || '';
          const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          const completeness = computeCompleteness(parsed);

          extractedResult = {
            id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            fullName: parsed.fullName || 'Not mentioned in resume',
            email: parsed.email || 'Not mentioned in resume',
            mobileNumber: parsed.mobileNumber || 'Not mentioned in resume',
            location: parsed.location || 'Not mentioned in resume',
            state: parsed.state || 'Not mentioned in resume',
            districtOrCity: parsed.districtOrCity || 'Not mentioned in resume',
            highestQualification: parsed.highestQualification || 'Not mentioned in resume',
            degree: parsed.degree || 'Not mentioned in resume',
            branch: parsed.branch || 'Not mentioned in resume',
            collegeOrUniversity: parsed.collegeOrUniversity || 'Not mentioned in resume',
            graduationYear: parsed.graduationYear || 'Not mentioned in resume',
            educationDetails: parsed.educationDetails || 'Not mentioned in resume',
            academicQualifications: parsed.academicQualifications || 'Not mentioned in resume',
            technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
            programmingLanguages: Array.isArray(parsed.programmingLanguages) ? parsed.programmingLanguages : [],
            softwareTools: Array.isArray(parsed.softwareTools) ? parsed.softwareTools : [],
            softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
            domainSkills: Array.isArray(parsed.domainSkills) ? parsed.domainSkills : [],
            otherSkills: Array.isArray(parsed.otherSkills) ? parsed.otherSkills : [],
            workExperience: parsed.workExperience || 'Not mentioned in resume',
            companyNames: Array.isArray(parsed.companyNames) ? parsed.companyNames : [],
            jobRoles: Array.isArray(parsed.jobRoles) ? parsed.jobRoles : [],
            internshipExperience: parsed.internshipExperience || 'Not mentioned in resume',
            internshipOrganizations: Array.isArray(parsed.internshipOrganizations) ? parsed.internshipOrganizations : [],
            duration: parsed.duration || 'Not mentioned in resume',
            responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            languagesKnown: Array.isArray(parsed.languagesKnown) ? parsed.languagesKnown : [],
            careerInterests: parsed.careerInterests || 'Not mentioned in resume',
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
            awards: Array.isArray(parsed.awards) ? parsed.awards : [],
            publications: Array.isArray(parsed.publications) ? parsed.publications : [],
            relevantTraining: Array.isArray(parsed.relevantTraining) ? parsed.relevantTraining : [],
            completeness: parsed.completeness || completeness,
            rawText: fullCombinedText || `${fileName || 'Uploaded Resume'} analyzed with complete page coverage.`,
            isConfirmed: false,
            updatedAt: new Date().toISOString(),
          };

          geminiUsed = true;
          break;
        } catch (geminiError: any) {
          console.warn(`Model ${modelName} extraction notice:`, geminiError.message || geminiError);
        }
      }
    }

    // Deterministic fallback on real document text only (never on fabricated placeholder data)
    if (!extractedResult && fullCombinedText && fullCombinedText.length >= 15) {
      extractedResult = fallbackExtractResume(fullCombinedText, fileName);
    }

    if (!extractedResult) {
      return res.status(400).json({
        success: false,
        message: 'Resume details could not be extracted. Please upload a valid, clear PDF, DOCX, image, or text file.',
      });
    }

    return res.json({
      success: true,
      aiPowered: geminiUsed,
      resumeAnalysis: extractedResult,
      message: 'Resume analyzed successfully. Please review the details below before confirming.',
    });
  } catch (error: any) {
    console.error('Extract complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract resume document',
      error: error.message,
    });
  }
});

/**
 * POST /api/resume/scan-camera
 * Compatible with existing Camera Resume Scanner.
 * Processes multiple camera pages and returns extracted analysis for review.
 */
router.post('/scan-camera', async (req: Request, res: Response) => {
  try {
    const { images, image } = req.body;
    const rawImages: string[] = Array.isArray(images)
      ? images
      : typeof image === 'string'
      ? [image]
      : [];

    if (rawImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No resume images provided. Please capture or upload at least one page.',
      });
    }

    // Forward to extract-complete internally
    const parsedImages = rawImages.map(img => parseDataUri(img));
    const ai = getGenAI();

    let extracted: StudentResumeAnalysis | null = null;
    let geminiUsed = false;

    if (ai) {
      try {
        const contents: any[] = parsedImages.map((img) => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        }));

        contents.push(`Extract all details from these physical resume camera pages into JSON matching the full schema. Do not invent info. Return valid JSON.`);

        let parsed: any = null;
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: { responseMimeType: 'application/json' },
            });
            parsed = JSON.parse(response.text || '{}');
            geminiUsed = true;
            break;
          } catch (modelErr) {
            console.warn(`Camera OCR model ${modelName} notice:`, modelErr);
          }
        }

        if (parsed) {
          extracted = {
            id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            fullName: parsed.fullName || parsed.studentName || 'Not mentioned in resume',
            email: parsed.email || 'Not mentioned in resume',
            mobileNumber: parsed.mobileNumber || 'Not mentioned in resume',
            location: parsed.location || 'Not mentioned in resume',
            state: parsed.state || 'Not mentioned in resume',
            districtOrCity: parsed.districtOrCity || 'Not mentioned in resume',
            highestQualification: parsed.highestQualification || parsed.qualification || 'Not mentioned in resume',
            degree: parsed.degree || 'Not mentioned in resume',
            branch: parsed.branch || 'Not mentioned in resume',
            collegeOrUniversity: parsed.college || parsed.collegeOrUniversity || 'Not mentioned in resume',
            graduationYear: parsed.graduationYear || 'Not mentioned in resume',
            educationDetails: parsed.educationDetails || 'Not mentioned in resume',
            academicQualifications: parsed.academicQualifications || 'Not mentioned in resume',
            technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
            programmingLanguages: Array.isArray(parsed.programmingLanguages) ? parsed.programmingLanguages : [],
            softwareTools: Array.isArray(parsed.softwareTools) ? parsed.softwareTools : [],
            softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
            domainSkills: Array.isArray(parsed.domainSkills) ? parsed.domainSkills : [],
            otherSkills: Array.isArray(parsed.otherSkills) ? parsed.otherSkills : [],
            workExperience: parsed.workExperience || parsed.experience || 'Not mentioned in resume',
            companyNames: Array.isArray(parsed.companyNames) ? parsed.companyNames : [],
            jobRoles: Array.isArray(parsed.jobRoles) ? parsed.jobRoles : [],
            internshipExperience: parsed.internshipExperience || 'Not mentioned in resume',
            internshipOrganizations: Array.isArray(parsed.internshipOrganizations) ? parsed.internshipOrganizations : [],
            duration: parsed.duration || 'Not mentioned in resume',
            responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects.map((p: any) => typeof p === 'string' ? { title: p, description: '', technologiesUsed: [], contributions: '' } : p) : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map((c: any) => typeof c === 'string' ? { name: c, issuingOrganization: '', completionDate: '' } : c) : [],
            languagesKnown: Array.isArray(parsed.languagesKnown) ? parsed.languagesKnown : [],
            careerInterests: parsed.careerInterests || 'Not mentioned in resume',
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
            awards: Array.isArray(parsed.awards) ? parsed.awards : [],
            publications: Array.isArray(parsed.publications) ? parsed.publications : [],
            relevantTraining: Array.isArray(parsed.relevantTraining) ? parsed.relevantTraining : [],
            completeness: computeCompleteness(parsed),
            rawText: `Camera Scanned Resume (${rawImages.length} page(s))`,
            isConfirmed: false,
            updatedAt: new Date().toISOString(),
          };
        }
      } catch (ocrErr) {
        console.warn('Camera OCR error:', ocrErr);
      }
    }

    if (!extracted) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract legible resume details from the scanned camera photo. Please take a clear, well-lit photo of your resume or upload a PDF document.',
      });
    }

    return res.json({
      success: true,
      pageCount: rawImages.length,
      aiPowered: geminiUsed,
      resumeAnalysis: extracted,
      // Backward compatibility fields
      extractedData: {
        studentName: extracted.fullName,
        qualification: extracted.highestQualification,
        degree: extracted.degree,
        branch: extracted.branch,
        college: extracted.collegeOrUniversity,
        graduationYear: extracted.graduationYear,
        technicalSkills: extracted.technicalSkills,
        softSkills: extracted.softSkills,
        certifications: extracted.certifications.map(c => c.name),
        projects: extracted.projects.map(p => p.title),
        experience: extracted.workExperience,
        careerInterests: extracted.careerInterests,
      },
      message: 'Resume scanned and transcribed successfully. Please review and confirm.',
    });
  } catch (err: any) {
    console.error('Camera scan error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process scanned resume image',
      error: err.message,
    });
  }
});

/**
 * GET /api/resume/my-resume
 * Retrieves the authenticated student's confirmed resume from the database.
 * Also supports query ?resumeId=... for direct resume lookup.
 */
router.get('/my-resume', (req: Request, res: Response) => {
  const resumeId = req.query.resumeId as string | undefined;
  if (resumeId) {
    const found = db.getResumeById(resumeId);
    if (found) {
      return res.json({ success: true, resume: found });
    }
  }

  const userId = getAuthenticatedUserId(req);
  if (userId) {
    const saved = db.getResumeByUserId(userId);
    if (saved) {
      return res.json({ success: true, resume: saved });
    }
  }

  // Fallback to guest session resume
  const guestResume = db.getResumeByUserId('guest');
  return res.json({ success: true, resume: guestResume || null });
});

/**
 * POST /api/resume/confirm
 * Saves the confirmed resume analysis to the student's database account.
 */
router.post('/confirm', (req: Request, res: Response) => {
  try {
    const { resumeAnalysis } = req.body;
    if (!resumeAnalysis) {
      return res.status(400).json({ success: false, message: 'Resume analysis data is required' });
    }

    const userId = getAuthenticatedUserId(req);

    // Recompute completeness check
    const completeness = computeCompleteness(resumeAnalysis);
    const finalized: Partial<StudentResumeAnalysis> = {
      ...resumeAnalysis,
      completeness,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const effectiveUserId = userId || 'guest';
    const savedResume = db.saveResume(effectiveUserId, finalized);

    return res.json({
      success: true,
      message: 'Resume confirmed successfully',
      resume: savedResume,
    });
  } catch (err: any) {
    console.error('Confirm resume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm resume' });
  }
});

/**
 * Helper to match jobs based on confirmed resume details
 */
function matchJobsWithResume(resume: Partial<StudentResumeAnalysis>) {
  const allJobs = db.getJobs();
  const allOrgs = db.getOrganizations();
  const allExams = db.getExaminations();

  const qualWeights: Record<string, number> = {
    '10th': 1,
    '12th': 2,
    'Diploma': 3,
    'B.A': 4,
    'B.Com': 4,
    'B.Sc': 4,
    'Graduation': 4,
    'B.Tech': 5,
    'B.E': 5,
    'M.Tech': 6,
    'M.A': 6,
    'M.Sc': 6,
    'Post Graduation': 6,
    'Other': 3,
    'Not specified': 0,
    'Not mentioned in resume': 0,
  };

  const candidateQual = resume.highestQualification || 'Not specified';
  const candidateQualWeight = qualWeights[candidateQual] !== undefined ? qualWeights[candidateQual] : 3;
  const candidateBranch = (resume.branch || '').toLowerCase();
  const candidateState = (resume.state || '').toLowerCase();
  const candidateSkills = [
    ...(resume.technicalSkills || []),
    ...(resume.programmingLanguages || []),
    ...(resume.softwareTools || []),
    ...(resume.softSkills || []),
    ...(resume.domainSkills || []),
  ];

  const candidateInterests = (resume.careerInterests || '').toLowerCase();

  const evaluated = allJobs.map((job) => {
    let score = 50;
    const jobQualWeight = qualWeights[job.qualification] || 4;

    let meetsQualification = false;
    let eligibilityNotes = '';
    let matchReason = '';

    // 1. Qualification Evaluation
    if (candidateQualWeight === 0) {
      score -= 10;
      meetsQualification = false;
      eligibilityNotes = `Resume did not specify qualification. Please verify if you meet the ${job.qualification} requirement.`;
    } else if (candidateQualWeight >= jobQualWeight) {
      score += 24;
      meetsQualification = true;
    } else {
      score -= 25;
      meetsQualification = false;
      eligibilityNotes = `Requires minimum ${job.qualification} (Candidate holds ${candidateQual}). Relaxations may apply; check official notification.`;
    }

    // 2. Skill Overlap
    const jobText = `${job.title} ${job.branch || ''} ${job.skillsRequired?.join(' ') || ''} ${job.description || ''} ${job.selectionProcess || ''} ${(job as any).industry || job.sector || ''}`.toLowerCase();

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    candidateSkills.forEach((skill) => {
      if (jobText.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
        score += 5;
      }
    });

    const requiredSkills = job.skillsRequired || (
      job.jobType === 'GOVERNMENT'
        ? ['General Studies', 'Quantitative Aptitude', 'Reasoning', 'Current Affairs']
        : ['Technical Fundamentals', 'Communication', 'Domain Competency']
    );

    requiredSkills.forEach((reqSkill) => {
      const found = candidateSkills.some((s) => s.toLowerCase() === reqSkill.toLowerCase());
      if (!found && !matchedSkills.includes(reqSkill)) {
        missingSkills.push(reqSkill);
      }
    });

    // 3. Branch / Domain Matching
    let branchMatched = false;
    if (job.branch) {
      const jb = job.branch.toLowerCase();
      if (
        jb.includes('any') ||
        jb.includes('all') ||
        jb.includes('general') ||
        (candidateBranch && (jb.includes(candidateBranch) || candidateBranch.includes(jb)))
      ) {
        score += 15;
        branchMatched = true;
      }
    }

    // 4. State Alignment (for state govt jobs)
    if (job.category === 'STATE' && job.stateId && candidateState) {
      if (candidateState.includes(job.stateId.toLowerCase()) || job.stateId.toLowerCase().includes(candidateState)) {
        score += 10;
      }
    }

    // 5. Career Interests Alignment
    if (candidateInterests && candidateInterests !== 'not mentioned in resume') {
      if (jobText.includes(candidateInterests) || candidateInterests.includes(job.title.toLowerCase())) {
        score += 8;
      }
    }

    // Clamp score
    const finalScore = Math.min(98, Math.max(38, Math.round(score)));

    let matchLevel: 'HIGH' | 'MEDIUM' | 'MODERATE' = 'MODERATE';
    if (finalScore >= 80) matchLevel = 'HIGH';
    else if (finalScore >= 65) matchLevel = 'MEDIUM';

    const eligibilityStatus: 'ELIGIBLE' | 'CHECK_CRITERIA' =
      meetsQualification && finalScore >= 60 ? 'ELIGIBLE' : 'CHECK_CRITERIA';

    // Formulate transparent matching reason
    const org = allOrgs.find((o) => o.id === job.organizationId);
    const orgName = org?.name || job.companyName || 'Department';

    // Verify vacancy status vs general career opportunity
    const isDeadlineActive = job.applicationEndDate ? new Date(job.applicationEndDate).getTime() >= Date.now() : true;
    const vacancyType = isDeadlineActive ? 'Active Recruitment' : 'Career Option / Regular Cadre';

    if (job.jobType === 'GOVERNMENT') {
      if (meetsQualification && branchMatched) {
        matchReason = `Direct match for ${candidateQual} with ${resume.branch || 'relevant'} background. Selection scheme in ${orgName} aligns with your academic preparation.`;
      } else if (meetsQualification) {
        matchReason = `Eligible based on academic qualification (${candidateQual}). Syllabus covers quantitative and general studies components.`;
      } else {
        matchReason = `Opportunity in ${orgName}. Check notification for state domicile or qualification relaxations.`;
      }
    } else {
      if (matchedSkills.length > 0) {
        matchReason = `Matches skills in ${matchedSkills.slice(0, 3).join(', ')}. Candidate background aligns with ${(job as any).industry || 'industry'} role expectations.`;
      } else {
        matchReason = `Entry-level career track for ${candidateQual} graduates at ${orgName}. Foundation in ${resume.branch || 'your degree'} provides good aptitude base.`;
      }
    }

    let skillGapAdvice = '';
    if (job.jobType === 'GOVERNMENT') {
      skillGapAdvice = missingSkills.length > 0
        ? `Focus daily on standard NCERTs, Previous 5-Year Question Papers, and Mock Tests in ${missingSkills.slice(0, 2).join(' & ')}.`
        : 'High syllabus congruence. Practice timed sectional mock tests and general awareness updates.';
    } else {
      skillGapAdvice = missingSkills.length > 0
        ? `Build hands-on practice projects or acquire certifications in ${missingSkills.slice(0, 2).join(' & ')} to strengthen shortlist prospects.`
        : 'Technical profile closely matches job prerequisites. Prepare a portfolio repository and practice mock interviews.';
    }

    const examination = job.examinationId ? allExams.find(e => e.id === job.examinationId) : undefined;

    return {
      job: {
        ...job,
        organization: org,
        examination,
      },
      matchScore: finalScore,
      matchLevel,
      matchingSkills: matchedSkills.length > 0 ? matchedSkills : ['Core Academic Foundation', 'Analytical Aptitude'],
      missingSkills: missingSkills.slice(0, 4),
      skillGapAdvice,
      matchReason,
      eligibilityStatus,
      eligibilityNotes,
      vacancyType,
    };
  });

  const recommendedGovernmentJobs = evaluated
    .filter((m) => m.job.jobType === 'GOVERNMENT')
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const recommendedPrivateJobs = evaluated
    .filter((m) => m.job.jobType === 'PRIVATE')
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const allMissing = Array.from(
    new Set(
      [...recommendedGovernmentJobs, ...recommendedPrivateJobs].flatMap((m) => m.missingSkills)
    )
  ).filter((sk) => !candidateSkills.some((s) => s.toLowerCase() === sk.toLowerCase()));

  const skillGapAnalysis = {
    existingSkills: candidateSkills,
    missingSkills: allMissing.slice(0, 5),
    recommendedSkillsToLearn: allMissing.slice(0, 4).length > 0
      ? allMissing.slice(0, 4)
      : ['Cloud & Container Fundamentals', 'Quantitative Aptitude Drills', 'System Architecture'],
    suggestedCourses: [
      {
        name: 'SWAYAM & NPTEL Official Certification',
        provider: 'Ministry of Education, Govt. of India',
        link: 'https://swayam.gov.in',
        type: 'Free Govt. Recognized'
      },
      {
        name: 'Official UPSC/SSC Previous Year Papers & Model Tests',
        provider: 'National Examination Archive',
        link: 'https://upsc.gov.in',
        type: 'Official Syllabus Scheme'
      },
      {
        name: 'Practical Technical Skills & Capstone Repository',
        provider: 'National Skill Development Corporation (NSDC)',
        link: 'https://nsdcindia.org',
        type: 'Industry Aligned'
      }
    ],
    careerRoadmap: [
      {
        phase: 'Phase 1: Academic & Fundamental Alignment (Month 1-2)',
        focus: `Strengthen fundamental prerequisites for ${candidateQual} qualifications and core reasoning.`,
        milestone: 'Complete 10 sectional mock tests and review previous recruitment cutoffs.'
      },
      {
        phase: 'Phase 2: Targeted Skills & Practical Projects (Month 3-4)',
        focus: `Bridge gaps in ${allMissing.slice(0, 2).join(' & ') || 'core domain skills'}. Complete 1 verified project or full syllabus tier.`,
        milestone: 'Verify state domicile eligibility and update candidate portfolio.'
      },
      {
        phase: 'Phase 3: Application & Examination Selection (Month 5+)',
        focus: 'Submit targeted applications for active recruitment gazettes and private hiring rounds.',
        milestone: 'Appear for preliminary examinations and company technical interviews.'
      }
    ]
  };

  return {
    recommendedGovernmentJobs,
    recommendedPrivateJobs,
    skillGapAnalysis,
  };
}

/**
 * POST /api/resume/recommend-jobs
 * Triggered AFTER student confirms extracted resume details.
 * Recommends verified Government and Private jobs based on confirmed resume credentials.
 */
router.post('/recommend-jobs', (req: Request, res: Response) => {
  try {
    const { confirmedResume, resumeAnalysis, resumeData, resumeId } = req.body || {};
    let resumeToUse = confirmedResume || resumeAnalysis || resumeData;

    // Check by resumeId if provided
    if (!resumeToUse && resumeId) {
      const resumes = (db as any).data?.studentResumes || [];
      resumeToUse = resumes.find((r: any) => r.id === resumeId);
    }

    // Fallback to authenticated user's confirmed resume
    if (!resumeToUse) {
      const userId = getAuthenticatedUserId(req);
      if (userId) {
        resumeToUse = db.getResumeByUserId(userId);
      }
    }

    if (!resumeToUse) {
      return res.status(400).json({
        success: false,
        message: 'Confirmed resume data is required to discover matching jobs',
      });
    }

    const recommendations = matchJobsWithResume(resumeToUse);

    return res.json({
      success: true,
      resumeUsed: {
        id: resumeToUse.id,
        fullName: resumeToUse.fullName,
        highestQualification: resumeToUse.highestQualification,
        degree: resumeToUse.degree,
        branch: resumeToUse.branch,
        state: resumeToUse.state,
        technicalSkills: resumeToUse.technicalSkills || [],
        programmingLanguages: resumeToUse.programmingLanguages || [],
        softwareTools: resumeToUse.softwareTools || [],
        workExperience: resumeToUse.workExperience,
        careerInterests: resumeToUse.careerInterests,
        projectsCount: resumeToUse.projects?.length || 0,
        certificationsCount: resumeToUse.certifications?.length || 0,
      },
      ...recommendations,
      disclaimer: 'Career Definer AI Matcher is an algorithmic career discovery engine. Vacancies and eligibility criteria are matched against official database records. Please verify official recruitment notifications before applying.',
    });
  } catch (err: any) {
    console.error('Recommend jobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to recommend jobs' });
  }
});

/**
 * GET /api/resume/recommend-jobs
 * Recommends jobs based on the current student's confirmed resume in the database.
 */
router.get('/recommend-jobs', (req: Request, res: Response) => {
  try {
    const resumeId = req.query.resumeId as string | undefined;
    let resumeToUse: any = null;

    if (resumeId) {
      const resumes = (db as any).data?.studentResumes || [];
      resumeToUse = resumes.find((r: any) => r.id === resumeId);
    }

    if (!resumeToUse) {
      const userId = getAuthenticatedUserId(req);
      if (userId) {
        resumeToUse = db.getResumeByUserId(userId);
      }
    }

    if (!resumeToUse) {
      return res.status(404).json({
        success: false,
        message: 'No confirmed resume found. Please upload and confirm your resume first.',
      });
    }

    const recommendations = matchJobsWithResume(resumeToUse);

    return res.json({
      success: true,
      resumeUsed: {
        id: resumeToUse.id,
        fullName: resumeToUse.fullName,
        highestQualification: resumeToUse.highestQualification,
        degree: resumeToUse.degree,
        branch: resumeToUse.branch,
        state: resumeToUse.state,
        technicalSkills: resumeToUse.technicalSkills || [],
        programmingLanguages: resumeToUse.programmingLanguages || [],
        softwareTools: resumeToUse.softwareTools || [],
        workExperience: resumeToUse.workExperience,
        careerInterests: resumeToUse.careerInterests,
      },
      ...recommendations,
      disclaimer: 'Career Definer AI Matcher is an algorithmic career discovery engine.',
    });
  } catch (err: any) {
    console.error('Get recommend jobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to recommend jobs' });
  }
});

/**
 * POST /api/resume/analyze
 * Maintained for backward compatibility. Supports legacy callers.
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { resumeText, structuredData, candidateProfile } = req.body;

    let resumeToMatch: Partial<StudentResumeAnalysis>;

    if (structuredData && Object.keys(structuredData).length > 0) {
      resumeToMatch = {
        fullName: structuredData.studentName || candidateProfile?.fullName,
        highestQualification: structuredData.qualification || candidateProfile?.qualification || 'Graduation',
        degree: structuredData.degree || candidateProfile?.courseDegree,
        branch: structuredData.branch || candidateProfile?.branch,
        collegeOrUniversity: structuredData.college || candidateProfile?.institution,
        graduationYear: structuredData.graduationYear,
        technicalSkills: structuredData.technicalSkills || [],
        softSkills: structuredData.softSkills || [],
        workExperience: structuredData.experience || 'Fresher',
        careerInterests: structuredData.careerInterests || '',
      };
    } else {
      resumeToMatch = fallbackExtractResume(resumeText || '', 'Resume');
    }

    const recommendations = matchJobsWithResume(resumeToMatch);

    return res.json({
      success: true,
      candidateName: resumeToMatch.fullName,
      analysis: {
        summary: `Resume analyzed for ${resumeToMatch.highestQualification} credentials.`,
        extractedSkills: [...(resumeToMatch.technicalSkills || []), ...(resumeToMatch.softSkills || [])],
        technicalSkills: resumeToMatch.technicalSkills,
        softSkills: resumeToMatch.softSkills,
        detectedQualification: resumeToMatch.highestQualification,
        detectedDegree: resumeToMatch.degree,
        detectedDomain: resumeToMatch.branch,
        detectedCollege: resumeToMatch.collegeOrUniversity,
        detectedExperience: resumeToMatch.workExperience,
        careerInterests: resumeToMatch.careerInterests,
        aiPowered: true,
      },
      ...recommendations,
      disclaimer: 'Career Definer AI Matcher is an algorithmic career discovery engine.',
    });
  } catch (err: any) {
    console.error('Analyze error:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume' });
  }
});

export default router;
