'use client'

import { useState } from 'react'
import { Bot, Copy, Terminal, Check, Play, ArrowRight, Code } from 'lucide-react'
import { 
  AppShell, 
  ConsoleLine, 
  InfoTag, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill,
  StatCard
} from '@/components/app-shell'

const MCP_TOOLS = [
  { name: 'find_optimal_route', desc: 'Dijkstra route solver across BOLT #7 graph' },
  { name: 'probe_node_liquidity', desc: 'Inspects capacity and channel health of a pubkey' },
  { name: 'check_fee_sentinel', desc: 'Audits fee percentiles and flags fee gouges' },
  { name: 'pay_invoice_guarded', desc: 'Pre-flight budget-enforced NWC payment dispatch' },
  { name: 'get_network_health', desc: 'Returns aggregate live network topology statistics' },
  { name: 'broadcast_nostr_threat_alert', desc: 'Signs & broadcasts Ed25519 threat advisories' },
]

export default function AgentPage() {
  const [copied, setCopied] = useState(false)
  const [activeTool, setActiveTool] = useState('find_optimal_route')
  const [executing, setExecuting] = useState(false)
  const [toolResponse, setToolResponse] = useState<any>(null)

  const mcpConfigJson = JSON.stringify({
    mcpServers: {
      satsnav: {
        command: "npx",
        args: ["-y", "tsx", "scripts/mcp-runner.ts"],
        env: { NODE_ENV: "production" }
      }
    }
  }, null, 2)

  const copyConfig = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(mcpConfigJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const runTestQuery = async (toolName: string) => {
    setExecuting(true)
    setActiveTool(toolName)

    try {
      let params: any = {}
      if (toolName === 'find_optimal_route') {
        params = { amount_sats: 25000, strategy: 'cheapest' }
      } else if (toolName === 'check_fee_sentinel') {
        params = { channel_id: '859002x999x1:0', fee_ppm: 8500 }
      } else if (toolName === 'get_network_health') {
        params = {}
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: params
          }
        })
      })

      const data = await res.json()
      setToolResponse(data)
    } catch (err: any) {
      setToolResponse({ error: err.message })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <AppShell title="Agent console">
      <PageIntro 
        eyebrow="Model Context Protocol" 
        title="Machine-native control, human-readable outcomes." 
        description="Inspect the same route, fee, and threat tools your AI agent calls over stdio or HTTP JSON-RPC 2.0." 
        action={
          <button 
            type="button"
            onClick={copyConfig}
            className="rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5 flex items-center shadow-sm"
          >
            {copied ? <Check className="mr-2 inline size-4 text-[#d7f76a]" /> : <Copy className="mr-2 inline size-4" />}
            {copied ? 'Copied Claude Config!' : 'Copy MCP Config'}
          </button>
        } 
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Protocol standard" value="MCP 1.0" detail="Anthropic JSON-RPC 2.0" accent />
        <StatCard label="Tools registered" value="6 tools" detail="Pre-flight firewall suite" />
        <StatCard label="Agent interfaces" value="Dual" detail="Stdio (CLI) + HTTP (/api/mcp)" />
      </div>

      <PageGrid>
        {/* Left Column: Tool Selector */}
        <Panel className="lg:col-span-5">
          <PanelTitle meta={<Pill tone="lime">6 tools online</Pill>}>
            Available MCP tools
          </PanelTitle>

          <div className="flex flex-col gap-2.5">
            {MCP_TOOLS.map((tool, i) => (
              <div 
                key={tool.name}
                onClick={() => runTestQuery(tool.name)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTool === tool.name 
                    ? 'border-[#171717] bg-[#171717] text-white shadow-sm' 
                    : 'border-[#ecece5] bg-[#fafaf7] hover:border-[#deded5] text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid size-7 place-items-center rounded-lg text-xs font-bold ${
                    activeTool === tool.name ? 'bg-[#d7f76a] text-[#171717]' : 'bg-[#eaf7c4] text-[#557c0d]'
                  }`}>
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-xs font-bold">{tool.name}</p>
                    <p className={`text-[11px] ${activeTool === tool.name ? 'text-[#aaa99f]' : 'text-[#88887f]'}`}>
                      {tool.desc}
                    </p>
                  </div>
                </div>

                <Play className={`size-3.5 ${activeTool === tool.name ? 'text-[#d7f76a]' : 'text-[#9a9a90]'}`} />
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-[#f7f7f2] border border-[#deded5] text-xs text-[#6c6c64]">
            <p className="font-bold text-[#171717] mb-1">💡 Machine Money Tip</p>
            Add SatsNav to Claude Desktop or Cursor to allow LLMs to audit route safety and check fee anomalies natively before dispatching satoshis.
          </div>
        </Panel>

        {/* Right Column: Terminal Activity & Output */}
        <Panel className="overflow-hidden bg-[#171717] text-white lg:col-span-7 flex flex-col justify-between">
          <div>
            <PanelTitle meta={
              <span className="flex items-center gap-2 text-xs text-[#d7f76a]">
                <span className="size-2 rounded-full bg-[#d7f76a]" />
                JSON-RPC 2.0 stream
              </span>
            }>
              <Terminal className="mr-2 inline size-4 text-[#d7f76a]" />
              Agent activity console
            </PanelTitle>

            <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs max-h-96 overflow-y-auto">
              <ConsoleLine time="10:42:01">⚡ find_optimal_route strategy=cheapest amount=25000</ConsoleLine>
              <ConsoleLine time="10:42:01" tone="success">✓ route accepted: ACINQ → Kraken → Binance (5 sats fee)</ConsoleLine>
              <ConsoleLine time="10:42:02">⚡ check_fee_sentinel scid=859002x999x1:0 ppm=8500</ConsoleLine>
              <ConsoleLine time="10:42:02" tone="warn">! anomaly detected: 8,500 ppm fee gouge (action=quarantine)</ConsoleLine>
              <ConsoleLine time="10:42:03" tone="success">✓ Nostr receipt broadcast: Schnorr signature verified</ConsoleLine>
              
              {toolResponse && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[11px] text-[#d7f76a] font-bold mb-2">
                    &gt; Live Execution Result ({activeTool}):
                  </p>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap bg-black/60 p-3 rounded-lg">
                    {JSON.stringify(toolResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#aaa99f]">
            <span className="font-mono">Endpoint: <span className="text-[#d7f76a]">/api/mcp</span></span>
            <span className="font-mono">Protocol: <span className="text-white">stdio / HTTP</span></span>
          </div>
        </Panel>
      </PageGrid>
    </AppShell>
  )
}
