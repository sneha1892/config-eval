'use client';

import { useEffect, useRef, useState } from 'react';
import EvaluationRating from '../components/EvaluationRating';
import PromptSection from '../components/PromptSection';

const TEST_CASES = [
  'Customer Support Query 1',
  'Technical Troubleshooting Scenario A',
  'Billing Dispute Follow-up',
  'Onboarding Workflow Question',
];

const MODELS = ['x-ai/grok-code-fast-1', 'GPT-5', 'GPT-4o', 'Claude 3 Haiku', 'Claude 3.5 Sonnet'];

const INITIAL_GUIDELINES = {
  role: `You are a CopilotKit Technical Support Assistant. Your job is to help developers integrate CopilotKit with various stacks (React, FastAPI, LangGraph, Agno, etc.) by providing accurate, up-to-date, and architecture-aware guidance based on official documentation, known limitations, and current implementation constraints.
You are not a general LLM—you must adhere strictly to CopilotKit’s actual capabilities, not speculate or invent workarounds that don’t exist.`,
  communicationGuideline: `Be precise and explicit about what is and isn’t supported.
  Never claim something is possible unless it’s confirmed in official docs or working examples.
  If a feature requires a specific layer (e.g., CopilotKit Runtime), state it clearly as mandatory, not optional.
  Avoid phrases like “you can expose GraphQL from FastAPI”—instead, explain how CopilotKit actually uses GraphQL (i.e., via its own runtime).
  Distinguish between frontend, backend, and middleware responsibilities.
  Use concrete terms: “CopilotKit Runtime (Node.js service)”, “AG-UI HTTP endpoint”, “GraphQL proxy”, etc.`,
  contextClarificationGuideline: `If the user asks whether a stack (e.g., React + FastAPI) works without Next.js or extra services, first confirm:
Are they using AG-UI agents (LangGraph, Agno, etc.)?
Are they expecting direct frontend-to-agent communication?
Do not assume they know about the CopilotKit Runtime.
If the question implies bypassing the runtime, clarify that the runtime is required for all AG-UI integrations.
Ask clarifying questions only if the intent is ambiguous (e.g., “Are you trying to avoid Node.js entirely, or just Next.js?”).
But if the question is clear (e.g., “Can I skip the runtime?”), answer directly with the ground truth.
`,
  handoverEscalationGuideline: `Escalate to human support if the issue involves account security, billing disputes over $500, or technical problems persisting after 3 attempts.`,
};

