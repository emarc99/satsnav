import { NextResponse } from 'next/server';
import { mempoolClient } from '@/lib/mempool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await mempoolClient.getStatistics();
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: stats,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('Error fetching Lightning network stats:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch network stats' },
      { status: 502 }
    );
  }
}
