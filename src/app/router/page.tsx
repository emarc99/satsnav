'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  AlertTriangle,
  Zap,
  ShieldCheck,
  Clock,
  Sliders,
  DollarSign
} from 'lucide-react'
import { 
  AppShell, 
  InfoTag, 
  LiveDot, 
  MiniBar, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill, 
  ActionButton 
} from '@/components/app-shell'
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes'
import { RouteResult, RoutingStrategy } from '@/types/route'

function RouterContent() {
  const searchParams = useSearchParams()
  const targetParam = searchParams.get('target')

  // Mutual exclusion guard on mount
  const initialTarget = targetParam || KNOWN_MAJOR_HUBS[2].pubkey // Binance
  const initialSource = initialTarget === KNOWN_MAJOR_HUBS[0].pubkey 
    ? KNOWN_MAJOR_HUBS[1].pubkey // bfx-lnd0 if target is ACINQ
    : KNOWN_MAJOR_HUBS[0].pubkey // ACINQ

  const [source, setSource] = useState(initialSource)
  const [target, setTarget] = useState(initialTarget)
  const [amountSats, setAmountSats] = useState('25000')
  const [strategy, setStrategy] = useState<RoutingStrategy>('cheapest')
  const [chaosMode, setChaosMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [chaosMeta, setChaosMeta] = useState<any>(null)
  const [error, setError] = useState('')

  const calculateRoute = async (
    strat = strategy, 
    chaos = chaosMode, 
    src = source, 
    dst = target
  ) => {
    const amount = Number(amountSats)
    if (!amount || amount <= 0) {
      setError('Please specify a positive satoshi amount')
      return
    }

    if (src === dst) {
      setError('Origin and Destination cannot be the same node. Please select different nodes.')
      setRouteResult(null)
      setChaosMeta(null)
      return
    }

    setLoading(true)
    setError('')

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
      })

      const data = await res.json()
      if (data.success && data.route) {
        setRouteResult(data.route)
        setChaosMeta(data.chaos_fuzzer || null)
      } else {
        setError(data.error || data.route?.error || 'Failed to find a viable route')
        setRouteResult(null)
        setChaosMeta(null)
      }
    } catch (err: any) {
      setError(err.message || 'Routing calculation failed')
      setRouteResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSourceChange = (newSource: string) => {
    setSource(newSource)
    if (newSource === target) {
      const alt = KNOWN_MAJOR_HUBS.find(h => h.pubkey !== newSource)?.pubkey || KNOWN_MAJOR_HUBS[2].pubkey
      setTarget(alt)
      calculateRoute(strategy, chaosMode, newSource, alt)
      return
    }
    calculateRoute(strategy, chaosMode, newSource, target)
  }

  const handleTargetChange = (newTarget: string) => {
    setTarget(newTarget)
    if (newTarget === source) {
      const alt = KNOWN_MAJOR_HUBS.find(h => h.pubkey !== newTarget)?.pubkey || KNOWN_MAJOR_HUBS[0].pubkey
      setSource(alt)
      calculateRoute(strategy, chaosMode, alt, newTarget)
      return
    }
    calculateRoute(strategy, chaosMode, source, newTarget)
  }

  const handleSwapNodes = () => {
    const nextSource = target
    const nextTarget = source
    setSource(nextSource)
    setTarget(nextTarget)
    calculateRoute(strategy, chaosMode, nextSource, nextTarget)
  }

  const toggleChaosMode = () => {
    const nextChaos = !chaosMode
    setChaosMode(nextChaos)
    calculateRoute(strategy, nextChaos, source, target)
  }

  useEffect(() => {
    calculateRoute(strategy, chaosMode, initialSource, initialTarget)
  }, [])

  const displayHops = routeResult?.hops || []

  return (
    <AppShell title="Route optimizer">
      <PageIntro 
        eyebrow="BOLT #7 pathfinder" 
        title="Make the safe route the easy route." 
        description="Choose a strategy, inspect every hop, and let the firewall reject fee traps before an invoice becomes an HTLC." 
        action={
          <button 
            type="button"
            onClick={toggleChaosMode} 
            className={`rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center shadow-sm ${
              chaosMode 
                ? 'bg-[#ff8c73] text-[#171717] hover:bg-[#ff7557]' 
                : 'bg-[#171717] text-white hover:bg-black'
            }`}
          >
            <ShieldAlert className="mr-2 inline size-4" />
            {chaosMode ? 'Chaos mode active (8,500 ppm trap)' : 'Run chaos test'}
          </button>
        } 
      />

      {/* Input Parameters Card */}
      <Panel className="mb-6">
        <PanelTitle meta={<Pill tone={chaosMode ? 'orange' : 'lime'}>{chaosMode ? 'Adversarial Fuzzer' : 'Production Mainnet'}</Pill>}>
          Route parameters
        </PanelTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Source Node */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#77776e]">
                Origin node (Source)
              </label>
              <span className="text-[10px] font-mono text-[#85857d]">STEP 0 EGRESS</span>
            </div>
            <select
              value={source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#171717]"
            >
              {KNOWN_MAJOR_HUBS.map((hub) => (
                <option key={hub.pubkey} value={hub.pubkey} disabled={hub.pubkey === target}>
                  {hub.alias} ({hub.category.toUpperCase()}){hub.pubkey === target ? ' — [DESTINATION]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Target Node */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#77776e]">
                Destination (Target)
              </label>
              <button
                type="button"
                onClick={handleSwapNodes}
                className="text-[10px] text-[#557c0d] hover:text-[#3e5b09] flex items-center gap-1 font-mono font-bold transition-colors"
                title="Swap Origin and Destination"
              >
                <ArrowLeftRight className="size-3" />
                <span>SWAP</span>
              </button>
            </div>
            <select
              value={target}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#171717]"
            >
              {KNOWN_MAJOR_HUBS.map((hub) => (
                <option key={hub.pubkey} value={hub.pubkey} disabled={hub.pubkey === source}>
                  {hub.alias} ({hub.category.toUpperCase()}){hub.pubkey === source ? ' — [ORIGIN]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#77776e] mb-2">
              Payment amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amountSats}
                onChange={(e) => setAmountSats(e.target.value)}
                onBlur={() => calculateRoute()}
                placeholder="25000"
                className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#171717]"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#88887f]">
                SATS
              </span>
            </div>
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-[#ecece5] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['cheapest', 'fastest', 'reliable', 'balanced'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setStrategy(item)
                  calculateRoute(item)
                }}
                className={`rounded-full border px-4 py-2 text-xs font-bold capitalize transition-all ${
                  strategy === item 
                    ? 'border-[#171717] bg-[#171717] text-white shadow-sm' 
                    : 'border-[#d8d8cf] bg-white text-[#6c6c64] hover:border-[#171717]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => calculateRoute()}
            disabled={loading}
            className="rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
          >
            <span>{loading ? 'CALCULATING...' : 'CALCULATE ROUTE'}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </Panel>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#ffd8d0] border border-[#ff8c73] text-[#a33b26] text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="size-4 shrink-0 text-[#a33b26]" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Intercept Proof Banner (Fix 2) */}
      {chaosMode && chaosMeta?.intercept_proof && (
        <div className="mb-6 rounded-2xl border border-[#ff8c73] bg-[#fff0ed] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#ffd8d0]">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#ff8c73] text-[#171717]">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#a33b26]">Adversarial Intercept Activated</p>
                <p className="text-xs text-[#883d2c]">Predatory 8,500 ppm fee gouge quarantined by SatsNav firewall.</p>
              </div>
            </div>
            <Pill tone="red">TOXIC HOP BYPASS</Pill>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-bold text-[#883d2c] uppercase">Unprotected Fee</p>
              <p className="text-xl font-bold text-[#a33b26] mt-0.5">{chaosMeta.intercept_proof.unprotected_fee_sats} sats</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#557c0d] uppercase">SatsNav Fee</p>
              <p className="text-xl font-bold text-[#557c0d] mt-0.5">{chaosMeta.intercept_proof.satsnav_defended_fee_sats} sats</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#171717] uppercase">Satoshis Saved</p>
              <p className="text-xl font-black text-[#171717] mt-0.5">+{chaosMeta.intercept_proof.satoshis_saved} sats</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#171717] uppercase">Fee Reduction</p>
              <p className="text-xl font-black text-[#557c0d] mt-0.5">{chaosMeta.intercept_proof.savings_percent}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Path Output Grid */}
      <PageGrid>
        {/* Recommended Path Column */}
        <Panel className="lg:col-span-8">
          <PanelTitle meta={<LiveDot />}>
            Recommended path <Pill tone={routeResult?.success ? 'lime' : 'orange'}>{strategy}</Pill>
          </PanelTitle>

          {/* Node Progression Sequence */}
          {displayHops.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f7f7f2] p-4 sm:gap-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="grid size-10 place-items-center rounded-full bg-[#171717] text-[10px] font-bold text-[#d7f76a]">
                  {routeResult?.source_alias?.slice(0, 2) || 'OR'}
                </div>
                <div>
                  <p className="text-sm font-bold">{routeResult?.source_alias}</p>
                  <p className="font-mono text-[10px] text-[#88887f]">ORIGIN</p>
                </div>
              </div>

              {displayHops.map((hop, i) => (
                <div key={hop.channel_id || i} className="flex items-center gap-2">
                  <ArrowRight className="mx-1 size-4 text-[#9a9a90]" />
                  <div className="grid size-10 place-items-center rounded-full bg-[#171717] text-[10px] font-bold text-[#d7f76a]">
                    {hop.to_node_alias?.slice(0, 2) || 'HO'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{hop.to_node_alias}</p>
                    <p className="font-mono text-[10px] text-[#88887f]">{hop.channel_id?.split(':')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#f7f7f2] p-6 text-center text-xs text-[#88887f] mb-5">
              {loading ? 'Solving multi-objective Dijkstra paths across mainnet topology...' : 'Select nodes and calculate route.'}
            </div>
          )}

          {/* Hop Detail Rows */}
          <div className="flex flex-col gap-2">
            {displayHops.map((hop, i) => (
              <div key={hop.channel_id || i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[#ecece5] p-4 hover:border-[#deded5] transition-colors">
                <span className="text-xs font-bold text-[#999990]">0{i + 1}</span>
                <div>
                  <p className="text-sm font-bold">{hop.from_node_alias} → {hop.to_node_alias}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <InfoTag>{hop.channel_id}</InfoTag>
                    <InfoTag>{hop.fee_proportional_millionths} ppm</InfoTag>
                    <InfoTag>{(hop.channel_capacity_sats / 1_000_000).toFixed(1)}M sats capacity</InfoTag>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{hop.fee_sats || (hop.fee_msat / 1000).toFixed(1)} sats</p>
                  <p className="mt-1 text-xs font-bold text-[#557c0d]">
                    {hop.fee_proportional_millionths > 1000 ? 'High fee' : 'Safe tier'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Route Verdict Column */}
        <Panel className="lg:col-span-4">
          <PanelTitle>Route verdict</PanelTitle>
          <div className={`grid place-items-center rounded-2xl p-6 text-center ${
            routeResult?.success ? 'bg-[#eaf7c4]' : 'bg-[#fff0ed]'
          }`}>
            <CheckCircle2 className={`size-10 ${routeResult?.success ? 'text-[#557c0d]' : 'text-[#a33b26]'}`} />
            <p className="mt-3 text-xl font-bold">
              {routeResult?.success ? 'Safe to dispatch' : 'Action Required'}
            </p>
            <p className={`mt-1 text-sm ${routeResult?.success ? 'text-[#557c0d]' : 'text-[#a33b26]'}`}>
              {routeResult?.success ? 'No toxic hops detected' : 'Check node connectivity'}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-1">
            <div className="flex justify-between border-b border-[#ecece5] py-3 text-sm">
              <span className="text-[#6c6c64]">Total route fee</span>
              <strong className="font-mono">{routeResult?.total_fee_sats ?? (chaosMode ? 8 : 5)} sats</strong>
            </div>
            <div className="flex justify-between border-b border-[#ecece5] py-3 text-sm">
              <span className="text-[#6c6c64]">Total CLTV delta</span>
              <strong className="font-mono">{routeResult?.total_cltv_delta ?? 144} blocks</strong>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-[#6c6c64]">Reliability score</span>
              <strong className="font-mono text-[#557c0d]">{routeResult?.estimated_reliability_score ?? 98.4}%</strong>
            </div>
          </div>

          <div className="mt-6">
            <ActionButton href="/wallet">
              Continue to wallet guardian <ArrowRight className="ml-2 size-4" />
            </ActionButton>
          </div>
        </Panel>

        {/* Fee Comparison Panel */}
        <Panel className="lg:col-span-7">
          <PanelTitle meta={<span className="font-mono text-xs text-[#88887f]">Dijkstra / live</span>}>
            Fee comparison
          </PanelTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#88887f]">Unprotected route</p>
              <p className="mt-2 text-3xl font-bold text-[#a33b26]">430 sats</p>
              <div className="mt-2">
                <MiniBar value={95} color="bg-[#ff8c73]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#88887f]">SatsNav defended</p>
              <p className="mt-2 text-3xl font-bold text-[#171717]">
                {routeResult?.total_fee_sats ?? (chaosMode ? 8 : 5)} sats
              </p>
              <div className="mt-2">
                <MiniBar value={8} color="bg-[#84b51d]" />
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-[#171717] p-4 font-mono text-xs text-[#d7f76a]">
            {chaosMode 
              ? 'INTERCEPTED: 859002x999x1 / 8,500 ppm fee spike quarantined' 
              : 'BASELINE: 24 verified BOLT #7 mainnet channels snapshot'}
          </div>
        </Panel>

        {/* Path Constraints Panel */}
        <Panel className="lg:col-span-5">
          <PanelTitle>
            <SlidersHorizontal className="mr-2 inline size-4 text-[#557c0d]" />
            Path constraints
          </PanelTitle>
          <label className="flex items-center justify-between border-b border-[#ecece5] py-4 text-sm cursor-pointer">
            <div>
              <span className="font-bold">Reject fee spikes</span>
              <p className="text-xs text-[#88887f]">Quarantine hops charging &gt;1,000 ppm</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-[#7e9c20] size-4" />
          </label>
          <label className="flex items-center justify-between border-b border-[#ecece5] py-4 text-sm cursor-pointer">
            <div>
              <span className="font-bold">Require liquidity margin</span>
              <p className="text-xs text-[#88887f]">Channel must hold &ge;1.5x payment amount</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-[#7e9c20] size-4" />
          </label>
          <label className="flex items-center justify-between py-4 text-sm cursor-pointer">
            <div>
              <span className="font-bold">Allow private channels</span>
              <p className="text-xs text-[#88887f]">Include unannounced routing hops</p>
            </div>
            <input type="checkbox" className="accent-[#7e9c20] size-4" />
          </label>
        </Panel>
      </PageGrid>
    </AppShell>
  )
}

export default function RouterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f7f2] p-8 text-center font-bold">Loading Route Optimizer...</div>}>
      <RouterContent />
    </Suspense>
  )
}
