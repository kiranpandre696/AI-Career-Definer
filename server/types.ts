export type UserRole = 'STUDENT' | 'ADMIN';

export type JobStatus = 'DRAFT' | 'UNDER_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type NoticeStatus = 'NEW' | 'IMPORTANT' | 'UPDATED';

export type QualificationLevel =
  | '10th'
  | '12th'
  | 'Diploma'
  | 'Graduation'
  | 'B.A'
  | 'B.Com'
  | 'B.Sc'
  | 'B.Tech'
  | 'B.E'
  | 'M.Tech'
  | 'M.A'
  | 'M.Sc'
  | 'Post Graduation'
  | 'Other';

export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  mobileNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  category?: string;
  state?: string;
  district?: string;
  // Education
  highestQualification?: QualificationLevel;
  courseDegree?: string;
  branchStream?: string;
  branch?: string;
  institution?: string;
  passingYear?: number;
  percentageCgpa?: string;
  // Interests (array of strings)
  interests: string[];
  // Skills (array of strings)
  skills: string[];
  // Career Preferences
  preferredSector?: 'Government' | 'Private' | 'Both';
  preferredJobType?: 'Full-Time' | 'Contractual' | 'Internship';
  preferredLocation?: string;
  preferredCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StateEntity {
  id: string;
  name: string;
  code: string;
  isUnionTerritory: boolean;
}

export interface SectorEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  type: 'CENTRAL' | 'STATE' | 'PRIVATE' | 'PSU' | 'AUTONOMOUS';
  sectorId?: string;
  stateId?: string; // If state government organization (e.g. APPSC -> Andhra Pradesh)
  description: string;
  officialWebsite: string;
  logoUrl?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
}

