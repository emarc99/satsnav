'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Bot, Compass, Gauge, Home, Radio, ShieldCheck, WalletCards, Menu, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { href: '/overview', label: 'Overview', icon: Home },
  { href: '/router', label: 'Route optimizer', icon: Compass },
  { href: '/sentinel', label: 'Nostr sentinel', icon: ShieldCheck },
  { href: '/radar', label: 'Network radar', icon: Radio },
  { href: '/agent', label: 'Agent console', icon: Bot },
  { href: '/wallet', label: 'Wallet guardian', icon: WalletCards },
]

export function AppShell({ children, title = 'Command center' }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#171717]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[#deded5] bg-[#fafaf7] px-5 py-6 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="grid size-10 place-items-center rounded-xl bg-[#171717] text-[#d7f76a]"><Activity /></div>
            <div>
              <div className="text-lg font-bold tracking-tight">SatsNav</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#73736c]">Payment firewall</div>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <div className="mt-10 rounded-2xl bg-[#eaf7c4] p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="size-2 rounded-full bg-[#5e8b12]" /> Mainnet protected
          </div>
          <p className="mt-2 text-sm leading-5 text-[#424831]">Auditing every route before machine money moves.</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  active ? 'bg-[#171717] text-white' : 'text-[#686860] hover:bg-[#efefe8] hover:text-[#171717]'
                }`}
              >
                <Icon className="size-[18px]" />
                {label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-[#d7f76a]" />}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-[#deded5] pt-5 text-xs text-[#85857d]">
          <div className="flex items-center justify-between">
            <span>Topology snapshot</span>
            <span className="font-bold text-[#171717]">24 channels</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Last sync</span>
            <span className="font-bold text-[#171717]">12 sec ago</span>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-20 bg-black/30 lg:hidden" aria-label="Close navigation overlay" onClick={() => setOpen(false)} />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#deded5]/80 bg-[#f7f7f2]/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-[#efefe8] lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#85857d]">SatsNav / {title}</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-[#deded5] bg-white px-3 py-2 text-xs font-semibold">
              <span className="size-2 rounded-full bg-[#84b51d]" />Live network
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-[#d7f76a] text-sm font-bold">SN</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  )
}

export function StatCard({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-[#d7f76a] bg-[#eaf7c4]' : 'border-[#deded5] bg-white'}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#77776e]">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-[#6c6c64]">{detail}</p>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7e9c20]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6c64]">{description}</p>}
    </div>
  )
}

export const nodeNames = ['ACINQ', 'Kraken', 'Binance', 'bfx-lnd0', 'CashApp', 'CoinGate']
export const hops = [
  { node: 'ACINQ', scid: '852914x1102x0', fee: '2 sats', risk: 'Low' },
  { node: 'Kraken', scid: '843221x421x1', fee: '1 sat', risk: 'Low' },
  { node: 'Binance', scid: '857002x884x0', fee: '5 sats', risk: 'Low' }
]

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7e9c20]">{eyebrow}</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#66665e]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export const iconForRisk = (risk: string) => risk === 'High' ? 'bg-[#ffd8d0] text-[#a33b26]' : risk === 'Medium' ? 'bg-[#fff0c7] text-[#8b6500]' : 'bg-[#eaf7c4] text-[#557c0d]'
export const GaugeIcon = Gauge
export const BotIcon = Bot

export function MiniBar({ value, color = 'bg-[#a9c83e]' }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#ecece5]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function DataRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#ecece5] py-4 last:border-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="mt-1 text-xs text-[#88887f]">{sub}</p>}
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}

export function ActionButton({ children, href = '#', secondary = false }: { children: React.ReactNode; href?: string; secondary?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${secondary ? 'border border-[#d8d8cf] bg-white text-[#33332f]' : 'bg-[#171717] text-white'}`}>
      {children}
    </Link>
  )
}

export function PageGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-12">{children}</div>
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#deded5] bg-white p-5 sm:p-6 ${className}`}>{children}</section>
}

export function PanelTitle({ children, meta }: { children: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 className="font-bold tracking-tight">{children}</h3>
      {meta}
    </div>
  )
}

export function Pill({ children, tone = 'lime' }: { children: React.ReactNode; tone?: 'lime' | 'dark' | 'orange' | 'red' }) {
  const toneClasses = tone === 'dark' 
    ? 'bg-[#171717] text-white' 
    : tone === 'orange' 
    ? 'bg-[#fff0c7] text-[#8b6500]' 
    : tone === 'red'
    ? 'bg-[#ffd8d0] text-[#a33b26]'
    : 'bg-[#eaf7c4] text-[#557c0d]'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClasses}`}>
      {children}
    </span>
  )
}

export function PlaceholderChart({ points = [34, 48, 42, 64, 56, 76, 68, 84, 72, 94] }: { points?: number[] }) {
  return (
    <div className="flex h-36 items-end gap-2">
      {points.map((point, index) => (
        <div key={index} className="flex-1 rounded-t-md bg-[#d7f76a]" style={{ height: `${point}%`, opacity: 0.55 + index / points.length / 2 }} />
      ))}
    </div>
  )
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-[#557c0d]">
      <span className="size-2 rounded-full bg-[#84b51d]" />Live
    </span>
  )
}

export function InfoTag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-[#f1f1ea] px-2 py-1 font-mono text-[11px] text-[#686860]">{children}</span>
}

export function ConsoleLine({ time, children, tone = 'normal' }: { time: string; children: React.ReactNode; tone?: 'normal' | 'success' | 'warn' }) {
  return (
    <div className="flex gap-3 font-mono text-xs leading-6">
      <span className="text-[#aaa99f]">{time}</span>
      <span className={tone === 'success' ? 'text-[#557c0d]' : tone === 'warn' ? 'text-[#a33b26]' : 'text-[#44443e]'}>{children}</span>
    </div>
  )
}

export function Orbit({ size = 280 }: { size?: number }) {
  return (
    <div className="relative mx-auto aspect-square" style={{ width: size, maxWidth: '100%' }}>
      <div className="absolute inset-[12%] rounded-full border border-[#d7f76a]" />
      <div className="absolute inset-[25%] rounded-full border border-[#c9caaf]" />
      <div className="absolute inset-[39%] rounded-full border border-[#d6d6cb]" />
      <div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#171717] text-[10px] font-bold text-[#d7f76a]">YOU</div>
      {[['12%', '50%'], ['73%', '18%'], ['82%', '70%'], ['17%', '78%'], ['46%', '5%']].map(([top, left], i) => (
        <div key={i} className={`absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white ${i === 1 ? 'bg-[#ff8c73]' : 'bg-[#b5d44b]'}`} style={{ top, left }}>
          <span className="size-1.5 rounded-full bg-[#171717]" />
        </div>
      ))}
    </div>
  )
}

export function MobileMenuHint() { return null }

export { nav }

export default AppShell

export type NavIcon = typeof Activity
