import AppShell, { DataRow, LiveDot, PageGrid, Panel, PanelTitle, StatCard } from '@/components/app-shell'

export default function OverviewPage() {
  return (
    <AppShell title="Overview">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7e9c20]">Sovereign intelligence command</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">A clearer view of your money.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#66665e]">
          Autonomous pre-flight payment firewall guarding Lightning Network routes against predatory fee gouging and phantom liquidity traps.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Graph liquidity" value="₿ 9.60 BTC" detail="Across 24 mainnet channels" accent />
        <StatCard label="Fee trap savings" value="98.1%" detail="+422 sats on quarantined trap" />
        <StatCard label="Active channels" value="24 SCIDs" detail="Verified mainnet snapshot" />
        <StatCard label="Nostr defense" value="3 Relays" detail="Schnorr threat broadcast" />
      </div>

      <PageGrid>
        <Panel className="lg:col-span-7">
          <PanelTitle meta={<LiveDot />}>Gossip telemetry & uptime</PanelTitle>
          <div className="flex h-48 items-end gap-3 rounded-xl bg-[#fafaf7] p-5">
            {[45, 58, 52, 70, 65, 78, 72, 88, 82, 96, 92, 100].map((height, index) => (
              <div key={index} className="flex-1 rounded-t-md bg-[#b5d44b]" style={{ height: `${height}%`, opacity: 0.45 + index / 24 }} />
            ))}
          </div>
          <div className="mt-5 flex justify-between text-xs font-semibold text-[#85857d]">
            <span>12 hours ago</span>
            <span>Now (100% Gossip Uptime across 10 Major Hubs)</span>
          </div>
        </Panel>

        <Panel className="lg:col-span-5">
          <PanelTitle meta={<span className="rounded-full bg-[#eaf7c4] px-2.5 py-1 text-[11px] font-bold text-[#557c0d]">Guarded</span>}>
            Pre-flight attention queue
          </PanelTitle>
          <DataRow label="Channel 859002x999x1" value="Quarantined" sub="8,500 ppm fee spike blocked (+422 sats saved)" />
          <DataRow label="ACINQ -> Binance route" value="Optimal" sub="8 sats fee via verified backbone" />
          <DataRow label="Agent wallet policy" value="Armed" sub="Pre-flight budget firewall active" />
          <DataRow label="Nostr threat feed" value="Active" sub="wss://relay.damus.io • Schnorr signed" />
        </Panel>
      </PageGrid>
    </AppShell>
  )
}
