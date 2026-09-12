import React, { useState } from 'react';
import { X, Building2, Briefcase, Calendar, MapPin, CheckCircle, GraduationCap } from 'lucide-react';
import { Job, Organization, StateEntity, Examination } from '../../types.ts';
import { apiRequest } from '../../lib/api.ts';

interface AdminJobModalProps {
  initialData: Job | null;
  organizations: Organization[];
  states: StateEntity[];
  examinations: Examination[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminJobModal: React.FC<AdminJobModalProps> = ({
  initialData,
  organizations,
  states,
  examinations,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<Job>>({
    title: initialData?.title || '',
    jobType: initialData?.jobType || 'GOVERNMENT',
    category: initialData?.category || 'CENTRAL',
    companyName: initialData?.companyName || '',
    organizationId: initialData?.organizationId || organizations[0]?.id || '',
    examinationId: initialData?.examinationId || '',
    stateId: initialData?.stateId || '',
    qualification: initialData?.qualification || 'Graduation',
    branch: initialData?.branch || '',
    vacancies: initialData?.vacancies || '100',
    minAge: initialData?.minAge || 18,
    maxAge: initialData?.maxAge || 32,
    salary: initialData?.salary || 'Level 7 (₹44,900 - ₹1,42,400)',
    location: initialData?.location || 'Pan-India',
    applicationStartDate: initialData?.applicationStartDate || new Date().toISOString().split('T')[0],
    applicationEndDate: initialData?.applicationEndDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    selectionProcess: initialData?.selectionProcess || 'Written Examination -> Document Verification',
    officialApplicationUrl: initialData?.officialApplicationUrl || 'https://govportal.nic.in/apply',
    officialNotificationUrl: initialData?.officialNotificationUrl || 'https://govportal.nic.in/notice.pdf',
    description: initialData?.description || '',
    status: initialData?.status || 'PUBLISHED',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = initialData?.id ? `/api/admin/jobs/${initialData.id}` : '/api/admin/jobs';
      const method = initialData?.id ? 'PUT' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || res.error || 'Failed to save job record');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Network error saving job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
              Opportunity Directory
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {initialData ? 'Edit Vacancy Advertisement' : 'Publish New Vacancy Advertisement'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Job Type Toggle: Government vs Private */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, jobType: 'GOVERNMENT' })}
              className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formData.jobType === 'GOVERNMENT'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Government Opportunity
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, jobType: 'PRIVATE' })}
              className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formData.jobType === 'PRIVATE'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Private / Corporate Role
            </button>
          </div>

          {/* Job Title */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Recruitment Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. UPSC Assistant Commandant / ISRO Scientist Recruitment"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Organization vs Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.jobType === 'GOVERNMENT' ? (
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Commission / Recruiting Authority *
                </label>
                <select
                  value={formData.organizationId || ''}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Select Commission / Body</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.shortName} — {org.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Company / Corporate Employer *
                </label>
                <input
                  type="text"
                  required={formData.jobType === 'PRIVATE'}
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Tata Consultancy Services / Infosys"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Category / Cadre
              </label>
              <select
                value={formData.category || 'CENTRAL'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="CENTRAL">Central Government</option>
                <option value="STATE">State Government</option>
                <option value="DEFENCE">Defence Services</option>
                <option value="BANKING">Banking & Financial</option>
                <option value="RAILWAY">Indian Railways</option>
                <option value="CORPORATE">Private / Corporate</option>
              </select>
            </div>
          </div>

          {/* Qualification & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Minimum Qualification *
              </label>
              <select
                value={formData.qualification || 'Graduation'}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="10th">10th Pass (Matriculation)</option>
                <option value="12th">12th Pass (Intermediate / Higher Secondary)</option>
                <option value="Diploma">Diploma (Polytechnic / Technical)</option>
                <option value="Graduation">Degree / Graduation (BA, B.Sc, B.Com, etc.)</option>
                <option value="B.Tech">B.Tech / B.E. (Engineering)</option>
                <option value="Post Graduation">Post Graduate (M.Sc, M.Tech, MBA)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. Any Discipline / Computer Science / Civil"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Vacancies, Salary & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Vacancies Count
              </label>
              <input
                type="text"
                value={formData.vacancies || ''}
                onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                placeholder="e.g. 520"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Salary / Pay Scale
              </label>
              <input
                type="text"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. ₹56,100 - ₹1,77,500 / ₹8.5 LPA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Location / Posting
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Pan-India / Hyderabad / New Delhi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Age Limits & Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Min Age
              </label>
              <input
                type="number"
                value={formData.minAge || 18}
                onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Max Age
              </label>
              <input
                type="number"
                value={formData.maxAge || 32}
                onChange={(e) => setFormData({ ...formData, maxAge: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.applicationStartDate || ''}
                onChange={(e) => setFormData({ ...formData, applicationStartDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Last Date *
              </label>
              <input
                type="date"
                required
                value={formData.applicationEndDate || ''}
                onChange={(e) => setFormData({ ...formData, applicationEndDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Official Application Portal URL *
              </label>
              <input
                type="url"
                required
                value={formData.officialApplicationUrl || ''}
                onChange={(e) => setFormData({ ...formData, officialApplicationUrl: e.target.value })}
                placeholder="https://upsconline.nic.in"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Official Gazette / PDF Notification URL
              </label>
              <input
                type="url"
                value={formData.officialNotificationUrl || ''}
                onChange={(e) => setFormData({ ...formData, officialNotificationUrl: e.target.value })}
                placeholder="https://upsc.gov.in/notification.pdf"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Selection Process & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Selection Process Overview
              </label>
              <input
                type="text"
                value={formData.selectionProcess || ''}
                onChange={(e) => setFormData({ ...formData, selectionProcess: e.target.value })}
                placeholder="e.g. Preliminary Exam -> Main Exam -> Interview"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Publish Status
              </label>
              <select
                value={formData.status || 'PUBLISHED'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
              >
                <option value="PUBLISHED">Published (Visible to public)</option>
                <option value="DRAFT">Draft (Internal review)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Submit Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Opportunity...' : initialData ? 'Save Changes' : 'Publish Vacancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
