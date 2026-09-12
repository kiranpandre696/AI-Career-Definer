import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {item.path && !isLast ? (
                <button
                  onClick={() => onNavigate(item.path!)}
                  className="hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer truncate max-w-[200px]"
                >
                  {item.label}
                </button>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[280px]">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
