import { describe, it } from 'node:test';
import assert from 'node:assert';
import { nostrSentinel } from '../src/lib/nostr-sentinel';

describe('Nostr Threat Sentinel Suite (NIP-01)', () => {
  it('initializes sovereign Nostr sentinel identity with valid npub', () => {
    const identity = nostrSentinel.getIdentity();
    assert.ok(identity.pubkey);
    assert.strictEqual(identity.pubkey.length, 64);
    assert.ok(identity.npub.startsWith('npub1'));
    assert.ok(identity.relays.length >= 2);
  });

  it('signs and formats threat alert event conforming to NIP-01 standards', async () => {
    const alertRecord = await nostrSentinel.broadcastThreatAlert({
      nodePubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
      alias: 'ACINQ-Simulated',
      ppm: 8500,
      medianPpm: 100,
      multiplierVsMedian: 85.0,
      severity: 'predatory',
      recommendation: 'Predatory gouging detected. Reroute via low-fee path.',
    });

    assert.ok(alertRecord.id);
    assert.strictEqual(alertRecord.id.length, 64);
    assert.ok(alertRecord.sig);
    assert.strictEqual(alertRecord.sig.length, 128);
    assert.ok(alertRecord.content.includes('ACINQ-Simulated'));
    assert.ok(alertRecord.content.includes('8500 ppm'));

    // Verify NIP-01 tags
    const hasLightningTag = alertRecord.tags.some((t) => t[0] === 't' && t[1] === 'lightning');
    const hasPpmTag = alertRecord.tags.some((t) => t[0] === 'ppm' && t[1] === '8500');
    const hasSeverityTag = alertRecord.tags.some((t) => t[0] === 'severity' && t[1] === 'predatory');

    assert.strictEqual(hasLightningTag, true);
    assert.strictEqual(hasPpmTag, true);
    assert.strictEqual(hasSeverityTag, true);

    nostrSentinel.close();
  });
});
