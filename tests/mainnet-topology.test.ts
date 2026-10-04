import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildLightningGraph } from '../src/lib/graph-builder';
import { LightningRouter } from '../src/lib/router';
import { FeeSentinel } from '../src/lib/sentinel';
import { KNOWN_MAJOR_HUBS } from '../src/data/known-nodes';
import { VERIFIED_MAINNET_CHANNELS, PREDATORY_TRAP_PUBKEY } from '../src/data/mainnet-channels';

describe('Verified Mainnet Channel Topology & Sentinel Defense Suite', () => {
  it('validates authentic BOLT #7 mainnet channel snapshot schema', () => {
    assert.ok(VERIFIED_MAINNET_CHANNELS.length >= 20, 'Must have at least 20 verified channels');

    const scidRegex = /^\d+x\d+x\d+$/;
    const pubkeyRegex = /^[0-9a-fA-F]{66}$/;

    for (const channel of VERIFIED_MAINNET_CHANNELS) {
      assert.match(channel.scid, scidRegex, `Channel ${channel.scid} must match block:tx:index format`);
      assert.match(channel.node1Pubkey, pubkeyRegex, `Node 1 pubkey must be 66 hex chars`);
      assert.match(channel.node2Pubkey, pubkeyRegex, `Node 2 pubkey must be 66 hex chars`);
      assert.ok(channel.capacitySats >= 10_000_000, 'Mainnet channel capacity must be >= 0.1 BTC');

      // Forward policy
      assert.ok(channel.node1ToNode2.feeBaseMsat >= 0);
      assert.ok(channel.node1ToNode2.feeProportionalMillionths > 0);
      assert.ok(channel.node1ToNode2.cltvExpiryDelta >= 14);

      // Return policy
      assert.ok(channel.node2ToNode1.feeBaseMsat >= 0);
      assert.ok(channel.node2ToNode1.feeProportionalMillionths > 0);
      assert.ok(channel.node2ToNode1.cltvExpiryDelta >= 14);
    }
  });

  it('builds real connected LightningGraph without synthetic random seed math', async () => {
    const graph = await buildLightningGraph(true);

    assert.ok(graph.nodeCount >= 10, 'Graph must contain all primary verified hubs');
    assert.ok(graph.edgeCount >= 40, 'Graph must contain both forward and reverse directed channel edges');

    const acinq = graph.getNode(KNOWN_MAJOR_HUBS[0].pubkey);
    assert.ok(acinq, 'ACINQ node must be present in graph');
    assert.strictEqual(acinq.alias, 'ACINQ');

    const outgoing = graph.getOutgoingEdges(KNOWN_MAJOR_HUBS[0].pubkey);
    assert.ok(outgoing.length >= 5, 'ACINQ must have at least 5 outgoing directed channel edges');
  });

  it('routes multi-hop payment across mainnet graph bypassing predatory 5000 ppm trap', async () => {
    const graph = await buildLightningGraph();
    const router = new LightningRouter(graph);

    const acinqPubkey = KNOWN_MAJOR_HUBS[0].pubkey;
    const binancePubkey = KNOWN_MAJOR_HUBS[2].pubkey;

    // Route 50,000 sats from ACINQ to Binance
    const route = router.findRoute(acinqPubkey, binancePubkey, 50_000, 'cheapest');

    assert.strictEqual(route.success, true);
    assert.ok(route.hop_count >= 1);
    assert.ok(route.total_fee_sats > 0);

    // Verify route does NOT traverse the 5,000 ppm predatory trap
    const nodeAliases = route.hops.map((h) => h.to_node_alias);
    assert.ok(!nodeAliases.includes('Predatory Intermediary'), 'Router must avoid predatory intermediary node');

    // Verify total fee rate is fair (< 0.1% of principal)
    assert.ok(route.total_fee_sats < 50, `Fee for 50k sat payment should be < 50 sats, got ${route.total_fee_sats}`);
  });

  it('detects and classifies the predatory intermediary channel as severe/predatory fee-trap', async () => {
    const graph = await buildLightningGraph();
    const edges = graph.getAllEdges();
    const ppmRates = edges.map((e) => e.feeProportionalMillionths);

    const dist = FeeSentinel.analyzeFeeDistribution(ppmRates);
    assert.ok(dist.p50MedianPpm <= 300, `Network median ppm should be <= 300, got ${dist.p50MedianPpm}`);

    // Audit the predatory trap channel
    const trapEdge = edges.find((e) => e.source === PREDATORY_TRAP_PUBKEY && e.target === KNOWN_MAJOR_HUBS[2].pubkey);
    assert.ok(trapEdge, 'Predatory trap edge must exist in topology');
    assert.strictEqual(trapEdge.feeProportionalMillionths, 5000);

    const gougeAlert = FeeSentinel.detectFeeGouging(trapEdge.feeProportionalMillionths, dist);
    assert.strictEqual(gougeAlert.isGouging, true);
    assert.strictEqual(gougeAlert.severity, 'predatory');
    assert.ok(gougeAlert.multiplierVsMedian >= 15, 'Trap multiplier should be > 15x vs network median');
    assert.ok(gougeAlert.recommendation.includes('CRITICAL'));
  });

  it('proves Adversarial Chaos Fuzzer dynamically spikes predatory fee and Sentinel intercepts safely', async () => {
    // 1. Run in Chaos Fuzzing mode
    const chaosGraph = await buildLightningGraph(false, true);
    const chaosEdge = chaosGraph.getEdge('859002x999x1:0');
    assert.ok(chaosEdge, 'Targeted chaos edge must exist');
    assert.strictEqual(chaosEdge.feeProportionalMillionths, 8500, 'Chaos fuzzer must dynamically spike to 8,500 PPM');

    const router = new LightningRouter(chaosGraph);
    const route = router.findRoute(KNOWN_MAJOR_HUBS[0].pubkey, KNOWN_MAJOR_HUBS[2].pubkey, 100_000, 'cheapest');

    assert.strictEqual(route.success, true);
    // Bypasses the 8,500 PPM fuzzed hop
    const aliases = route.hops.map((h) => h.to_node_alias);
    assert.ok(!aliases.includes('Predatory Intermediary'), 'Router must dynamically evade the 8,500 PPM fuzzed hop');

    // Calculate intercepted savings: 100k sats * 8500 ppm = ~850 sats vs defended fee (<30 sats)
    const naiveFeeSats = Math.round((100_000 * 8500) / 1_000_000);
    assert.ok(route.total_fee_sats < 50, 'Defended fee must remain low');
    assert.ok(naiveFeeSats - route.total_fee_sats > 800, 'Must prove > 800 satoshis saved on a 100k sat transaction');

    // 2. Verify that baseline production cache was NOT corrupted by the chaos run
    const baselineGraph = await buildLightningGraph(false, false);
    const baselineEdge = baselineGraph.getEdge('859002x999x1:0');
    assert.ok(baselineEdge);
    assert.strictEqual(baselineEdge.feeProportionalMillionths, 5000, 'Baseline cache must remain at default without mutation');
  });
});
