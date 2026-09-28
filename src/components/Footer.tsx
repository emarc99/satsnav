export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#06080D] py-10 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-mono">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[#F7931A]">⚡</span>
            <span className="font-bold text-white tracking-wide">SATNAV SENTINEL</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>Boss Battle 2026 Hackathon (Bitshala)</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-400">Zero Mocking • Live Mainnet Topology</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/lightning/bolts/blob/master/07-routing-gossip.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F7931A] transition-colors"
          >
            BOLT #7 SPEC
          </a>
          <a
            href="https://nwc.getalby.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00F2FE] transition-colors"
          >
            NIP-47 (NWC)
          </a>
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            ANTHROPIC MCP
          </a>
        </div>
      </div>
    </footer>
  );
}
