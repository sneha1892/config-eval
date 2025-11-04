'use client';

import { EvaluationRecord } from '@/lib/dynamo';

type EvaluationListProps = {
  evaluations: EvaluationRecord[];
  onSelect: (evaluation: EvaluationRecord) => void;
  isLoading?: boolean;
};

export default function EvaluationList({ evaluations, onSelect, isLoading }: EvaluationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading evaluations...</div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-400">No evaluations found</p>
          <p className="mt-2 text-sm text-slate-500">Start by running some evaluations on the main dashboard</p>
        </div>
      </div>
    );
  }

  // Group evaluations by query
  const groupedByQuery = evaluations.reduce((acc, evaluationItem) => {
    if (!acc[evaluationItem.query]) {
      acc[evaluationItem.query] = [];
    }
    acc[evaluationItem.query].push(evaluationItem);
    return acc;
  }, {} as Record<string, EvaluationRecord[]>);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (sk: string) => {
    // SK format: TIME#2025-11-04T10:33:46.123Z
    const timestamp = sk.replace('TIME#', '');
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 10000) return 'text-green-400';
    if (latency < 30000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-3">
      {evaluations.map((evaluation) => {
        const evalCount = groupedByQuery[evaluation.query]?.length || 1;
        
        return (
          <div
            key={`${evaluation.PK}-${evaluation.SK}`}
            onClick={() => onSelect(evaluation)}
            className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-600 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-200">
                    {truncateText(evaluation.query, 100)}
                  </p>
                  {evalCount > 1 && (
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {evalCount} evaluations
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Run: {evaluation.runId.replace('run-', '')}</span>
                  <span>{formatDate(evaluation.SK)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-semibold ${getLatencyColor(evaluation.latencyMs)}`}>
                  {evaluation.latencyMs} ms
                </span>
                <div className="h-2 w-2 rounded-full bg-green-500" title="Completed"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

