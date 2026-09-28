/**
 * BOLT #7 Specification: Fee Calculation & CLTV Arithmetic
 * Standard: https://github.com/lightning/bolts/blob/master/07-routing-gossip.md
 * 
 * Exact specification:
 * fee = fee_base_msat + floor((amount_msat * fee_proportional_millionths) / 1000000)
 */

export interface HopPolicy {
  feeBaseMsat: number;
  feeProportionalMillionths: number;
  cltvExpiryDelta: number;
}

export interface PathHopAmount {
  outgoingAmountMsat: number;
  feeMsat: number;
  cumulativeCltvDelta: number;
}

export class Bolt7 {
  /**
   * Calculate forwarding fee in millisatoshis for a single hop
   */
  static calculateHopFee(
    amountMsat: number,
    feeBaseMsat: number,
    feeProportionalMillionths: number
  ): number {
    if (amountMsat <= 0) return 0;
    const proportionalFee = Math.floor(
      (amountMsat * feeProportionalMillionths) / 1_000_000
    );
    return feeBaseMsat + proportionalFee;
  }

  /**
   * Backward multi-hop amount and fee calculation (as specified in BOLT #4 & BOLT #7).
   * In Lightning onion routing, amounts are calculated from destination back to source.
   */
  static computeMultiHopFlow(
    hops: HopPolicy[],
    finalDestinationAmountMsat: number
  ): {
    totalFeeMsat: number;
    totalCltvDelta: number;
    hopAmounts: PathHopAmount[];
  } {
    let currentAmount = finalDestinationAmountMsat;
    let totalFeeMsat = 0;
    let totalCltvDelta = 0;
    const hopAmounts: PathHopAmount[] = [];

    // Traverse hops in reverse (from destination back to origin)
    for (let i = hops.length - 1; i >= 0; i--) {
      const hop = hops[i];
      const fee = this.calculateHopFee(
        currentAmount,
        hop.feeBaseMsat,
        hop.feeProportionalMillionths
      );

      totalCltvDelta += hop.cltvExpiryDelta;
      totalFeeMsat += fee;

      hopAmounts.unshift({
        outgoingAmountMsat: currentAmount,
        feeMsat: fee,
        cumulativeCltvDelta: totalCltvDelta,
      });

      // The previous hop must forward enough to cover current amount + fee
      currentAmount += fee;
    }

    return {
      totalFeeMsat,
      totalCltvDelta,
      hopAmounts,
    };
  }

  /**
   * Convert satoshis to millisatoshis
   */
  static satsToMsat(sats: number): number {
    return Math.floor(sats * 1000);
  }

  /**
   * Convert millisatoshis to satoshis (ceiling)
   */
  static msatToSats(msat: number): number {
    return Math.ceil(msat / 1000);
  }

  /**
   * Calculate fee percentage with 4 decimal places
   */
  static feePercentage(feeMsat: number, amountMsat: number): number {
    if (amountMsat <= 0) return 0;
    return Number(((feeMsat / amountMsat) * 100).toFixed(4));
  }

  /**
   * Validate whether an HTLC amount satisfies channel min/max constraints
   */
  static isHtlcWithinLimits(
    amountMsat: number,
    minHtlcMsat = 1000,
    maxHtlcMsat = Infinity
  ): boolean {
    return amountMsat >= minHtlcMsat && amountMsat <= maxHtlcMsat;
  }
}