export default function Page() {
  const [selectedTestCase, setSelectedTestCase] = useState(TEST_CASES[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(500);
  const [guidelines, setGuidelines] = useState(INITIAL_GUIDELINES);
  const [ratings, setRatings] = useState({
    overall: '',
    accuracy: '',
    completeness: '',
    relevance: '',
    tone: '',
  });
  const [evaluationComment, setEvaluationComment] = useState('');
  const [developerQuestion, setDeveloperQuestion] = useState(
    'Our onboarding flow is failing when a user connects their CRM sandbox. They see an OAuth mismatch error even though the redirect URI looks correct. What should we check first?'
  );
  const [agentResponse, setAgentResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const developerQuestionRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = developerQuestionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [developerQuestion]);

  const generateResponse = async () => {
    if (!developerQuestion.trim()) return;

    setIsGenerating(true);
    try {
      const requestBody = {
        messages: [
          {
            role: "user",
            content: developerQuestion
          }
        ],
        model: model.toLowerCase().replace(/\s+/g, '-'), // Convert "GPT-5" to "gpt-5", "Claude 3 Haiku" to "claude-3-haiku", etc.
        organisation_id: 23,
        use_new_agent: true,
        agent_config: {
          name: "Nova",
          description: guidelines.role,
          guidances: [
            {
              type: "context",
              enabled: true,
              text: guidelines.contextClarificationGuideline
            },
            {
              type: "communication",
              enabled: true,
              text: guidelines.communicationGuideline
            },
            {
              type: "escalation",
              enabled: true,
              text: guidelines.handoverEscalationGuideline
            }
          ],
          toolsConfig: [
            {
              name: "find_answer",
              enabled: true,
              internal: false,
              arguments: {
                ticketId: "TKTID",
                organisationId: 23
              }
            },
            {
              name: "handover_and_escalate",
              enabled: true,
              internal: true,
              arguments: {
                channel_id: "C084C3HEBQS",
                message: "",
                type: "slack",
                ticketId: "TKTID",
                organisationId: 23
              }
            },
            {
              name: "close_ticket",
              enabled: true,
              internal: true,
              arguments: {
                status: "closed",
                source: "Ticket Answer Agent",
                ticketId: "TKTID",
                organisationId: 23
              }
            }
          ]
        },
        metadata: {
          source: "sneha-evals-test"
        }
      };

      console.log('📤 Sending request to lambda:', JSON.stringify(requestBody, null, 2));

      const startTime = Date.now();
      const response = await fetch('/api/lambda-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      setLatency(elapsedTime);

      console.log('📋 Response status:', response.status);

      if (response.ok) {
        const result = await response.text();
        console.log('✅ Lambda response received:', result);

        // Try to extract human-readable output if the response is JSON
        let assistantContent = result;
        try {
          const parsed = JSON.parse(result);
          if (parsed && typeof parsed === "object" && typeof parsed.output === "string") {
            assistantContent = parsed.output;
            console.log("[format] extracted output field from JSON response for display");
          }
        } catch (_) {
          // not JSON; keep raw text
        }

        setAgentResponse(assistantContent);
      } else {
        const errorText = await response.text();
        console.error('❌ Lambda proxy error:', errorText);
        setAgentResponse(`Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
      setAgentResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };
  const groundTruth =
    'Validate that the sandbox redirect URI is registered independently from production. Confirm that the OAuth app is requesting only the sandbox-supported scopes. If errors persist, rotate the sandbox client secret and review the provider logs using the returned request ID.';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3.5">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            LLM Agent Evaluation Dashboard
          </h1>
          <button
            type="button"
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 shadow hover:border-slate-500 hover:text-white"
          >
            Save Evaluation
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0">
        <div className="flex h-full w-full flex-1 min-h-0 flex-col gap-4 px-4 pb-28 pt-4 md:pb-32">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-10 md:gap-4">
            <section className="flex flex-col rounded-xl border border-slate-900 bg-slate-900/60 shadow-lg md:col-span-3">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Test Case Selector
                    </label>
                    <select
                      value={selectedTestCase}
                      onChange={(event) => setSelectedTestCase(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    >
                      {TEST_CASES.map((testCase) => (
                        <option key={testCase}>{testCase}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3">
                    <PromptSection
                      title="Role"
                      value={guidelines.role}
                      onChange={(next) => setGuidelines((prev) => ({ ...prev, role: next }))}
                    />
                    <PromptSection
                      title="Communication Guideline"
                      value={guidelines.communicationGuideline}
                      onChange={(next) => setGuidelines((prev) => ({ ...prev, communicationGuideline: next }))}
                    />
                    <PromptSection
                      title="Context & Clarification Guideline"
                      value={guidelines.contextClarificationGuideline}
                      onChange={(next) => setGuidelines((prev) => ({ ...prev, contextClarificationGuideline: next }))}
                    />
                    <PromptSection
                      title="Handover & Escalation Guideline"
                      value={guidelines.handoverEscalationGuideline}
                      onChange={(next) => setGuidelines((prev) => ({ ...prev, handoverEscalationGuideline: next }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Model</label>
                    <select
                      value={model}
                      onChange={(event) => setModel(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    >
                      {MODELS.map((candidate) => (
                        <option key={candidate}>{candidate}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <span>Temperature</span>
                        <span className="text-slate-200">{temperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={temperature}
                        onChange={(event) => setTemperature(parseFloat(event.target.value))}
                        className="mt-2 h-2 w-full cursor-pointer accent-slate-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Max Tokens</label>
                      <input
                        type="number"
                        min={1}
                        value={maxTokens}
                        onChange={(event) => setMaxTokens(Number(event.target.value))}
                        className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col rounded-xl border border-slate-900 bg-slate-900/60 shadow-lg md:col-span-4">
              <div className="space-y-3 p-4">
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-300">Developer Question</h2>
                  <textarea
                    ref={developerQuestionRef}
                    rows={1}
                    value={developerQuestion}
                    onChange={(event) => setDeveloperQuestion(event.target.value)}
                    className="w-full resize-none overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-200 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    placeholder="Enter your developer question here..."
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-300">AI Agent Response</h2>
                  <div className="rounded-lg border border-slate-900 bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {agentResponse || 'Click "Generate Response" to get AI response...'}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-xl border border-slate-900 bg-slate-900/60 shadow-lg md:col-span-3">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-300">Ground Truth / Right Answer</h2>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-900 bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-200">
                    {groundTruth}
                  </div>
                </div>

                <EvaluationRating
                  label="Overall Grade"
                  name="overall-grade"
                  options={[
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                  ]}
                  value={ratings.overall}
                  onChange={(next) => setRatings((prev) => ({ ...prev, overall: next }))}
                />

                <EvaluationRating
                  label="Accuracy"
                  name="accuracy"
                  options={[
                    { label: 'Excellent', value: 'excellent' },
                    { label: 'Good', value: 'good' },
                    { label: 'Poor', value: 'poor' },
                  ]}
                  value={ratings.accuracy}
                  onChange={(next) => setRatings((prev) => ({ ...prev, accuracy: next }))}
                />

                <EvaluationRating
                  label="Completeness"
                  name="completeness"
                  options={[
                    { label: 'Excellent', value: 'excellent' },
                    { label: 'Good', value: 'good' },
                    { label: 'Poor', value: 'poor' },
                  ]}
                  value={ratings.completeness}
                  onChange={(next) => setRatings((prev) => ({ ...prev, completeness: next }))}
                />

                <EvaluationRating
                  label="Relevance"
                  name="relevance"
                  options={[
                    { label: 'Excellent', value: 'excellent' },
                    { label: 'Good', value: 'good' },
                    { label: 'Poor', value: 'poor' },
                  ]}
                  value={ratings.relevance}
                  onChange={(next) => setRatings((prev) => ({ ...prev, relevance: next }))}
                />

                <EvaluationRating
                  label="Tone / Clarity"
                  name="tone"
                  options={[
                    { label: 'Excellent', value: 'excellent' },
                    { label: 'Good', value: 'good' },
                    { label: 'Poor', value: 'poor' },
                  ]}
                  value={ratings.tone}
                  onChange={(next) => setRatings((prev) => ({ ...prev, tone: next }))}
                />

                <div className="rounded-lg border border-slate-900 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <span className="font-semibold text-slate-300">Latency: </span>
                  {latency !== null ? `${latency} ms` : 'Not measured'}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Overall Evaluation Comment</label>
                  <textarea
                    value={evaluationComment}
                    onChange={(event) => setEvaluationComment(event.target.value)}
                    className="h-28 w-full resize-none rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    placeholder="Add high-level notes, suggested fixes, or follow-up actions..."
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-slate-900/80 bg-slate-950/90 backdrop-blur">
         <div className="flex w-full flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 hover:text-white"
              >
                {'< Previous Thread'}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 hover:text-white"
              >
                {'Next Thread >'}
              </button>
              <button
                type="button"
                onClick={generateResponse}
                disabled={isGenerating || !developerQuestion.trim()}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Response'}
              </button>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <a
                href="#"
                className="text-sm font-medium text-slate-200 underline-offset-4 hover:underline"
              >
                View Analytics
              </a>
              <button
                type="button"
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
              >
                Save Evaluation
              </button>
            </div>
         </div>
      </footer>
    </div>
  );
}


