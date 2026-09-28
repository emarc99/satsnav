import { NextResponse } from 'next/server';
import { mempoolClient } from '@/lib/mempool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rankings = await mempoolClient.getRankings();
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: rankings,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: any) {
    console.error('Error fetching rankings:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch rankings' },
      { status: 502 }
    );
  }
}
