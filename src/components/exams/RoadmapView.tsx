import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Milestone, Compass } from 'lucide-react';
import { PreparationRoadmapPhase } from '../../types.ts';

interface RoadmapViewProps {
  phases: PreparationRoadmapPhase[];
  examName?: string;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ phases, examName }) => {
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const togglePoint = (key: string) => {
    setCheckedPoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!phases || phases.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-sm">
        <Milestone className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          Preparation Strategy Being Curated
        </p>
        <p className="text-xs mt-1">
          A step-by-step master roadmap for {examName || 'this exam'} is being prepared by expert mentors.
        </p>
      </div>
    );
  }

  const sortedPhases = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-slate-800/60 p-4 rounded-lg border border-blue-200 dark:border-slate-700 flex items-start gap-3">
        <Compass className="w-5 h-5 text-blue-800 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 dark:text-slate-200">
          <p className="font-bold text-sm text-blue-900 dark:text-white mb-0.5">
            Structured 6-Phase Preparation Framework
          </p>
          <p>
            Follow this progressive timeline designed by previous toppers and examination analysts. Mark tasks as you finish them to track your progress.
          </p>
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {sortedPhases.map((phase) => (
          <div key={phase.id} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-blue-900 dark:bg-amber-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
              {phase.phaseNumber}
            </div>

            {/* Card Content */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {phase.title}
                </h4>
                {phase.duration && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {phase.duration}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {phase.description}
              </p>

              {/* Action Checkpoints */}
              {phase.keyActionPoints && phase.keyActionPoints.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Key Action Checkpoints:
                  </span>
                  <div className="space-y-1.5">
                    {phase.keyActionPoints.map((point, pIdx) => {
                      const key = `${phase.id}_${pIdx}`;
                      const isChecked = checkedPoints[key] || false;
                      return (
                        <div
                          key={pIdx}
                          onClick={() => togglePoint(key)}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                            {point}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
