import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationByKeys } from '@/lib/dynamo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const pk = req.nextUrl.searchParams.get('pk');
    const sk = req.nextUrl.searchParams.get('sk');
    if (!pk || !sk) {
      return NextResponse.json({ error: 'Missing pk or sk' }, { status: 400 });
    }
    const item = await getEvaluationByKeys(pk, sk);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err) {
    console.error('get-evaluation error', err);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }
}
