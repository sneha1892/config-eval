import { NextRequest, NextResponse } from 'next/server';
import { getEvaluations } from '@/lib/dynamo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await getEvaluations({
      limit,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('get-evaluations error', err);
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

