import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LightningGraph } from '../src/lib/graph';
import { LightningRouter } from '../src/lib/router';

describe('SatNav Dijkstra Routing Engine', () => {
  it('selects lowest-fee multi-hop route over expensive direct route', () => {
    const graph = new LightningGraph();

    const nodeA = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const nodeB = '02bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const nodeC = '02cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

    graph.addNode({ pubkey: nodeA, alias: 'NodeA', capacitySats: 50_000_000, channelCount: 2 });
    graph.addNode({ pubkey: nodeB, alias: 'NodeB', capacitySats: 50_000_000, channelCount: 2 });
    graph.addNode({ pubkey: nodeC, alias: 'NodeC', capacitySats: 50_000_000, channelCount: 2 });

    // Path 1: Direct A -> C (Expensive: 5,000 ppm)
    graph.addEdge({
      id: 'direct_A_C',
      source: nodeA,
      target: nodeC,
      capacitySats: 10_000_000,
      feeBaseMsat: 2000,
      feeProportionalMillionths: 5000,
      cltvExpiryDelta: 40,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    // Path 2: Hop A -> B -> C (Cheap: 200 ppm + 150 ppm)
    graph.addEdge({
      id: 'hop_A_B',
      source: nodeA,
      target: nodeB,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 200,
      cltvExpiryDelta: 20,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    graph.addEdge({
      id: 'hop_B_C',
      source: nodeB,
      target: nodeC,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 150,
      cltvExpiryDelta: 20,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    const router = new LightningRouter(graph);

    // Test cheapest strategy
    const cheapestRoute = router.findRoute(nodeA, nodeC, 100_000, 'cheapest');
    assert.strictEqual(cheapestRoute.success, true);
    assert.strictEqual(cheapestRoute.hop_count, 2); // Selected A -> B -> C
    assert.strictEqual(cheapestRoute.hops[0].to_node_alias, 'NodeB');
    assert.strictEqual(cheapestRoute.hops[1].to_node_alias, 'NodeC');

    // Test fastest strategy (minimizes hops / CLTV)
    const fastestRoute = router.findRoute(nodeA, nodeC, 100_000, 'fastest');
    assert.strictEqual(fastestRoute.success, true);
    assert.strictEqual(fastestRoute.hop_count, 1); // Selected direct A -> C
  });

  it('rejects routes with insufficient channel capacity', () => {
    const graph = new LightningGraph();
    const nodeA = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const nodeB = '02bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    graph.addNode({ pubkey: nodeA, alias: 'NodeA', capacitySats: 10_000, channelCount: 1 });
    graph.addNode({ pubkey: nodeB, alias: 'NodeB', capacitySats: 10_000, channelCount: 1 });

    graph.addEdge({
      id: 'tiny_channel',
      source: nodeA,
      target: nodeB,
      capacitySats: 5_000, // Only 5,000 sats capacity
      feeBaseMsat: 1000,
      feeProportionalMillionths: 100,
      cltvExpiryDelta: 40,
      minHtlcMsat: 1000,
      maxHtlcMsat: 5_000_000,
      disabled: false,
    });

    const router = new LightningRouter(graph);
    // Attempting to route 20,000 sats through 5,000 sat channel
    const route = router.findRoute(nodeA, nodeB, 20_000, 'cheapest');
    assert.strictEqual(route.success, false);
    assert.strictEqual(route.hop_count, 0);
  });
});
