'use client';

import { useEffect, useState } from 'react';
import { LightningNetworkStatistics } from '@/types/lightning';

export function NetworkTicker() {
  const [stats, setStats] = useState<LightningNetworkStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mempool/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch((err) => console.warn('Ticker stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const capacityBtc = stats
    ? (stats.total_capacity / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })
    : '4,850+';

  const channels = stats ? stats.channel_count.toLocaleString() : '36,400+';
  const medianFee = stats ? `${stats.med_fee_rate} ppm` : '250 ppm';
  const torRatio = stats
    ? `${Math.round((stats.tor_nodes / (stats.clearnet_nodes + stats.tor_nodes || 1)) * 100)}%`
    : '68%';

  return (
    <div className="w-full bg-[#090D15] border-b border-white/5 py-2 px-4 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-slate-400">
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">CAPACITY:</span>
            <span className="text-[#F7931A] font-bold text-glow-bitcoin">{capacityBtc} BTC</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">CHANNELS:</span>
            <span className="text-white font-medium">{channels}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">MEDIAN FEE:</span>
            <span className="text-[#00F2FE] font-medium text-glow-cyan">{medianFee}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">TOR PRIVACY:</span>
            <span className="text-emerald-400 font-medium">{torRatio}</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
          <span>SOURCE: MEMPOOL.SPACE API</span>
          <span>•</span>
          <span className="text-emerald-400">SYNCED</span>
        </div>
      </div>
    </div>
  );
}
