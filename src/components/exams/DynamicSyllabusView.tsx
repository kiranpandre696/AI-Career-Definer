import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, Check, Search } from 'lucide-react';
import { SyllabusSubject } from '../../types.ts';

interface DynamicSyllabusViewProps {
  subjects: SyllabusSubject[];
  examName?: string;
}

export const DynamicSyllabusView: React.FC<DynamicSyllabusViewProps> = ({ subjects, examName }) => {
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>(() => {
    // Open first subject by default
    const initial: Record<string, boolean> = {};
    if (subjects.length > 0) {
      initial[subjects[0].id] = true;
    }
    return initial;
  });

  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    subjects.forEach((s) => {
      s.topics?.forEach((t) => {
        initial[t.id] = true;
      });
    });
    return initial;
  });

  const [searchTerm, setSearchTerm] = useState('');

  const toggleSubject = (id: string) => {
    setOpenSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (id: string) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allSubs: Record<string, boolean> = {};
    const allTops: Record<string, boolean> = {};
    subjects.forEach((s) => {
      allSubs[s.id] = true;
      s.topics?.forEach((t) => {
        allTops[t.id] = true;
      });
    });
    setOpenSubjects(allSubs);
    setOpenTopics(allTops);
  };

  const collapseAll = () => {
    setOpenSubjects({});
    setOpenTopics({});
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-sm">
        <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          Dynamic Syllabus Structure Under Compilation
        </p>
        <p className="text-xs mt-1">
          The official paper-wise syllabus for {examName || 'this examination'} is being mapped according to the official commission notification.
        </p>
      </div>
    );
  }

  // Filter subjects/topics if search active
  const filteredSubjects = subjects
    .map((sub) => {
      if (!searchTerm.trim()) return sub;
      const term = searchTerm.toLowerCase();
      const matchSubject = sub.name.toLowerCase().includes(term);

      const filteredTopics = sub.topics.filter((top) => {
        const matchTopic = top.name.toLowerCase().includes(term);
        const matchSubtopic = top.subtopics?.some((st) => st.name.toLowerCase().includes(term));
        return matchTopic || matchSubtopic;
      });

      if (matchSubject || filteredTopics.length > 0) {
        return {
          ...sub,
          topics: matchSubject ? sub.topics : filteredTopics,
        };
      }
      return null;
    })
    .filter(Boolean) as SyllabusSubject[];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topic or keyword in syllabus..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Subjects Accordion */}
      <div className="space-y-3">
        {filteredSubjects.map((sub, sIdx) => {
          const isOpen = openSubjects[sub.id];
          return (
            <div
              key={sub.id}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors"
            >
              {/* Subject Header */}
              <button
                onClick={() => toggleSubject(sub.id)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-200/60 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-blue-900 dark:bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                    {sIdx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {sub.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sub.topics?.length || 0} Core Topics
                    </span>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Topics Container */}
              {isOpen && (
                <div className="p-4 sm:p-5 space-y-4">
                  {sub.topics && sub.topics.length > 0 ? (
                    sub.topics.map((top, tIdx) => {
                      const topOpen = openTopics[top.id] ?? true;
                      return (
                        <div
                          key={top.id}
                          className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleTopic(top.id)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-left bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-800 dark:text-amber-400 shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                {top.name}
                              </span>
                            </div>
                            <span className="text-slate-400">
                              {topOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                          </button>

                          {topOpen && (
                            <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
                              {top.subtopics && top.subtopics.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {top.subtopics.map((st) => (
                                    <li
                                      key={st.id}
                                      className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
                                    >
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                      <span>{st.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-500 italic">
                                  Comprehensive conceptual study under this topic as specified by official syllabus.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No topics configured under this subject.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
