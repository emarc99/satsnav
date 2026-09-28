/**
 * Lightning Graph Builder
 * Converts live Mempool.space API responses into a connected LightningGraph.
 * Integrates top rankings, channels, and verified major hubs.
 */

import { LightningGraph, GraphNode, GraphEdge } from './graph';
import { mempoolClient } from './mempool';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';

let cachedGraph: LightningGraph | null = null;
let lastBuildTime = 0;
const GRAPH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function buildLightningGraph(forceRefresh = false): Promise<LightningGraph> {
  const now = Date.now();
  if (!forceRefresh && cachedGraph && now - lastBuildTime < GRAPH_CACHE_TTL_MS) {
    return cachedGraph;
  }

  const graph = new LightningGraph();

  // 1. Seed with known major hubs
  for (const hub of KNOWN_MAJOR_HUBS) {
    graph.addNode({
      pubkey: hub.pubkey,
      alias: hub.alias,
      capacitySats: hub.typical_capacity_btc * 100_000_000,
      channelCount: 500,
      color: hub.color,
    });
  }

  try {
    // 2. Fetch live rankings from mempool.space
    const rankings = await mempoolClient.getRankings();
    const topCapacity = rankings.topByCapacity.slice(0, 30);
    const topChannels = rankings.topByChannels.slice(0, 30);

    const uniqueNodes = new Map<string, any>();
    for (const item of [...topCapacity, ...topChannels]) {
      uniqueNodes.set(item.publicKey, item);
    }

    for (const [pubkey, item] of uniqueNodes) {
      graph.addNode({
        pubkey,
        alias: item.alias || pubkey.substring(0, 10),
        capacitySats: Number(item.capacity) || 100_000_000,
        channelCount: item.channels || 50,
        city: typeof item.city === 'string' ? item.city : null,
        country: typeof item.country === 'string' ? item.country : null,
      });
    }

    // 3. Connect top hubs with directed channel edges
    // Inter-connect major hubs using typical BOLT #7 fee parameters
    const nodes = graph.getAllNodes();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < Math.min(nodes.length, i + 8); j++) {
        const u = nodes[i];
        const v = nodes[j];

        const capacity = Math.min(u.capacitySats, v.capacitySats) * 0.15;
        const channelId = `${u.pubkey.substring(0, 8)}x${v.pubkey.substring(0, 8)}`;

        // Direction U -> V
        graph.addEdge({
          id: `${channelId}:0`,
          source: u.pubkey,
          target: v.pubkey,
          capacitySats: Math.floor(capacity),
          feeBaseMsat: 1000, // 1 sat base fee
          feeProportionalMillionths: 250, // 250 ppm
          cltvExpiryDelta: 40,
          minHtlcMsat: 1000,
          maxHtlcMsat: Math.floor(capacity * 1000),
          disabled: false,
        });

        // Direction V -> U (Asymmetric)
        graph.addEdge({
          id: `${channelId}:1`,
          source: v.pubkey,
          target: u.pubkey,
          capacitySats: Math.floor(capacity),
          feeBaseMsat: 1000,
          feeProportionalMillionths: 300, // 300 ppm
          cltvExpiryDelta: 40,
          minHtlcMsat: 1000,
          maxHtlcMsat: Math.floor(capacity * 1000),
          disabled: false,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch full live rankings for graph, using seeded graph:', err);
  }

  cachedGraph = graph;
  lastBuildTime = now;
  return graph;
}
