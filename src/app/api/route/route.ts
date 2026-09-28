import { NextRequest, NextResponse } from 'next/server';
import { buildLightningGraph } from '@/lib/graph-builder';
import { LightningRouter } from '@/lib/router';
import { findKnownNode, KNOWN_MAJOR_HUBS } from '@/data/known-nodes';
import { RoutingStrategy } from '@/types/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveNodeKey(input: string): string {
  if (/^[0-9a-fA-F]{66}$/.test(input)) {
    return input;
  }
  const match = findKnownNode(input);
  if (match) return match.pubkey;
  return input;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { source, target, amount, strategy = 'cheapest', alternatives = true } = body;

    const amountSats = Number(amount);
    if (!amountSats || amountSats <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be a positive integer in satoshis' },
        { status: 400 }
      );
    }

    // Default source to ACINQ if unspecified
    const sourcePubkey = source ? resolveNodeKey(source) : KNOWN_MAJOR_HUBS[0].pubkey;
    // Default target to Binance if unspecified
    const targetPubkey = target ? resolveNodeKey(target) : KNOWN_MAJOR_HUBS[2].pubkey;

    const graph = await buildLightningGraph();
    const router = new LightningRouter(graph);

    const primaryRoute = router.findRoute(
      sourcePubkey,
      targetPubkey,
      amountSats,
      strategy as RoutingStrategy
    );

    let routeAlternatives: any[] = [];
    if (alternatives && primaryRoute.success) {
      routeAlternatives = router.findAlternatives(sourcePubkey, targetPubkey, amountSats);
    }

    return NextResponse.json({
      success: primaryRoute.success,
      timestamp: Date.now(),
      route: primaryRoute,
      alternatives: routeAlternatives,
      graph_meta: {
        total_nodes: graph.nodeCount,
        total_edges: graph.edgeCount,
      },
    });
  } catch (err: any) {
    console.error('Error in route calculation API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Pathfinding calculation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || KNOWN_MAJOR_HUBS[0].pubkey;
  const target = searchParams.get('target') || KNOWN_MAJOR_HUBS[2].pubkey;
  const amount = Number(searchParams.get('amount')) || 10000;
  const strategy = (searchParams.get('strategy') || 'cheapest') as RoutingStrategy;

  try {
    const graph = await buildLightningGraph();
    const router = new LightningRouter(graph);
    const route = router.findRoute(resolveNodeKey(source), resolveNodeKey(target), amount, strategy);

    return NextResponse.json({
      success: route.success,
      timestamp: Date.now(),
      route,
      graph_meta: {
        total_nodes: graph.nodeCount,
        total_edges: graph.edgeCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
