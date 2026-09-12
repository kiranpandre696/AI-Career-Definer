import React from 'react';
import { ShieldCheck, Compass, Users, CheckCircle2, AlertTriangle, Building2, BookOpen } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.tsx';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'About Us' }]} onNavigate={onNavigate} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Independent Public Career Guide
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                About CAREER DEFINER
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Define Your Career. Discover Your Future.
              </p>
            </div>
            <div className="hidden sm:flex p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <BrandLogo size={52} />
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
            <p>
              <strong>CAREER DEFINER</strong> is a dedicated career guidance and public recruitment information portal created to bridge the information gap for millions of Indian students, graduates, and government job aspirants.
            </p>
            <p>
              Our mission is to replace confusing, scattered advertisements with verified, structured, and easily navigable career intelligence. Whether you are exploring Central Civil Services (UPSC), Staff Selection (SSC), Indian Railways (RRB), Public Sector Banking (IBPS), or State Public Service Commissions (such as APPSC, TSPSC, KPSC, TNPSC), Career Definer organizes every detail in one place.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <Building2 className="w-5 h-5 text-blue-900 dark:text-amber-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Structured Cadres</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete institutional mappings from central ministries down to state departmental cadres and groups.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dynamic Syllabus</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Topic-by-topic interactive syllabi and official examination schemes with full marking criteria.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Eligibility Evaluator</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rule-based eligibility verification ensuring candidates apply only for posts matching their criteria.
              </p>
            </div>
          </div>

          {/* Statutory Disclaimer */}
          <div className="p-5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Statutory Independent Entity Disclaimer</span>
            </div>
            <p>
              Career Definer is an independent career guidance and employment information platform. It is not an official Government of India, State Government, UPSC, SSC, APPSC or other government website. Users should verify recruitment details, eligibility, dates and application information from the official notification or official government website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
