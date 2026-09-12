import React, { useEffect, useState } from 'react';
import { Award, Building2, Search, GraduationCap, ChevronRight, BookOpen, Table } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Examination, Organization } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';

interface ExaminationsListPageProps {
  onNavigate: (path: string) => void;
  onSelectExam: (examId: string) => void;
}

export const ExaminationsListPage: React.FC<ExaminationsListPageProps> = ({
  onNavigate,
  onSelectExam,
}) => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [query, setQuery] = useState('');
  const [qualFilter, setQualFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/hierarchy/exams').then((res) => {
      if (res.success && res.examinations) {
        setExams(res.examinations);
      }
      setLoading(false);
    });
  }, []);

  const filteredExams = exams.filter((exam) => {
    const term = query.toLowerCase();
    const matchQuery =
      !query.trim() ||
      exam.name.toLowerCase().includes(term) ||
      exam.shortName.toLowerCase().includes(term) ||
      exam.organization?.name.toLowerCase().includes(term) ||
      exam.organization?.shortName.toLowerCase().includes(term);

    const matchQual = !qualFilter || exam.qualification === qualFilter;
    const matchType = !typeFilter || exam.examType === typeFilter;

    return matchQuery && matchQual && matchType;
  });

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Examinations' }]} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Competitive Examinations Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse complete syllabi, dynamic examination schemes, and preparation frameworks for national and state public recruitments.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by exam name or commission (UPSC, SSC, APPSC)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <select
              value={qualFilter}
              onChange={(e) => setQualFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">All Qualifications</option>
              <option value="10th">10th Standard</option>
              <option value="12th">12th Standard</option>
              <option value="Diploma">Diploma</option>
              <option value="Graduation">Graduation</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">All Exam Types</option>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="Recruitment">Recruitment</option>
            </select>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => onSelectExam(exam.id)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-700 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 dark:text-amber-400 uppercase tracking-wider">
                    {exam.shortName}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {exam.qualification}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 transition-colors">
                  {exam.name}
                </h3>

                <p className="text-xs text-blue-900/80 dark:text-slate-300 font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{exam.organization?.name || 'Recruiting Commission'}</span>
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {exam.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-amber-400">
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Table className="w-3 h-3" /> Pattern
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Syllabus
                  </span>
                </div>
                <div className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Dossier</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
