/**
 * SatNav Payment Safety Guard
 * Prevents unauthorized wallet drainage, predatory fee payments,
 * and enforces strict agent budget caps.
 */

import { PaymentSafetyGuardConfig, DecodedInvoice } from '@/types/nwc';

export const DEFAULT_GUARD_CONFIG: PaymentSafetyGuardConfig = {
  max_fee_sats: 250,
  max_fee_percent: 2.5, // 2.5% max fee rate
  max_single_payment_sats: 100_000, // 100k sats max per payment
  daily_budget_sats: 500_000,
  require_route_audit: true,
};

export class PaymentSafetyGuard {
  private config: PaymentSafetyGuardConfig;
  private spentTodaySats = 0;
  private lastResetDay = new Date().getUTCDate();

  constructor(config = DEFAULT_GUARD_CONFIG) {
    this.config = config;
  }

  private checkBudgetReset(): void {
    const currentDay = new Date().getUTCDate();
    if (currentDay !== this.lastResetDay) {
      this.spentTodaySats = 0;
      this.lastResetDay = currentDay;
    }
  }

  /**
   * Validate whether an invoice payment is safe to dispatch
   */
  validatePayment(
    invoice: DecodedInvoice,
    estimatedFeeSats: number
  ): { safe: boolean; reason?: string } {
    this.checkBudgetReset();

    // 1. Single payment cap
    if (invoice.amount_sats > this.config.max_single_payment_sats) {
      return {
        safe: false,
        reason: `Payment amount (${invoice.amount_sats.toLocaleString()} sats) exceeds single transaction limit of ${this.config.max_single_payment_sats.toLocaleString()} sats.`,
      };
    }

    // 2. Daily budget cap
    if (this.spentTodaySats + invoice.amount_sats > this.config.daily_budget_sats) {
      return {
        safe: false,
        reason: `Payment exceeds daily spending limit (${this.config.daily_budget_sats.toLocaleString()} sats). Current daily spent: ${this.spentTodaySats.toLocaleString()} sats.`,
      };
    }

    // 3. Absolute fee limit
    if (estimatedFeeSats > this.config.max_fee_sats) {
      return {
        safe: false,
        reason: `Estimated routing fee (${estimatedFeeSats} sats) exceeds max fee tolerance of ${this.config.max_fee_sats} sats.`,
      };
    }

    // 4. Percentage fee limit (evaluated when payment principal is known)
    if (invoice.amount_sats > 0) {
      const feePercent = (estimatedFeeSats / invoice.amount_sats) * 100;
      if (feePercent > this.config.max_fee_percent) {
        return {
          safe: false,
          reason: `Routing fee is ${feePercent.toFixed(2)}% of payment amount, exceeding maximum allowed threshold of ${this.config.max_fee_percent}%.`,
        };
      }
    }

    return { safe: true };
  }

  recordSpend(amountSats: number): void {
    this.checkBudgetReset();
    this.spentTodaySats += amountSats;
  }

  getConfig(): PaymentSafetyGuardConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PaymentSafetyGuardConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export const paymentGuard = new PaymentSafetyGuard();
