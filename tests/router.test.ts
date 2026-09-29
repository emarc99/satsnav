import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LightningGraph } from '../src/lib/graph';
import { LightningRouter } from '../src/lib/router';

describe('SatNav Dijkstra Routing Engine', () => {
  it('selects lowest-fee multi-hop route bypassing expensive intermediary fee trap', () => {
    const graph = new LightningGraph();

    const nodeOrigin = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const nodeTrap = '02bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const nodeCheap = '02cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const nodeTarget = '02dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

    graph.addNode({ pubkey: nodeOrigin, alias: 'OriginNode', capacitySats: 50_000_000, channelCount: 2 });
    graph.addNode({ pubkey: nodeTrap, alias: 'TrapHub', capacitySats: 50_000_000, channelCount: 2 });
    graph.addNode({ pubkey: nodeCheap, alias: 'CheapHub', capacitySats: 50_000_000, channelCount: 2 });
    graph.addNode({ pubkey: nodeTarget, alias: 'TargetNode', capacitySats: 50_000_000, channelCount: 2 });

    // Path 1 (Fee Trap): Origin -> TrapHub -> Target (TrapHub charges 5,000 ppm)
    graph.addEdge({
      id: 'hop_origin_trap',
      source: nodeOrigin,
      target: nodeTrap,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 200,
      cltvExpiryDelta: 20,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });
    graph.addEdge({
      id: 'hop_trap_target',
      source: nodeTrap,
      target: nodeTarget,
      capacitySats: 10_000_000,
      feeBaseMsat: 2000,
      feeProportionalMillionths: 5000, // 5,000 ppm fee trap!
      cltvExpiryDelta: 40,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    // Path 2 (Low-Cost): Origin -> CheapHub -> Target (CheapHub charges 150 ppm)
    graph.addEdge({
      id: 'hop_origin_cheap',
      source: nodeOrigin,
      target: nodeCheap,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 200,
      cltvExpiryDelta: 20,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });
    graph.addEdge({
      id: 'hop_cheap_target',
      source: nodeCheap,
      target: nodeTarget,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 150, // 150 ppm fair fee
      cltvExpiryDelta: 20,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    const router = new LightningRouter(graph);

    // Test cheapest strategy routes around TrapHub
    const cheapestRoute = router.findRoute(nodeOrigin, nodeTarget, 100_000, 'cheapest');
    assert.strictEqual(cheapestRoute.success, true);
    assert.strictEqual(cheapestRoute.hop_count, 2);
    assert.strictEqual(cheapestRoute.hops[0].to_node_alias, 'CheapHub');
    assert.strictEqual(cheapestRoute.hops[1].to_node_alias, 'TargetNode');

    // Verify backward onion amounts:
    // Final hop delivers principal (100,000,000 msat)
    assert.strictEqual(cheapestRoute.hops[1].outgoing_amount_msat, 100_000_000);
    // Hop 0 must forward principal + intermediary fee
    assert.ok(cheapestRoute.hops[0].outgoing_amount_msat > 100_000_000);
    assert.strictEqual(cheapestRoute.hops[0].fee_msat, 0); // Egress from origin node has 0 routing fee
  });

  it('charges zero routing fees for direct 1-hop payments', () => {
    const graph = new LightningGraph();
    const nodeA = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const nodeB = '02bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    graph.addNode({ pubkey: nodeA, alias: 'NodeA', capacitySats: 50_000_000, channelCount: 1 });
    graph.addNode({ pubkey: nodeB, alias: 'NodeB', capacitySats: 50_000_000, channelCount: 1 });

    graph.addEdge({
      id: 'direct_A_B',
      source: nodeA,
      target: nodeB,
      capacitySats: 10_000_000,
      feeBaseMsat: 1000,
      feeProportionalMillionths: 500,
      cltvExpiryDelta: 40,
      minHtlcMsat: 1000,
      maxHtlcMsat: 10_000_000_000,
      disabled: false,
    });

    const router = new LightningRouter(graph);
    const directRoute = router.findRoute(nodeA, nodeB, 50_000, 'cheapest');

    assert.strictEqual(directRoute.success, true);
    assert.strictEqual(directRoute.hop_count, 1);
    assert.strictEqual(directRoute.total_fee_msat, 0);
    assert.strictEqual(directRoute.total_fee_sats, 0);
    assert.strictEqual(directRoute.hops[0].fee_msat, 0);
    assert.strictEqual(directRoute.hops[0].outgoing_amount_msat, 50_000_000);
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
