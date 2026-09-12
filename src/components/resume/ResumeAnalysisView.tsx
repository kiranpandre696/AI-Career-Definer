import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Wrench,
  Briefcase,
  FolderGit2,
  Award,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentResumeAnalysis, ResumeProjectItem, ResumeCertificationItem } from '../../types.ts';

interface ResumeAnalysisViewProps {
  analysis: StudentResumeAnalysis;
  isConfirmed: boolean;
  onConfirm: () => void;
  onSaveEdits: (updated: StudentResumeAnalysis) => void;
  onNextRecommendedJobs?: () => void;
  onOpenProfileSync?: () => void;
  onUploadNew: () => void;
  isRecommending?: boolean;
}

export const ResumeAnalysisView: React.FC<ResumeAnalysisViewProps> = ({
  analysis,
  isConfirmed,
  onConfirm,
  onSaveEdits,
  onNextRecommendedJobs,
  onOpenProfileSync,
  onUploadNew,
  isRecommending = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<StudentResumeAnalysis>({ ...analysis });
  const [newSkill, setNewSkill] = useState('');
  const [newLang, setNewLang] = useState('');
  const [confirmWarning, setConfirmWarning] = useState<string | null>(null);

  // Sync editForm when analysis changes
  React.useEffect(() => {
    setEditForm({ ...analysis });
  }, [analysis]);

  const handleSaveEdits = () => {
    onSaveEdits(editForm);
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditForm({ ...analysis });
    setIsEditing(false);
  };

  const handleNextRecommendedJobsClick = () => {
    if (!isConfirmed) {
      setConfirmWarning('Please confirm your resume details before viewing recommended jobs.');
      return;
    }
    setConfirmWarning(null);
    if (onNextRecommendedJobs) {
      onNextRecommendedJobs();
    }
  };

  // Helper for empty strings
  const displayVal = (val: string | undefined) => {
    if (!val || val.trim() === '' || val.trim().toLowerCase() === 'not mentioned in resume') {
      return <span className="text-slate-400 italic text-sm">Not mentioned in resume</span>;
    }
    return <span className="text-slate-800 font-medium text-sm">{val}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Warning Banner */}
      {confirmWarning && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 text-xs sm:text-sm shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-semibold">{confirmWarning}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setConfirmWarning(null);
                onConfirm();
              }}
              className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Confirm Details Now
            </button>
            <button
              type="button"
              onClick={() => setConfirmWarning(null)}
              className="px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Status and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isConfirmed
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}
          >
            {isConfirmed ? <ShieldCheck className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isConfirmed ? 'Confirmed Resume Profile' : 'Extracted Resume Analysis'}
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isConfirmed ? 'Status: Confirmed' : 'Step 4: Pending Confirmation'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {isConfirmed
                ? 'Your resume details are confirmed. Proceed to Recommended Jobs to view tailored opportunities.'
                : 'Please review all extracted sections. You can edit any details before confirming.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-600" />
                Edit Details
              </button>

              {!isConfirmed ? (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isRecommending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRecommending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Matching Jobs...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Confirm Resume
                    </>
                  )}
                </button>
              ) : onOpenProfileSync ? (
                <button
                  type="button"
                  onClick={onOpenProfileSync}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Update My Profile
                </button>
              ) : null}

              {/* Next: Recommended Jobs Button */}
              <button
                type="button"
                onClick={handleNextRecommendedJobsClick}
                disabled={isRecommending}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                  isConfirmed
                    ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
                }`}
                title={isConfirmed ? 'Navigate to recommended jobs' : 'Confirm resume details first'}
              >
                {isRecommending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Finding jobs...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Recommended Jobs</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onUploadNew}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Upload or scan a different resume"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload New
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdits}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Resume Quality & Completeness Check */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-xl border border-blue-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {analysis.completeness?.scorePercent || 70}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Resume Quality Check
                <span className="text-xs font-normal text-slate-600">
                  ({analysis.completeness?.scorePercent || 70}% completeness score)
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                A thorough resume helps identify both Government examination qualification criteria and Private sector skill alignment.
              </p>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span
              className={`px-2.5 py-1 rounded-full border ${
                analysis.completeness?.education === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Education: {analysis.completeness?.education || 'Available'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full border ${
                analysis.completeness?.skills === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Skills: {analysis.completeness?.skills || 'Available'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full border ${
                analysis.completeness?.projects === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Projects: {analysis.completeness?.projects || 'Not mentioned'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full border ${
                analysis.completeness?.experience === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Experience: {analysis.completeness?.experience || 'Not mentioned'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full border ${
                analysis.completeness?.careerInterests === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Interests: {analysis.completeness?.careerInterests || 'Not mentioned'}
            </span>
          </div>
        </div>

        {/* Quality Advice notes */}
        {analysis.completeness?.missingNotes && analysis.completeness.missingNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-100/80 space-y-1.5">
            {analysis.completeness.missingNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-blue-900/90">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editable or Display View */}
      {isEditing ? (
        /* ================= EDITING FORM ================= */
        <div className="bg-white rounded-xl border border-blue-300 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              Edit Extracted Resume Details
            </h3>
            <span className="text-xs text-slate-500">Changes will be saved locally to this analysis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Information</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName === 'Not mentioned in resume' ? '' : editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email === 'Not mentioned in resume' ? '' : editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber === 'Not mentioned in resume' ? '' : editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location === 'Not mentioned in resume' ? '' : editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state === 'Not mentioned in resume' ? '' : editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="e.g. Telangana"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">District / City</label>
                  <input
                    type="text"
                    value={editForm.districtOrCity === 'Not mentioned in resume' ? '' : editForm.districtOrCity}
                    onChange={(e) => setEditForm({ ...editForm, districtOrCity: e.target.value })}
                    placeholder="e.g. Rangareddy"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Education Details</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Highest Qualification</label>
                  <select
                    value={editForm.highestQualification}
                    onChange={(e) => setEditForm({ ...editForm, highestQualification: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10th">10th (Matriculation)</option>
                    <option value="12th">12th (Intermediate / 10+2)</option>
                    <option value="Diploma">Diploma (Polytechnic)</option>
                    <option value="Graduation">Graduation (General)</option>
                    <option value="B.A">Bachelor of Arts (B.A)</option>
                    <option value="B.Com">Bachelor of Commerce (B.Com)</option>
                    <option value="B.Sc">Bachelor of Science (B.Sc)</option>
                    <option value="B.Tech">Bachelor of Technology (B.Tech)</option>
                    <option value="B.E">Bachelor of Engineering (B.E)</option>
                    <option value="M.Tech">Master of Technology (M.Tech)</option>
                    <option value="Post Graduation">Post Graduation / Masters</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Course / Degree</label>
                  <input
                    type="text"
                    value={editForm.degree === 'Not mentioned in resume' ? '' : editForm.degree}
                    onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Branch / Specialization</label>
                  <input
                    type="text"
                    value={editForm.branch === 'Not mentioned in resume' ? '' : editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={editForm.graduationYear === 'Not mentioned in resume' ? '' : editForm.graduationYear}
                    onChange={(e) => setEditForm({ ...editForm, graduationYear: e.target.value })}
                    placeholder="e.g. 2025"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">College or University</label>
                <input
                  type="text"
                  value={editForm.collegeOrUniversity === 'Not mentioned in resume' ? '' : editForm.collegeOrUniversity}
                  onChange={(e) => setEditForm({ ...editForm, collegeOrUniversity: e.target.value })}
                  placeholder="e.g. Osmania University / JNTU"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skills & Technologies</h4>
            <div className="flex flex-wrap gap-1.5">
              {editForm.technicalSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-slate-300 text-slate-800 rounded-md shadow-2xs"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        technicalSkills: editForm.technicalSkills.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-slate-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSkill.trim() && !editForm.technicalSkills.includes(newSkill.trim())) {
                      setEditForm({
                        ...editForm,
                        technicalSkills: [...editForm.technicalSkills, newSkill.trim()],
                      });
                      setNewSkill('');
                    }
                  }
                }}
                placeholder="Add a skill (e.g. Python, SQL, React) and press Enter"
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSkill.trim() && !editForm.technicalSkills.includes(newSkill.trim())) {
                    setEditForm({
                      ...editForm,
                      technicalSkills: [...editForm.technicalSkills, newSkill.trim()],
                    });
                    setNewSkill('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md cursor-pointer"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Career Interests & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Career Interests</h4>
              <input
                type="text"
                value={editForm.careerInterests === 'Not mentioned in resume' ? '' : editForm.careerInterests}
                onChange={(e) => setEditForm({ ...editForm, careerInterests: e.target.value })}
                placeholder="e.g. Civil Services, Software Engineer, Banking PO"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Work Experience</h4>
              <input
                type="text"
                value={editForm.workExperience === 'Not mentioned in resume' ? '' : editForm.workExperience}
                onChange={(e) => setEditForm({ ...editForm, workExperience: e.target.value })}
                placeholder="e.g. Fresher / 1 Year Software Developer at ABC Corp"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelEdits}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdits}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
            >
              Save Details
            </button>
          </div>
        </div>
      ) : (
        /* ================= STRUCTURED DISPLAY CARDS ================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <User className="w-4 h-4 text-blue-600" />
              1. Personal Information
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Full Name</span>
                {displayVal(analysis.fullName)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Email Address</span>
                {displayVal(analysis.email)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Mobile Number</span>
                {displayVal(analysis.mobileNumber)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Location / City</span>
                {displayVal(analysis.location)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">State</span>
                {displayVal(analysis.state)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">District</span>
                {displayVal(analysis.districtOrCity)}
              </div>
            </div>
          </div>

          {/* Card 2: Education */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              2. Education & Qualifications
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Highest Qualification</span>
                <span className="inline-block px-2 py-0.5 mt-0.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">
                  {analysis.highestQualification || 'Graduation'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Course / Degree</span>
                {displayVal(analysis.degree)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Branch / Specialization</span>
                {displayVal(analysis.branch)}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Passing / Graduation Year</span>
                {displayVal(analysis.graduationYear)}
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-xs">College / University</span>
                {displayVal(analysis.collegeOrUniversity)}
              </div>
            </div>
          </div>

          {/* Card 3: Skills & Tools */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Wrench className="w-4 h-4 text-emerald-600" />
                3. Skills & Competencies
              </div>
              <span className="text-xs text-slate-500">
                Total: {(analysis.technicalSkills?.length || 0) + (analysis.softSkills?.length || 0)} skills
              </span>
            </div>

            <div className="space-y-3">
              {/* Technical Skills */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Technical & Programming Skills:
                </span>
                {analysis.technicalSkills && analysis.technicalSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.technicalSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">Not mentioned in resume</span>
                )}
              </div>

              {/* Software Tools */}
              {analysis.softwareTools && analysis.softwareTools.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">Software Tools:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.softwareTools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-md"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">Soft Skills:</span>
                {analysis.softSkills && analysis.softSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.softSkills.map((ss, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-md"
                      >
                        {ss}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">Not mentioned in resume</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Work & Internship Experience */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <Briefcase className="w-4 h-4 text-amber-600" />
              4. Experience & Internships
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Work Experience</span>
                {displayVal(analysis.workExperience)}
              </div>
              {analysis.companyNames && analysis.companyNames.length > 0 && (
                <div>
                  <span className="text-slate-500 block text-xs">Companies</span>
                  <span className="text-slate-800 font-medium">{analysis.companyNames.join(', ')}</span>
                </div>
              )}
              {analysis.jobRoles && analysis.jobRoles.length > 0 && (
                <div>
                  <span className="text-slate-500 block text-xs">Job Roles</span>
                  <span className="text-slate-800 font-medium">{analysis.jobRoles.join(', ')}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-xs">Internship Experience</span>
                {displayVal(analysis.internshipExperience)}
              </div>
              {analysis.duration && analysis.duration !== 'Not mentioned in resume' && (
                <div>
                  <span className="text-slate-500 block text-xs">Duration</span>
                  <span className="text-slate-800 font-medium">{analysis.duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Projects */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <FolderGit2 className="w-4 h-4 text-purple-600" />
              5. Projects
            </div>
            {analysis.projects && analysis.projects.length > 0 ? (
              <div className="space-y-2.5">
                {analysis.projects.map((proj, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <h5 className="font-bold text-slate-900 text-sm">{proj.title}</h5>
                    {proj.description && <p className="text-slate-600 mt-1">{proj.description}</p>}
                    {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {proj.technologiesUsed.map((tech, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs">Not mentioned in resume</p>
            )}
          </div>

          {/* Card 6: Certifications */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <Award className="w-4 h-4 text-amber-500" />
              6. Certifications & Training
            </div>
            {analysis.certifications && analysis.certifications.length > 0 ? (
              <div className="space-y-2">
                {analysis.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{cert.name}</span>
                      {cert.issuingOrganization && (
                        <span className="text-slate-500">{cert.issuingOrganization}</span>
                      )}
                    </div>
                    {cert.completionDate && (
                      <span className="text-[11px] text-slate-400">{cert.completionDate}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs">Not mentioned in resume</p>
            )}
          </div>

          {/* Card 7: Other Details */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
              <Globe2 className="w-4 h-4 text-cyan-600" />
              7. Other Details & Interests
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Languages Known</span>
                {analysis.languagesKnown && analysis.languagesKnown.length > 0 ? (
                  <span className="text-slate-800 font-medium">{analysis.languagesKnown.join(', ')}</span>
                ) : (
                  <span className="text-slate-400 italic text-xs">Not mentioned in resume</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Career Interests</span>
                {displayVal(analysis.careerInterests)}
              </div>
              {analysis.achievements && analysis.achievements.length > 0 && (
                <div>
                  <span className="text-slate-500 block text-xs">Achievements</span>
                  <span className="text-slate-800 font-medium">{analysis.achievements.join('; ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Step 5 Confirmation Banner */}
      {!isConfirmed && !isEditing && (
        <div className="bg-amber-50 border-2 border-amber-300/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="font-bold text-amber-950 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Review & Confirm Your Details
            </h4>
            <p className="text-xs sm:text-sm text-amber-900 mt-1 max-w-xl">
              Please verify the information above. Once confirmed, Career Definer will match your credentials against active Government Vacancies and Verified Corporate Job openings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isRecommending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Confirm Resume</span>
            </button>

            <button
              type="button"
              onClick={handleNextRecommendedJobsClick}
              disabled={isRecommending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-blue-900 bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-blue-800 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <span>Next: Recommended Jobs</span>
              <ArrowRight className="w-4 h-4 text-blue-800" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmed Banner with Next Action */}
      {isConfirmed && !isEditing && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="font-bold text-emerald-950 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Resume Details Verified & Confirmed!
            </h4>
            <p className="text-xs sm:text-sm text-emerald-900 mt-1 max-w-xl">
              Your academic qualifications, skills, and eligibility are preserved. Click Next to explore tailored Government and Private sector opportunities.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNextRecommendedJobsClick}
            disabled={isRecommending}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shrink-0"
          >
            {isRecommending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Finding jobs based on your resume...</span>
              </>
            ) : (
              <>
                <span>Next: Recommended Jobs</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
