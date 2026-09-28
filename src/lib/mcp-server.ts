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

    throw new Error(`Tool not found: ${name}`);
  });

  return server;
}
