import { NextRequest, NextResponse } from 'next/server';
import { buildLightningGraph } from '@/lib/graph-builder';
import { FeeSentinel } from '@/lib/sentinel';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const graph = await buildLightningGraph();
    const edges = graph.getAllEdges();

    const ppmRates = edges.map((e) => e.feeProportionalMillionths);
    const distribution = FeeSentinel.analyzeFeeDistribution(ppmRates);

    // Calculate reliability scores for known hubs
    const hubReliabilities = KNOWN_MAJOR_HUBS.map((hub) => {
      const graphNode = graph.getNode(hub.pubkey);
      const rel = FeeSentinel.calculateNodeReliability({
        active_channel_count: graphNode?.channelCount || 100,
        capacity: (graphNode?.capacitySats || 10_000_000).toString(),
      });

      return {
        pubkey: hub.pubkey,
        alias: hub.alias,
        color: hub.color,
        category: hub.category,
        reliability: rel,
      };
    });

    // Detect predatory anomaly channels
    const anomalousEdges = edges
      .map((edge) => {
        const alert = FeeSentinel.detectFeeGouging(edge.feeProportionalMillionths, distribution);
        const sourceNode = graph.getNode(edge.source);
        const targetNode = graph.getNode(edge.target);
        return {
          channelId: edge.id,
          sourceAlias: sourceNode?.alias || edge.source.substring(0, 8),
          targetAlias: targetNode?.alias || edge.target.substring(0, 8),
          capacitySats: edge.capacitySats,
          alert,
        };
      })
      .filter((e) => e.alert.isGouging)
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      fee_distribution: distribution,
      hub_reliability_rankings: hubReliabilities,
      anomalous_channels: anomalousEdges,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: any) {
    console.error('Error in sentinel API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Fee sentinel analysis failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { route } = body;

    if (!route || !route.hops) {
      return NextResponse.json(
        { success: false, error: 'A valid route object with hops must be provided for audit' },
        { status: 400 }
      );
    }

    const graph = await buildLightningGraph();
    const ppmRates = graph.getAllEdges().map((e) => e.feeProportionalMillionths);
    const distribution = FeeSentinel.analyzeFeeDistribution(ppmRates);

    const auditReport = FeeSentinel.generatePreFlightAudit(route, distribution);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      audit: auditReport,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
