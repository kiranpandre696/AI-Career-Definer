import React, { useState } from 'react';
import {
  Compass,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface CareerGuidancePageProps {
  onNavigate: (path: string) => void;
}

export const CareerGuidancePage: React.FC<CareerGuidancePageProps> = ({ onNavigate }) => {
  const [selectedTrack, setSelectedTrack] = useState<'10th' | '12th_mpc' | '12th_bipc' | '12th_commerce' | 'graduation'>('10th');

  const tracks = [
    { id: '10th', label: 'After 10th (Secondary)', sub: 'Intermediate, Polytechnic, ITI' },
    { id: '12th_mpc', label: 'After 12th MPC (PCM)', sub: 'Engineering, Defence, Architecture' },
    { id: '12th_bipc', label: 'After 12th BiPC (PCB)', sub: 'Medical, Pharmacy, Agriculture' },
    { id: '12th_commerce', label: 'After 12th Commerce', sub: 'CA, CS, Law, Banking, Management' },
    { id: 'graduation', label: 'After Graduation / B.Tech', sub: 'Civil Services, GATE, Tech, MBA' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Career Guidance & Roadmaps' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-xl border border-blue-800 shadow-md">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <Compass className="w-3.5 h-3.5" />
              National Educational & Career Progression Framework
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Comprehensive Career Roadmaps & Academic Pathways
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Structured step-by-step guidance designed to empower students and aspirants in navigating educational milestones, competitive eligibility, and career trajectories.
            </p>
          </div>
        </div>

        {/* Track Selector Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tracks.map((t) => {
            const isSelected = selectedTrack === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTrack(t.id as any)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 dark:bg-amber-600 text-white border-blue-900 dark:border-amber-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <span className="font-bold text-xs block truncate">{t.label}</span>
                <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-blue-200 dark:text-amber-100' : 'text-slate-400'}`}>
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pathway Details */}
        <div className="space-y-6">
          {selectedTrack === '10th' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Educational Pathways After 10th Standard (Matriculation)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upon finishing class 10, students can choose between conventional senior secondary academic education (10+2), technical polytechnic diplomas, or immediate skill-based vocational certifications.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  {/* Option 1: Intermediate */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="text-xs font-bold text-blue-900 dark:text-amber-400 uppercase tracking-wider">
                      Option A (2 Years)
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Intermediate / 10+2 (CBSE / State)
                    </h3>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li><strong>MPC:</strong> Mathematics, Physics, Chemistry for Engineering & Tech.</li>
                      <li><strong>BiPC:</strong> Biology, Physics, Chemistry for Medical & Life Sciences.</li>
                      <li><strong>CEC / MEC:</strong> Commerce, Economics, Civics / Maths for Finance & CA.</li>
                      <li><strong>HEC:</strong> History, Economics, Civics for Arts & Civil Services.</li>
                    </ul>
                  </div>

                  {/* Option 2: Polytechnic Diploma */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Option B (3 Years)
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Polytechnic Technical Diploma
                    </h3>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Branches: Computer, Mechanical, Electrical, Civil, Electronics.</li>
                      <li>Entrance: State POLYCET examinations.</li>
                      <li>Direct lateral entry into 2nd year of B.Tech via ECET.</li>
                      <li>Eligible for Junior Engineer (JE) government examinations in SSC, RRB, and State PWD.</li>
                    </ul>
                  </div>

                  {/* Option 3: ITI & Vocational */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                      Option C (1-2 Years)
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Industrial Training Institutes (ITI)
                    </h3>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Trades: Electrician, Fitter, Machinist, Welder, Draughtsman.</li>
                      <li>Immediate industrial employment & apprenticeship.</li>
                      <li>High recruitment quotas in Indian Railways (RRB ALP & Technician).</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Government jobs accessible right after 10th: RRB Group D, SSC MTS, Postman.</span>
                  <button
                    onClick={() => onNavigate('/government-jobs?qualification=10th')}
                    className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Jobs After 10th</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTrack === '12th_mpc' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Career Options for Mathematics, Physics, Chemistry (MPC / PCM)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Engineering & Technology (B.Tech / B.E - 4 Years)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      National Entrance: JEE Main, JEE Advanced (IITs, NITs, IIITs). State entrance: EAMCET, KCET, MHT CET. Disciplines: CSE, AI/ML, ECE, Electrical, Mechanical, Civil, Chemical.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Defence Forces (NDA - National Defence Academy)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Recruitment via UPSC NDA Exam for Army, Navy, and Air Force wings with SSB Interview. Premier commission as Lieutenant / Flying Officer / Sub Lieutenant.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Architecture & Planning (B.Arch - 5 Years)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Admissions via NATA (National Aptitude Test in Architecture) and JEE Main Paper 2. Careers in spatial urban planning, structural design, and construction consulting.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      4. Merchant Navy & Aviation
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Admissions via IMU CET for B.Sc Nautical Science or B.Tech Marine Engineering. Commercial Pilot License (CPL) training via DGCA recognized academies.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Government jobs accessible right after 12th: SSC CHSL, Railway Clerks, Police Constables.</span>
                  <button
                    onClick={() => onNavigate('/government-jobs?qualification=12th')}
                    className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Jobs After 12th</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTrack === '12th_bipc' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Career Options for Biology, Physics, Chemistry (BiPC / PCB)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Medical & Dental Sciences (NEET-UG)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      MBBS (Bachelor of Medicine & Surgery - 5.5 Years), BDS (Dental), BAMS (Ayurveda), BHMS (Homeopathy). Direct medical officer government posts via UPSC Combined Medical Services.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Agriculture & Veterinary Sciences
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      B.Sc (Hons) Agriculture, Horticulture, Forestry, Fishery, and B.V.Sc (Veterinary). High government demand: Agriculture Extension Officer (AEO), Forest Ranger.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Pharmacy & Biotechnology (B.Pharm / Biotech)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Pharmaceutical formulation, clinical research, quality control, drug inspector examinations, and bioinformatics.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      4. Nursing & Allied Health Sciences
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      B.Sc Nursing, Physiotherapy (BPT), Medical Lab Technology (BMLT), Radiology. Massive recruitment via AIIMS NORCET and state hospital boards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTrack === '12th_commerce' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Career Options in Commerce, Finance, Law & Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Professional Certifications (CA / CS / CMA)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Chartered Accountancy (ICAI), Company Secretary (ICSI), Cost & Management Accountant. Direct statutory audit rights and senior financial executive roles.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Corporate Law & Judiciary (CLAT)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      5-Year Integrated B.A. LL.B / B.B.A. LL.B from National Law Universities (NLUs). Corporate legal practice, litigation, and Civil Judge judicial service exams.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Business Administration & Economics (BBA / B.Com)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Specializations in Finance, Business Analytics, Investment Banking, and pathway towards premier IIM MBA degrees via CAT.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      4. Banking & Financial Institutions
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Prepares candidates for RBI Grade B Officer, IBPS Probationary Officer, SBI Specialist Officer, and insurance actuarial services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTrack === 'graduation' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-amber-400" />
                  Master Career Trajectories After Graduation / B.Tech / Degree
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Civil & Administrative Services (UPSC CSE & State PSC)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Recruitment to IAS, IPS, IFS, IRS, and State Deputy Collectors / DSPs. Requires strong general studies preparation, writing skill, and personality interview readiness.
                    </p>
                    <button
                      onClick={() => onNavigate('/examinations/exam_upsc_cse')}
                      className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Explore UPSC CSE Dossier</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Graduate Level Central Ministries (SSC CGL)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Income Tax Inspector, Assistant Section Officer (Central Secretariat), Central Excise Inspector, Enforcement Officer, Sub-Inspector in CBI.
                    </p>
                    <button
                      onClick={() => onNavigate('/examinations/exam_ssc_cgl')}
                      className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Explore SSC CGL Dossier</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Technical PSUs & Masters (GATE Exam)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Direct executive engineer recruitment in ONGC, IOCL, NTPC, BHEL, ISRO, BARC, as well as M.Tech/Ph.D at IITs and IISc.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      4. High-Growth Tech & Corporate Careers
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Software engineering, cloud infrastructure, artificial intelligence, product management, and strategic management consulting.
                    </p>
                    <button
                      onClick={() => onNavigate('/private-jobs')}
                      className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Browse Private Industry Openings</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Filter all active graduate government opportunities across India:</span>
                  <button
                    onClick={() => onNavigate('/government-jobs?qualification=Graduation')}
                    className="text-xs font-bold text-blue-900 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Jobs After Graduation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
