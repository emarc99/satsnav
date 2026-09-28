import { NextRequest, NextResponse } from 'next/server';
import { mempoolClient } from '@/lib/mempool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    pubkey: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { pubkey } = await context.params;

    if (!pubkey || !/^[0-9a-fA-F]{66}$/.test(pubkey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing node public key (must be 66 hex characters)' },
        { status: 400 }
      );
    }

    const node = await mempoolClient.getNode(pubkey);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: node,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('Error fetching node details:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch node details' },
      { status: 502 }
    );
  }
}
