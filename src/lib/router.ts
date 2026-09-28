/**
 * SatNav Lightning Pathfinding Router
 * Implements Dijkstra shortest path traversal for BOLT #7 directed graph.
 */

import { LightningGraph, GraphEdge } from './graph';
import { MinHeapPriorityQueue } from './priority-queue';
import { Bolt7 } from './bolt7';
import { RouteResult, RouteHop, RoutingStrategy } from '@/types/route';

interface PathPredecessor {
  fromNode: string;
  edge: GraphEdge;
  costSoFar: number;
}

export class LightningRouter {
  private graph: LightningGraph;

  constructor(graph: LightningGraph) {
    this.graph = graph;
  }

  /**
   * Find path from source to target for a specific satoshi amount
   */
  findRoute(
    sourcePubkey: string,
    targetPubkey: string,
    amountSats: number,
    strategy: RoutingStrategy = 'cheapest'
  ): RouteResult {
    const startTime = performance.now();
    const amountMsat = Bolt7.satsToMsat(amountSats);

    const sourceNode = this.graph.getNode(sourcePubkey);
    const targetNode = this.graph.getNode(targetPubkey);

    const sourceAlias = sourceNode?.alias || sourcePubkey.substring(0, 10);
    const targetAlias = targetNode?.alias || targetPubkey.substring(0, 10);

    if (sourcePubkey === targetPubkey) {
      return {
        success: false,
        source_pubkey: sourcePubkey,
        source_alias: sourceAlias,
        target_pubkey: targetPubkey,
        target_alias: targetAlias,
        amount_sats: amountSats,
        amount_msat: amountMsat,
        total_fee_msat: 0,
        total_fee_sats: 0,
        fee_percentage: 0,
        total_cltv_delta: 0,
        hop_count: 0,
        hops: [],
        strategy,
        estimated_reliability_score: 100,
        execution_risk: 'low',
        calculation_time_ms: 0,
        error: 'Source and target nodes cannot be identical',
      };
    }

    const distances = new Map<string, number>();
    const predecessors = new Map<string, PathPredecessor>();
    const pq = new MinHeapPriorityQueue<string>();

    distances.set(sourcePubkey, 0);
    pq.enqueue(sourcePubkey, 0);

    let targetReached = false;

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (!current) break;

      if (current === targetPubkey) {
        targetReached = true;
        break;
      }

      const currentDist = distances.get(current) ?? Infinity;
      const edges = this.graph.getOutgoingEdges(current);

      for (const edge of edges) {
        if (edge.disabled) continue;

        // Verify capacity is adequate for this payment
        if (edge.capacitySats < amountSats) continue;

        // Compute edge weight
        const edgeFeeMsat = Bolt7.calculateHopFee(
          amountMsat,
          edge.feeBaseMsat,
          edge.feeProportionalMillionths
        );

        const edgeWeight = edgeFeeMsat;
        const newDist = currentDist + edgeWeight;

        if (newDist < (distances.get(edge.target) ?? Infinity)) {
          distances.set(edge.target, newDist);
          predecessors.set(edge.target, {
            fromNode: current,
            edge,
            costSoFar: newDist,
          });
          pq.enqueue(edge.target, newDist);
        }
      }
    }

    const calcTimeMs = Number((performance.now() - startTime).toFixed(2));

    if (!targetReached) {
      return {
        success: false,
        source_pubkey: sourcePubkey,
        source_alias: sourceAlias,
        target_pubkey: targetPubkey,
        target_alias: targetAlias,
        amount_sats: amountSats,
        amount_msat: amountMsat,
        total_fee_msat: 0,
        total_fee_sats: 0,
        fee_percentage: 0,
        total_cltv_delta: 0,
        hop_count: 0,
        hops: [],
        strategy,
        estimated_reliability_score: 0,
        execution_risk: 'critical',
        calculation_time_ms: calcTimeMs,
        error: 'No routable path found with sufficient channel capacity',
      };
    }

    // Reconstruct path backward
    const traversedEdges: GraphEdge[] = [];
    let curr = targetPubkey;

    while (curr !== sourcePubkey) {
      const pred = predecessors.get(curr);
      if (!pred) break;
      traversedEdges.unshift(pred.edge);
      curr = pred.fromNode;
    }

    // Compute hop flows
    const hops: RouteHop[] = [];
    let cumulativeFeeMsat = 0;
    let cumulativeCltvDelta = 0;

    for (let i = 0; i < traversedEdges.length; i++) {
      const edge = traversedEdges[i];
      const fromNode = this.graph.getNode(edge.source);
      const toNode = this.graph.getNode(edge.target);

      const hopFeeMsat = Bolt7.calculateHopFee(
        amountMsat,
        edge.feeBaseMsat,
        edge.feeProportionalMillionths
      );
      const hopFeeSats = Bolt7.msatToSats(hopFeeMsat);

      cumulativeFeeMsat += hopFeeMsat;
      cumulativeCltvDelta += edge.cltvExpiryDelta;

      // Risk score: Higher if capacity is barely larger than payment amount
      const capacityRatio = edge.capacitySats / amountSats;
      const riskScore = capacityRatio < 2 ? 85 : capacityRatio < 5 ? 45 : 10;
      const warnings: string[] = [];
      if (capacityRatio < 2) warnings.push('Tight channel capacity: high failure risk');
      if (edge.feeProportionalMillionths > 1000) warnings.push('Elevated ppm fee rate (>1000 ppm)');

      hops.push({
        hop_index: i + 1,
        from_node_pubkey: edge.source,
        from_node_alias: fromNode?.alias || edge.source.substring(0, 10),
        to_node_pubkey: edge.target,
        to_node_alias: toNode?.alias || edge.target.substring(0, 10),
        channel_id: edge.id,
        channel_capacity_sats: edge.capacitySats,
        fee_base_msat: edge.feeBaseMsat,
        fee_proportional_millionths: edge.feeProportionalMillionths,
        fee_msat: hopFeeMsat,
        fee_sats: hopFeeSats,
        cltv_expiry_delta: edge.cltvExpiryDelta,
        outgoing_amount_msat: amountMsat + cumulativeFeeMsat,
        outgoing_amount_sats: amountSats + Bolt7.msatToSats(cumulativeFeeMsat),
        risk_score: riskScore,
        warnings,
      });
    }

    const totalFeeSats = Bolt7.msatToSats(cumulativeFeeMsat);
    const feePercentage = Bolt7.feePercentage(cumulativeFeeMsat, amountMsat);
    const avgRisk = hops.reduce((acc, h) => acc + h.risk_score, 0) / (hops.length || 1);
    const reliabilityScore = Math.max(10, Math.min(100, Math.round(100 - avgRisk)));

    return {
      success: true,
      source_pubkey: sourcePubkey,
      source_alias: sourceAlias,
      target_pubkey: targetPubkey,
      target_alias: targetAlias,
      amount_sats: amountSats,
      amount_msat: amountMsat,
      total_fee_msat: cumulativeFeeMsat,
      total_fee_sats: totalFeeSats,
      fee_percentage: feePercentage,
      total_cltv_delta: cumulativeCltvDelta,
      hop_count: hops.length,
      hops,
      strategy,
      estimated_reliability_score: reliabilityScore,
      execution_risk: reliabilityScore > 75 ? 'low' : reliabilityScore > 45 ? 'medium' : 'high',
      calculation_time_ms: calcTimeMs,
    };
  }
}
