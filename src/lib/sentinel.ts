/**
 * SatNav Fee Sentinel & Network Risk Analyzer
 * Statistical distribution calculations, fee-gouging anomaly detection,
 * channel balance depletion risk scoring, and node reliability indexing.
 */

export interface FeeDistribution {
  minPpm: number;
  maxPpm: number;
  p25Ppm: number;
  p50MedianPpm: number;
  p75Ppm: number;
  p90Ppm: number;
  p99Ppm: number;
  averagePpm: number;
  sampleSize: number;
}

export interface FeeGougeAlert {
  isGouging: boolean;
  severity: 'none' | 'moderate' | 'severe' | 'predatory';
  hopPpm: number;
  networkMedianPpm: number;
  networkP90Ppm: number;
  excessPpm: number;
  multiplierVsMedian: number;
  recommendation: string;
}

export interface CapacityRiskResult {
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  riskScore: number; // 0 to 100
  ratio: number;
  depletionProbability: number;
  warningMessage?: string;
}

export interface NodeReliabilityIndex {
  score: number; // 0 to 100
  tier: 'Elite Router' | 'Core Hub' | 'Standard Node' | 'Edge Node';
  channelCount: number;
  capacityBtc: number;
  nodeAgeDays: number;
  stabilityFactors: string[];
}

