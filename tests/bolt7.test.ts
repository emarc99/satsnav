import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Bolt7 } from '../src/lib/bolt7';

describe('BOLT #7 Fee Calculation Engine', () => {
  it('calculates single-hop forwarding fee correctly per specification', () => {
    // 100,000,000 msat (100k sats) with 1000 msat base fee and 250 ppm
    // fee = 1000 + floor((100,000,000 * 250) / 1,000,000) = 1000 + 25000 = 26,000 msat (26 sats)
    const feeMsat = Bolt7.calculateHopFee(100_000_000, 1000, 250);
    assert.strictEqual(feeMsat, 26_000);
    assert.strictEqual(Bolt7.msatToSats(feeMsat), 26);
  });

  it('handles zero base fee and pure proportional fee', () => {
    // 50,000,000 msat with 0 base fee and 500 ppm
    // fee = 0 + floor((50,000,000 * 500) / 1,000,000) = 25,000 msat
    const feeMsat = Bolt7.calculateHopFee(50_000_000, 0, 500);
    assert.strictEqual(feeMsat, 25_000);
  });

  it('converts between sats and msat accurately', () => {
    assert.strictEqual(Bolt7.satsToMsat(1500), 1_500_000);
    assert.strictEqual(Bolt7.msatToSats(1_500_000), 1500);
    // Ceiling rounding test
    assert.strictEqual(Bolt7.msatToSats(1_001), 2);
  });

  it('computes backward multi-hop onion amounts and fees correctly', () => {
    const hops = [
      { feeBaseMsat: 1000, feeProportionalMillionths: 200, cltvExpiryDelta: 40 },
      { feeBaseMsat: 500, feeProportionalMillionths: 100, cltvExpiryDelta: 30 },
    ];

    const finalAmountMsat = 100_000_000; // 100k sats
    const flow = Bolt7.computeMultiHopFlow(hops, finalAmountMsat);

    assert.strictEqual(flow.totalCltvDelta, 70);
    assert.ok(flow.totalFeeMsat > 0);
    assert.strictEqual(flow.hopAmounts.length, 2);
  });
});
