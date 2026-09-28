/**
 * Multi-Hop Route and Pathfinding Data Types
 * Implements BOLT #7 source-routed onion payment path representation
 * with fee breakdowns, CLTV deltas, and multi-objective heuristics.
 */

export type RoutingStrategy = 'cheapest' | 'fastest' | 'reliable' | 'balanced';

export interface RouteHop {
  hop_index: number;
  from_node_pubkey: string;
  from_node_alias: string;
  to_node_pubkey: string;
  to_node_alias: string;
  channel_id: string;
  channel_capacity_sats: number;
  fee_base_msat: number;
  fee_proportional_millionths: number;
  fee_msat: number;
  fee_sats: number;
  cltv_expiry_delta: number;
  outgoing_amount_msat: number;
  outgoing_amount_sats: number;
  risk_score: number; // 0 (safest) to 100 (highest risk)
  warnings: string[];
}

export interface RouteResult {
  success: boolean;
  source_pubkey: string;
  source_alias: string;
  target_pubkey: string;
  target_alias: string;
  amount_sats: number;
  amount_msat: number;
  total_fee_msat: number;
  total_fee_sats: number;
  fee_percentage: number;
  total_cltv_delta: number;
  hop_count: number;
  hops: RouteHop[];
  strategy: RoutingStrategy;
  estimated_reliability_score: number; // 0-100
  execution_risk: 'low' | 'medium' | 'high' | 'critical';
  calculation_time_ms: number;
  error?: string;
}

export interface RouteAlternative {
  route: RouteResult;
  difference_summary: string;
}

export interface RouteQueryParams {
  source: string; // Pubkey or alias
  target: string; // Pubkey or alias
  amount_sats: number;
  strategy?: RoutingStrategy;
  max_fee_sats?: number;
  max_hops?: number;
  avoid_nodes?: string[];
}
