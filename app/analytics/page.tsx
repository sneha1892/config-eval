'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EvaluationRecord } from '@/lib/dynamo';
import StatCard from '@/components/StatCard';
import EvaluationDetail from '@/components/EvaluationDetail';

type AnalyticsData = {
  items: EvaluationRecord[];
  stats: {
    totalCount: number;
    avgLatency: number;
    uniqueQueries: number;
  };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRecord | null>(null);
  const [limit, setLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByQuery, setGroupByQuery] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, [limit]);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-evaluations?limit=${limit}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to fetch evaluations');
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter evaluations based on search query
  const filteredEvaluations = data?.items.filter((evaluation) =>
    evaluation.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evaluation.response.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              title="Back to Dashboard"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Analytics Dashboard
            </h1>
          </div>
          <button
            onClick={fetchEvaluations}
            disabled={isLoading}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 shadow hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {data && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Evaluations"
              value={data.stats.totalCount}
              subtitle="All time"
            />
            <StatCard
              title="Average Latency"
              value={`${data.stats.avgLatency} ms`}
              subtitle="Response time"
            />
            <StatCard
              title="Unique Queries"
              value={data.stats.uniqueQueries}
              subtitle="Distinct questions"
            />
            <StatCard
              title="Latest Run"
              value={data.items.length > 0 ? new Date(data.items[0].SK.replace('TIME#', '')).toLocaleDateString() : 'N/A'}
              subtitle="Most recent"
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-300">Show:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
            >
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
            <label className="ml-4 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={groupByQuery}
                onChange={(e) => setGroupByQuery(e.target.checked)}
                className="h-4 w-4 accent-slate-500"
              />
              Group by question
            </label>
          </div>

          <div className="flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="Search queries or responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
          </div>
        </div>

        {/* Evaluations Table */}
        <div className="rounded-xl border border-slate-900 bg-slate-900/60 p-6 shadow-lg overflow-x-auto">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">
            Evaluation History
            {searchQuery && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({filteredEvaluations.length} results)
              </span>
            )}
          </h2>

          <table className="min-w-full table-auto text-sm">
            <thead className="text-left text-slate-300">
              <tr className="border-b border-slate-800">
                <th className="py-2 pr-4">Question</th>
                <th className="py-2 pr-4">Answer</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Prompt Diff</th>
                <th className="py-2 pr-4">Latency</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {isLoading && (
                <tr>
                  <td className="py-4 text-slate-400" colSpan={7}>Loading evaluations...</td>
                </tr>
              )}
              {!isLoading && filteredEvaluations.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-400" colSpan={7}>No evaluations found</td>
                </tr>
              )}

              {groupByQuery ? (
                // Grouped by question: render a summary row plus all versions
                Object.values(
                  filteredEvaluations.reduce((acc: Record<string, EvaluationRecord[]>, e) => {
                    acc[e.query] = acc[e.query] || [];
                    acc[e.query].push(e);
                    return acc;
                  }, {})
                ).map((group) => {
                  const first = group[0];
                  const question = first.query.length > 80 ? first.query.slice(0, 80) + '…' : first.query;
                  return (
                    <>
                      <tr key={`${first.PK}-summary`} className="bg-slate-900/40">
                        <td className="py-2 pr-4 align-top text-slate-200">
                          {question}
                          <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{group.length} evals</span>
                        </td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                        <td className="py-2 pr-4 align-top text-slate-300">—</td>
                      </tr>
                      {group.map((e) => {
                        const time = new Date(e.SK.replace('TIME#', '')).toLocaleString();
                        const model = e.model || '—';
                        const latency = `${e.latencyMs} ms`;
                        const promptKey = [e.role, e.communicationGuideline, e.contextClarificationGuideline, e.handoverEscalationGuideline]
                          .filter(Boolean)
                          .join('|');
                        const promptBadge = promptKey ? (promptKey.length > 24 ? promptKey.slice(0, 24) + '…' : promptKey) : '—';
                        const answer = e.response ? (e.response.length > 80 ? e.response.slice(0, 80) + '…' : e.response) : '—';
                        return (
                          <tr
                            key={`${e.PK}-${e.SK}`}
                            className="hover:bg-slate-900/60 cursor-pointer"
                            onClick={() => setSelectedEvaluation(e)}
                          >
                            <td className="py-2 pr-4 align-top text-slate-400">{question}</td>
                            <td className="py-2 pr-4 align-top text-slate-300">{answer}</td>
                            <td className="py-2 pr-4 align-top text-slate-300">{model}</td>
                            <td className="py-2 pr-4 align-top"><span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{promptBadge}</span></td>
                            <td className="py-2 pr-4 align-top text-slate-300">{latency}</td>
                            <td className="py-2 pr-4 align-top text-slate-400">{time}</td>
                            <td className="py-2 pr-4 align-top text-slate-400">{e.runId.replace('run-', '')}</td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })
              ) : (
                // Flat list
                filteredEvaluations.map((e) => {
                  const time = new Date(e.SK.replace('TIME#', '')).toLocaleString();
                  const question = e.query.length > 80 ? e.query.slice(0, 80) + '…' : e.query;
                  const model = e.model || '—';
                  const latency = `${e.latencyMs} ms`;
                  const promptKey = [e.role, e.communicationGuideline, e.contextClarificationGuideline, e.handoverEscalationGuideline]
                    .filter(Boolean)
                    .join('|');
                  const promptBadge = promptKey ? (promptKey.length > 24 ? promptKey.slice(0, 24) + '…' : promptKey) : '—';
                  const answer = e.response ? (e.response.length > 80 ? e.response.slice(0, 80) + '…' : e.response) : '—';
                  return (
                    <tr
                      key={`${e.PK}-${e.SK}`}
                      className="hover:bg-slate-900/60 cursor-pointer"
                      onClick={() => setSelectedEvaluation(e)}
                    >
                      <td className="py-2 pr-4 align-top text-slate-200">{question}</td>
                      <td className="py-2 pr-4 align-top text-slate-300">{answer}</td>
                      <td className="py-2 pr-4 align-top text-slate-300">{model}</td>
                      <td className="py-2 pr-4 align-top"><span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{promptBadge}</span></td>
                      <td className="py-2 pr-4 align-top text-slate-300">{latency}</td>
                      <td className="py-2 pr-4 align-top text-slate-400">{time}</td>
                      <td className="py-2 pr-4 align-top text-slate-400">{e.runId.replace('run-', '')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Tip: Click any row to open full details and compare other versions for the same question.</p>
        </div>
      </main>

      {/* Detail Modal */}
      <EvaluationDetail
        evaluation={selectedEvaluation}
        allEvaluations={data?.items || []}
        onClose={() => setSelectedEvaluation(null)}
      />
    </div>
  );
}

