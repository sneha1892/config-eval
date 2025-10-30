import { NextResponse } from 'next/server';
import { recordEvaluation } from '@/lib/dynamo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, response, latencyMs, runId } = body ?? {};

    if (
      typeof query !== 'string' ||
      typeof response !== 'string' ||
      typeof latencyMs !== 'number' ||
      typeof runId !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasLocalEndpoint = Boolean(process.env.DYNAMO_ENDPOINT);

    if (hasAwsCreds || hasLocalEndpoint) {
      await recordEvaluation({ query, response, latencyMs, runId });
      return NextResponse.json({ ok: true });
    } else {
      // Skip write when credentials/endpoint are not configured so the UI can proceed.
      return NextResponse.json({ ok: true, skipped: true, reason: 'dynamo_not_configured' });
    }
  } catch (err) {
    console.error('record-eval error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


