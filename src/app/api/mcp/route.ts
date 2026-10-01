import { NextRequest, NextResponse } from 'next/server';
import { buildLightningGraph } from '@/lib/graph-builder';
import { LightningRouter } from '@/lib/router';
import { FeeSentinel } from '@/lib/sentinel';
import { mempoolClient } from '@/lib/mempool';
import { satNavWallet } from '@/lib/nwc';
import { nostrSentinel } from '@/lib/nostr-sentinel';
import { findKnownNode, KNOWN_MAJOR_HUBS } from '@/data/known-nodes';
import { RoutingStrategy } from '@/types/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveNodeKey(input: string): string {
  if (/^[0-9a-fA-F]{66}$/.test(input)) return input;
  const match = findKnownNode(input);
  return match ? match.pubkey : input;
}

export async function GET() {
  // Returns available MCP tools registry definition
  return NextResponse.json({
    jsonrpc: '2.0',
    result: {
      tools: [
        {
          name: 'find_optimal_route',
          description: 'Find lowest-fee, fastest, or most reliable path across Lightning Network using exact BOLT #7 calculations.',
          parameters: {
            target_node: 'string (pubkey or alias)',
            amount_sats: 'number',
            source_node: 'string (optional)',
            strategy: "'cheapest' | 'fastest' | 'reliable' | 'balanced'",
          },
        },
        {
          name: 'probe_node_liquidity',
          description: 'Inspect a Lightning node capacity, channels, reliability tier, and location.',
          parameters: {
            node_pubkey_or_alias: 'string',
          },
        },
        {
          name: 'check_fee_sentinel',
          description: 'Audit network fee percentiles (median, p90, p99) and detect fee gouging.',
          parameters: {
            target_node: 'string (optional)',
          },
        },
        {
          name: 'pay_invoice_guarded',
          description: 'Execute a payment safely via NWC with fee caps and budget guardrails.',
          parameters: {
            invoice: 'string',
            max_fee_sats: 'number (optional)',
          },
        },
        {
          name: 'get_network_health',
          description: 'Get real-time Lightning Network aggregate capacity, channels, and stats.',
          parameters: {},
        },
        {
          name: 'broadcast_nostr_threat_alert',
          description: 'Cryptographically sign and broadcast a predatory fee threat alert to public Nostr relays (NIP-01) for AI swarms.',
          parameters: {
            node_pubkey: 'string',
            observed_ppm: 'number',
            severity: "'predatory' | 'severe' | 'moderate' (optional)",
            recommendation: 'string (optional)',
          },
        },
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params, id = 1 } = body;

    if (method === 'tools/list') {
      return GET();
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};

      if (name === 'find_optimal_route') {
        const target = String(args?.target_node || '');
        const amount = Number(args?.amount_sats || 0);
        const source = args?.source_node ? String(args.source_node) : KNOWN_MAJOR_HUBS[0].pubkey;
        const strategy = (args?.strategy as RoutingStrategy) || 'cheapest';

        const graph = await buildLightningGraph();
        const router = new LightningRouter(graph);
        const route = router.findRoute(resolveNodeKey(source), resolveNodeKey(target), amount, strategy);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: route.success
                  ? `⚡ SatNav Route Found: ${route.source_alias} ➔ ${route.hops.map(h => h.to_node_alias).join(' ➔ ')} (${route.total_fee_sats} sats fee, ${route.estimated_reliability_score}% reliability)`
                  : `Route Failed: ${route.error}`,
              },
              { type: 'text', text: JSON.stringify(route, null, 2) },
            ],
            isError: !route.success,
          },
        });
      }

      if (name === 'probe_node_liquidity') {
        const query = String(args?.node_pubkey_or_alias || '');
        const pubkey = resolveNodeKey(query);
        const node = await mempoolClient.getNode(pubkey);
        const rel = FeeSentinel.calculateNodeReliability(node);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              { type: 'text', text: `Node ${node.alias}: Tier ${rel.tier} (${rel.score}/100), Capacity ${rel.capacityBtc} BTC, ${rel.channelCount} channels` },
              { type: 'text', text: JSON.stringify({ node, reliability: rel }, null, 2) },
            ],
          },
        });
      }

      if (name === 'check_fee_sentinel') {
        const graph = await buildLightningGraph();
        const ppmRates = graph.getAllEdges().map(e => e.feeProportionalMillionths);
        const dist = FeeSentinel.analyzeFeeDistribution(ppmRates);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              { type: 'text', text: `Fee Sentinel: Median ${dist.p50MedianPpm} ppm, p90 ${dist.p90Ppm} ppm, p99 ${dist.p99Ppm} ppm across ${dist.sampleSize} channels` },
              { type: 'text', text: JSON.stringify(dist, null, 2) },
            ],
          },
        });
      }

      if (name === 'pay_invoice_guarded') {
        const invoice = String(args?.invoice || '');
        const maxFeeSats = args?.max_fee_sats ? Number(args.max_fee_sats) : undefined;
        const result = await satNavWallet.payInvoiceGuarded(invoice, maxFeeSats);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              { type: 'text', text: result.success ? `Payment Succeeded: Preimage ${result.preimage}` : `Payment Failed: ${result.error}` },
              { type: 'text', text: JSON.stringify(result, null, 2) },
            ],
            isError: !result.success,
          },
        });
      }

      if (name === 'get_network_health') {
        const stats = await mempoolClient.getStatistics();
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              { type: 'text', text: `Network Health: Capacity ${(stats.total_capacity / 1e8).toFixed(2)} BTC, Channels ${stats.channel_count}` },
              { type: 'text', text: JSON.stringify(stats, null, 2) },
            ],
          },
        });
      }

      if (name === 'broadcast_nostr_threat_alert') {
        const query = String(args?.node_pubkey || '');
        const pubkey = resolveNodeKey(query);
        const ppm = Number(args?.observed_ppm || 0);
        const severity = (args?.severity as any) || 'predatory';
        const recommendation = args?.recommendation
          ? String(args.recommendation)
          : `Predatory fee rate (${ppm} ppm) detected on ${query}. Choose alternative low-fee path.`;

        const alertRecord = await nostrSentinel.broadcastThreatAlert({
          nodePubkey: pubkey,
          alias: query,
          ppm,
          medianPpm: 100,
          multiplierVsMedian: Number((ppm / 100).toFixed(1)),
          severity,
          recommendation,
        });

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `📡 Nostr Threat Alert Broadcasted (NIP-01): Event ${alertRecord.id.substring(0, 16)}... published to ${alertRecord.relays.length} relays`,
              },
              { type: 'text', text: JSON.stringify(alertRecord, null, 2) },
            ],
          },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method or tool not found: ${name}` },
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: 'Invalid Request' },
    });
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: err.message },
    });
  }
}
