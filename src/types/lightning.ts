/**
 * BOLT #7 & Lightning Network Topology Data Types
 * Conforms to Lightning RFC BOLT #7 (P2P Node and Channel Discovery)
 * and Mempool.space Lightning REST API specifications.
 */

export interface LightningNodeFeature {
  bit: number;
  name: string;
  is_required: boolean;
  is_known: boolean;
}

export interface LightningNode {
  public_key: string;
  alias: string;
  first_seen?: number;
  updated_at?: number;
  color?: string;
  sockets?: string;
  as_number?: number;
  as_organization?: string;
  city?: string | null;
  country?: Record<string, string> | null;
  iso_code?: string | null;
  subdivision?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  features?: LightningNodeFeature[];
  featuresBits?: string;
  active_channel_count?: number;
  capacity?: string | number;
  opened_channel_count?: number;
  closed_channel_count?: number;
}

export interface ChannelPolicy {
  fee_base_msat: number;
  fee_rate_milli_msat: number; // ppm (parts per million)
  time_lock_delta: number; // CLTV delta
  min_htlc: number;
  max_htlc_msat: number;
  disabled: boolean;
}

export interface LightningChannel {
  id: string; // SCID or channel txid:index
  short_channel_id?: string;
  capacity: number; // in satoshis
  node1_pub: string;
  node2_pub: string;
  node1_policy?: ChannelPolicy | null;
  node2_policy?: ChannelPolicy | null;
  fee_base_msat?: number;
  fee_proportional_millionths?: number;
  cltv_expiry_delta?: number;
  min_htlc_msat?: number;
  max_htlc_msat?: number;
  is_active?: boolean;
  last_update?: number;
}

export interface MempoolNodeRankingItem {
  publicKey: string;
  alias: string;
  capacity: number;
  channels: number;
  city?: Record<string, string> | string | null;
  country?: Record<string, string> | string | null;
  iso_code?: string | null;
  subdivision?: string | null;
}

export interface MempoolRankingsResponse {
  topByCapacity: MempoolNodeRankingItem[];
  topByChannels: MempoolNodeRankingItem[];
}

export interface LightningNetworkStatistics {
  channel_count: number;
  total_capacity: number; // in satoshis
  tor_nodes: number;
  clearnet_nodes: number;
  unannounced_nodes: number;
  avg_capacity: number;
  avg_fee_rate: number; // in ppm
  med_fee_rate: number;
  avg_base_fee_mtokens: number;
  med_base_fee_mtokens: number;
  clearnet_tor_nodes: number;
}
