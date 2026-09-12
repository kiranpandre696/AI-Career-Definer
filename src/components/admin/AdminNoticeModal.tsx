import React, { useState } from 'react';
import { X, Bell, Link, Building2 } from 'lucide-react';
import { Notice } from '../../types.ts';
import { apiRequest } from '../../lib/api.ts';

interface AdminNoticeModalProps {
  initialData: Notice | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminNoticeModal: React.FC<AdminNoticeModalProps> = ({
  initialData,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<Notice>>({
    title: initialData?.title || '',
    organizationName: initialData?.organizationName || 'UPSC',
    category: initialData?.category || 'CENTRAL',
    status: initialData?.status || 'NEW',
    linkUrl: initialData?.linkUrl || 'https://upsc.gov.in',
    isImportant: initialData?.isImportant ?? true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = initialData?.id ? `/api/admin/notices/${initialData.id}` : '/api/admin/notices';
      const method = initialData?.id ? 'PUT' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Failed to save notice');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Network error saving notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
              Gazette Bulletin
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {initialData ? 'Edit Notice / Circular' : 'Broadcast New Official Notice'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Notice / Headline Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. UPSC CSE Preliminary Examination 2026 Notification Released"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Issuing Commission / Body *
              </label>
              <input
                type="text"
                required
                value={formData.organizationName || ''}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="UPSC / SSC / IBPS"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Status Badge
              </label>
              <select
                value={formData.status || 'NEW'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="NEW">NEW</option>
                <option value="IMPORTANT">IMPORTANT</option>
                <option value="UPDATED">UPDATED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Official Reference / PDF Link
            </label>
            <input
              type="url"
              value={formData.linkUrl || ''}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              placeholder="https://upsc.gov.in/notice.pdf"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isImportant"
              checked={Boolean(formData.isImportant)}
              onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
              className="w-4 h-4 rounded text-blue-900"
            />
            <label htmlFor="isImportant" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pin to Top Bar Urgent Ticker
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Notice...' : initialData ? 'Save Notice' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
