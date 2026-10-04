'use client';

import { useState, useEffect, Suspense } from 'react';
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
  DollarSign, 
  ShieldAlert, 
  Radio, 
  Flame,
  ArrowLeftRight
} from 'lucide-react';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';
import { RouteResult, RoutingStrategy } from '@/types/route';

function RouterContent() {
  const searchParams = useSearchParams();
  const targetParam = searchParams.get('target');

  // Guard: if target param matches ACINQ, source defaults to bfx-lnd0 (Bitfinex), else ACINQ
  const initialTarget = targetParam || KNOWN_MAJOR_HUBS[2].pubkey; // Binance
  const initialSource = initialTarget === KNOWN_MAJOR_HUBS[0].pubkey 
    ? KNOWN_MAJOR_HUBS[1].pubkey // bfx-lnd0 if target is ACINQ
    : KNOWN_MAJOR_HUBS[0].pubkey; // ACINQ

  const [source, setSource] = useState(initialSource);
  const [target, setTarget] = useState(initialTarget);
  const [amountSats, setAmountSats] = useState('25000');
  const [strategy, setStrategy] = useState<RoutingStrategy>('cheapest');
  const [chaosMode, setChaosMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [chaosMeta, setChaosMeta] = useState<any>(null);
  const [error, setError] = useState('');

  const calculateRoute = async (
    strat = strategy, 
    chaos = chaosMode, 
    src = source, 
    dst = target
  ) => {
    const amount = Number(amountSats);
    if (!amount || amount <= 0) {
      setError('Please specify a positive satoshi amount');
      return;
    }

    if (src === dst) {
      setError('Origin and Destination cannot be the same node. Please select different nodes to route across the Lightning Network.');
      setRouteResult(null);
      setAlternatives([]);
      setChaosMeta(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: src,
          target: dst,
          amount,
          strategy: strat,
          alternatives: true,
          chaos_mode: chaos,
        }),
      });

      const data = await res.json();
      if (data.success && data.route) {
        setRouteResult(data.route);
        setAlternatives(data.alternatives || []);
        setChaosMeta(data.chaos_fuzzer || null);
      } else {
        setError(data.error || data.route?.error || 'Failed to find a viable route');
        setRouteResult(null);
        setAlternatives([]);
        setChaosMeta(null);
      }
    } catch (err: any) {
      setError(err.message || 'Routing calculation failed');
      setRouteResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    if (newSource === target) {
      const alt = KNOWN_MAJOR_HUBS.find(h => h.pubkey !== newSource)?.pubkey || KNOWN_MAJOR_HUBS[2].pubkey;
      setTarget(alt);
      calculateRoute(strategy, chaosMode, newSource, alt);
      return;
    }
    calculateRoute(strategy, chaosMode, newSource, target);
  };

  const handleTargetChange = (newTarget: string) => {
    setTarget(newTarget);
    if (newTarget === source) {
      const alt = KNOWN_MAJOR_HUBS.find(h => h.pubkey !== newTarget)?.pubkey || KNOWN_MAJOR_HUBS[0].pubkey;
      setSource(alt);
      calculateRoute(strategy, chaosMode, alt, newTarget);
      return;
    }
    calculateRoute(strategy, chaosMode, source, newTarget);
  };

  const handleSwapNodes = () => {
    const nextSource = target;
    const nextTarget = source;
    setSource(nextSource);
    setTarget(nextTarget);
    calculateRoute(strategy, chaosMode, nextSource, nextTarget);
  };

  useEffect(() => {
    calculateRoute(strategy, chaosMode, initialSource, initialTarget);
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
            ENGINE: <span className="text-[#00F2FE] font-bold">MULTI-OBJECTIVE DIJKSTRA (BOLT #7)</span>
          </div>
        </div>

        {/* Dual-Engine Architecture Selector (Fix 2: Whitehat Framing) */}
        <div className="mt-8 p-5 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${chaosMode ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {chaosMode ? 'ADVERSARIAL CHAOS FUZZER (STRESS-TEST SUITE)' : 'SOVEREIGN BITCOIN MAINNET (PRODUCTION)'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  chaosMode 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {chaosMode ? 'INJECTING 8,500 PPM SPIKE' : 'VERIFIED MAINNET GOSSIP'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {chaosMode 
                  ? 'Active whitehat security harness: Injects an in-flight predatory fee-gouging spike (8,500 PPM) into intermediary hops to mathematically prove real-time intercept & reroute.'
                  : 'Operating against 100% verified Bitcoin mainnet channel topology with authentic short channel IDs (SCIDs) and baseline competitive fees.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-[#090D15] rounded-xl border border-white/15 shrink-0 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setChaosMode(false);
                calculateRoute(strategy, false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !chaosMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Production Mainnet
            </button>
            <button
              type="button"
              onClick={() => {
                setChaosMode(true);
                calculateRoute(strategy, true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chaosMode 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.35)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>⚡ Adversarial Chaos Fuzzer</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="mt-6 glass-panel rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Source Node */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400">
                  ORIGIN NODE (SOURCE)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">STEP 0 EGRESS</span>
              </div>
              <select
                value={source}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F7931A]"
              >
                {KNOWN_MAJOR_HUBS.map((hub) => (
                  <option 
                    key={hub.pubkey} 
                    value={hub.pubkey}
                    disabled={hub.pubkey === target}
                  >
                    {hub.alias} ({hub.category.toUpperCase()}){hub.pubkey === target ? ' — [DESTINATION]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Node */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400">
                  DESTINATION (TARGET)
                </label>
                <button
                  type="button"
                  onClick={handleSwapNodes}
                  className="text-[10px] text-[#00F2FE] hover:text-[#3bf4ff] flex items-center gap-1 font-mono transition-colors font-semibold"
                  title="Swap Origin and Destination"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>SWAP NODES</span>
                </button>
              </div>
              <select
                value={target}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
              >
                {KNOWN_MAJOR_HUBS.map((hub) => (
                  <option 
                    key={hub.pubkey} 
                    value={hub.pubkey}
                    disabled={hub.pubkey === source}
                  >
                    {hub.alias} ({hub.category.toUpperCase()}){hub.pubkey === source ? ' — [ORIGIN]' : ''}
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
            {/* Hero Moment: Adversarial Intercept Banner (Fix 2) */}
            {chaosMode && chaosMeta?.intercept_proof && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/50 via-[#180A12] to-amber-950/40 border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-red-500/20">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white tracking-wide">
                          HERO MOMENT: PREDATORY FEE GOUGE INTERCEPTED!
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-black text-[10px] font-black uppercase">
                          ATTACK BLOCKED
                        </span>
                      </div>
                      <p className="text-xs text-red-200/90 mt-1">
                        Intermediary hop attempted dynamic in-flight fee spike to <strong className="text-red-300 font-bold">8,500 PPM</strong> (42.5x vs network median). SatsNav Sentinel intercepted the route and bypassed the predatory hop.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/sentinel"
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    <span>VIEW NOSTR THREAT GOSSIP</span>
                  </a>
                </div>

                {/* Hard Financial Savings Proof */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Naive Unprotected Router Fee</div>
                    <div className="text-lg font-bold text-red-400 line-through mt-0.5">
                      {chaosMeta.intercept_proof.unprotected_fee_sats} sats
                    </div>
                    <div className="text-[10px] text-slate-500">Blindly swallowed fee trap</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">SatsNav Sentinel Guarded Fee</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {chaosMeta.intercept_proof.satsnav_defended_fee_sats} sats
                    </div>
                    <div className="text-[10px] text-emerald-500/80">Guarded by BOLT #7 Dijkstra</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <div className="text-emerald-400 text-[10px] font-bold uppercase">Direct Capital Saved</div>
                    <div className="text-lg font-extrabold text-[#00F2FE] text-glow-cyan mt-0.5">
                      +{chaosMeta.intercept_proof.satoshis_saved} SATS ({chaosMeta.intercept_proof.savings_percent}%)
                    </div>
                    <div className="text-[10px] text-slate-400">Node operator funds protected</div>
                  </div>
                </div>
              </div>
            )}

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

export default function RouterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080D] flex items-center justify-center font-mono text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F7931A] live-pulse" />
            <span>LOADING SATNAV ROUTER...</span>
          </div>
        </div>
      }
    >
      <RouterContent />
    </Suspense>
  );
}
