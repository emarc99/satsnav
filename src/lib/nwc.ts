/**
 * Nostr Wallet Connect (NIP-47) Integration
 * Powered by @getalby/sdk
 * Provides authenticated, decentralized Lightning wallet operations
 * with sub-second execution and cryptographic Schnorr event signing.
 */

import { NWCClient } from '@getalby/sdk';
import { NWCWalletInfo, NWCWalletBalance } from '@/types/nwc';

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

  /**
   * Fetch connected wallet metadata and supported NIP-47 methods
   */
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

  /**
   * Fetch wallet balance in satoshis and millisatoshis
   */
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
}

export const satNavWallet = new SatNavWalletService();
