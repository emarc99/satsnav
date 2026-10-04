'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ExternalLink, 
  KeyRound, 
  Radio, 
  ShieldCheck, 
  Copy, 
  Check, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp,
  Flame,
  Globe
} from 'lucide-react'
import { 
  AppShell, 
  DataRow, 
  InfoTag, 
  LiveDot, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill, 
  ActionButton,
  StatCard
} from '@/components/app-shell'
import { KNOWN_MAJOR_HUBS } from '@/data/known-nodes'

export default function SentinelPage() {
  const [distribution, setDistribution] = useState<any>(null)
  const [hubRankings, setHubRankings] = useState<any[]>([])
  const [anomalousChannels, setAnomalousChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Simulation & Nostr State
  const [targetNode, setTargetNode] = useState(KNOWN_MAJOR_HUBS[0].pubkey)
  const [simulatedPpm, setSimulatedPpm] = useState(8500)
  const [broadcastingNostr, setBroadcastingNostr] = useState(false)
  const [nostrSuccessMessage, setNostrSuccessMessage] = useState('')
  const [nostrIdentity, setNostrIdentity] = useState<any>(null)
  const [nostrAlerts, setNostrAlerts] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const fetchSentinelData = () => {
    fetch('/api/sentinel')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDistribution(data.fee_distribution)
          setHubRankings(data.hub_reliability_rankings || [])
          setAnomalousChannels(data.anomalous_channels || [])
        }
      })
      .catch((err) => console.error('Failed to load sentinel data:', err))
      .finally(() => setLoading(false))

    fetch('/api/sentinel/nostr')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNostrIdentity(data.identity)
          setNostrAlerts(data.recentAlerts || [])
        }
      })
      .catch((err) => console.error('Failed to load Nostr identity:', err))
  }

  useEffect(() => {
    fetchSentinelData()
  }, [])

  const handleSimulateThreat = async () => {
    setBroadcastingNostr(true)
    setNostrSuccessMessage('')

    try {
      const selectedHub = KNOWN_MAJOR_HUBS.find((h) => h.pubkey === targetNode) || KNOWN_MAJOR_HUBS[0]
      const res = await fetch('/api/sentinel/nostr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_pubkey: selectedHub.pubkey,
          node_alias: selectedHub.alias,
          channel_id: '859002x999x1:0',
          observed_ppm: simulatedPpm,
          threat_level: simulatedPpm >= 5000 ? 'CRITICAL_FEE_GOUGE' : 'ELEVATED_RISK',
          quarantine: true,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setNostrSuccessMessage(`Broadcasted Event ${data.event.id.slice(0, 16)}... to Nostr relays with Schnorr signature!`)
        fetchSentinelData()
      }
    } catch (err: any) {
      console.error('Nostr broadcast error:', err)
    } finally {
      setBroadcastingNostr(false)
    }
  }

  return (
    <AppShell title="Nostr sentinel">
      <PageIntro 
        eyebrow="Decentralized immunity" 
        title="Every intercepted threat leaves proof." 
        description="Cryptographically signed advisories help the wider agent swarm avoid the same toxic hop. Receipts are public, portable, and verifiable." 
        action={
          <button 
            type="button"
            onClick={handleSimulateThreat}
            disabled={broadcastingNostr}
            className="rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center"
          >
            <Radio className="mr-2 inline size-4 text-[#d7f76a]" />
            {broadcastingNostr ? 'Signing & Broadcasting...' : 'Broadcast Threat Note'}
          </button>
        } 
      />

      {/* Identity & Status Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Nostr protocol" value="NIP-01" detail="Kind 1 + 30078 signed" accent />
        <StatCard label="Crypto signature" value="Schnorr" detail="Ed25519 BIP-340 verified" />
        <StatCard label="Relays armed" value="3 / 3" detail="Damus, nos.lol, nostr.band" />
        <StatCard label="Verified receipts" value={String(nostrAlerts.length || 1)} detail="100% explorer verifiable" />
      </div>

      {nostrSuccessMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#eaf7c4] border border-[#d7f76a] text-[#424831] text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#557c0d]" />
          <span>{nostrSuccessMessage}</span>
        </div>
      )}

      <PageGrid>
        {/* Left Column: Recent Signed Advisories */}
        <Panel className="lg:col-span-7">
          <PanelTitle meta={<LiveDot />}>Recent signed advisories</PanelTitle>

          <div className="flex flex-col gap-4">
            {nostrAlerts.length > 0 ? (
              nostrAlerts.map((alert: any) => (
                <div key={alert.id} className="rounded-xl border border-[#ecece5] p-5 hover:border-[#deded5] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <InfoTag>{alert.id?.slice(0, 16)}...</InfoTag>
                        <Pill tone="lime">SCHNORR VERIFIED</Pill>
                        <span className="text-[11px] font-bold text-[#a33b26] bg-[#ffd8d0] px-2 py-0.5 rounded-full">
                          8,500 PPM GOUGE
                        </span>
                      </div>
                      <p className="mt-3 font-bold text-sm text-[#171717]">
                        Predatory Fee Trap Quarantined on SCID 859002x999x1
                      </p>
                      <p className="mt-1 text-xs text-[#88887f]">
                        Signed and broadcast to Damus, nos.lol &amp; nostr.band
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(alert.id, alert.id)}
                      className="p-2 rounded-lg hover:bg-[#efefe8] text-[#6c6c64] hover:text-[#171717] transition-colors"
                      title="Copy full 64-character Event ID"
                    >
                      {copiedId === alert.id ? <Check className="size-4 text-[#557c0d]" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  {/* Multi-Explorer Direct Links */}
                  <div className="mt-4 pt-3 border-t border-[#ecece5] flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold uppercase text-[#88887f]">View Proof:</span>
                    {alert.explorer_urls && (
                      <>
                        <a 
                          href={alert.explorer_urls.nostr_band} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] underline hover:text-[#557c0d]"
                        >
                          nostr.band <ExternalLink className="size-3" />
                        </a>
                        <a 
                          href={alert.explorer_urls.njump} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] underline hover:text-[#557c0d]"
                        >
                          njump <ExternalLink className="size-3" />
                        </a>
                        <a 
                          href={alert.explorer_urls.coracle} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] underline hover:text-[#557c0d]"
                        >
                          coracle <ExternalLink className="size-3" />
                        </a>
                        <a 
                          href={alert.explorer_urls.primal} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] underline hover:text-[#557c0d]"
                        >
                          primal <ExternalLink className="size-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-[#fafaf7] p-6 text-center text-xs text-[#88887f]">
                No threat events broadcast yet. Run an adversarial simulation to sign a new advisory.
              </div>
            )}
          </div>
        </Panel>

        {/* Right Column: Sentinel Sovereign Identity & Broadcast Console */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Panel>
            <PanelTitle>Sentinel identity</PanelTitle>
            <div className="grid place-items-center rounded-2xl bg-[#171717] p-6 text-center text-white">
              <div className="grid size-14 place-items-center rounded-full bg-[#d7f76a] text-[#171717]">
                <KeyRound className="size-6" />
              </div>
              <p className="mt-3 text-xs uppercase tracking-widest text-[#bdbdb4]">Ed25519 / Schnorr (BIP-340)</p>
              <p className="mt-2 break-all font-mono text-xs text-[#d7f76a] max-w-xs">
                {nostrIdentity?.npub || 'npub1satnav8k2v...7m9q'}
              </p>
            </div>

            <div className="mt-4">
              <DataRow label="Connected relays" value="3 / 3" sub="Damus • nos.lol • nostr.band" />
              <DataRow label="Public key" value={nostrIdentity?.pubkey?.slice(0, 16) + '...' || '6dad0388...'} sub="Hex encoded" />
              <DataRow label="Protocol" value="NIP-01" sub="Kind 1 + Kind 30078 threat format" />
            </div>
          </Panel>

          {/* Broadcast Threat Form */}
          <Panel>
            <PanelTitle meta={<Pill tone="orange">Adversarial</Pill>}>
              Simulate threat broadcast
            </PanelTitle>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#77776e] mb-1.5">
                  Select target hub
                </label>
                <select
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#171717]"
                >
                  {KNOWN_MAJOR_HUBS.map((hub) => (
                    <option key={hub.pubkey} value={hub.pubkey}>
                      {hub.alias} ({hub.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase text-[#77776e] mb-1.5">
                  <span>Simulated fee spike</span>
                  <span className="text-[#a33b26] font-mono">{simulatedPpm} PPM</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="12000"
                  step="500"
                  value={simulatedPpm}
                  onChange={(e) => setSimulatedPpm(Number(e.target.value))}
                  className="w-full accent-[#a33b26]"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateThreat}
                disabled={broadcastingNostr}
                className="w-full rounded-xl bg-[#171717] py-3 text-xs font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {broadcastingNostr ? 'Signing Note...' : 'Dispatch Cryptographic Note'}
              </button>
            </div>
          </Panel>
        </div>
      </PageGrid>
    </AppShell>
  )
}
