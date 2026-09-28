/**
 * Nostr Wallet Connect (NIP-47) Integration
 * Powered by @getalby/sdk
 * Provides authenticated, decentralized Lightning wallet operations
 * with sub-second execution, pre-flight safety guardrails, and audit trails.
 */

import { NWCClient } from '@getalby/sdk';
import { NWCWalletInfo, NWCWalletBalance, GuardedPaymentResult } from '@/types/nwc';
import { InvoiceDecoder } from './invoice';
import { paymentGuard } from './payment-guard';

export class SatNavWalletService {
  private client: NWCClient | null = null;
  private connectionUri: string | null = null;

  connect(nostrWalletConnectUrl: string): boolean {
    if (!nostrWalletConnectUrl.startsWith('nostr+walletconnect://')) {
      throw new Error('Invalid NWC URI: Must start with nostr+walletconnect://');
    }

    try {
      this.client = new NWCClient({
        nostrWalletConnectUrl,
      });
      this.connectionUri = nostrWalletConnectUrl;
      return true;
    } catch (err: any) {
      this.client = null;
      this.connectionUri = null;
      throw new Error(`Failed to initialize NWC client: ${err.message}`);
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.close();
      } catch (_) {}
    }
    this.client = null;
    this.connectionUri = null;
  }

  getClient(): NWCClient {
    if (!this.client) {
      throw new Error('NWC Wallet not connected. Please connect with your NIP-47 URI.');
    }
    return this.client;
  }

  async getWalletInfo(): Promise<NWCWalletInfo> {
    const client = this.getClient();
    const info = await client.getInfo();

    return {
      alias: info.alias || 'NWC Connected Wallet',
      color: info.color || '#F7931A',
      pubkey: info.pubkey || client.publicKey,
      network: (info.network as any) || 'mainnet',
      block_height: info.block_height,
      block_hash: info.block_hash,
      methods: info.methods || ['pay_invoice', 'get_balance', 'get_info', 'make_invoice'],
      notifications: info.notifications,
    };
  }

  async getWalletBalance(): Promise<NWCWalletBalance> {
    const client = this.getClient();
    const balanceResponse = await client.getBalance();

    const balanceMsat = Number(balanceResponse.balance) || 0;
    const balanceSats = Math.floor(balanceMsat / 1000);

    let maxAmountSats: number | undefined;
    if (balanceResponse.max_amount) {
      maxAmountSats = Math.floor(Number(balanceResponse.max_amount) / 1000);
    }

    return {
      balance_sats: balanceSats,
      balance_msat: balanceMsat,
      max_amount_sats: maxAmountSats,
      budget_renewal: balanceResponse.budget_renewal,
    };
  }

  /**
   * Execute a payment safely with pre-flight fee and budget guardrails
   */
  async payInvoiceGuarded(
    invoiceStr: string,
    maxFeeSatsOverride?: number
  ): Promise<GuardedPaymentResult> {
    const decoded = InvoiceDecoder.decode(invoiceStr);

    // Heuristic routing fee estimate (0.2% or minimum 3 sats)
    const estimatedFeeSats = Math.max(3, Math.ceil(decoded.amount_sats * 0.002));

    // Safety validation
    const validation = paymentGuard.validatePayment(
      decoded,
      maxFeeSatsOverride || estimatedFeeSats
    );

    if (!validation.safe) {
      return {
        success: false,
        fee_paid_sats: 0,
        fee_paid_msat: 0,
        audit_timestamp: Date.now(),
        error: `Safety Guard Blocked Payment: ${validation.reason}`,
      };
    }

    const client = this.getClient();
    const result = await client.payInvoice({
      invoice: invoiceStr,
    });

    const feePaidMsat = Number(result.fees_paid) || 0;
    const feePaidSats = Math.ceil(feePaidMsat / 1000);

    paymentGuard.recordSpend(decoded.amount_sats);

    return {
      success: true,
      preimage: result.preimage,
      payment_hash: decoded.payment_hash,
      fee_paid_sats: feePaidSats,
      fee_paid_msat: feePaidMsat,
      route_summary: `Direct / Routed via NWC to ${decoded.destination_pubkey.substring(0, 10)}...`,
      audit_timestamp: Date.now(),
    };
  }
}

export const satNavWallet = new SatNavWalletService();
