/**
 * SatNav Model Context Protocol (MCP) Server
 * Exposes Bitcoin Lightning Network pathfinding, fee anomaly detection,
 * node liquidity probing, and guarded payment dispatching to AI agent runtimes.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { buildLightningGraph } from './graph-builder';
import { LightningRouter } from './router';
import { FeeSentinel } from './sentinel';
import { mempoolClient } from './mempool';
import { satNavWallet } from './nwc';
import { nostrSentinel } from './nostr-sentinel';
import { findKnownNode, KNOWN_MAJOR_HUBS } from '@/data/known-nodes';
import { RoutingStrategy } from '@/types/route';

function resolveNodeKey(input: string): string {
  if (/^[0-9a-fA-F]{66}$/.test(input)) return input;
  const match = findKnownNode(input);
  return match ? match.pubkey : input;
}

export function createSatNavMCPServer(): Server {
  const server = new Server(
    {
      name: 'satnav-lightning-sentinel',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'find_optimal_route',
          description:
            'Find the lowest-fee, fastest, or most reliable multi-hop path across the Bitcoin Lightning Network using exact BOLT #7 fee calculations.',
          inputSchema: {
            type: 'object',
            properties: {
              target_node: {
                type: 'string',
                description: 'Destination Lightning node public key or well-known alias (e.g., Binance, Kraken, ACINQ).',
              },
              amount_sats: {
                type: 'number',
                description: 'Payment amount in satoshis to route across the network.',
              },
              source_node: {
                type: 'string',
                description: 'Origin node public key or alias. Defaults to ACINQ LSP if omitted.',
              },
              strategy: {
                type: 'string',
                enum: ['cheapest', 'fastest', 'reliable', 'balanced'],
                description: "Pathfinding priority: 'cheapest' (lowest satoshi fee), 'fastest' (fewest hops/CLTV delay), 'reliable' (highest liquidity margin).",
              },
            },
            required: ['target_node', 'amount_sats'],
          },
        },
        {
          name: 'probe_node_liquidity',
          description:
            'Inspect a Lightning node capacity, active channel count, network reliability index, and geographical location.',
          inputSchema: {
            type: 'object',
            properties: {
              node_pubkey_or_alias: {
                type: 'string',
                description: 'Public key or alias of the target Lightning node.',
              },
            },
            required: ['node_pubkey_or_alias'],
          },
        },
        {
          name: 'check_fee_sentinel',
          description:
            'Audit network fee percentiles (median, p90, p99) and detect whether a node or channel charges predatory fee rates.',
          inputSchema: {
            type: 'object',
            properties: {
              target_node: {
                type: 'string',
                description: 'Optional node alias or pubkey to evaluate for fee gouging.',
              },
            },
            required: [],
          },
        },
        {
          name: 'pay_invoice_guarded',
          description:
            'Execute a BOLT-11 Lightning payment safely via Nostr Wallet Connect (NIP-47) with pre-flight fee limits and daily budget guardrails.',
          inputSchema: {
            type: 'object',
            properties: {
              invoice: {
                type: 'string',
                description: 'BOLT-11 Lightning invoice string (starts with lnbc...).',
              },
              max_fee_sats: {
                type: 'number',
                description: 'Optional maximum fee in satoshis willing to pay for routing.',
              },
            },
            required: ['invoice'],
          },
        },
        {
          name: 'get_network_health',
          description:
            'Get real-time Lightning Network aggregate metrics including total capacity, active channels, and verified routing hubs.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'broadcast_nostr_threat_alert',
          description:
            'Cryptographically sign and broadcast a Lightning Network routing threat alert to public Nostr relays (NIP-01) to protect the decentralized AI agent swarm.',
          inputSchema: {
            type: 'object',
            properties: {
              node_pubkey: {
                type: 'string',
                description: 'Public key or alias of the predatory/flagged node.',
              },
              observed_ppm: {
                type: 'number',
                description: 'The excessive fee rate in ppm (parts per million) charged by the node.',
              },
              severity: {
                type: 'string',
                enum: ['predatory', 'severe', 'moderate'],
                description: 'Severity level of the threat (predatory, severe, moderate).',
              },
              recommendation: {
                type: 'string',
                description: 'Actionable bypass advice for other routing agents.',
              },
            },
            required: ['node_pubkey', 'observed_ppm'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'find_optimal_route') {
      const target = String(args?.target_node || '');
      const amount = Number(args?.amount_sats || 0);
      const source = args?.source_node ? String(args.source_node) : KNOWN_MAJOR_HUBS[0].pubkey;
      const strategy = (args?.strategy as RoutingStrategy) || 'cheapest';

      if (!target || !amount) {
        return {
          content: [{ type: 'text', text: 'Error: target_node and amount_sats are required.' }],
          isError: true,
        };
      }

      const graph = await buildLightningGraph();
      const router = new LightningRouter(graph);
      const route = router.findRoute(resolveNodeKey(source), resolveNodeKey(target), amount, strategy);

      if (!route.success) {
        return {
          content: [{ type: 'text', text: `Routing Failed: ${route.error}` }],
          isError: true,
        };
      }

      const summary = `⚡ SatNav Route Found (${route.strategy} strategy):
• Total Path: ${route.source_alias} ➔ ${route.hops.map(h => h.to_node_alias).join(' ➔ ')}
• Hops: ${route.hop_count}
• Total Fee: ${route.total_fee_sats} sats (${route.fee_percentage}% of principal)
• Estimated Reliability: ${route.estimated_reliability_score}% (${route.execution_risk} risk)
• CLTV Delta: ${route.total_cltv_delta} blocks`;

      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(route, null, 2) },
        ],
      };
    }

    if (name === 'probe_node_liquidity') {
      const query = String(args?.node_pubkey_or_alias || '');
      const pubkey = resolveNodeKey(query);

      try {
        const node = await mempoolClient.getNode(pubkey);
        const rel = FeeSentinel.calculateNodeReliability(node);

        const summary = `🔍 Node Telemetry for ${node.alias} (${pubkey.substring(0, 10)}...):
• Reliability Tier: ${rel.tier} (${rel.score}/100)
• Channels: ${rel.channelCount} active
• Total Capacity: ${rel.capacityBtc} BTC
• Node Age: ${rel.nodeAgeDays} days online
• Stability Factors: ${rel.stabilityFactors.join(', ') || 'Standard'}`;

        return {
          content: [
            { type: 'text', text: summary },
            { type: 'text', text: JSON.stringify({ node, reliability: rel }, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to probe node: ${err.message}` }],
          isError: true,
        };
      }
    }

    if (name === 'check_fee_sentinel') {
      const graph = await buildLightningGraph();
      const edges = graph.getAllEdges();
      const ppmRates = edges.map((e) => e.feeProportionalMillionths);
      const dist = FeeSentinel.analyzeFeeDistribution(ppmRates);

      const targetNode = args?.target_node ? String(args.target_node) : undefined;
      let targetGougeInfo: any = null;

      if (targetNode) {
        const pubkey = resolveNodeKey(targetNode);
        const outgoing = graph.getOutgoingEdges(pubkey);
        const avgPpm = outgoing.length > 0
          ? Math.round(outgoing.reduce((a, b) => a + b.feeProportionalMillionths, 0) / outgoing.length)
          : dist.p50MedianPpm;

        targetGougeInfo = FeeSentinel.detectFeeGouging(avgPpm, dist);
      }

      const summary = `🛡️ SatNav Fee Sentinel Intelligence:
• Network Median (p50): ${dist.p50MedianPpm} ppm
• 90th Percentile (p90): ${dist.p90Ppm} ppm
• 99th Percentile (p99): ${dist.p99Ppm} ppm
• Monitored Channels: ${dist.sampleSize.toLocaleString()}
${targetGougeInfo ? `\nTarget Node Assessment:\n• Status: ${targetGougeInfo.severity.toUpperCase()} (${targetGougeInfo.hopPpm} ppm)\n• Recommendation: ${targetGougeInfo.recommendation}` : ''}`;

      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify({ distribution: dist, target_audit: targetGougeInfo }, null, 2) },
        ],
      };
    }

    if (name === 'pay_invoice_guarded') {
      const invoice = String(args?.invoice || '');
      const maxFeeSats = args?.max_fee_sats ? Number(args.max_fee_sats) : undefined;

      if (!invoice) {
        return {
          content: [{ type: 'text', text: 'Error: invoice string is required.' }],
          isError: true,
        };
      }

      if (!satNavWallet.isConnected()) {
        return {
          content: [{ type: 'text', text: 'Error: NWC Wallet is not connected. Connect via SatNav Wallet UI or API first.' }],
          isError: true,
        };
      }

      const result = await satNavWallet.payInvoiceGuarded(invoice, maxFeeSats);

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `Payment Blocked/Failed: ${result.error}` }],
          isError: true,
        };
      }

      const summary = `✅ Guarded Payment Successful!
• Preimage: ${result.preimage}
• Fee Paid: ${result.fee_paid_sats} sats
• Payment Hash: ${result.payment_hash}`;

      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(result, null, 2) },
        ],
      };
    }

    if (name === 'get_network_health') {
      try {
        const stats = await mempoolClient.getStatistics();
        if (!stats) {
          throw new Error('Mempool API did not return network statistics.');
        }
        const capBtc = (Number(stats.total_capacity) / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
        const channels = Number(stats.channel_count).toLocaleString();
        const summary = `🌐 Lightning Network Health (Live Mainnet):
• Total Capacity: ${capBtc} BTC
• Active Channels: ${channels}
• Clearnet Nodes: ${stats.clearnet_nodes != null ? Number(stats.clearnet_nodes).toLocaleString() : 'N/A'}
• Tor Nodes: ${stats.tor_nodes != null ? Number(stats.tor_nodes).toLocaleString() : 'N/A'}
• Median Fee Rate: ${stats.med_fee_rate != null ? stats.med_fee_rate + ' ppm' : 'N/A'}`;

        return {
          content: [
            { type: 'text', text: summary },
            { type: 'text', text: JSON.stringify(stats, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to fetch live network stats: ${err.message}` }],
          isError: true,
        };
      }
    }

    if (name === 'broadcast_nostr_threat_alert') {
      try {
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

        const summary = `📡 Nostr Threat Alert Broadcasted (NIP-01):
• Event ID: ${alertRecord.id}
• Author npub: ${alertRecord.npub}
• Schnorr Signature: ${alertRecord.sig.slice(0, 32)}... (Verified Ed25519: ${alertRecord.verified})
• Public Explorer: ${alertRecord.explorer_urls.nostr_band}
• Alternative Viewers: ${alertRecord.explorer_urls.coracle} | ${alertRecord.explorer_urls.njump}
• Relays: ${alertRecord.relays.join(', ')}
• Status: ${alertRecord.status.toUpperCase()}`;

        return {
          content: [
            { type: 'text', text: summary },
            { type: 'text', text: JSON.stringify(alertRecord, null, 2) },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Failed to broadcast Nostr alert: ${err.message}` }],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${name}`);
  });

  return server;
}
