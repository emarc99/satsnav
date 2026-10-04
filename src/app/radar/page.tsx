'use client'

import { useState, useEffect } from 'react'
import { Maximize2, Radio, RefreshCw, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'
import { 
  AppShell, 
  DataRow, 
  LiveDot, 
  Orbit, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill, 
  StatCard,
  InfoTag
} from '@/components/app-shell'
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes'

export default function RadarPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedHub, setSelectedHub] = useState<any>(KNOWN_MAJOR_HUBS[0])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <AppShell title="Network radar">
      <PageIntro 
        eyebrow="Sovereign topology layer" 
        title="See the network before you route through it." 
        description="A live, human-readable view of the verified mainnet snapshot powering every SatsNav decision." 
        action={
          <button 
            type="button"
            onClick={handleRefresh}
            className="rounded-xl border border-[#d8d8cf] bg-white px-4 py-3 text-sm font-bold hover:bg-[#efefe8] transition-colors flex items-center"
          >
            <RefreshCw className={`mr-2 inline size-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh snapshot'}
          </button>
        } 
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Verified nodes" value="13" detail="Across 24 mainnet channels" />
        <StatCard label="Total capacity" value="1.84B" detail="satoshis observed" accent />
        <StatCard label="Topology sync" value="12 sec" detail="Real Bitcoin mainnet SCIDs" />
      </div>

      <PageGrid>
        {/* Left Column: Visual Orbit Topology & Hub List */}
        <Panel className="lg:col-span-8">
          <PanelTitle meta={
            <div className="flex items-center gap-3">
              <LiveDot />
              <Pill tone="dark">24 SCIDs</Pill>
            </div>
          }>
            Mainnet topology orbit
          </PanelTitle>

          <div className="grid min-h-[380px] place-items-center overflow-hidden rounded-2xl bg-[#f3f4e9] p-6 mb-6">
            <Orbit size={340} />
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#77776e] mb-3">
              Verified routing hubs in snapshot
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KNOWN_MAJOR_HUBS.map((hub) => (
                <div 
                  key={hub.pubkey}
                  onClick={() => setSelectedHub(hub)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedHub?.pubkey === hub.pubkey 
                      ? 'border-[#171717] bg-[#171717] text-white shadow-sm' 
                      : 'border-[#ecece5] bg-[#fafaf7] hover:border-[#deded5] text-[#171717]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">{hub.alias}</p>
                    <p className={`text-[11px] font-mono ${selectedHub?.pubkey === hub.pubkey ? 'text-[#d7f76a]' : 'text-[#88887f]'}`}>
                      {hub.typical_capacity_btc} BTC capacity
                    </p>
                  </div>
                  <Link 
                    href={`/router?target=${hub.pubkey}`}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      selectedHub?.pubkey === hub.pubkey 
                        ? 'bg-[#d7f76a] text-[#171717]' 
                        : 'bg-white border border-[#deded5] text-[#171717] hover:bg-[#efefe8]'
                    }`}
                  >
                    Route →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Right Column: Node Details & Network Signals */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Panel>
            <PanelTitle meta={<Radio className="size-4 text-[#84b51d]" />}>
              Selected node profile
            </PanelTitle>
            <div className="rounded-2xl bg-[#eaf7c4] p-5 mb-4">
              <p className="text-xs font-bold uppercase text-[#557c0d]">Direct Node</p>
              <h3 className="text-xl font-bold text-[#171717] mt-1">{selectedHub.alias}</h3>
              <p className="font-mono text-[11px] text-[#424831] mt-1 break-all">
                {selectedHub.pubkey}
              </p>
            </div>
            <DataRow label="Category" value={selectedHub.category?.toUpperCase() || 'ROUTING_HUB'} />
            <DataRow label="Typical capacity" value={`${selectedHub.typical_capacity_btc} BTC`} sub="Mainnet public channels" />
            <DataRow label="Firewall status" value="Active" sub="Guarded against fee spikes" />
            <div className="mt-5">
              <Link 
                href={`/router?target=${selectedHub.pubkey}`}
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#171717] py-3 text-xs font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5"
              >
                Plan payment to {selectedHub.alias} <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelTitle meta={<ShieldCheck className="size-4 text-[#84b51d]" />}>
              Network signals
            </PanelTitle>
            <DataRow label="Inbound liquidity" value="71%" sub="Healthy distribution" />
            <DataRow label="Median fee" value="42 ppm" sub="Across verified edges" />
            <DataRow label="Channel resilience" value="88 / 100" sub="Capacity-weighted" />
            <DataRow label="Fee outliers" value="1" sub="Quarantined by sentinel" />
          </Panel>
        </div>
      </PageGrid>
    </AppShell>
  )
}
