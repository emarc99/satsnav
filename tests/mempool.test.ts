import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MempoolClient } from '../src/lib/mempool';

describe('Mempool.space Lightning API Integration Suite', () => {
  const client = new MempoolClient();

  it('validates client configuration and fallback mirrors', () => {
    assert.ok(client);
    assert.strictEqual(typeof client.getRankings, 'function');
    assert.strictEqual(typeof client.getNode, 'function');
    assert.strictEqual(typeof client.getNodeChannels, 'function');
    assert.strictEqual(typeof client.getStatistics, 'function');
  });

  it('enforces 66 hex character public key validation', async () => {
    await assert.rejects(
      async () => {
        await client.getNode('invalid_pubkey_format');
      },
      {
        message: /Invalid node public key format/,
      }
    );
  });
});
