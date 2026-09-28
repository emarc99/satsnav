'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Layers, 
  ExternalLink, 
  ShieldCheck, 
  Search,
  ArrowRight
} from 'lucide-react';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';

interface RadarNode {
  id: string;
  alias: string;
  capacityBtc: number;
  channels: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface RadarEdge {
  source: string;
  target: string;
  capacity: number;
}

export default function RadarPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [edges, setEdges] = useState<RadarEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<RadarNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [filterMinBtc, setFilterMinBtc] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState('');

  // Transform and scale state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Ingest live rankings
    fetch('/api/mempool/rankings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const topCapacity = data.data.topByCapacity || [];
          const canvas = canvasRef.current;
          const width = canvas ? canvas.width : 1000;
          const height = canvas ? canvas.height : 700;

          const initialNodes: RadarNode[] = topCapacity.slice(0, 35).map((item: any, i: number) => {
            const capacityBtc = Number(item.capacity) / 100_000_000;
            const known = KNOWN_MAJOR_HUBS.find((h) => h.pubkey === item.publicKey);
            const angle = (i / 35) * Math.PI * 2;
            const radiusDist = 120 + Math.random() * 240;

            return {
              id: item.publicKey,
              alias: item.alias || item.publicKey.substring(0, 10),
              capacityBtc: Number(capacityBtc.toFixed(2)),
              channels: item.channels ?? 0,
              color: known?.color || '#00F2FE',
              x: width / 2 + Math.cos(angle) * radiusDist,
              y: height / 2 + Math.sin(angle) * radiusDist,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              radius: Math.max(6, Math.min(28, Math.sqrt(capacityBtc) * 1.3)),
            };
          });

          // Generate inter-hub mesh edges
          const initialEdges: RadarEdge[] = [];
          for (let i = 0; i < initialNodes.length; i++) {
            for (let j = i + 1; j < Math.min(initialNodes.length, i + 5); j++) {
              initialEdges.push({
                source: initialNodes[i].id,
                target: initialNodes[j].id,
                capacity: Math.min(initialNodes[i].capacityBtc, initialNodes[j].capacityBtc),
              });
            }
          }

          setNodes(initialNodes);
          setEdges(initialEdges);
          if (initialNodes.length > 0) setSelectedNode(initialNodes[0]);
        }
      })
      .catch((err) => console.error('Failed to load radar rankings:', err))
      .finally(() => setLoading(false));
  }, []);

  // Physics & Animation Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      // 1. Draw channel edges
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      ctx.lineWidth = 1;

      for (const edge of edges) {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) continue;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();

        // Draw animated satoshi flow particle
        const flowTime = (Date.now() / 1500) % 1;
        const px = u.x + (v.x - u.x) * flowTime;
        const py = u.y + (v.y - u.y) * flowTime;

        ctx.fillStyle = '#F7931A';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw nodes
      for (const node of nodes) {
        const isSelected = selectedNode?.id === node.id;

        // Glowing outer halo
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2.2);
        grad.addColorStop(0, node.color + '40');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core circle
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Alias text label
        ctx.font = '10px monospace';
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#94A3B8';
        ctx.textAlign = 'center';
        ctx.fillText(node.alias, node.x, node.y + node.radius + 14);
      }

      ctx.restore();

      // Physics update if running
      if (isRunning) {
        setNodes((prevNodes) => {
          return prevNodes.map((node) => {
            let fx = (width / 2 - node.x) * 0.0003;
            let fy = (height / 2 - node.y) * 0.0003;

            for (const other of prevNodes) {
              if (other.id === node.id) continue;
              const dx = node.x - other.x;
              const dy = node.y - other.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              if (dist < 180) {
                const repulse = (180 - dist) / dist;
                fx += (dx / dist) * repulse * 0.12;
                fy += (dy / dist) * repulse * 0.12;
              }
            }

            return {
              ...node,
              x: node.x + node.vx + fx,
              y: node.y + node.vy + fy,
              vx: (node.vx + fx) * 0.94,
              vy: (node.vy + fy) * 0.94,
            };
          });
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, isRunning, selectedNode]);

  // Handle canvas clicks to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.scale;
    const clickY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.scale;

    for (const node of nodes) {
      const dx = clickX - node.x;
      const dy = clickY - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 8) {
        setSelectedNode(node);
        return;
      }
    }
  };

  const filteredNodes = nodes.filter((n) => {
    const matchesBtc = n.capacityBtc >= filterMinBtc;
    const matchesSearch =
      n.alias.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.id.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesBtc && matchesSearch;
  });

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-[#06080D] flex flex-col lg:flex-row overflow-hidden font-mono">
      {/* Center Radar Canvas Area */}
      <div className="relative flex-1 h-[650px] lg:h-auto bg-[#070A11] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10">
        <canvas
          ref={canvasRef}
          width={1100}
          height={750}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />

        {/* Floating Canvas Controls */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0D111A]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isRunning ? 'Pause Physics' : 'Resume Physics'}
          >
            {isRunning ? <Pause className="w-4 h-4 text-[#F7931A]" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <button
            onClick={() => {
              transformRef.current.scale = Math.min(2.5, transformRef.current.scale * 1.2);
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              transformRef.current.scale = Math.max(0.4, transformRef.current.scale / 1.2);
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              transformRef.current = { x: 0, y: 0, scale: 1 };
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Legend */}
        <div className="absolute bottom-4 left-4 bg-[#0D111A]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-[11px] text-slate-400 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#49daaa]" />
            <span>LSP / Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f0b90b]" />
            <span>Exchange</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7931A]" />
            <span>Payment Particle</span>
          </div>
        </div>
      </div>

      {/* Right Drawer: Node Inspector & Directory */}
      <div className="w-full lg:w-96 bg-[#090D15] p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#00F2FE]" />
              <h2 className="text-sm font-bold text-white tracking-wide">NODE INSPECTOR</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30">
              35 HUBS
            </span>
          </div>

          {/* Selected Node Details Card */}
          {selectedNode ? (
            <div className="mt-5 p-4 rounded-xl glass-panel border border-[#00F2FE]/30">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                <h3 className="font-extrabold text-base text-white truncate">{selectedNode.alias}</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 break-all select-all font-mono">
                {selectedNode.id}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">CAPACITY</span>
                  <p className="text-[#F7931A] font-bold text-sm">{selectedNode.capacityBtc} BTC</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">CHANNELS</span>
                  <p className="text-white font-bold text-sm">{selectedNode.channels.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                <Link
                  href={`/router?target=${selectedNode.id}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#00F2FE] hover:bg-[#38f4ff] text-black font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>ROUTE TO THIS NODE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 p-6 rounded-xl border border-dashed border-white/15 text-center text-xs text-slate-500">
              Click any node on the topology canvas to inspect live metrics.
            </div>
          )}

          {/* Filter & Search */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter nodes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]"
              />
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-[11px]">
              <span className="text-slate-500">MIN:</span>
              {[0, 10, 50, 100].map((btc) => (
                <button
                  key={btc}
                  onClick={() => setFilterMinBtc(btc)}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    filterMinBtc === btc
                      ? 'bg-[#F7931A] text-black font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {btc === 0 ? 'ALL' : `${btc}+ BTC`}
                </button>
              ))}
            </div>
          </div>

          {/* Node List */}
          <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredNodes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                  selectedNode?.id === n.id
                    ? 'bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-white'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                  <span className="font-medium truncate">{n.alias}</span>
                </div>
                <span className="text-[#F7931A] font-bold text-[11px] shrink-0 ml-2">
                  {n.capacityBtc} BTC
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
          <span>2D TOPOLOGY FORCE LAYOUT</span>
          <span className="text-emerald-400">60 FPS</span>
        </div>
      </div>
    </div>
  );
}
