'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  GitFork, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  DollarSign
} from 'lucide-react';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';
import { RouteResult, RoutingStrategy } from '@/types/route';

export default function RouterPage() {
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get('target') || KNOWN_MAJOR_HUBS[2].pubkey; // Binance

  const [source, setSource] = useState(KNOWN_MAJOR_HUBS[0].pubkey); // ACINQ
  const [target, setTarget] = useState(initialTarget);
  const [amountSats, setAmountSats] = useState('25000');
  const [strategy, setStrategy] = useState<RoutingStrategy>('cheapest');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [error, setError] = useState('');

  const calculateRoute = async (strat = strategy) => {
    const amount = Number(amountSats);
    if (!amount || amount <= 0) {
      setError('Please specify a positive satoshi amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          target,
          amount,
          strategy: strat,
          alternatives: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.route) {
        setRouteResult(data.route);
        setAlternatives(data.alternatives || []);
      } else {
        setError(data.error || 'Failed to find a viable route');
      }
    } catch (err: any) {
      setError(err.message || 'Routing calculation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRoute();
  }, []);

  return (
    <div className="min-h-screen bg-[#06080D] bg-cypher-grid py-10 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/30 text-xs text-[#F7931A] mb-2">
              <GitFork className="w-3.5 h-3.5" />
              <span>DETERMINISTIC BOLT #7 PATHFINDING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Route Optimizer & Sentinel</h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-hop Dijkstra algorithm calculating backward onion amounts, fee breakdowns, and liquidity margins.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
            ENGINE: <span className="text-[#00F2FE] font-bold">DIJKSTRA + A* DUAL HEURISTIC</span>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Source Node */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                ORIGIN NODE (SOURCE)
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F7931A]"
              >
                {KNOWN_MAJOR_HUBS.map((hub) => (
                  <option key={hub.pubkey} value={hub.pubkey}>
                    {hub.alias} ({hub.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Node */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                DESTINATION (TARGET)
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
              >
                {KNOWN_MAJOR_HUBS.map((hub) => (
                  <option key={hub.pubkey} value={hub.pubkey}>
                    {hub.alias} ({hub.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                PAYMENT AMOUNT (SATOSHIS)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amountSats}
                  onChange={(e) => setAmountSats(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F7931A]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">
                  SATS
                </span>
              </div>
            </div>
          </div>

          {/* Strategy Selector Tabs */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-2">STRATEGY:</span>
              {(
                [
                  { id: 'cheapest', label: '⚡ CHEAPEST FEE', icon: Zap },
                  { id: 'fastest', label: '🚀 LOWEST LATENCY', icon: Clock },
                  { id: 'reliable', label: '🛡️ MAX RELIABILITY', icon: ShieldCheck },
                  { id: 'balanced', label: '⚖️ BALANCED', icon: Sliders },
                ] as const
              ).map((tab) => {
                const isSelected = strategy === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStrategy(tab.id);
                      calculateRoute(tab.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#F7931A] text-black shadow-[0_0_15px_rgba(247,147,26,0.4)]'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => calculateRoute()}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#00F2FE] hover:bg-[#3bf4ff] text-black font-bold text-xs tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
            >
              <span>{loading ? 'COMPUTING...' : 'DISCOVER OPTIMAL PATH'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Route Output Results */}
        {routeResult && (
          <div className="mt-8 space-y-8 animate-in fade-in duration-300">
            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#F7931A]">
                <div className="text-slate-500 text-[11px]">TOTAL ROUTING FEE</div>
                <div className="text-xl font-extrabold text-[#F7931A] text-glow-bitcoin mt-1">
                  {routeResult.total_fee_sats} sats
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {routeResult.fee_percentage}% of payment
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#00F2FE]">
                <div className="text-slate-500 text-[11px]">HOPS &amp; DELAY</div>
                <div className="text-xl font-extrabold text-[#00F2FE] text-glow-cyan mt-1">
                  {routeResult.hop_count} Hops
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  +{routeResult.total_cltv_delta} blocks CLTV
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4 border-l-4 border-l-emerald-400">
                <div className="text-slate-500 text-[11px]">RELIABILITY ESTIMATE</div>
                <div className="text-xl font-extrabold text-emerald-400 text-glow-green mt-1">
                  {routeResult.estimated_reliability_score}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 uppercase">
                  {routeResult.execution_risk} Execution Risk
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4 border-l-4 border-l-purple-400">
                <div className="text-slate-500 text-[11px]">CALCULATION LATENCY</div>
                <div className="text-xl font-extrabold text-purple-400 mt-1">
                  {routeResult.calculation_time_ms} ms
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pure deterministic engine
                </div>
              </div>
            </div>

            {/* Visual Hop Flow Progression */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-6 flex items-center gap-2">
                <span>ONION ROUTING HOP PROGRESSION</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                  VERIFIED
                </span>
              </h3>

              <div className="space-y-4">
                {routeResult.hops.map((hop, idx) => (
                  <div
                    key={hop.hop_index}
                    className="p-4 rounded-xl bg-[#090D15] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{hop.from_node_alias}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#F7931A]" />
                          <span className="font-bold text-white text-sm">{hop.to_node_alias}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                          Channel: {hop.channel_id} • Capacity: {hop.channel_capacity_sats.toLocaleString()} sats
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-right">
                      <div>
                        <div className="text-slate-500 text-[10px]">HOP FEE</div>
                        <div className="text-[#F7931A] font-bold">{hop.fee_sats} sats</div>
                        <div className="text-[10px] text-slate-400">{hop.fee_proportional_millionths} ppm</div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px]">CLTV DELTA</div>
                        <div className="text-slate-300 font-bold">+{hop.cltv_expiry_delta} blks</div>
                      </div>

                      <div className="w-24">
                        <div className="text-slate-500 text-[10px]">RISK SCORE</div>
                        <div className={`font-bold ${hop.risk_score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {hop.risk_score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives Comparison */}
            {alternatives.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">
                  STRATEGY ALTERNATIVES COMPARISON
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border text-xs ${
                        alt.route.strategy === strategy
                          ? 'bg-[#F7931A]/10 border-[#F7931A]/40'
                          : 'bg-[#090D15] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white uppercase">
                        <span>{alt.route.strategy}</span>
                        {alt.route.strategy === strategy && (
                          <span className="text-[10px] text-[#F7931A]">SELECTED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{alt.difference_summary}</p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-slate-500">Fee: {alt.route.total_fee_sats} sats</span>
                        <span className="text-slate-400">{alt.route.hop_count} hops</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
