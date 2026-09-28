/**
 * Resilient Mempool.space Lightning Network API Client
 * Features:
 * - AbortController timeout handling
 * - Custom User-Agent identification
 * - Multiple mirror failover
 * - Strict typing against Lightning RFC specs
 */

import {
  LightningNode,
  LightningChannel,
  MempoolRankingsResponse,
  LightningNetworkStatistics,
} from '@/types/lightning';

const DEFAULT_TIMEOUT_MS = 12000;
const PRIMARY_BASE_URL = 'https://mempool.space/api/v1/lightning';
const FALLBACK_BASE_URL = 'https://mempool.emzy.de/api/v1/lightning';

export class MempoolClient {
  private primaryUrl: string;
  private fallbackUrl: string;
  private timeoutMs: number;

  constructor(
    primaryUrl: string = PRIMARY_BASE_URL,
    fallbackUrl: string = FALLBACK_BASE_URL,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ) {
    this.primaryUrl = primaryUrl.replace(/\/$/, '');
    this.fallbackUrl = fallbackUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  private async fetchWithTimeout<T>(endpoint: string): Promise<T> {
    const urls = [
      `${this.primaryUrl}${endpoint}`,
      `${this.fallbackUrl}${endpoint}`,
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SatNav-Sentinel/1.0 (Bitcoin-Lightning-Agent; contact: dev@satnav.sh)',
          },
          next: { revalidate: 60 }, // Cache on edge for 60 seconds
        });

        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} from ${url}`);
        }

        const data = await response.json();
        return data as T;
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        // Continue to fallback url if available
      }
    }

    throw new Error(
      `Failed to fetch Lightning data from both primary and fallback mirrors: ${lastError?.message}`
    );
  }

  /**
   * Fetch top Lightning nodes ranked by capacity and active channel count
   */
  async getRankings(): Promise<MempoolRankingsResponse> {
    return this.fetchWithTimeout<MempoolRankingsResponse>('/nodes/rankings');
  }

  /**
   * Fetch detailed metadata for a specific node by public key
   */
  async getNode(pubkey: string): Promise<LightningNode> {
    if (!/^[0-9a-fA-F]{66}$/.test(pubkey)) {
      throw new Error(`Invalid node public key format: ${pubkey}`);
    }
    return this.fetchWithTimeout<LightningNode>(`/nodes/${pubkey}`);
  }

  /**
   * Fetch active public channels for a specific node
   */
  async getNodeChannels(pubkey: string): Promise<LightningChannel[]> {
    if (!/^[0-9a-fA-F]{66}$/.test(pubkey)) {
      throw new Error(`Invalid node public key format: ${pubkey}`);
    }
    return this.fetchWithTimeout<LightningChannel[]>(`/nodes/${pubkey}/channels`);
  }

  /**
   * Fetch global Lightning Network aggregate statistics
   */
  async getStatistics(): Promise<LightningNetworkStatistics> {
    return this.fetchWithTimeout<LightningNetworkStatistics>('/statistics/latest');
  }
}

export const mempoolClient = new MempoolClient();
