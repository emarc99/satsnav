/**
 * SatNav Fee Sentinel & Network Risk Analyzer
 * Statistical distribution calculations and anomaly detection.
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

export class FeeSentinel {
  /**
   * Compute percentile from a sorted array of numbers
   */
  private static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Analyze fee distribution across a set of ppm fee rates
   */
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
}
