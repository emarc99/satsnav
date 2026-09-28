/**
 * SatNav Fee Sentinel & Network Risk Analyzer
 * Statistical distribution calculations and fee-gouging anomaly detection.
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

  /**
   * Detect whether a specific channel hop fee rate constitutes predatory fee gouging
   */
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
}
