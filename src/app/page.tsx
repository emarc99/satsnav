import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck, Sparkles, Zap, Lock, Terminal, Activity } from 'lucide-react'

const features = [
  { 
    icon: ShieldCheck, 
    title: 'Pre-Flight Payment Firewall', 
    text: 'Audits multi-hop Lightning paths before funds move, catching fee spikes over 5,000 ppm and channel balance traps.' 
  },
  { 
    icon: Zap, 
    title: 'Authentic Mainnet Dijkstra Engine', 
    text: 'Real BOLT #7 shortest-path routing over 24 verified Bitcoin mainnet channels with zero mock math.' 
  },
  { 
    icon: Sparkles, 
    title: 'Model Context Protocol (MCP) Co-Pilot', 
    text: 'Standardized machine-native interface for Claude Desktop, Cursor, and AI agents to query routes and verify safety.' 
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2] text-[#171717] font-sans">
      {/* Top Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="SatsNav home">
          <span className="grid size-10 place-items-center rounded-xl bg-[#171717] text-[#d7f76a]">
            <ShieldCheck className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">SatsNav</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#73736c]">Payment firewall</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href="/overview" 
            className="hidden sm:inline-flex items-center rounded-xl border border-[#d8d8cf] bg-white px-4 py-2.5 text-xs font-bold text-[#33332f] hover:bg-[#efefe8] transition-colors"
          >
            Overview
          </Link>
          <Link 
            href="/router" 
            className="rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <span>Launch App</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#eaf7c4] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#557c0d]">
            <span className="size-2 rounded-full bg-[#84b51d]" />
            Bitcoin Mainnet Verified
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.0] tracking-[-0.055em] sm:text-7xl">
            The safer way to move <span className="text-[#7e9c20]">sats.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#66665e]">
            SatsNav is the autonomous pre-flight payment firewall for the Bitcoin Lightning Network. It protects AI agents and sovereign nodes from predatory fee traps and toxic hops before machine money moves.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link 
              href="/router" 
              className="inline-flex items-center justify-center rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 shadow-sm"
            >
              Launch Route Optimizer <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link 
              href="/overview" 
              className="inline-flex items-center justify-center rounded-xl border border-[#d8d8cf] bg-white px-6 py-3.5 text-sm font-bold text-[#33332f] hover:bg-[#efefe8] transition-colors"
            >
              Command Overview
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#686860]">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-[#7e9c20]" /> BOLT #7 Dijkstra Engine
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-[#7e9c20]" /> Zero Mock Math
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-[#7e9c20]" /> Nostr Cryptographic Receipts
            </span>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="relative rounded-[2rem] border border-[#deded5] bg-white p-5 shadow-[0_24px_80px_rgba(23,23,23,0.06)] sm:p-7">
          <div className="absolute -right-5 -top-5 size-24 rounded-full bg-[#d7f76a] blur-2xl opacity-60" />
          <div className="relative rounded-2xl bg-[#171717] p-5 text-white sm:p-7">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#aaa99f]">
              <span className="inline-flex items-center gap-2">
                <Activity className="size-3.5 text-[#d7f76a]" /> Network Pulse
              </span>
              <span className="text-[#d7f76a] font-mono">Live Gossip Active</span>
            </div>

            <div className="mt-8 flex items-center justify-center py-4">
              <div className="relative grid size-56 place-items-center rounded-full border border-[#4b5140] sm:size-64">
                <div className="absolute inset-8 rounded-full border border-[#65704b]" />
                <div className="absolute inset-16 rounded-full border border-[#7f8c5a]" />
                <div className="grid size-20 place-items-center rounded-full bg-[#d7f76a] text-center text-xs font-black leading-4 text-[#171717] shadow-lg">
                  SAFE<br />ROUTE
                </div>
                <span className="absolute left-6 top-16 size-4 rounded-full bg-[#ff8c73] animate-pulse" title="Quarantined Fee Trap" />
                <span className="absolute right-8 top-10 size-3 rounded-full bg-[#d7f76a]" title="Kraken Hub" />
                <span className="absolute bottom-8 right-16 size-3 rounded-full bg-[#b5d44b]" title="Binance Hub" />
                <span className="absolute bottom-12 left-10 size-3.5 rounded-full bg-[#49daaa]" title="ACINQ" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3.5">
                <p className="text-xs text-[#aaa99f]">Adversarial Intercept</p>
                <p className="mt-1 text-2xl font-bold text-[#d7f76a]">+422 sats</p>
                <p className="text-[11px] text-[#aaa99f]">Saved vs 8,500 ppm trap</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3.5">
                <p className="text-xs text-[#aaa99f]">Verified Topology</p>
                <p className="mt-1 text-2xl font-bold">24 SCIDs</p>
                <p className="text-[11px] text-[#aaa99f]">Authentic mainnet channels</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="border-t border-[#deded5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-3 lg:py-20">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#deded5] bg-[#fafaf7] p-6 transition-all hover:border-[#171717]/20">
              <div className="mb-6 grid size-11 place-items-center rounded-xl bg-[#eaf7c4] text-[#557c0d]">
                <Icon className="size-5" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6c6c64]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
