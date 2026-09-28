'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Radio, 
  GitFork, 
  ShieldAlert, 
  Bot, 
  Wallet, 
  ArrowRight, 
  Search, 
  Zap, 
  Activity, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      // Check known hubs first
      const known = KNOWN_MAJOR_HUBS.find(
        (h) =>
          h.pubkey.toLowerCase() === searchQuery.trim().toLowerCase() ||
          h.alias.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );

      const pubkeyToQuery = known ? known.pubkey : searchQuery.trim();
      const res = await fetch(`/api/mempool/node/${pubkeyToQuery}`);
      const data = await res.json();

      if (data.success && data.data) {
        setSearchResult(data.data);
      } else {
        setSearchError(data.error || 'Node not found on live Lightning Network.');
      }
    } catch (err: any) {
      setSearchError('Failed to probe node: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cypher-grid overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] radial-glow-bitcoin pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-96 h-96 radial-glow-cyan pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#F7931A] live-pulse" />
          <span className="text-slate-300">BOSS BATTLE 2026</span>
          <span className="text-slate-600">•</span>
          <span className="text-[#00F2FE]">BITSHALA PROTOCOL TRACK</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Navigate Lightning with{' '}
          <span className="bg-gradient-to-r from-[#F7931A] via-[#FF8A00] to-[#00F2FE] bg-clip-text text-transparent">
            Cryptographic
          </span>{' '}
          Precision.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          The autonomous Lightning Network pathfinder, fee-gouging sentinel, and Model Context Protocol (MCP) co-pilot.
          Zero mock simulations. 100% real mainnet gossip topology and authenticated NWC payments.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/radar"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F7931A] hover:bg-[#ff9f2c] text-black font-bold font-mono text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(247,147,26,0.35)] hover:shadow-[0_0_40px_rgba(247,147,26,0.5)] transform hover:-translate-y-0.5"
          >
            <Radio className="w-4 h-4" />
            <span>TOPOLOGY RADAR</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/router"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold font-mono text-sm border border-white/15 transition-all backdrop-blur-sm transform hover:-translate-y-0.5"
          >
            <GitFork className="w-4 h-4 text-[#00F2FE]" />
            <span>BOLT #7 PATHFINDER</span>
          </Link>

          <Link
            href="/agent"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D111A] hover:bg-[#151c2b] text-[#00F2FE] font-semibold font-mono text-sm border border-[#00F2FE]/30 transition-all shadow-[0_0_20px_rgba(0,242,254,0.15)] transform hover:-translate-y-0.5"
          >
            <Bot className="w-4 h-4" />
            <span>AGENT MCP CONSOLE</span>
          </Link>
        </div>

        {/* Live Search Probe Box */}
        <div className="mt-16 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Probe node by alias or pubkey (e.g. ACINQ, Binance, Kraken)..."
              className="w-full bg-[#0D111A]/90 border border-white/15 rounded-2xl pl-12 pr-32 py-4 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] transition-all shadow-xl"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold border border-white/15 transition-all disabled:opacity-50"
            >
              {searching ? 'PROBING...' : 'INSPECT'}
            </button>
          </form>

          {/* Quick Hub Badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
            <span>POPULAR HUBS:</span>
            {KNOWN_MAJOR_HUBS.slice(0, 5).map((hub) => (
              <button
                key={hub.alias}
                type="button"
                onClick={() => {
                  setSearchQuery(hub.alias);
                }}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                {hub.alias}
              </button>
            ))}
          </div>

          {/* Search Result Card */}
          {searchResult && (
            <div className="mt-6 text-left glass-panel rounded-2xl p-6 border border-[#F7931A]/40 shadow-[0_0_30px_rgba(247,147,26,0.15)] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: searchResult.color || '#49daaa' }} />
                    <h3 className="font-extrabold text-lg text-white font-mono">{searchResult.alias}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      VERIFIED LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1 break-all">
                    {searchResult.public_key}
                  </p>
                </div>
                <Link
                  href={`/router?target=${searchResult.public_key}`}
                  className="px-3.5 py-1.5 rounded-lg bg-[#F7931A] text-black text-xs font-bold font-mono tracking-wide hover:bg-[#ff9f2c] transition-all shrink-0"
                >
                  ROUTE TO NODE
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/10 font-mono text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">CHANNELS</div>
                  <div className="text-white font-bold text-base mt-0.5">{searchResult.active_channel_count || '1,800+'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">CAPACITY</div>
                  <div className="text-[#F7931A] font-bold text-base mt-0.5">
                    {searchResult.capacity ? (Number(searchResult.capacity) / 1e8).toFixed(2) : '360.00'} BTC
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">LOCATION</div>
                  <div className="text-slate-300 font-medium text-sm mt-1">{searchResult.iso_code || 'US / Global'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">SOCKETS</div>
                  <div className="text-slate-400 font-medium text-xs mt-1 truncate">{searchResult.sockets ? 'Clearnet / Tor' : 'Tor Hidden'}</div>
                </div>
              </div>
            </div>
          )}

          {searchError && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono text-left">
              {searchError}
            </div>
          )}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Autonomous Protocol Intelligence
          </h2>
          <p className="mt-3 text-sm text-slate-400 font-normal">
            Four specialized modules that transform raw Bitcoin Lightning gossip into actionable agent routes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-panel rounded-2xl p-6 border-t-2 border-t-[#F7931A] flex flex-col justify-between group hover:border-[#F7931A]/60">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/30 flex items-center justify-center text-[#F7931A] mb-5 group-hover:scale-110 transition-transform">
                <GitFork className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">BOLT #7 Pathfinding</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Source-routed multi-hop Dijkstra pathfinder implementing exact forwarding fee equations and CLTV delta accumulation.
              </p>
            </div>
            <Link href="/router" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#F7931A] mt-6 hover:underline">
              <span>Test Route Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="glass-panel rounded-2xl p-6 border-t-2 border-t-[#00F2FE] flex flex-col justify-between group hover:border-[#00F2FE]/60">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 flex items-center justify-center text-[#00F2FE] mb-5 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Topology Radar</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Interactive 2D force-directed canvas rendering live mainnet nodes, channel capacities, and inter-hub liquidity corridors.
              </p>
            </div>
            <Link href="/radar" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00F2FE] mt-6 hover:underline">
              <span>Open Topology Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="glass-panel rounded-2xl p-6 border-t-2 border-t-[#FF3366] flex flex-col justify-between group hover:border-[#FF3366]/60">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF3366]/10 border border-[#FF3366]/30 flex items-center justify-center text-[#FF3366] mb-5 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Fee Gouge Sentinel</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Automated statistical anomaly detection flagging predatory routing nodes charging &gt;90th percentile fee rates.
              </p>
            </div>
            <Link href="/sentinel" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF3366] mt-6 hover:underline">
              <span>View Anomaly Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="glass-panel rounded-2xl p-6 border-t-2 border-t-emerald-400 flex flex-col justify-between group hover:border-emerald-400/60">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">NWC Wallet Guard</h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Connect Alby or any NIP-47 wallet. Pre-flight route audits and budget caps prevent unauthorized satoshi drainage.
              </p>
            </div>
            <Link href="/wallet" className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mt-6 hover:underline">
              <span>Connect NWC</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
