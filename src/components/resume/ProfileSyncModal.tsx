import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StudentProfile } from '../../types.ts';
import { StructuredResumeData } from './ExtractedResumeForm.tsx';

interface ProfileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmedData: any;
  currentProfile: StudentProfile | null;
  onProfileUpdated: () => void;
}

export const ProfileSyncModal: React.FC<ProfileSyncModalProps> = ({
  isOpen,
  onClose,
  confirmedData,
  currentProfile,
  onProfileUpdated,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const qualVal = confirmedData?.highestQualification || confirmedData?.qualification || '';
  const collegeVal = confirmedData?.collegeOrUniversity || confirmedData?.college || '';
  const degreeVal = confirmedData?.degree || '';
  const branchVal = confirmedData?.branch || '';
  const gradYearVal = confirmedData?.graduationYear || '';

  const currentSkills = currentProfile?.skills || [];
  const resumeSkills = confirmedData?.technicalSkills || [];
  const newSkillsToAdd = resumeSkills.filter(
    (sk: string) => !currentSkills.some((cs: string) => cs.toLowerCase() === sk.toLowerCase())
  );

  const diffItems = [
    {
      label: 'Highest Qualification',
      current: currentProfile?.highestQualification || currentProfile?.qualification || 'Not Specified',
      updated: qualVal && qualVal !== 'Not mentioned in resume' ? qualVal : 'Not Specified',
      hasChanged: !!qualVal && qualVal !== 'Not mentioned in resume' && qualVal !== (currentProfile?.highestQualification || ''),
    },
    {
      label: 'Course / Degree',
      current: currentProfile?.courseDegree || 'Not Specified',
      updated: degreeVal && degreeVal !== 'Not mentioned in resume' ? degreeVal : 'Not Specified',
      hasChanged: !!degreeVal && degreeVal !== 'Not mentioned in resume' && degreeVal !== currentProfile?.courseDegree,
    },
    {
      label: 'Branch / Stream',
      current: currentProfile?.branchStream || currentProfile?.branch || 'Not Specified',
      updated: branchVal && branchVal !== 'Not mentioned in resume' ? branchVal : 'Not Specified',
      hasChanged: !!branchVal && branchVal !== 'Not mentioned in resume' && branchVal !== (currentProfile?.branchStream || currentProfile?.branch),
    },
    {
      label: 'College / Institution',
      current: currentProfile?.institution || 'Not Specified',
      updated: collegeVal && collegeVal !== 'Not mentioned in resume' ? collegeVal : 'Not Specified',
      hasChanged: !!collegeVal && collegeVal !== 'Not mentioned in resume' && collegeVal !== currentProfile?.institution,
    },
    {
      label: 'Passing Year',
      current: currentProfile?.passingYear ? String(currentProfile.passingYear) : 'Not Specified',
      updated: gradYearVal && gradYearVal !== 'Not mentioned in resume' ? gradYearVal : 'Not Specified',
      hasChanged: !!gradYearVal && gradYearVal !== 'Not mentioned in resume' && gradYearVal !== String(currentProfile?.passingYear || ''),
    },
  ];

  const handleConfirmSync = async () => {
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const payload = {
        qualification: qualVal && qualVal !== 'Not mentioned in resume' ? qualVal : undefined,
        degree: degreeVal && degreeVal !== 'Not mentioned in resume' ? degreeVal : undefined,
        branch: branchVal && branchVal !== 'Not mentioned in resume' ? branchVal : undefined,
        institution: collegeVal && collegeVal !== 'Not mentioned in resume' ? collegeVal : undefined,
        passingYear: gradYearVal && gradYearVal !== 'Not mentioned in resume' ? gradYearVal : undefined,
        skills: confirmedData.technicalSkills,
        interests: confirmedData.careerInterests && confirmedData.careerInterests !== 'Not mentioned in resume' ? [confirmedData.careerInterests] : undefined,
      };

      const res = await apiRequest('/api/student/profile/sync-resume', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setUpdateSuccess(true);
        onProfileUpdated();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error('Profile sync error:', err);
      setErrorMessage('Network or server error updating student profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Update My Student Profile</h3>
              <p className="text-[11px] text-slate-300">Synchronize verified resume credentials with your permanent profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {updateSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Profile Updated Successfully!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your educational credentials and new skills from your scanned resume have been safely merged into your candidate profile.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Review the differences between your existing profile data and the information extracted from your resume. No data is overwritten without your confirmation.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Side-by-side Diff Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="col-span-4">Field</div>
                  <div className="col-span-4">Current Profile</div>
                  <div className="col-span-4">Scanned Resume (New)</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {diffItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 px-4 py-3 items-center ${
                        item.hasChanged
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </div>
                      <div className="col-span-4 text-slate-500 dark:text-slate-400 truncate pr-2">
                        {item.current}
                      </div>
                      <div className="col-span-4 flex items-center gap-1.5 font-semibold">
                        <span
                          className={`truncate ${
                            item.hasChanged
                              ? 'text-blue-900 dark:text-amber-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.updated}
                        </span>
                        {item.hasChanged && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Diff Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Skills Merging Strategy:</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    +{newSkillsToAdd.length} New Competencies Detected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {newSkillsToAdd.length > 0 ? (
                    newSkillsToAdd.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800"
                      >
                        +{sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      All resume skills already present in your current profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSync}
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Updating Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Confirm & Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
