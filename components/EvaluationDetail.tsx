'use client';

import { EvaluationRecord } from '@/lib/dynamo';

type EvaluationDetailProps = {
  evaluation: EvaluationRecord | null;
  allEvaluations: EvaluationRecord[];
  onClose: () => void;
};

export default function EvaluationDetail({ evaluation, allEvaluations, onClose }: EvaluationDetailProps) {
  if (!evaluation) return null;

  // Find other evaluations for the same query
  const relatedEvaluations = allEvaluations.filter(
    (e) => e.query === evaluation.query && e.SK !== evaluation.SK
  );

  const formatDate = (sk: string) => {
    const timestamp = sk.replace('TIME#', '');
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const hasComparisons = relatedEvaluations.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-semibold text-slate-100">Evaluation Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Run ID</p>
              <p className="mt-1 text-sm text-slate-200">{evaluation.runId.replace('run-', '')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timestamp</p>
              <p className="mt-1 text-sm text-slate-200">{formatDate(evaluation.SK)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latency</p>
              <p className="mt-1 text-sm font-semibold text-green-400">{evaluation.latencyMs} ms</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Versions</p>
              <p className="mt-1 text-sm text-slate-200">{hasComparisons ? `${relatedEvaluations.length + 1} total` : '1 only'}</p>
            </div>
          </div>

          {/* Query */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">Query</h3>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                {evaluation.query}
              </p>
            </div>
          </div>

          {/* Response */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">AI Response</h3>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                {evaluation.response}
              </p>
            </div>
          </div>

          {/* Comparison Section */}
          {hasComparisons && (
            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-slate-300">
                Other Evaluations for This Query ({relatedEvaluations.length})
              </h3>
              <div className="space-y-2">
                {relatedEvaluations.map((relEval) => (
                  <div
                    key={`${relEval.PK}-${relEval.SK}`}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Run: {relEval.runId.replace('run-', '')}</p>
                        <p className="text-xs text-slate-500">{formatDate(relEval.SK)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-yellow-400">{relEval.latencyMs} ms</p>
                      </div>
                    </div>
                    <div className="mt-2 max-h-20 overflow-hidden text-xs text-slate-400">
                      {relEval.response.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end border-t border-slate-800 bg-slate-950 p-6">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

