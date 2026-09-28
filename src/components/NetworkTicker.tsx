'use client';

import { useEffect, useState } from 'react';
import { LightningNetworkStatistics } from '@/types/lightning';

export function NetworkTicker() {
  const [stats, setStats] = useState<LightningNetworkStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/mempool/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const raw = data.data.latest || data.data;
          setStats(raw);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.warn('Ticker stats fetch error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-[#090D15] border-b border-white/5 py-2 px-4 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-slate-400">
        {loading ? (
          <div className="flex items-center gap-3 shrink-0 py-0.5">
            <span className="w-2 h-2 rounded-full bg-[#F7931A] live-pulse" />
            <span className="text-slate-400 font-medium">CONNECTING TO LIVE LIGHTNING GOSSIP TOPOLOGY...</span>
          </div>
        ) : error || !stats ? (
          <div className="flex items-center gap-3 shrink-0 py-0.5">
            <span className="w-2 h-2 rounded-full bg-[#FF3366] live-pulse" />
            <span className="text-slate-400 font-medium">MAINNET TOPOLOGY TELEMETRY RECONNECTING...</span>
          </div>
        ) : (
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">CAPACITY:</span>
              <span className="text-[#F7931A] font-bold text-glow-bitcoin">
                {(Number(stats.total_capacity) / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })} BTC
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">CHANNELS:</span>
              <span className="text-white font-medium">
                {Number(stats.channel_count).toLocaleString()}
              </span>
            </div>

            {stats.med_fee_rate != null && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">MEDIAN FEE:</span>
                <span className="text-[#00F2FE] font-medium text-glow-cyan">
                  {stats.med_fee_rate} ppm
                </span>
              </div>
            )}

            {stats.tor_nodes != null && stats.clearnet_nodes != null && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">TOR PRIVACY:</span>
                <span className="text-emerald-400 font-medium">
                  {Math.round((stats.tor_nodes / (stats.clearnet_nodes + stats.tor_nodes || 1)) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
          <span>SOURCE: LIVE MAINNET GOSSIP</span>
          <span>•</span>
          <span className={stats ? 'text-emerald-400' : 'text-slate-500'}>
            {loading ? 'SYNCING' : stats ? 'SYNCED' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}
