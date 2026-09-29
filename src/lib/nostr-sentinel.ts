/**
 * Nostr Sentinel Threat Intelligence Publisher
 * Publishes cryptographically signed Lightning Network threat telemetry
 * (predatory fee-gouging, liquidity traps, unreachable routing hubs) to public Nostr relays.
 * Conforms to NIP-01 standards.
 */

import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { npubEncode } from 'nostr-tools/nip19';
import { SimplePool } from 'nostr-tools/pool';
import { bytesToHex, hexToBytes } from 'nostr-tools/utils';

export interface NostrThreatAlert {
  nodePubkey: string;
  alias: string;
  ppm: number;
  medianPpm: number;
  multiplierVsMedian: number;
  severity: 'predatory' | 'severe' | 'moderate';
  recommendation: string;
}

export interface BroadcastedNostrEvent {
  id: string;
  pubkey: string;
  npub: string;
  content: string;
  createdAt: number;
  tags: string[][];
  sig: string;
  relays: string[];
  status: 'published' | 'buffered';
}

export const NOSTR_SENTINEL_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

class NostrSentinelPublisher {
  private secretKey: Uint8Array;
  private publicKey: string;
  private npub: string;
  private recentBroadcasts: BroadcastedNostrEvent[] = [];
  private pool: SimplePool | null = null;

  constructor() {
    // Check if deterministic seed provided in env, else generate persistent ephemeral key
    const envSk = process.env.NOSTR_SENTINEL_PRIVATE_KEY;
    if (envSk && /^[0-9a-fA-F]{64}$/.test(envSk)) {
      this.secretKey = hexToBytes(envSk);
    } else {
      this.secretKey = generateSecretKey();
    }

    this.publicKey = getPublicKey(this.secretKey);
    this.npub = npubEncode(this.publicKey);
  }

  private getPool(): SimplePool {
    if (!this.pool) {
      this.pool = new SimplePool();
    }
    return this.pool;
  }

  public getIdentity() {
    return {
      pubkey: this.publicKey,
      npub: this.npub,
      relays: NOSTR_SENTINEL_RELAYS,
    };
  }

  public getRecentAlerts(): BroadcastedNostrEvent[] {
    return [...this.recentBroadcasts];
  }

  /**
   * Cryptographically sign and broadcast a Lightning threat intelligence alert to Nostr relays
   */
  async broadcastThreatAlert(alert: NostrThreatAlert): Promise<BroadcastedNostrEvent> {
    const createdAt = Math.floor(Date.now() / 1000);

    const content = [
      `🚨 [SATSNAV SENTINEL ALERT]`,
      `Predatory Lightning routing fee detected on Bitcoin mainnet.`,
      ``,
      `• Target Node: ${alert.alias}`,
      `• Public Key: ${alert.nodePubkey}`,
      `• Observed Fee: ${alert.ppm} ppm (${alert.multiplierVsMedian}x vs network median ${alert.medianPpm} ppm)`,
      `• Severity: ${alert.severity.toUpperCase()}`,
      `• Recommendation: ${alert.recommendation}`,
      ``,
      `#bitcoin #lightning #satsnav #mcp #freedomstack`,
    ].join('\n');

    const tags = [
      ['t', 'lightning'],
      ['t', 'bitcoin'],
      ['t', 'satsnav'],
      ['t', 'threat-intelligence'],
      ['p', alert.nodePubkey],
      ['ppm', alert.ppm.toString()],
      ['severity', alert.severity],
      ['client', 'SatsNav Sentinel v0.1.0'],
    ];

    const eventTemplate = {
      kind: 1, // Standard public text note
      created_at: createdAt,
      tags,
      content,
    };

    // Sign event using Ed25519 per NIP-01
    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);

    const record: BroadcastedNostrEvent = {
      id: signedEvent.id,
      pubkey: signedEvent.pubkey,
      npub: this.npub,
      content: signedEvent.content,
      createdAt: signedEvent.created_at,
      tags: signedEvent.tags,
      sig: signedEvent.sig,
      relays: NOSTR_SENTINEL_RELAYS,
      status: 'published',
    };

    // Store in ring buffer (keep last 25)
    this.recentBroadcasts.unshift(record);
    if (this.recentBroadcasts.length > 25) {
      this.recentBroadcasts.pop();
    }

    // Attempt broadcast to public relays in background without blocking
    try {
      const pool = this.getPool();
      // Publish event to configured relays with timeout
      const pubs = pool.publish(NOSTR_SENTINEL_RELAYS, signedEvent);
      // Wait shortly for relay acknowledgments or timeout
      await Promise.race([
        Promise.allSettled(pubs),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (err) {
      console.warn('Nostr relay publication warning:', err);
      record.status = 'buffered';
    }

    return record;
  }

  public close(): void {
    if (this.pool) {
      this.pool.close(NOSTR_SENTINEL_RELAYS);
      this.pool = null;
    }
  }
}

export const nostrSentinel = new NostrSentinelPublisher();
