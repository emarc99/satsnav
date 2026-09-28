/**
 * BOLT #7 Specification: Fee Calculation & CLTV Arithmetic
 * Standard: https://github.com/lightning/bolts/blob/master/07-routing-gossip.md
 * 
 * Exact specification:
 * fee = fee_base_msat + floor((amount_msat * fee_proportional_millionths) / 1000000)
 */

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
   * Convert satoshis to millisatoshis
   */
  static satsToMsat(sats: number): number {
    return Math.floor(sats * 1000);
  }

  /**
   * Convert millisatoshis to satoshis (ceiling or rounding depending on context)
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
