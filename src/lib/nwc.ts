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

  /**
   * Initialize or update the NWC client connection with a NIP-47 URI
   */
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

  /**
   * Check if a valid wallet client is currently connected
   */
  isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * Disconnect the current client
   */
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
}

export const satNavWallet = new SatNavWalletService();
