import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  Info,
  Layers,
  Award,
  Zap,
  Camera,
  RotateCcw,
  UserCheck,
  ExternalLink,
  BookOpen,
  Compass,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, StudentProfile, StudentResumeAnalysis } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { ResumeCameraScanner } from '../../components/resume/ResumeCameraScanner.tsx';
import { ExtractedResumeForm, StructuredResumeData } from '../../components/resume/ExtractedResumeForm.tsx';
import { ResumeAnalysisView } from '../../components/resume/ResumeAnalysisView.tsx';
import { ProfileSyncModal } from '../../components/resume/ProfileSyncModal.tsx';

interface ResumeMatcherPageProps {
  onNavigate: (path: string) => void;
  onSelectJob: (job: Job) => void;
}

interface MatchResult {
  job: Job;
  matchScore: number;
  matchLevel: 'HIGH' | 'MEDIUM' | 'MODERATE';
  matchingSkills: string[];
  missingSkills: string[];
  skillGapAdvice: string;
  matchReason?: string;
  eligibilityStatus?: 'ELIGIBLE' | 'CHECK_CRITERIA';
  eligibilityNotes?: string;
}

interface SkillGapPayload {
  existingSkills: string[];
  missingSkills: string[];
  recommendedSkillsToLearn: string[];
  suggestedCourses: { name: string; provider: string; link: string; type: string }[];
  careerRoadmap: { phase: string; focus: string; milestone: string }[];
}

interface AnalysisPayload {
  summary: string;
  extractedSkills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  detectedQualification: string;
  detectedDegree?: string;
  detectedDomain: string;
  detectedCollege?: string;
  detectedExperience: string;
  careerInterests?: string;
  aiPowered: boolean;
}

