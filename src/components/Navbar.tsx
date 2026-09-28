'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Radio, GitFork, ShieldAlert, Bot, Wallet } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: Compass },
  { href: '/radar', label: 'Topology Radar', icon: Radio },
  { href: '/router', label: 'Route Optimizer', icon: GitFork },
  { href: '/sentinel', label: 'Fee Sentinel', icon: ShieldAlert },
  { href: '/agent', label: 'Agent MCP', icon: Bot },
  { href: '/wallet', label: 'NWC Wallet', icon: Wallet },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#06080D]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7931A] via-[#FF6B00] to-[#00F2FE] p-[1.5px] transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#06080D] rounded-[10px] flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#F7931A] transition-colors">
                SAT<span className="text-[#00F2FE]">NAV</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wide uppercase bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40 rounded">
                BOLT #7
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Autonomous Lightning Sentinel
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/15'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F2FE]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
            <span className="hidden sm:inline">MAINNET LIVE</span>
          </div>

          <Link
            href="/agent"
            className="px-3.5 py-1.5 rounded-lg bg-[#F7931A] hover:bg-[#ff9f2c] text-black text-xs font-bold font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_25px_rgba(247,147,26,0.5)]"
          >
            LAUNCH AGENT
          </Link>
        </div>
      </div>
    </header>
  );
}
