/**
 * Nostr Wallet Connect (NIP-47) Data Types
 * Standardized protocol specifications for programmatic Lightning wallet control,
 * payment safety guardrails, and execution audit logging.
 */

export interface NWCConnectionConfig {
  connectionURI: string;
  relayUrl: string;
  walletPubkey: string;
  secret: string;
  lud16?: string;
}

export interface NWCWalletInfo {
  alias: string;
  color?: string;
  pubkey: string;
  network: 'mainnet' | 'testnet' | 'signet' | 'regtest';
  block_height?: number;
  block_hash?: string;
  methods: string[];
  notifications?: string[];
}

export interface NWCWalletBalance {
  balance_sats: number;
  balance_msat: number;
  max_amount_sats?: number;
  budget_renewal?: string;
}

export interface DecodedInvoice {
  payment_request: string;
  payment_hash: string;
  amount_sats: number;
  amount_msat: number;
  destination_pubkey: string;
  description: string;
  created_at: number;
  expiry: number; // in seconds
  expires_at: number; // unix timestamp
  is_expired: boolean;
  cltv_delta?: number;
}

export interface PaymentSafetyGuardConfig {
  max_fee_sats: number;
  max_fee_percent: number; // e.g. 2.0%
  max_single_payment_sats: number;
  daily_budget_sats: number;
  require_route_audit: boolean;
}

export interface GuardedPaymentResult {
  success: boolean;
  preimage?: string;
  payment_hash?: string;
  fee_paid_sats: number;
  fee_paid_msat: number;
  fees_saved_estimate_sats?: number;
  route_summary?: string;
  audit_timestamp: number;
  error?: string;
}
