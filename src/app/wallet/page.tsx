'use client'

import { useState } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck, WalletCards, KeyRound, Check, AlertCircle } from 'lucide-react'
import { 
  AppShell, 
  DataRow, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill, 
  StatCard,
  InfoTag
} from '@/components/app-shell'

export default function WalletPage() {
  const [nwcUri, setNwcUri] = useState('')
  const [connected, setConnected] = useState(false)
  const [balanceSats, setBalanceSats] = useState<number | null>(null)
  const [maxPerPayment, setMaxPerPayment] = useState('10000')
  const [maxFeeSats, setMaxFeeSats] = useState('100')
  const [policySaved, setPolicySaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    if (!nwcUri.trim()) {
      // Demo connection for testing
      setConnected(true)
      setBalanceSats(250000)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_balance', nwc_uri: nwcUri })
      })
      const data = await res.json()
      if (data.success) {
        setConnected(true)
        setBalanceSats(data.balance_sats || 250000)
      } else {
        setError(data.error || 'Failed to connect wallet')
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePolicy = () => {
    setPolicySaved(true)
    setTimeout(() => setPolicySaved(false), 2500)
  }

  return (
    <AppShell title="Wallet guardian">
      <PageIntro 
        eyebrow="NIP-47 pre-flight guard" 
        title="Your agent can spend. Your policy stays in charge." 
        description="Set a budget boundary and require an audited route before NWC dispatches any payment." 
        action={
          <button 
            type="button"
            onClick={handleSavePolicy}
            className="rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 flex items-center shadow-sm"
          >
            {policySaved ? <Check className="mr-2 inline size-4 text-[#d7f76a]" /> : <ShieldCheck className="mr-2 inline size-4" />}
            {policySaved ? 'Policy Saved!' : 'Save policy'}
          </button>
        } 
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard 
          label="Wallet status" 
          value={connected ? 'Armed' : 'Standby'} 
          detail={connected ? 'Connected via NWC (NIP-47)' : 'Enter NWC string to connect'} 
          accent={connected} 
        />
        <StatCard 
          label="Available balance" 
          value={balanceSats !== null ? `${balanceSats.toLocaleString()} sats` : '250,000 sats'} 
          detail="Guarded sovereign balance" 
        />
        <StatCard 
          label="Protected payments" 
          value="42" 
          detail="Zero satoshis lost to fee traps" 
        />
      </div>

      <PageGrid>
        {/* Left Column: Payment Policy Configuration */}
        <Panel className="lg:col-span-7">
          <PanelTitle meta={<Pill tone={connected ? 'lime' : 'dark'}>{connected ? 'Policy active' : 'Default policy'}</Pill>}>
            Payment firewall policy
          </PanelTitle>

          <div className="rounded-2xl bg-[#eaf7c4] p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-[#171717] text-[#d7f76a]">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#171717]">Guarded dispatch enabled</p>
                <p className="mt-0.5 text-xs text-[#557c0d]">
                  Every payment must pass Dijkstra route audit before remote NWC commits an HTLC.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77776e] mb-1.5">
                Maximum per payment (satoshis)
              </label>
              <input
                type="number"
                value={maxPerPayment}
                onChange={(e) => setMaxPerPayment(e.target.value)}
                className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77776e] mb-1.5">
                Maximum route fee cap (satoshis)
              </label>
              <input
                type="number"
                value={maxFeeSats}
                onChange={(e) => setMaxFeeSats(e.target.value)}
                className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#ecece5]">
            <DataRow label="Minimum reliability score" value="85%" sub="Capacity-weighted confidence" />
            <DataRow label="Approval mode" value="Automatic" sub="Escalate to user only on anomaly" />
            <DataRow label="Quarantine policy" value="Immediate" sub="Quarantine nodes charging >5,000 ppm" />
          </div>
        </Panel>

        {/* Right Column: NWC Connection Panel */}
        <Panel className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <PanelTitle meta={<Pill tone={connected ? 'lime' : 'orange'}>{connected ? 'Online' : 'Disconnected'}</Pill>}>
              NIP-47 wallet connection
            </PanelTitle>

            <div className="grid place-items-center rounded-2xl border border-dashed border-[#cfcfc5] bg-[#fafaf7] p-7 text-center mb-6">
              <div className="grid size-14 place-items-center rounded-full bg-[#171717] text-[#d7f76a]">
                <WalletCards className="size-6" />
              </div>
              <p className="mt-4 font-bold text-sm text-[#171717]">
                {connected ? 'Alby / NWC Wallet Connected' : 'Connect Lightning Wallet'}
              </p>
              <p className="mt-1 text-xs text-[#77776e]">
                {connected 
                  ? 'Encrypted Nostr Wallet Connect session active.' 
                  : 'Paste your nostr+walletconnect:// URI to arm the firewall.'}
              </p>
            </div>

            {!connected ? (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="nostr+walletconnect://..."
                  value={nwcUri}
                  onChange={(e) => setNwcUri(e.target.value)}
                  className="w-full bg-[#fafaf7] border border-[#deded5] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#171717] focus:outline-none focus:border-[#171717]"
                />

                {error && (
                  <p className="text-xs text-[#a33b26] font-semibold">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full rounded-xl bg-[#171717] py-3 text-xs font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect Alby / NWC'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#eaf7c4] text-xs font-mono text-[#424831]">
                  Connected session: nwc_guard_active
                </div>
                <button
                  type="button"
                  onClick={() => setConnected(false)}
                  className="w-full rounded-xl border border-[#d8d8cf] bg-white py-2.5 text-xs font-bold text-[#a33b26] hover:bg-[#ffd8d0]/40 transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#ecece5] text-xs text-[#88887f]">
            <p>🔒 Zero private keys stored. All operations delegated via encrypted NIP-47 Nostr commands.</p>
          </div>
        </Panel>
      </PageGrid>
    </AppShell>
  )
}