export interface Examination {
  id: string;
  name: string;
  shortName: string;
  organizationId: string;
  examType: 'National' | 'State' | 'Recruitment' | 'Entrance';
  qualification: QualificationLevel;
  description: string;
  minAge: number;
  maxAge: number;
  selectionProcess: string;
  officialNotificationUrl?: string;
  officialWebsiteUrl?: string;
  officialApplicationUrl?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ExamGroup {
  id: string;
  examinationId: string;
  name: string; // e.g. "Group-I", "Group-II", "Group-IV", "Non-Technical"
  description?: string;
  displayOrder: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface PostService {
  id: string;
  name: string; // e.g. "Indian Administrative Service (IAS)", "Sub-Inspector"
  organizationId: string;
  examinationId: string;
  groupId?: string; // Optional!
  departmentId?: string;
  description: string;
  qualification: QualificationLevel;
  branchRestriction?: string;
  minAge: number;
  maxAge: number;
  paySalary?: string;
  responsibilities?: string;
  careerGrowth?: string;
  officialSourceUrl?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface Job {
  id: string;
  title: string;
  jobType: 'GOVERNMENT' | 'PRIVATE';
  category: 'CENTRAL' | 'STATE' | 'PRIVATE';
  companyName?: string;
  stateId?: string;
  organizationId: string;
  examinationId?: string;
  groupId?: string;
  postId?: string;
  department?: string;
  qualification: QualificationLevel;
  branch?: string;
  minAge?: number;
  maxAge?: number;
  salary?: string;
  vacancies: number | string;
  applicationStartDate: string;
  applicationEndDate: string;
  examDate?: string;
  selectionProcess: string;
  officialNotificationUrl: string;
  officialApplicationUrl: string;
  // For private jobs:
  workMode?: 'On-site' | 'Hybrid' | 'Remote';
  experienceRequired?: string;
  skillsRequired?: string[];
  location?: string;
  sector?: string;
  description?: string;
  status: JobStatus;
  viewsCount: number;
  isVerified?: boolean;
  recruitmentStage?: 'Opportunity' | 'Upcoming' | 'Active' | 'Closed';
  syllabusSummary?: string;
  examPatternSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  savedAt: string;
}

// DYNAMIC SYLLABUS
export interface SyllabusSubject {
  id: string;
  examinationId: string;
  name: string;
  displayOrder: number;
}

export interface SyllabusTopic {
  id: string;
  subjectId: string;
  name: string;
  displayOrder: number;
}

export interface SyllabusSubtopic {
  id: string;
  topicId: string;
  name: string;
  displayOrder: number;
}

// DYNAMIC EXAM PATTERN
export interface ExamPattern {
  id: string;
  examinationId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ExamPatternColumn {
  id: string;
  examPatternId: string;
  columnName: string;
  displayOrder: number;
}

export interface ExamPatternRow {
  id: string;
  examPatternId: string;
  displayOrder: number;
}

export interface ExamPatternCell {
  id: string;
  rowId: string;
  columnId: string;
  cellValue: string;
}

// PREPARATION ROADMAP
export interface PreparationRoadmapPhase {
  id: string;
  examinationId: string;
  phaseNumber: number;
  title: string;
  duration?: string;
  description: string;
  keyActionPoints: string[];
}

export interface Notice {
  id: string;
  title: string;
  organizationName: string;
  category: 'CENTRAL' | 'STATE' | 'EXAM_UPDATE' | 'GENERAL';
  status: NoticeStatus;
  date: string;
  linkUrl?: string;
  isImportant?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Important Announcements' | 'Exam Updates' | 'Career Information' | 'Platform Updates' | 'Job Updates';
  date: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | '10th' | '12th' | 'Diploma' | 'Graduates' | 'B.Tech' | 'State' | 'Interest';
  targetValue?: string;
  linkUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserNotificationRead {
  userId: string;
  notificationId: string;
  readAt: string;
}

// ==========================================
// FEATURE 1: AI CAREER ROADMAP TYPES
// ==========================================

export interface RoadmapPhase {
  phaseNumber: number;
  name: string; // e.g. "1. Basic Knowledge & Prerequisites", "2. Core Skills", etc.
  description: string;
  skills: string[];
  tasks: string[];
  certifications?: string[];
  projects?: string[];
}

export interface RoadmapWeekPlan {
  weekNumber: number;
  title: string;
  topics: string[];
  skills: string[];
  practiceTasks: string[];
  suggestedProjects?: string[];
  expectedOutcome: string;
}

export interface RoadmapTimelinePlan {
  durationMonths: 1 | 3 | 6 | 12;
  weeks: RoadmapWeekPlan[];
}

export interface MissingSkillDetail {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'RECOMMENDED';
  explanation: string;
  whyImportant: string;
  suggestedLearningTopics: string[];
  practiceActivity: string;
  relatedJobs: string[];
}

export interface CareerRoadmap {
  id: string;
  title: string; // e.g. "Software Developer", "Data Analyst", "Bank PO", "SSC CGL"
  category: string; // "Information Technology", "Banking & Finance", etc.
  sector: 'GOVERNMENT' | 'PRIVATE' | 'BOTH';
  targetQualification: string;
  importantSkills: string[];
  suitableJobRoles: string[];
  growthOpportunities: string;
  overview: string;
  learningPhases: RoadmapPhase[];
  timelinePlans: RoadmapTimelinePlan[];
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface StudentRoadmapProgress {
  id: string;
  userId: string;
  roadmapId: string;
  careerTitle: string;
  durationMonths: 1 | 3 | 6 | 12;
  completedTasks: string[]; // task names or ids marked done
  completedModules: number[]; // phase numbers completed
  notes: string;
  progressPercentage: number;
  currentStage: string;
  customGoal?: string;
  existingSkills: string[];
  skillsYouNeed: string[];
  missingSkills: MissingSkillDetail[];
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// FEATURE 2: AI MOCK INTERVIEW TYPES
// ==========================================

export type InterviewType =
  | 'Government Job Interview'
  | 'Private Job Interview'
  | 'HR Interview'
  | 'Technical Interview'
  | 'Fresher Interview'
  | 'General Career Interview';

export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface InterviewInterimFeedback {
  goodPoints: string[];
  improvements: string[];
  missingPoints: string[];
  betterAnswerStructure: string;
}

export interface InterviewQuestionItem {
  id: string;
  index: number;
  category: 'HR' | 'Technical' | 'Situational' | 'Resume-Based' | 'Subject Knowledge' | 'General Awareness';
  questionText: string;
  context?: string;
  userAnswer?: string;
  answerDurationSeconds?: number;
  skipped?: boolean;
  interimFeedback?: InterviewInterimFeedback;
}

export interface InterviewPerformanceMetric {
  score: number; // 0 - 100
  feedback: string;
}

export interface InterviewFinalReport {
  overallScore: number; // 0 - 100
  attemptedCount: number;
  skippedCount: number;
  performanceAnalysis: {
    communication: InterviewPerformanceMetric;
    technicalKnowledge: InterviewPerformanceMetric;
    confidenceIndicators: InterviewPerformanceMetric;
    answerRelevance: InterviewPerformanceMetric;
    problemSolving: InterviewPerformanceMetric;
    overallPreparation: InterviewPerformanceMetric;
  };
  improvementSuggestions: {
    topicsToRevise: string[];
    skillsToImprove: string[];
    questionsToPractice: string[];
    suggestedLearningResources: string[];
    recommendedRoadmapModules: string[];
  };
  disclaimer: string;
}

export interface MockInterview {
  id: string;
  userId: string;
  jobId?: string;
  jobTitle: string;
  jobType: 'GOVERNMENT' | 'PRIVATE' | 'GENERAL';
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  totalQuestions: 5 | 10 | 15;
  feedbackTiming: 'EACH_QUESTION' | 'END_OF_INTERVIEW';
  answerMode: 'text' | 'voice';
  questions: InterviewQuestionItem[];
  currentQuestionIndex: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  finalReport?: InterviewFinalReport;
  createdAt: string;
  completedAt?: string;
}

// ==========================================
// FEATURE 3: GOVERNMENT EXAM PREPARATION TYPES
// ==========================================

export type ExamCategoryType =
  | 'Banking Exams'
  | 'SSC Exams'
  | 'State Public Service Commission Exams'
  | 'State Police Recruitment Exams'
  | 'Railway Exams'
  | 'Teaching Recruitment Exams'
  | 'Other Government Recruitment Exams';

export interface GovernmentExamDetail {
  id: string;
  examinationId?: string;
  examName: string;
  shortName: string;
  category: ExamCategoryType | string;
  conductingOrganization: string;
  eligibility: any;
  ageRequirement?: { min: number; max: number; relaxations?: string };
  examStages?: { stageNumber: number; name: string; type: string; marks?: number; duration?: string }[];
  examPattern?: any[];
  examPatternSummary?: string;
  subjects?: string[];
  syllabus?: any[];
  syllabusOverview?: string;
  selectionProcess?: string;
  recommendedBooks?: any[];
  previousYearCutoffs?: any[];
  frequency?: string;
  officialNotificationUrl?: string;
  officialWebsiteUrl?: string;
  officialWebsite?: string;
  jobOpportunities?: string[];
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamStudyPlan {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  durationMonths?: number;
  targetMonths?: number;
  dailyStudyHours?: number;
  availableDailyHours?: number;
  preparationLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  weakSubjects?: string[];
  strongSubjects?: string[];
  dailySchedule?: any;
  subjectWiseHours?: any;
  milestonePlan?: any;
  weeklyTargets?: any[];
  revisionStrategy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamSyllabusProgress {
  id: string;
  userId: string;
  examId: string;
  examName?: string;
  completedTopics?: string[];
  completedTopicIds?: string[];
  completedSubtopics?: string[];
  revisionCompletedTopicIds?: string[];
  overallPercentage?: number;
  topicNotes?: Record<string, string>; // topicId -> note
  updatedAt: string;
}

export interface PracticeQuestion {
  id: string;
  examId: string;
  examName?: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question?: string;
  questionText?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  marks?: number;
  negativeMarks?: number;
  isVerified?: boolean;
  isAiGenerated?: boolean;
  status: 'PUBLISHED' | 'DRAFT';
}

export interface MockTest {
  id: string;
  examId: string;
  examName: string;
  title: string;
  tierStage?: string;
  subject?: string; // 'All Subjects' / 'Quantitative Aptitude', etc.
  durationMinutes: number;
  totalMarks: number;
  negativeMarking?: boolean;
  negativeMarksPerWrong?: number;
  sections?: any[];
  questionIds: string[];
  questions?: PracticeQuestion[];
  instructions?: string[];
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
}

export interface StudentMockTestAttempt {
  id: string;
  userId: string;
  testId?: string;
  mockTestId?: string;
  testTitle?: string;
  examName: string;
  score: number;
  totalMarks: number;
  percentage?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  incorrectCount?: number;
  unattemptedCount?: number;
  timeSpentSeconds?: number;
  timeTakenSeconds?: number;
  sectionBreakdown?: any[];
  weakAreas?: string[];
  weakTopicsIdentified?: string[];
  recommendations?: string[];
  userAnswers?: any;
  answers?: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
  attemptedAt: string;
}

// ==========================================
// RESUME ANALYSIS AND DATA STORAGE TYPES
// ==========================================

export interface ResumeProjectItem {
  title: string;
  description: string;
  technologiesUsed: string[];
  contributions: string;
}

export interface ResumeCertificationItem {
  name: string;
  issuingOrganization: string;
  completionDate: string;
}

export interface ResumeCompletenessSummary {
  education: 'Available' | 'Not mentioned';
  skills: 'Available' | 'Not mentioned';
  projects: 'Available' | 'Not mentioned';
  experience: 'Available' | 'Not mentioned';
  careerInterests: 'Available' | 'Not mentioned';
  scorePercent: number;
  missingNotes: string[];
}

export interface StudentResumeAnalysis {
  id: string;
  userId?: string;
  // Personal Info
  fullName: string;
  email: string;
  mobileNumber: string;
  location: string;
  state: string;
  districtOrCity: string;
  // Education
  highestQualification: string;
  degree: string;
  branch: string;
  collegeOrUniversity: string;
  graduationYear: string;
  educationDetails: string;
  academicQualifications: string;
  // Skills
  technicalSkills: string[];
  programmingLanguages: string[];
  softwareTools: string[];
  softSkills: string[];
  domainSkills: string[];
  otherSkills: string[];
  // Experience
  workExperience: string;
  companyNames: string[];
  jobRoles: string[];
  internshipExperience: string;
  internshipOrganizations: string[];
  duration: string;
  responsibilities: string[];
  // Projects
  projects: ResumeProjectItem[];
  // Certifications
  certifications: ResumeCertificationItem[];
  // Other Details
  languagesKnown: string[];
  careerInterests: string;
  achievements: string[];
  awards: string[];
  publications: string[];
  relevantTraining: string[];
  // Completeness check
  completeness: ResumeCompletenessSummary;
  rawText?: string;
  isConfirmed?: boolean;
  confirmedAt?: string;
  updatedAt: string;
}
