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
  BarChart3
} from 'lucide-react';
import { FeeDistribution } from '@/lib/sentinel';

export default function SentinelPage() {
  const [distribution, setDistribution] = useState<FeeDistribution | null>(null);
  const [hubRankings, setHubRankings] = useState<any[]>([]);
  const [anomalousChannels, setAnomalousChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
              Continuously audits network fee percentiles to protect autonomous agents from predatory routing traps.
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
                FLAGGED FEE-GOUGING CHANNELS ({anomalousChannels.length})
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
