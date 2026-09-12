import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Sparkles,
  Plus,
  X,
  BookOpen,
  Award,
  Briefcase,
  GraduationCap,
  Globe,
  Compass,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Building,
} from 'lucide-react';

export interface StructuredResumeData {
  studentName?: string;
  qualification?: string;
  degree?: string;
  branch?: string;
  college?: string;
  graduationYear?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  certifications?: string[];
  projects?: string[];
  internships?: string[];
  experience?: string;
  languages?: string[];
  careerInterests?: string;
  rawText?: string;
  isLegible?: boolean;
  qualityNotes?: string;
}

interface ExtractedResumeFormProps {
  initialData: StructuredResumeData;
  onConfirmAndAnalyze: (confirmedData: StructuredResumeData) => void;
  onRescan: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
}

export const ExtractedResumeForm: React.FC<ExtractedResumeFormProps> = ({
  initialData,
  onConfirmAndAnalyze,
  onRescan,
  onClear,
  isAnalyzing,
}) => {
  const [formData, setFormData] = useState<StructuredResumeData>({
    studentName: initialData.studentName || '',
    qualification: initialData.qualification || 'Graduation',
    degree: initialData.degree || '',
    branch: initialData.branch || '',
    college: initialData.college || '',
    graduationYear: initialData.graduationYear || '',
    experience: initialData.experience || 'Fresher',
    careerInterests: initialData.careerInterests || '',
    technicalSkills: initialData.technicalSkills || [],
    softSkills: initialData.softSkills || [],
    certifications: initialData.certifications || [],
    projects: initialData.projects || [],
    internships: initialData.internships || [],
    languages: initialData.languages || ['English'],
    rawText: initialData.rawText || '',
    qualityNotes: initialData.qualityNotes || '',
  });

  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newProject, setNewProject] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // Skill management
  const handleAddTechSkill = () => {
    const trimmed = newTechSkill.trim();
    if (trimmed && !formData.technicalSkills?.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        technicalSkills: [...(prev.technicalSkills || []), trimmed],
      }));
      setNewTechSkill('');
    }
  };

  const handleRemoveTechSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      technicalSkills: (prev.technicalSkills || []).filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddSoftSkill = () => {
    const trimmed = newSoftSkill.trim();
    if (trimmed && !formData.softSkills?.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        softSkills: [...(prev.softSkills || []), trimmed],
      }));
      setNewSoftSkill('');
    }
  };

  const handleRemoveSoftSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      softSkills: (prev.softSkills || []).filter((s) => s !== skillToRemove),
    }));
  };

  // Certifications management
  const handleAddCert = () => {
    const trimmed = newCert.trim();
    if (trimmed) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...(prev.certifications || []), trimmed],
      }));
      setNewCert('');
    }
  };

  const handleRemoveCert = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index),
    }));
  };

  // Projects management
  const handleAddProject = () => {
    const trimmed = newProject.trim();
    if (trimmed) {
      setFormData((prev) => ({
        ...prev,
        projects: [...(prev.projects || []), trimmed],
      }));
      setNewProject('');
    }
  };

  const handleRemoveProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAndAnalyze(formData);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Document Understanding Complete</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Review Extracted Resume Information
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Please verify the OCR transcribed details. You can correct fields, add missing skills, and confirm to generate AI Job Recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRescan}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake / Rescan</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-3.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Data</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* Quality Notice Banner */}
        {formData.qualityNotes && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">AI OCR Extraction Verification:</span>
              <p className="text-slate-600 dark:text-slate-300">{formData.qualityNotes}</p>
            </div>
          </div>
        )}

        {/* Section 1: Candidate & Educational Qualifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <GraduationCap className="w-4 h-4 text-blue-900 dark:text-amber-400" />
            <span>Academic Credentials & Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Candidate Name
              </label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="e.g. Sai Kiran"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
              />
            </div>

            {/* Highest Qualification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highest Educational Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500 font-semibold"
              >
                <option value="10th">10th Pass (Matriculation)</option>
                <option value="12th">12th Pass (Higher Secondary / Intermediate)</option>
                <option value="Diploma">Diploma (Polytechnic)</option>
                <option value="Graduation">Graduation (BA, B.Sc, B.Com, etc.)</option>
                <option value="B.Tech">B.Tech / B.E (Engineering)</option>
                <option value="Post Graduation">Post Graduation (M.Tech, MBA, M.Sc, etc.)</option>
              </select>
            </div>

            {/* Degree Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Degree / Course Title
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
              />
            </div>

            {/* Branch / Stream */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. Computer Science, Civil, Commerce"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
              />
            </div>

            {/* College or University */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College or University
              </label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="e.g. Jawaharlal Nehru Technological University"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
              />
            </div>

            {/* Passing Year & Experience */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Passing Year
                </label>
                <input
                  type="text"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="e.g. 2024"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Experience
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500 font-semibold"
                >
                  <option value="Fresher">Fresher</option>
                  <option value="1-2 Years">1 - 2 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Technical & Core Competencies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Technical & Domain Skills ({formData.technicalSkills?.length || 0})</span>
            </h3>
            <span className="text-[11px] text-slate-500">Press Enter or click Add</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
            {formData.technicalSkills && formData.technicalSkills.length > 0 ? (
              formData.technicalSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-2xs group"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTechSkill(skill)}
                    className="text-blue-700 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400"
                    title="Remove skill"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No technical skills added yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTechSkill}
              onChange={(e) => setNewTechSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTechSkill();
                }
              }}
              placeholder="Add missing skill (e.g. Java, Python, SQL, AutoCAD, Tally, GST)..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleAddTechSkill}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Section 3: Soft Skills & Aptitude */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Soft Skills & Aptitude Competencies ({formData.softSkills?.length || 0})</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
            {formData.softSkills && formData.softSkills.length > 0 ? (
              formData.softSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold shadow-2xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSoftSkill(skill)}
                    className="text-emerald-700 hover:text-red-600 dark:text-emerald-400 dark:hover:text-red-400"
                    title="Remove skill"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No soft skills listed.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSoftSkill();
                }
              }}
              placeholder="Add soft skill (e.g. Quantitative Aptitude, Logical Reasoning, Public Administration)..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleAddSoftSkill}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Section 4: Projects, Certifications & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projects */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-900 dark:text-amber-400" />
              <span>Academic Projects & Internships</span>
            </h4>

            <div className="space-y-2">
              {formData.projects?.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2"
                >
                  <span className="text-slate-800 dark:text-slate-200 truncate">{proj}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="Project title or internship summary..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Certifications & Goals */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Certifications</span>
              </h4>

              <div className="space-y-2">
                {formData.certifications?.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-800 dark:text-slate-200 truncate">{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCert(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Certificate title..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Career Goals / Interests
              </label>
              <input
                type="text"
                value={formData.careerInterests}
                onChange={(e) => setFormData({ ...formData, careerInterests: e.target.value })}
                placeholder="e.g. UPSC Civil Services, Software Engineering, Bank PO, SSC JE"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Raw OCR Transcript */}
        {formData.rawText && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>View Full Optical OCR Transcript Text</span>
              </div>
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRawText && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border-t border-slate-800">
                {formData.rawText}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Verified resume data will be matched with 280+ Central, State, and Corporate recruitments.
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Analyzing Eligibility & Matching Jobs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Confirm & Analyze Resume</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