export class FeeSentinel {
  private static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  static analyzeFeeDistribution(ppmRates: number[]): FeeDistribution {
    if (ppmRates.length === 0) {
      return {
        minPpm: 0,
        maxPpm: 0,
        p25Ppm: 0,
        p50MedianPpm: 0,
        p75Ppm: 0,
        p90Ppm: 0,
        p99Ppm: 0,
        averagePpm: 0,
        sampleSize: 0,
      };
    }

    const sorted = [...ppmRates].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      minPpm: sorted[0],
      maxPpm: sorted[sorted.length - 1],
      p25Ppm: this.calculatePercentile(sorted, 25),
      p50MedianPpm: this.calculatePercentile(sorted, 50),
      p75Ppm: this.calculatePercentile(sorted, 75),
      p90Ppm: this.calculatePercentile(sorted, 90),
      p99Ppm: this.calculatePercentile(sorted, 99),
      averagePpm: Math.round(sum / sorted.length),
      sampleSize: sorted.length,
    };
  }

  static detectFeeGouging(
    hopPpm: number,
    distribution: FeeDistribution
  ): FeeGougeAlert {
    const median = Math.max(1, distribution.p50MedianPpm || 250);
    const p90 = Math.max(median, distribution.p90Ppm || 1000);

    const multiplierVsMedian = Number((hopPpm / median).toFixed(2));
    const excessPpm = Math.max(0, hopPpm - median);

    if (hopPpm >= p90 * 2.5 || multiplierVsMedian >= 8.0) {
      return {
        isGouging: true,
        severity: 'predatory',
        hopPpm,
        networkMedianPpm: median,
        networkP90Ppm: p90,
        excessPpm,
        multiplierVsMedian,
        recommendation: `CRITICAL: Hop charges ${hopPpm} ppm (${multiplierVsMedian}x network median). Reroute immediately around this node to prevent satoshi drainage.`,
      };
    }

    if (hopPpm >= p90 || multiplierVsMedian >= 3.5) {
      return {
        isGouging: true,
        severity: 'severe',
        hopPpm,
        networkMedianPpm: median,
        networkP90Ppm: p90,
        excessPpm,
        multiplierVsMedian,
        recommendation: `WARNING: Elevated fee rate (${hopPpm} ppm). Consider choosing 'cheapest' strategy to bypass this channel.`,
      };
    }

    if (multiplierVsMedian >= 2.0) {
      return {
        isGouging: false,
        severity: 'moderate',
        hopPpm,
        networkMedianPpm: median,
        networkP90Ppm: p90,
        excessPpm,
        multiplierVsMedian,
        recommendation: `Moderate fee rate (${hopPpm} ppm). Acceptable for priority routing.`,
      };
    }

    return {
      isGouging: false,
      severity: 'none',
      hopPpm,
      networkMedianPpm: median,
      networkP90Ppm: p90,
      excessPpm: 0,
      multiplierVsMedian,
      recommendation: `Fair fee rate (${hopPpm} ppm, at or below network median).`,
    };
  }

  static scoreCapacityRisk(
    paymentAmountSats: number,
    channelCapacitySats: number
  ): CapacityRiskResult {
    if (channelCapacitySats <= 0) {
      return {
        riskLevel: 'critical',
        riskScore: 100,
        ratio: 1.0,
        depletionProbability: 1.0,
        warningMessage: 'Channel has 0 reported capacity',
      };
    }

    const ratio = paymentAmountSats / channelCapacitySats;

    if (ratio > 0.5) {
      return {
        riskLevel: 'critical',
        riskScore: 95,
        ratio: Number(ratio.toFixed(4)),
        depletionProbability: 0.85,
        warningMessage: `High risk: Payment requires ${(ratio * 100).toFixed(1)}% of channel capacity. Directional depletion likely.`,
      };
    }

    if (ratio > 0.2) {
      return {
        riskLevel: 'high',
        riskScore: 70,
        ratio: Number(ratio.toFixed(4)),
        depletionProbability: 0.55,
        warningMessage: `Payment size is ${(ratio * 100).toFixed(1)}% of channel capacity. Route may fail if remote balance is low.`,
      };
    }

    if (ratio > 0.05) {
      return {
        riskLevel: 'moderate',
        riskScore: 35,
        ratio: Number(ratio.toFixed(4)),
        depletionProbability: 0.20,
      };
    }

    return {
      riskLevel: 'safe',
      riskScore: 10,
      ratio: Number(ratio.toFixed(4)),
      depletionProbability: 0.05,
    };
  }

  /**
   * Calculate node reliability index based on connectivity, capacity, and maturity
   */
  static calculateNodeReliability(node: {
    active_channel_count?: number;
    capacity?: number | string;
    first_seen?: number;
  }): NodeReliabilityIndex {
    const channels = node.active_channel_count || 1;
    const capacitySats = Number(node.capacity) || 10_000_000;
    const capacityBtc = Number((capacitySats / 100_000_000).toFixed(2));

    const nowSeconds = Math.floor(Date.now() / 1000);
    const firstSeen = node.first_seen || (nowSeconds - 86400 * 30);
    const nodeAgeDays = Math.max(1, Math.floor((nowSeconds - firstSeen) / 86400));

    const stabilityFactors: string[] = [];
    let score = 20; // Base score

    // Channel connectivity weight (max 35 pts)
    if (channels >= 500) {
      score += 35;
      stabilityFactors.push('Tier-1 Connectivity (500+ channels)');
    } else if (channels >= 100) {
      score += 25;
      stabilityFactors.push('Strong Connectivity (100+ channels)');
    } else if (channels >= 20) {
      score += 15;
    }

    // Capacity depth weight (max 25 pts)
    if (capacityBtc >= 100) {
      score += 25;
      stabilityFactors.push('Massive Liquidity Depth (100+ BTC)');
    } else if (capacityBtc >= 10) {
      score += 18;
      stabilityFactors.push('Deep Liquidity (10+ BTC)');
    } else if (capacityBtc >= 1) {
      score += 10;
    }

    // Maturity age weight (max 20 pts)
    if (nodeAgeDays >= 730) {
      score += 20;
      stabilityFactors.push('Battle-Tested Uptime (2+ years)');
    } else if (nodeAgeDays >= 365) {
      score += 15;
      stabilityFactors.push('Mature Node (1+ year)');
    } else if (nodeAgeDays >= 90) {
      score += 10;
    }

    score = Math.min(100, Math.max(10, score));

    let tier: NodeReliabilityIndex['tier'] = 'Edge Node';
    if (score >= 85) tier = 'Elite Router';
    else if (score >= 65) tier = 'Core Hub';
    else if (score >= 40) tier = 'Standard Node';

    return {
      score,
      tier,
      channelCount: channels,
      capacityBtc,
      nodeAgeDays,
      stabilityFactors,
    };
  }
}
