import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'job' | 'notice' | 'eligibility' | 'category';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'job', className = '' }) => {
  const norm = status.toUpperCase();

  if (type === 'eligibility') {
    if (norm === 'ELIGIBLE' || norm === 'GREEN') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Eligible
        </span>
      );
    }
    if (norm === 'CHECK_REQUIREMENTS' || norm === 'YELLOW') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Check Requirements
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${className}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Not Eligible
      </span>
    );
  }

  if (type === 'notice') {
    if (norm === 'NEW') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${className}`}>
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          NEW
        </span>
      );
    }
    if (norm === 'IMPORTANT') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${className}`}>
          IMPORTANT
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-800 ${className}`}>
        UPDATED
      </span>
    );
  }

  if (type === 'category') {
    if (norm === 'CENTRAL') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-800 ${className}`}>
          Central Govt
        </span>
      );
    }
    if (norm === 'STATE') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 ${className}`}>
          State Govt
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 ${className}`}>
        Private Sector
      </span>
    );
  }

  // Default: Job status
  switch (norm) {
    case 'PUBLISHED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Active
        </span>
      );
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 ${className}`}>
          Verified
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${className}`}>
          Under Review
        </span>
      );
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${className}`}>
          Draft
        </span>
      );
    case 'CLOSED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${className}`}>
          <Clock className="w-3 h-3 text-rose-600" />
          Closed
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 ${className}`}>
          Archived
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${className}`}>
          {status}
        </span>
      );
  }
};
