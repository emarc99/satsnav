import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InvoiceDecoder } from '../src/lib/invoice';
import { paymentGuard } from '../src/lib/payment-guard';

describe('BOLT-11 Invoice Decoder & Safety Suite', () => {
  // Real sample testnet BOLT-11 invoice
  const sampleTestnetInvoice = 'lntb20u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpk2pehg57dyfhkctda7n52qw98egfqvduk2m3qg3xhrhwyp38gurhaf0fd5r2vg5qqqqqqqqqqqqqqpqq9qrzvqsp5tq2cpm9pkctcvu9l8sd7l7k5qk7n8qxyu5vsq5qsp5tq2cpm9pkctcvu9l8sd7l7k5qk7n8qxyu5vsq5qqyqqqqqqqqqqqqqqq9q9qxpqysgqcl8g2q9ks9qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9qqqsqqqqqqqqqqqqqqqp';

  it('correctly decodes testnet (lntb) invoice amount and hrp multipliers', () => {
    // 20 micro-btc = 2,000 sats = 2,000,000 msat
    const decoded = InvoiceDecoder.decode(sampleTestnetInvoice);
    assert.strictEqual(decoded.amount_sats, 2000);
    assert.strictEqual(decoded.amount_msat, 2000000);
    assert.ok(decoded.payment_hash.length >= 32);
    assert.strictEqual(typeof decoded.created_at, 'number');
  });

  it('rejects invalid invoice formats', () => {
    assert.throws(() => InvoiceDecoder.decode('invalid_invoice_string'), {
      message: /Invalid invoice/,
    });
    assert.throws(() => InvoiceDecoder.decode('lnbc_missing_one_separator'), {
      message: /Missing separator 1/,
    });
  });

  it('evaluates payment safety guard without crashing on zero-amount invoices', () => {
    const zeroAmountInvoice = {
      payment_request: sampleTestnetInvoice,
      payment_hash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      amount_sats: 0,
      amount_msat: 0,
      destination_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
      description: 'Zero amount invoice',
      created_at: Math.floor(Date.now() / 1000),
      expiry: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      is_expired: false,
    };

    // A zero amount invoice with 10 sats fee estimate should NOT be blocked by percentage check
    const validation = paymentGuard.validatePayment(zeroAmountInvoice, 10);
    assert.strictEqual(validation.safe, true);

    // But exceeding max absolute fee should still be blocked
    const highFeeValidation = paymentGuard.validatePayment(zeroAmountInvoice, 500);
    assert.strictEqual(highFeeValidation.safe, false);
    assert.ok(highFeeValidation.reason?.includes('exceeds max fee tolerance'));
  });
});
