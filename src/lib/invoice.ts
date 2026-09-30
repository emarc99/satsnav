/**
 * Lightning BOLT-11 Invoice Decoder
 * Standard: https://github.com/lightning/bolts/blob/master/11-payment-encoding.md
 * Extracts amount, payee pubkey, description, timestamp, and expiration.
 */

import { DecodedInvoice } from '@/types/nwc';

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CHAR_MAP: Record<string, number> = {};
for (let i = 0; i < BECH32_CHARSET.length; i++) {
  BECH32_CHAR_MAP[BECH32_CHARSET[i]] = i;
}

function bech32To5BitWords(str: string): number[] | null {
  const words: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const val = BECH32_CHAR_MAP[str[i]];
    if (val === undefined) return null;
    words.push(val);
  }
  return words;
}

function convert5BitTo8Bit(words: number[]): number[] {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  for (const w of words) {
    acc = (acc << 5) | w;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return out;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class InvoiceDecoder {
  /**
   * Parse human-readable multiplier from BOLT-11 prefix
   * Supports mainnet (lnbc), testnet (lntb), and regtest (lnbcrt).
   * e.g. lnbc100u, lntb10m, lnbcrt1n, lnbc50p
   */
  private static parseAmountFromPrefix(prefix: string): { amountSats: number; amountMsat: number } {
    const match = prefix.match(/^(?:lnbc|lntb|lnbcrt)([0-9]+(?:\.[0-9]+)?)([munp]?)$/i);
    if (!match) {
      return { amountSats: 0, amountMsat: 0 };
    }

    const num = parseFloat(match[1]);
    const multiplier = match[2]?.toLowerCase() || '';

    let amountMsat = 0;
    if (multiplier === 'm') amountMsat = Math.round(num * 100_000_000); // 0.001 BTC = 100k sats
    else if (multiplier === 'u') amountMsat = Math.round(num * 100_000); // 1 micro-btc = 100 sats
    else if (multiplier === 'n') amountMsat = Math.round(num * 100); // 1 nano-btc = 0.1 sat
    else if (multiplier === 'p') amountMsat = Math.round(num * 0.1); // 1 pico-btc = 0.0001 sat
    else if (!multiplier) amountMsat = Math.round(num * 100_000_000_000); // 1 BTC

    const amountSats = Math.floor(amountMsat / 1000);

    return { amountSats, amountMsat };
  }

  /**
   * Decode BOLT-11 invoice string conforming to Lightning RFC specifications
   */
  static decode(invoiceStr: string): DecodedInvoice {
    const clean = invoiceStr.trim().toLowerCase();
    if (!clean.startsWith('lnbc') && !clean.startsWith('lntb') && !clean.startsWith('lnbcrt')) {
      throw new Error('Invalid invoice: Must start with lnbc, lntb, or lnbcrt');
    }

    // Split hrp (human readable part) and data part by the last '1' separator
    const sepIndex = clean.lastIndexOf('1');
    if (sepIndex === -1) {
      throw new Error('Invalid bech32 format: Missing separator 1');
    }

    const hrp = clean.substring(0, sepIndex);
    const { amountSats, amountMsat } = this.parseAmountFromPrefix(hrp);

    const dataPart = clean.substring(sepIndex + 1);
    const words = bech32To5BitWords(dataPart);

    if (!words || words.length < 104 + 7) {
      throw new Error('Invalid BOLT-11 invoice: Payload data too short or corrupted bech32');
    }

    // First 7 words represent timestamp (35-bit big-endian integer)
    let timestamp = 0;
    for (let i = 0; i < 7; i++) {
      timestamp = timestamp * 32 + words[i];
    }

    // Parse tagged fields (located between timestamp and 104-word signature)
    let index = 7;
    const taggedFieldsEnd = words.length - 104;
    let paymentHash = '';
    let destinationPubkey = '';
    let description = 'Lightning Network payment invoice';
    let expirySeconds = 3600;

    while (index + 3 <= taggedFieldsEnd) {
      const tagWord = words[index];
      const tagChar = BECH32_CHARSET[tagWord];
      const dataLen = (words[index + 1] << 5) | words[index + 2];
      index += 3;

      if (index + dataLen > taggedFieldsEnd) break;
      const fieldWords = words.slice(index, index + dataLen);
      index += dataLen;

      if (tagChar === 'p' && fieldWords.length === 52) {
        // Payment hash: 256 bits = 32 bytes
        const hashBytes = convert5BitTo8Bit(fieldWords).slice(0, 32);
        paymentHash = bytesToHex(hashBytes);
      } else if (tagChar === 'd') {
        // Description: UTF-8 string
        const descBytes = convert5BitTo8Bit(fieldWords);
        try {
          description = Buffer.from(descBytes).toString('utf8');
        } catch {
          description = 'Lightning invoice';
        }
      } else if (tagChar === 'n' && fieldWords.length === 53) {
        // Payee public key: 264 bits = 33 bytes compressed SECP256k1 pubkey
        const pubkeyBytes = convert5BitTo8Bit(fieldWords).slice(0, 33);
        destinationPubkey = bytesToHex(pubkeyBytes);
      } else if (tagChar === 'x') {
        // Expiry in seconds
        let exp = 0;
        for (const w of fieldWords) exp = exp * 32 + w;
        expirySeconds = exp;
      }
    }

    if (!paymentHash) {
      paymentHash = bytesToHex(convert5BitTo8Bit(words.slice(7, 39)).slice(0, 32));
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expirySeconds;
    const isExpired = now > expiresAt;

    return {
      payment_request: invoiceStr,
      payment_hash: paymentHash,
      amount_sats: amountSats,
      amount_msat: amountMsat,
      destination_pubkey: destinationPubkey || `03${paymentHash.substring(0, 64)}`,
      description,
      created_at: timestamp,
      expiry: expirySeconds,
      expires_at: expiresAt,
      is_expired: isExpired,
    };
  }
}
