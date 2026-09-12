import React from 'react';
import { Table, FileText, CheckCircle } from 'lucide-react';
import { ExamPattern } from '../../types.ts';

interface DynamicExamPatternViewProps {
  patterns: ExamPattern[];
  examName?: string;
}

export const DynamicExamPatternView: React.FC<DynamicExamPatternViewProps> = ({
  patterns,
  examName,
}) => {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-sm">
        <Table className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          Official Examination Pattern Being Finalized
        </p>
        <p className="text-xs mt-1">
          Detailed scheme of examination, mark distribution, and time allocation will appear here according to the official commission brochure.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {patterns.map((pattern) => {
        const sortedColumns = [...pattern.columns].sort((a, b) => a.displayOrder - b.displayOrder);
        const sortedRows = [...pattern.rows].sort((a, b) => a.displayOrder - b.displayOrder);

        // Helper map to quickly lookup cell value: `${rowId}_${colId}` -> cellValue
        const cellMap = new Map<string, string>();
        pattern.cells.forEach((cell) => {
          cellMap.set(`${cell.rowId}_${cell.columnId}`, cell.cellValue);
        });

        return (
          <div
            key={pattern.id}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
          >
            {/* Pattern Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="font-bold text-sm sm:text-base tracking-tight">{pattern.title}</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded self-start sm:self-auto border border-slate-700">
                Official Structure
              </span>
            </div>

            {pattern.description && (
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                {pattern.description}
              </div>
            )}

            {/* Responsive Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 w-12 text-center">
                      #
                    </th>
                    {sortedColumns.map((col) => (
                      <th
                        key={col.id}
                        className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {col.columnName}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {sortedRows.map((row, rIdx) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-xs font-semibold text-slate-400 text-center">
                        {rIdx + 1}
                      </td>
                      {sortedColumns.map((col) => {
                        const val = cellMap.get(`${row.id}_${col.id}`) || '—';
                        return (
                          <td
                            key={col.id}
                            className="py-3 px-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium"
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>* Candidates must verify negative marking rules and qualifying cutoffs in official notice.</span>
              <span className="hidden sm:inline">Official Scheme of Examination</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
