/**
 * Directed Multigraph Data Structure for Lightning Network Topology
 * Models asymmetric channel policies where directed edge (A -> B)
 * has different fee and CLTV policies from (B -> A).
 */

export interface GraphNode {
  pubkey: string;
  alias: string;
  capacitySats: number;
  channelCount: number;
  color?: string;
  city?: string | null;
  country?: string | null;
}

export interface GraphEdge {
  id: string; // SCID or channel txid
  source: string; // Outgoing from pubkey
  target: string; // Incoming to pubkey
  capacitySats: number;
  feeBaseMsat: number;
  feeProportionalMillionths: number; // ppm
  cltvExpiryDelta: number;
  minHtlcMsat: number;
  maxHtlcMsat: number;
  disabled: boolean;
}

export class LightningGraph {
  private nodes = new Map<string, GraphNode>();
  private adjacency = new Map<string, GraphEdge[]>();
  private allEdges: GraphEdge[] = [];

  addNode(node: GraphNode): void {
    if (!this.nodes.has(node.pubkey)) {
      this.nodes.set(node.pubkey, node);
      if (!this.adjacency.has(node.pubkey)) {
        this.adjacency.set(node.pubkey, []);
      }
    }
  }

  addEdge(edge: GraphEdge): void {
    // Ensure nodes exist in graph
    if (!this.nodes.has(edge.source)) {
      this.addNode({
        pubkey: edge.source,
        alias: edge.source.substring(0, 10),
        capacitySats: edge.capacitySats,
        channelCount: 1,
      });
    }

    if (!this.nodes.has(edge.target)) {
      this.addNode({
        pubkey: edge.target,
        alias: edge.target.substring(0, 10),
        capacitySats: edge.capacitySats,
        channelCount: 1,
      });
    }

    const edges = this.adjacency.get(edge.source) || [];
    edges.push(edge);
    this.adjacency.set(edge.source, edges);
    this.allEdges.push(edge);
  }

  getNode(pubkey: string): GraphNode | undefined {
    return this.nodes.get(pubkey);
  }

  getOutgoingEdges(pubkey: string): GraphEdge[] {
    return this.adjacency.get(pubkey) || [];
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return this.allEdges;
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.allEdges.length;
  }

  clear(): void {
    this.nodes.clear();
    this.adjacency.clear();
    this.allEdges = [];
  }
}
