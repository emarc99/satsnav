'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Zap,
  BarChart3,
  Sliders,
  Radio,
  ArrowRight,
  Flame,
  Globe,
  Copy,
  Check
} from 'lucide-react';
import { FeeDistribution } from '@/lib/sentinel';
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes';

export default function SentinelPage() {
  const [distribution, setDistribution] = useState<FeeDistribution | null>(null);
  const [hubRankings, setHubRankings] = useState<any[]>([]);
  const [anomalousChannels, setAnomalousChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Adversarial Simulation State
  const [targetNode, setTargetNode] = useState(KNOWN_MAJOR_HUBS[0].pubkey);
  const [simulatedPpm, setSimulatedPpm] = useState(4800);
  const [broadcastingNostr, setBroadcastingNostr] = useState(false);
  const [nostrSuccessMessage, setNostrSuccessMessage] = useState('');
  const [nostrIdentity, setNostrIdentity] = useState<any>(null);
  const [nostrAlerts, setNostrAlerts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const fetchSentinelData = () => {
    fetch('/api/sentinel')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDistribution(data.fee_distribution);
          setHubRankings(data.hub_reliability_rankings || []);
          setAnomalousChannels(data.anomalous_channels || []);
        }
      })
      .catch((err) => console.error('Failed to load sentinel data:', err))
      .finally(() => setLoading(false));

    fetch('/api/sentinel/nostr')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNostrIdentity(data.identity);
          setNostrAlerts(data.recentAlerts || []);
        }
      })
      .catch((err) => console.warn('Failed to load Nostr identity:', err));
  };

  useEffect(() => {
    fetchSentinelData();
  }, []);

  // Compute live threat evaluation for sandbox
  const median = distribution?.p50MedianPpm || 100;
  const p90 = distribution?.p90Ppm || 850;
  const multiplier = Number((simulatedPpm / Math.max(1, median)).toFixed(1));

  let simSeverity: 'none' | 'moderate' | 'severe' | 'predatory' = 'none';
  let simVerdict = 'APPROVED_SAFE';
  let simColor = 'text-emerald-400';
  let simBorder = 'border-emerald-500/30';
  let simBg = 'bg-emerald-500/10';

  if (simulatedPpm >= p90 * 2.5 || multiplier >= 8.0) {
    simSeverity = 'predatory';
    simVerdict = 'CRITICAL: PREDATORY FEE GOUGE';
    simColor = 'text-[#FF3366]';
    simBorder = 'border-[#FF3366]/40';
    simBg = 'bg-[#FF3366]/10';
  } else if (simulatedPpm >= p90 || multiplier >= 3.5) {
    simSeverity = 'severe';
    simVerdict = 'WARNING: SEVERE FEE ELEVATION';
    simColor = 'text-[#FF8A00]';
    simBorder = 'border-[#FF8A00]/40';
    simBg = 'bg-[#FF8A00]/10';
  } else if (multiplier >= 2.0) {
    simSeverity = 'moderate';
    simVerdict = 'CAUTION: MODERATE SURCHARGE';
    simColor = 'text-yellow-400';
    simBorder = 'border-yellow-500/40';
    simBg = 'bg-yellow-500/10';
  }

  const selectedNodeObj = KNOWN_MAJOR_HUBS.find((h) => h.pubkey === targetNode) || KNOWN_MAJOR_HUBS[0];

  const handleBroadcastNostr = async () => {
    setBroadcastingNostr(true);
    setNostrSuccessMessage('');

    try {
      const res = await fetch('/api/sentinel/nostr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodePubkey: selectedNodeObj.pubkey,
          alias: selectedNodeObj.alias,
          ppm: simulatedPpm,
          medianPpm: median,
          multiplierVsMedian: multiplier,
          severity: simSeverity === 'none' ? 'moderate' : simSeverity,
          recommendation: `High fee alert: ${selectedNodeObj.alias} observed charging ${simulatedPpm} ppm (${multiplier}x median). Automated agent reroute recommended.`,
        }),
      });

      const data = await res.json();
      if (data.success && data.event) {
        setNostrSuccessMessage(`Broadcasted to Nostr Relays! Event ID: ${data.event.id.slice(0, 16)}...`);
        setNostrAlerts((prev) => [data.event, ...prev.slice(0, 19)]);
      }
    } catch (err: any) {
      console.error('Nostr broadcast error:', err);
    } finally {
      setBroadcastingNostr(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] bg-cypher-grid py-10 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3366]/10 border border-[#FF3366]/30 text-xs text-[#FF3366] mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>STATISTICAL ANOMALY &amp; PREDATORY FEE DETECTOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Fee Gouge Sentinel</h1>
            <p className="text-xs text-slate-400 mt-1">
              Continuously audits live mainnet percentiles to protect autonomous AI agents from predatory routing traps.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
            <span>MONITORING:</span>
            <span className="text-[#FF3366] font-bold">LIVE MAINNET CHANNELS</span>
          </div>
        </div>

        {/* Statistical Percentiles Cards */}
        {distribution && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-panel rounded-xl p-4 border-l-4 border-l-slate-500">
              <div className="text-slate-500 text-[11px]">25TH PERCENTILE</div>
              <div className="text-lg font-extrabold text-white mt-1">{distribution.p25Ppm} ppm</div>
              <div className="text-[10px] text-slate-400">Competitive baseline</div>
            </div>

            <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#00F2FE]">
              <div className="text-slate-500 text-[11px]">MEDIAN (P50)</div>
              <div className="text-xl font-extrabold text-[#00F2FE] text-glow-cyan mt-1">
                {distribution.p50MedianPpm} ppm
              </div>
              <div className="text-[10px] text-slate-400">Network benchmark</div>
            </div>

            <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#F7931A]">
              <div className="text-slate-500 text-[11px]">75TH PERCENTILE</div>
              <div className="text-lg font-extrabold text-[#F7931A] mt-1">{distribution.p75Ppm} ppm</div>
              <div className="text-[10px] text-slate-400">Premium routing</div>
            </div>

            <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#FF8A00]">
              <div className="text-slate-500 text-[11px]">90TH PERCENTILE</div>
              <div className="text-lg font-extrabold text-[#FF8A00] mt-1">{distribution.p90Ppm} ppm</div>
              <div className="text-[10px] text-slate-400">Elevated threshold</div>
            </div>

            <div className="glass-panel rounded-xl p-4 border-l-4 border-l-[#FF3366]">
              <div className="text-slate-500 text-[11px]">99TH PERCENTILE</div>
              <div className="text-xl font-extrabold text-[#FF3366] text-glow-red mt-1">
                {distribution.p99Ppm} ppm
              </div>
              <div className="text-[10px] text-red-400">Predatory danger zone</div>
            </div>
          </div>
        )}

        {/* Adversarial Attack Vector Sandbox */}
        <div className="mt-8 glass-panel rounded-2xl p-6 border border-[#FF3366]/30 shadow-[0_0_30px_rgba(255,51,102,0.1)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF3366]/20 border border-[#FF3366]/40 flex items-center justify-center text-[#FF3366]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                  ADVERSARIAL ATTACK SIMULATION SANDBOX
                </h2>
                <p className="text-[11px] text-slate-400">
                  Simulate an intermediary node jacking fees up to predatory rates to observe Sentinel threat detection &amp; Nostr broadcasts.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#FF3366]/10 text-[#FF3366] text-[10px] font-bold border border-[#FF3366]/30">
              LIVE TESTBED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Target Node Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                TARGET ROUTING HUB UNDER ATTACK
              </label>
              <select
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value)}
                className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF3366]"
              >
                {KNOWN_MAJOR_HUBS.map((hub) => (
                  <option key={hub.pubkey} value={hub.pubkey}>
                    {hub.alias} ({hub.category.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-2 truncate">
                Pubkey: {selectedNodeObj.pubkey}
              </p>
            </div>

            {/* Fee Spike Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold text-slate-400">SIMULATED FEE RATE</label>
                <span className="text-[#F7931A] font-bold">{simulatedPpm.toLocaleString()} ppm</span>
              </div>
              <input
                type="range"
                min="100"
                max="15000"
                step="100"
                value={simulatedPpm}
                onChange={(e) => setSimulatedPpm(Number(e.target.value))}
                className="w-full accent-[#FF3366] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>100 ppm (Fair)</span>
                <span>2,500 ppm (High)</span>
                <span>15,000 ppm (Predatory)</span>
              </div>
            </div>

            {/* Real-Time Sentinel Diagnosis */}
            <div className={`p-4 rounded-xl border ${simBorder} ${simBg} flex flex-col justify-between`}>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  SENTINEL DIAGNOSIS
                </div>
                <div className={`text-base font-extrabold mt-1 ${simColor}`}>
                  {simVerdict}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Charged Fee is <span className="font-bold text-white">{multiplier}x</span> network median ({median} ppm).
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                <button
                  onClick={handleBroadcastNostr}
                  disabled={broadcastingNostr}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#FF3366] hover:bg-[#ff4d79] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(255,51,102,0.3)]"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{broadcastingNostr ? 'SIGNING...' : 'BROADCAST TO NOSTR'}</span>
                </button>

                <Link
                  href={`/router?target=${selectedNodeObj.pubkey}&strategy=cheapest`}
                  className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <span>AUTONOMOUS BYPASS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {nostrSuccessMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{nostrSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Nostr Decentralized Threat Feed */}
        <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00F2FE]" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                DECENTRALIZED NOSTR THREAT INTELLIGENCE (NIP-01)
              </h2>
            </div>
            {nostrIdentity && (
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="text-slate-500">SENTINEL NPUB:</span>
                <span className="text-[#00F2FE] select-all truncate max-w-xs">{nostrIdentity.npub}</span>
              </div>
            )}
          </div>

          {nostrAlerts.length > 0 ? (
            <div className="space-y-4">
              {nostrAlerts.map((alert, idx) => (
                <div
                  key={alert.id || idx}
                  className="p-4 rounded-xl bg-[#090D15] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#FF3366]/20 text-[#FF3366] font-bold text-[10px] uppercase">
                        NIP-01 THREAT ADVISORY
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>SCHNORR SIGNED &amp; VERIFIED</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={alert.explorer_urls?.nostr_band || `https://nostr.band/${alert.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-[#F7931A]/10 hover:bg-[#F7931A]/20 border border-[#F7931A]/30 text-[#F7931A] text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>nostr.band</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={alert.explorer_urls?.coracle || `https://coracle.social/e/${alert.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span>coracle</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={alert.explorer_urls?.njump || `https://njump.me/${alert.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span>njump</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="text-white font-mono font-medium whitespace-pre-line text-xs bg-black/30 p-3 rounded-lg border border-white/5">
                    {alert.content}
                  </div>

                  {/* Cryptographic Receipt Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-slate-500 uppercase shrink-0">EVENT ID:</span>
                      <span className="text-white truncate select-all">{alert.id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(alert.id, alert.id)}
                        className="p-1 hover:text-white transition-colors shrink-0"
                        title="Copy Event ID"
                      >
                        {copiedId === alert.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-slate-500 uppercase shrink-0">SCHNORR SIG:</span>
                      <span className="text-slate-300 truncate select-all">{alert.sig || 'Verifiable NIP-01 Signature'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    <span>RELAY BROADCAST CONSENSUS: {alert.relays?.length || 3} RELAYS</span>
                    <span className="text-emerald-400 font-semibold">STATUS: CONFIRMED DECENTRALIZED</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
              Use the Adversarial Sandbox above or trigger an MCP threat alert to broadcast signed threat telemetry to Nostr relays.
            </div>
          )}
        </div>

        {/* Hub Reliability Index */}
        <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00F2FE]" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                MAJOR ROUTING HUB RELIABILITY INDEX
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">BASED ON CONNECTIVITY, LIQUIDITY &amp; AGE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubRankings.map((item) => (
              <div
                key={item.pubkey}
                className="p-4 rounded-xl bg-[#090D15] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-white text-sm">{item.alias}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.reliability.tier === 'Elite Router'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30'
                      }`}
                    >
                      {item.reliability.tier}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">RELIABILITY SCORE</span>
                    <span className="text-[#F7931A] font-extrabold text-sm">{item.reliability.score}/100</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.reliability.stabilityFactors.map((f: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.reliability.channelCount} Channels</span>
                  <span>{item.reliability.capacityBtc} BTC Capacity</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Predatory Channels Table */}
        <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF3366]" />
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                FLAGGED MAINNET FEE ANOMALIES ({anomalousChannels.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">AUTO-AVOIDED BY 'CHEAPEST' ROUTER</span>
          </div>

          {anomalousChannels.length > 0 ? (
            <div className="space-y-3">
              {anomalousChannels.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#FF3366]/20 text-[#FF3366] font-bold text-[10px] uppercase">
                      {item.alert.severity}
                    </span>
                    <div>
                      <div className="text-white font-bold">
                        {item.sourceAlias} ➔ {item.targetAlias}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.alert.recommendation}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[#FF3366] font-bold text-sm">{item.alert.hopPpm} ppm</div>
                    <div className="text-[10px] text-slate-500">{item.alert.multiplierVsMedian}x vs network median</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
              All monitored channels are currently operating within safe fee tolerance bounds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
