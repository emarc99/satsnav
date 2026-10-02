import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FeeSentinel, FeeDistribution } from '../src/lib/sentinel';

describe('Fee Sentinel & Liquidity Risk Suite', () => {
  it('accurately computes percentile distribution over network fee rates', () => {
    // Sample rates from mainnet nodes
    const sampleRates = [50, 100, 150, 200, 250, 300, 500, 850, 1200, 5500];
    const dist = FeeSentinel.analyzeFeeDistribution(sampleRates);

    assert.strictEqual(dist.sampleSize, 10);
    assert.strictEqual(dist.minPpm, 50);
    assert.strictEqual(dist.maxPpm, 5500);
    assert.strictEqual(dist.p50MedianPpm, 250);
    assert.strictEqual(dist.p90Ppm, 1200);
    assert.strictEqual(dist.p99Ppm, 5500);
  });

  it('detects and classifies predatory fee gouging anomalies', () => {
    const dist: FeeDistribution = {
      minPpm: 50,
      maxPpm: 6000,
      p25Ppm: 120,
      p50MedianPpm: 200,
      p75Ppm: 450,
      p90Ppm: 900,
      p99Ppm: 4500,
      averagePpm: 350,
      sampleSize: 100,
    };

    // 1. Fair hop (150 ppm <= median)
    const fairCheck = FeeSentinel.detectFeeGouging(150, dist);
    assert.strictEqual(fairCheck.isGouging, false);
    assert.strictEqual(fairCheck.severity, 'none');

    // 2. Moderate hop (500 ppm, ~2.5x median)
    const modCheck = FeeSentinel.detectFeeGouging(500, dist);
    assert.strictEqual(modCheck.severity, 'moderate');

    // 3. Severe hop (1000 ppm > p90)
    const severeCheck = FeeSentinel.detectFeeGouging(1000, dist);
    assert.strictEqual(severeCheck.isGouging, true);
    assert.strictEqual(severeCheck.severity, 'severe');

    // 4. Predatory fee trap (6,500 ppm, > 2.5x p90 and > 8x median)
    const predatoryCheck = FeeSentinel.detectFeeGouging(6500, dist);
    assert.strictEqual(predatoryCheck.isGouging, true);
    assert.strictEqual(predatoryCheck.severity, 'predatory');
    assert.ok(predatoryCheck.recommendation.includes('CRITICAL'));
  });

  it('evaluates channel capacity depletion risk scores', () => {
    // 1. Payment is small (<5% of capacity) => safe
    const safeRisk = FeeSentinel.scoreCapacityRisk(5_000, 1_000_000);
    assert.strictEqual(safeRisk.riskLevel, 'safe');
    assert.strictEqual(safeRisk.riskScore, 10);

    // 2. Payment requires 60% of capacity => critical
    const criticalRisk = FeeSentinel.scoreCapacityRisk(600_000, 1_000_000);
    assert.strictEqual(criticalRisk.riskLevel, 'critical');
    assert.strictEqual(criticalRisk.riskScore, 95);
    assert.ok(criticalRisk.warningMessage?.includes('High risk'));
  });

  it('computes node reliability tier correctly based on uptime and capacity', () => {
    const eliteNode = FeeSentinel.calculateNodeReliability({
      active_channel_count: 650,
      capacity: '42500000000', // 425 BTC
      first_seen: Math.floor(Date.now() / 1000) - 86400 * 800, // > 2 years
    });
    assert.strictEqual(eliteNode.tier, 'Elite Router');
    assert.ok(eliteNode.score >= 85);
    assert.ok(eliteNode.stabilityFactors.length >= 3);
  });
});