export const ResumeMatcherPage: React.FC<ResumeMatcherPageProps> = ({ onNavigate, onSelectJob }) => {
  const { user, isStudent, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Active workflow mode: 'select' | 'upload' | 'camera' | 'review' | 'results'
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Extracted structured data for review
  const [extractedData, setExtractedData] = useState<StructuredResumeData | null>(null);
  const [isReviewingExtracted, setIsReviewingExtracted] = useState(false);

  // Complete Resume Analysis State (Decoupled Flow: Extract -> Review -> Confirm -> Recommend)
  const [resumeAnalysis, setResumeAnalysis] = useState<StudentResumeAnalysis | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);

  // File Upload State
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileMimeType, setFileMimeType] = useState('');
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [recommendedGovtJobs, setRecommendedGovtJobs] = useState<MatchResult[]>([]);
  const [recommendedPrivateJobs, setRecommendedPrivateJobs] = useState<MatchResult[]>([]);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapPayload | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Record<string, boolean>>({});

  // Profile Sync
  const [currentProfile, setCurrentProfile] = useState<StudentProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [confirmedResumeData, setConfirmedResumeData] = useState<StudentResumeAnalysis | StructuredResumeData | null>(null);

  // Fetch student profile and any existing confirmed resume if authenticated
  useEffect(() => {
    if (isAuthenticated && isStudent) {
      apiRequest('/api/student/profile')
        .then((res) => {
          if (res.success && res.profile) {
            setCurrentProfile(res.profile);
          }
        })
        .catch(() => {});

      // Load existing confirmed resume if student previously analyzed and confirmed
      apiRequest('/api/resume/my-resume')
        .then((res) => {
          if (res.success && res.resume) {
            setResumeAnalysis(res.resume);
            setConfirmedResumeData(res.resume);
            setIsConfirmed(true);
            setIsReviewingExtracted(true);
            // Fetch recommendations for this existing confirmed resume
            setIsRecommending(true);
            apiRequest('/api/resume/recommend-jobs', {
              method: 'POST',
              body: JSON.stringify({ resumeAnalysis: res.resume }),
            })
              .then((matchRes) => {
                if (matchRes.success) {
                  setRecommendedGovtJobs(matchRes.recommendedGovernmentJobs || []);
                  setRecommendedPrivateJobs(matchRes.recommendedPrivateJobs || []);
                  setSkillGapAnalysis(matchRes.skillGapAnalysis || null);
                }
              })
              .finally(() => setIsRecommending(false));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isStudent]);

  // Handle camera scanned images submission
  const handleProcessScannedImages = async (images: string[]) => {
    setIsOcrProcessing(true);
    setOcrError(null);

    try {
      const res = await apiRequest('/api/resume/scan-camera', {
        method: 'POST',
        body: JSON.stringify({ images }),
      });

      if (res.success && res.resumeAnalysis) {
        setResumeAnalysis(res.resumeAnalysis);
        setIsCameraScannerOpen(false);
        setIsReviewingExtracted(true);
        setIsConfirmed(false);
        setRecommendedGovtJobs([]);
        setRecommendedPrivateJobs([]);
        setSkillGapAnalysis(null);
      } else if (res.success && res.extractedData) {
        setExtractedData(res.extractedData);
        setIsCameraScannerOpen(false);
        setIsReviewingExtracted(true);
        setAnalysisDone(false);
      } else {
        setOcrError(
          res.message || 'The scanned image appears blurry or unclear. Please retake the photo with good lighting and steady focus.'
        );
      }
    } catch (err: any) {
      console.error('Camera OCR API error:', err);
      setOcrError('The scanned image appears blurry, unclear, or incomplete. Please retake the photo with good lighting.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Quick sample templates
  const loadSample = (type: 'btech' | 'degree' | 'twelfth' | 'diploma') => {
    setIsReviewingExtracted(false);
    setExtractedData(null);
    setUploadedFileDataUrl(null);
    setFileMimeType('text/plain');
    if (type === 'btech') {
      setFileName('BTech_CSE_Resume.pdf');
      setFileSize('145 KB');
      setResumeText(
        `Curriculum Vitae\nCandidate: Sai Kiran\nEducation: B.Tech (Computer Science & Engineering) with 8.4 CGPA\nCore Competencies: Python, React, Node.js, TypeScript, SQL, PostgreSQL, Cloud / Docker, Data Analytics\nAptitude: Quantitative Aptitude, Logical Reasoning, General Studies\nExperience: Fresher (0-1 Years Project Work)\nGoal: Engineering Services (UPSC ESE), Technical Officer, or Full Stack Software Engineering.`
      );
    } else if (type === 'degree') {
      setFileName('BA_Graduation_Resume.pdf');
      setFileSize('112 KB');
      setResumeText(
        `Resume Profile\nCandidate: Priya Sharma\nEducation: Graduation (Bachelor of Arts - History & Political Science)\nCore Competencies: Public Administration, General Studies, Constitution of India, Current Affairs, Verbal Ability, English Comprehension\nAptitude: Analytical reasoning, administrative drafting, documentation\nExperience: Fresher\nGoal: UPSC Civil Services, APPSC Group-I, SSC CGL Assistant Section Officer.`
      );
    } else if (type === 'diploma') {
      setFileName('Diploma_Mechanical_Resume.pdf');
      setFileSize('98 KB');
      setResumeText(
        `Resume\nCandidate: Rajesh Kumar\nEducation: 3-Year Diploma in Mechanical Engineering\nSkills: AutoCAD, Mechanical Drafting, Manufacturing Systems, Industrial Safety, Basic Electrical\nAptitude: Quantitative Aptitude, Basic Science\nGoal: SSC Junior Engineer (JE), Railway Loco Pilot / Technician.`
      );
    } else {
      setFileName('Intermediate_12th_Resume.pdf');
      setFileSize('85 KB');
      setResumeText(
        `Candidate Profile\nQualification: Higher Secondary (10+2 Intermediate MPC)\nMarks: 88%\nSkills: Typing 35 WPM, Computer Basics, MS Excel, Word Processing, English Comprehension\nAptitude: General Intelligence, Numerical Ability\nGoal: SSC CHSL Lower Division Clerk (LDC), Data Entry Operator (DEO).`
      );
    }
  };

  // File Upload (PDF, DOCX, TXT, JPG, PNG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setFileMimeType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain'));
    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 30;
      });
    }, 120);

    // If image file uploaded directly via file input
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setUploadedFileDataUrl(dataUrl);
          handleProcessScannedImages([dataUrl]);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For PDF, Word (DOC/DOCX), or plain text files
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedFileDataUrl(dataUrl);

      // If text file, display actual text
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textReader = new FileReader();
        textReader.onload = (tEvent) => {
          setResumeText((tEvent.target?.result as string) || '');
        };
        textReader.readAsText(file);
      } else {
        setResumeText(`[Document attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Ready for complete multi-page AI analysis]`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Complete Resume Extraction (Does NOT recommend jobs yet)
  const handleExtractComplete = async (customText?: string) => {
    const textToProcess = customText || resumeText;
    const hasFileData = Boolean(uploadedFileDataUrl);
    const hasText = Boolean(textToProcess && textToProcess.trim() && !textToProcess.startsWith('[Document attached:'));

    if (!hasFileData && !hasText) {
      alert('Please upload a resume file (PDF, DOCX, or Image), paste resume text, or select one of the sample candidate profiles.');
      return;
    }

    setIsExtracting(true);
    setIsAnalyzing(true);
    setOcrError(null);
    setIsConfirmed(false);
    setRecommendedGovtJobs([]);
    setRecommendedPrivateJobs([]);
    setSkillGapAnalysis(null);

    try {
      const res = await apiRequest('/api/resume/extract-complete', {
        method: 'POST',
        body: JSON.stringify({
          fileData: uploadedFileDataUrl || undefined,
          fileName: fileName || undefined,
          fileType: fileMimeType || (fileName?.endsWith('.pdf') ? 'application/pdf' : fileName?.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : undefined),
          resumeText: hasText ? textToProcess : undefined,
          candidateProfile: currentProfile,
        }),
      });

      if (res.success && res.resumeAnalysis) {
        setResumeAnalysis(res.resumeAnalysis);
        setConfirmedResumeData(res.resumeAnalysis);
        setIsReviewingExtracted(true);
      } else {
        alert(res.message || 'Failed to extract resume details. Please try again.');
      }
    } catch (err: any) {
      console.error('Resume extraction error:', err);
      alert('Error communicating with resume extraction service.');
    } finally {
      setIsExtracting(false);
      setIsAnalyzing(false);
    }
  };

  // Step 2 & 3: Save edits to extracted resume
  const handleSaveResumeEdits = (updated: StudentResumeAnalysis) => {
    setResumeAnalysis(updated);
    setConfirmedResumeData(updated);
    try {
      localStorage.setItem('career_definer_confirmed_resume', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Step 4: Confirm Resume & Recommend Jobs (ONLY runs after user explicitly confirms)
  const handleConfirmAndRecommend = async (customAnalysis?: StudentResumeAnalysis) => {
    const dataToConfirm = customAnalysis || resumeAnalysis;
    if (!dataToConfirm) return;

    setIsRecommending(true);
    try {
      // 0. Store confirmed data in localStorage for cross-page persistence
      try {
        localStorage.setItem('career_definer_confirmed_resume', JSON.stringify(dataToConfirm));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      // 1. Persist confirmation in student database
      await apiRequest('/api/resume/confirm', {
        method: 'POST',
        body: JSON.stringify({ resumeAnalysis: dataToConfirm }),
      });

      // 2. Fetch matched jobs strictly based on the confirmed resume
      const res = await apiRequest('/api/resume/recommend-jobs', {
        method: 'POST',
        body: JSON.stringify({
          resumeAnalysis: dataToConfirm,
          candidateProfile: currentProfile,
        }),
      });

      if (res.success) {
        setRecommendedGovtJobs(res.recommendedGovernmentJobs || []);
        setRecommendedPrivateJobs(res.recommendedPrivateJobs || []);
        setSkillGapAnalysis(res.skillGapAnalysis || null);
        setIsConfirmed(true);
        setConfirmedResumeData(dataToConfirm);
      } else {
        alert(res.message || 'Job matching failed. Please verify your resume details.');
      }
    } catch (err) {
      console.error('Job recommendation error:', err);
      alert('Error fetching job recommendations.');
    } finally {
      setIsRecommending(false);
    }
  };

  // Step 5: Navigate to Recommended Jobs Page
  const handleNextRecommendedJobs = async () => {
    const dataToUse = confirmedResumeData || resumeAnalysis;
    if (!dataToUse) {
      alert('Please upload and extract your resume details first.');
      return;
    }

    if (!isConfirmed) {
      alert('Please confirm your resume details before viewing recommended jobs.');
      return;
    }

    setIsRecommending(true);
    try {
      // Ensure local storage is up to date
      try {
        localStorage.setItem('career_definer_confirmed_resume', JSON.stringify(dataToUse));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      // Ensure backend has confirmed status
      const confirmRes = await apiRequest('/api/resume/confirm', {
        method: 'POST',
        body: JSON.stringify({ resumeAnalysis: dataToUse }),
      });

      const resumeId = confirmRes.resume?.id || dataToUse.id;
      if (resumeId) {
        onNavigate(`/recommended-jobs?resumeId=${encodeURIComponent(resumeId)}`);
      } else {
        onNavigate('/recommended-jobs');
      }
    } catch (err) {
      console.error('Error proceeding to recommended jobs:', err);
      onNavigate('/recommended-jobs');
    } finally {
      setIsRecommending(false);
    }
  };

  // Legacy fallback support for older forms
  const handleAnalyzeConfirmedData = async (confirmedData: StructuredResumeData) => {
    handleExtractComplete();
  };

  // Run AI Analysis for raw text or manual upload
  const handleAnalyzeText = async () => {
    handleExtractComplete();
  };

  // Bookmark / Save Job Toggle
  const handleToggleSave = async (jobId: string) => {
    if (!isAuthenticated || !isStudent) {
      alert('Please log in as a student to save jobs to your profile.');
      return;
    }

    const current = savedJobIds[jobId];
    try {
      if (current) {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'DELETE' });
        setSavedJobIds((prev) => ({ ...prev, [jobId]: false }));
      } else {
        await apiRequest(`/api/student/saved-jobs/${jobId}`, { method: 'POST' });
        setSavedJobIds((prev) => ({ ...prev, [jobId]: true }));
      }
    } catch (err) {
      console.error('Failed to toggle save', err);
    }
  };

  // Reset scanner and start over
  const handleResetAll = () => {
    setAnalysisDone(false);
    setIsReviewingExtracted(false);
    setIsCameraScannerOpen(false);
    setResumeAnalysis(null);
    setIsConfirmed(false);
    setRecommendedGovtJobs([]);
    setRecommendedPrivateJobs([]);
    setSkillGapAnalysis(null);
    setExtractedData(null);
    setResumeText('');
    setFileName('');
    setOcrError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Matchmaking & Optical Scanner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Resume Assistant & Scanner
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Upload your digital resume or use your device camera to scan physical paper resumes. Our AI extracts your education, branch, competencies, and experience, providing transparent eligibility checks and matched Government & Private opportunities across all 28 Indian States.
          </p>
        </div>
      </div>

      {/* Two Clearly Visible Options: Upload Resume vs Scan Resume with Camera */}
      {!isReviewingExtracted && !analysisDone && (
        <div className="space-y-6">
          {/* Prominent Mode Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Upload Resume Card */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setIsCameraScannerOpen(false);
                setOcrError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                activeTab === 'upload' && !isCameraScannerOpen
                  ? 'border-blue-900 dark:border-amber-500 bg-blue-50/50 dark:bg-slate-800/80 shadow-md ring-2 ring-blue-900/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center shrink-0">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-amber-400">
                    Option 1
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    PDF / DOCX / IMG
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upload Resume File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a document from your computer or phone (.pdf, .docx, .png, .jpg).
                </p>
              </div>
            </button>

            {/* Option 2: Scan Resume with Camera Card */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setIsCameraScannerOpen(true);
                setOcrError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
                activeTab === 'camera' || isCameraScannerOpen
                  ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Option 2 &bull; New
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    Camera OCR
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scan Resume with Camera
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Photograph your printed paper resume using device camera with multi-page support.
                </p>
              </div>
            </button>
          </div>

          {/* OCR Error / Blurry Notification */}
          {ocrError && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Image Quality Notice:</span>
                <p>{ocrError}</p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsCameraScannerOpen(true);
                      setOcrError(null);
                    }}
                    className="font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline"
                  >
                    Open Camera to Retake
                  </button>
                  <span className="text-slate-400">&bull;</span>
                  <button
                    onClick={() => {
                      setActiveTab('upload');
                      setIsCameraScannerOpen(false);
                      setOcrError(null);
                    }}
                    className="font-bold text-blue-900 dark:text-amber-300 underline hover:no-underline"
                  >
                    Switch to File Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera Scanner View */}
          {isCameraScannerOpen && (
            <ResumeCameraScanner
              onProcessImages={handleProcessScannedImages}
              onClose={() => setIsCameraScannerOpen(false)}
              onFallbackToUpload={() => {
                setIsCameraScannerOpen(false);
                setActiveTab('upload');
              }}
              isProcessing={isOcrProcessing}
            />
          )}

          {/* Traditional File Upload & Paste View */}
          {!isCameraScannerOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Upload Box (2 Cols) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                    <span>Upload Resume Document</span>
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Accepted:</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">.PDF</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">.DOCX</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">.PNG</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">.JPG</span>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <label className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-700 dark:hover:border-amber-500 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <UploadCloud className="w-7 h-7 text-blue-900 dark:text-amber-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Click to browse or drag & drop your resume file here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supports PDF, DOCX, TXT, JPG, or PNG (up to 15MB)
                    </p>
                  </div>
                </label>

                {/* Upload Status / Progress */}
                {fileName && (
                  <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-900 dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-white truncate">{fileName}</span>
                      <span className="text-slate-500 dark:text-slate-400">({fileSize})</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready</span>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Reading File Data</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-900 dark:bg-amber-500 h-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Text Area for Resume Content / Direct Paste */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Resume Text / Academic Summary
                  </label>
                  <textarea
                    rows={5}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text, academic background, or project summary here..."
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500 font-mono leading-relaxed"
                  />
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={() => handleExtractComplete()}
                  disabled={isExtracting || isAnalyzing}
                  className="w-full py-3.5 px-6 bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isExtracting || isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Extracting Complete Resume Details...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Extract & Review Resume Details</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right: Quick Samples & Guidelines (1 Col) */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Quick-Load Sample Profiles</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test the AI analysis engine instantly with calibrated candidate archetypes:
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => loadSample('btech')}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">B.Tech (CSE) Graduate</div>
                        <div className="text-[11px] text-slate-500">Python, React, SQL, Aptitude</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => loadSample('degree')}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Degree Graduate (BA/B.Sc)</div>
                        <div className="text-[11px] text-slate-500">Public Admin, General Studies</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => loadSample('diploma')}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Diploma (Mechanical)</div>
                        <div className="text-[11px] text-slate-500">AutoCAD, Junior Engg prep</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => loadSample('twelfth')}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-amber-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">12th Pass (Intermediate)</div>
                        <div className="text-[11px] text-slate-500">Typing 35 WPM, CHSL / Clerk</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Statutory Disclaimer Card */}
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Statutory Advisory Disclaimer</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                    Career Definer AI Matcher is an algorithmic advisory tool. It does not claim or guarantee official recruitment selection or statutory eligibility. Please verify official recruitment notifications before applying.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Resume Details & Completeness View */}
      {isReviewingExtracted && resumeAnalysis && (
        <ResumeAnalysisView
          analysis={resumeAnalysis}
          isConfirmed={isConfirmed}
          onConfirm={handleConfirmAndRecommend}
          onSaveEdits={handleSaveResumeEdits}
          onNextRecommendedJobs={handleNextRecommendedJobs}
          onOpenProfileSync={() => onNavigate('/candidate-portal')}
          onUploadNew={handleResetAll}
          isRecommending={isRecommending}
        />
      )}

      {/* Fallback for legacy camera structured data */}
      {isReviewingExtracted && extractedData && !resumeAnalysis && (
        <ExtractedResumeForm
          initialData={extractedData}
          onConfirmAndAnalyze={handleAnalyzeConfirmedData}
          onRescan={() => {
            setIsReviewingExtracted(false);
            setIsCameraScannerOpen(true);
          }}
          onClear={handleResetAll}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* AI Recommendations & Analysis Results View - ONLY DISPLAYED AFTER USER CONFIRMATION */}
      {((analysisDone && analysis) || (isConfirmed && (recommendedGovtJobs.length > 0 || recommendedPrivateJobs.length > 0))) && (
        <div id="job-recommendations-section" className="space-y-8 animate-fadeIn pt-4">
          {/* Top Actions: Reset & Update My Profile */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Verified Candidate Profile &bull; Matched Opportunities Active
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {isAuthenticated && isStudent ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Sync verified resume details with your student profile"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Update My Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('/student/login')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-900 text-xs font-semibold"
                >
                  Log In to Save to Profile
                </button>
              )}

              <button
                type="button"
                onClick={handleResetAll}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload / Scan Another Resume</span>
              </button>
            </div>
          </div>

          {/* AI Resume Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Match Profile</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {analysis?.summary || 'Opportunities matched based on your verified qualifications, skills, and experience.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold">
                  Qual: {resumeAnalysis?.highestQualification || analysis?.detectedQualification}
                </span>
                {(resumeAnalysis?.degree || analysis?.detectedDegree) && (
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold">
                    {resumeAnalysis?.degree || analysis?.detectedDegree}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                  Exp: {resumeAnalysis?.workExperience || analysis?.detectedExperience || 'Fresher'}
                </span>
              </div>
            </div>

            {/* Extracted Skills Badges */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Matched Technical & Domain Skills ({((resumeAnalysis?.technicalSkills || analysis?.extractedSkills) || []).length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {((resumeAnalysis?.technicalSkills || analysis?.extractedSkills) || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Government Jobs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  <span>Recommended Government Jobs ({recommendedGovtJobs.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Commissions & Gazetted posts evaluated against statutory educational and branch eligibility
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedGovtJobs.map((item) => {
                const isSaved = savedJobIds[item.job.id];
                return (
                  <div
                    key={item.job.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-700 dark:hover:border-amber-500 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Header: Badge + Match Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                            Government
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.job.state || 'Central'}
                          </span>
                          {item.eligibilityStatus === 'ELIGIBLE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              ✓ Eligible
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              Verify Criteria
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                            item.matchScore >= 80
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                        >
                          {item.matchScore}% Match
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-blue-900 dark:text-blue-400">
                        {item.job.department || item.job.organization?.name || 'Recruiting Commission'}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {item.job.title}
                      </h3>

                      {/* Match Reason */}
                      {item.matchReason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 leading-relaxed">
                          <strong>Match Reason:</strong> {item.matchReason}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <strong>Qualification:</strong> {item.job.qualification}
                        </div>
                        <div>
                          <strong>Branch / Stream:</strong> {item.job.branch || 'Any Graduate'}
                        </div>
                        <div>
                          <strong>Pay Scale:</strong> {item.job.salary || 'Standard Govt Scale'}
                        </div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {item.job.status}
                          </span>
                        </div>
                      </div>

                      {/* Matching Skills */}
                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Matching Skills ({item.matchingSkills.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.matchingSkills.map((ms, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-900/60"
                            >
                              ✓ {ms}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Skills / Gaps */}
                      {item.missingSkills.length > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-amber-700 dark:text-amber-400">
                            Missing Skills / Syllabus Gaps:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.missingSkills.map((ms, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-medium border border-amber-200 dark:border-amber-900/60"
                              >
                                ! {ms}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skill Gap Advice */}
                      <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-slate-800/60 text-[11px] text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-slate-800 leading-relaxed">
                        <strong>Preparation Advice:</strong> {item.skillGapAdvice}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSave(item.job.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5" />}
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {item.job.applicationUrl && (
                          <a
                            href={item.job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-900 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            title="Official Recruitment Portal"
                          >
                            <span>Apply</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectJob(item.job)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Private Jobs Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-800 dark:text-indigo-400" />
                <span>Recommended Private Sector Jobs ({recommendedPrivateJobs.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Corporate software, engineering, and finance positions matched to candidate skills & location
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedPrivateJobs.map((item) => {
                const isSaved = savedJobIds[item.job.id];
                return (
                  <div
                    key={item.job.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-600 dark:hover:border-indigo-500 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase">
                            Private Sector
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.job.location || 'India'}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 shrink-0">
                          {item.matchScore}% Match
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                        {item.job.company || item.job.organization?.name || 'Corporate Employer'}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {item.job.title}
                      </h3>

                      {/* Match Reason */}
                      {item.matchReason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 leading-relaxed">
                          <strong>Match Reason:</strong> {item.matchReason}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <strong>Qualification:</strong> {item.job.qualification}
                        </div>
                        <div>
                          <strong>Experience:</strong> {item.job.experience || '0 - 2 Years'}
                        </div>
                        <div>
                          <strong>Salary Range:</strong> {item.job.salary || 'Market Competitive'}
                        </div>
                        <div>
                          <strong>Industry:</strong> {item.job.industry || 'Technology / Services'}
                        </div>
                      </div>

                      {/* Required Skills */}
                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          Required Competencies:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.job.skillsRequired?.map((sk, idx) => {
                            const isMatch = item.matchingSkills.includes(sk);
                            return (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isMatch
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {isMatch ? '✓ ' : ''}
                                {sk}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Domain Guidance */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 leading-relaxed">
                        <strong>Skill Advisory:</strong> {item.skillGapAdvice}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSave(item.job.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5" />}
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {item.job.applicationUrl && (
                          <a
                            href={item.job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            title="Official Career Portal"
                          >
                            <span>Apply</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectJob(item.job)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Gap Analysis Section */}
          {skillGapAnalysis && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>Comprehensive Skill Gap Analysis & Roadmap</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted recommendations to upgrade qualification standing and interview competitiveness
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Existing vs Missing Skills */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Existing Verified Skills ({skillGapAnalysis.existingSkills.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapAnalysis.existingSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Recommended Skills to Prioritize</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapAnalysis.recommendedSkillsToLearn.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800"
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggested Courses & Certifications */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-900 dark:text-amber-400" />
                    <span>Suggested Official Courses & Certification Portals</span>
                  </h3>
                  <div className="space-y-2">
                    {skillGapAnalysis.suggestedCourses.map((course, idx) => (
                      <a
                        key={idx}
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-700 dark:hover:border-amber-400 block transition-all group"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400">
                          <span>{course.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 dark:group-hover:text-amber-400" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>{course.provider}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {course.type}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3-Stage Career Roadmap */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Strategic Career Roadmap</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {skillGapAnalysis.careerRoadmap.map((stage, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="text-xs font-extrabold text-blue-900 dark:text-amber-400">
                        {stage.phase}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {stage.focus}
                      </p>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                        Milestone: {stage.milestone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Sync Modal */}
      {confirmedResumeData && (
        <ProfileSyncModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          confirmedData={confirmedResumeData}
          currentProfile={currentProfile}
          onProfileUpdated={() => {
            if (isAuthenticated && isStudent) {
              apiRequest('/api/student/profile').then((res) => {
                if (res.success && res.profile) {
                  setCurrentProfile(res.profile);
                }
              });
            }
          }}
        />
      )}
    </div>
  );
};
