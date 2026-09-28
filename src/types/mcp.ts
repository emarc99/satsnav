/**
 * Model Context Protocol (MCP) Tool Schemas & Interface Definitions
 * Compliant with Anthropic MCP Specification v1.0+
 * Allows AI agents (Claude, Cursor, Antigravity) to query Lightning routing,
 * fee anomaly detection, and execute guarded micropayments.
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: any;
    }>;
    required: string[];
  };
}

// Tool 1: find_optimal_route
export interface FindOptimalRouteInput {
  source_node?: string; // Pubkey or alias (defaults to major hub or user node)
  target_node: string;  // Pubkey or alias
  amount_sats: number;
  strategy?: 'cheapest' | 'fastest' | 'reliable' | 'balanced';
  max_fee_sats?: number;
}

// Tool 2: probe_node_liquidity
export interface ProbeNodeLiquidityInput {
  node_pubkey_or_alias: string;
}

// Tool 3: check_fee_sentinel
export interface CheckFeeSentinelInput {
  target_node?: string;
  percentile_threshold?: number; // default 90th percentile
}

// Tool 4: pay_invoice_guarded
export interface PayInvoiceGuardedInput {
  invoice: string; // BOLT-11 payment request
  max_fee_sats?: number;
  confirm_preflight_route?: boolean;
}

// Tool 5: get_network_health
export interface GetNetworkHealthInput {
  include_top_hubs?: boolean;
}

export interface MCPToolCallResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}
