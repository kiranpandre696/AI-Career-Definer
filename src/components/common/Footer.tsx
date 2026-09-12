import React from 'react';
import { ExternalLink, ShieldCheck, HelpCircle, Mail, Phone, ArrowUp } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors">
      {/* Top Banner / Disclaimer Box */}
      <div className="bg-amber-950/30 border-b border-amber-900/40 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">Mandatory Statutory Notice:</strong> Career Definer is an independent career guidance and employment information platform. It is not an official Government of India, State Government, UPSC, SSC, APPSC or other government website. Users should verify recruitment details, eligibility, dates and application information from the official notification or official government website.
          </p>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center border border-slate-800 p-0.5 shadow-xs">
                <BrandLogo size={34} />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white">
                  CAREER <span className="text-amber-500">DEFINER</span>
                </span>
                <p className="text-xs text-slate-400">Define Your Career. Discover Your Future.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Empowering students and job seekers across India with structured, verified career roadmaps, public examination schedules, dynamic syllabi, and official application sources.
            </p>

            <div className="pt-2 flex flex-col gap-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>support@careerdefiner.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>National Career Guidance Cell (Mon - Sat, 9 AM - 6 PM)</span>
              </div>
            </div>
          </div>

          {/* Quick Discovery */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 border-b border-slate-800 pb-1">
              Government Jobs
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/government-jobs/central')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Central Government
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs/states')} className="hover:text-white transition-colors cursor-pointer text-left">
                  State Governments (All States)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs?qualification=10th')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Jobs After 10th
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs?qualification=12th')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Jobs After 12th / Intermediate
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs?qualification=Diploma')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Jobs After Diploma
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs?qualification=Graduation')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Jobs After Graduation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs?qualification=B.Tech')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Jobs After B.Tech / B.E
                </button>
              </li>
            </ul>
          </div>

          {/* Premier Commissions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 border-b border-slate-800 pb-1">
              Commissions & Exams
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/examinations')} className="hover:text-white transition-colors cursor-pointer text-left">
                  UPSC Civil Services (IAS/IPS)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/examinations')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Staff Selection Commission (SSC)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/examinations')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Railway Recruitment Control Board
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/examinations')} className="hover:text-white transition-colors cursor-pointer text-left">
                  IBPS & SBI Banking Cadres
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/government-jobs/states/st_ap')} className="hover:text-white transition-colors cursor-pointer text-left">
                  APPSC (Group-I & Group-II)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/career-guidance')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Preparation Roadmaps
                </button>
              </li>
            </ul>
          </div>

          {/* Portal Information & Help */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 border-b border-slate-800 pb-1">
              Information & Support
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer text-left">
                  About Career Definer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Help Desk & FAQs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Verification & Source Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/private-jobs')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Private Industry Opportunities
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/login')} className="text-amber-500 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Authorized Admin Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Back to Top */}
        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CAREER DEFINER Platform. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span>Designed for Public Service & Student Empowerment</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded border border-slate-800 transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
