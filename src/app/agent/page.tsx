'use client';

import { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  Cpu, 
  Zap, 
  Radio, 
  ShieldAlert, 
  Wallet 
} from 'lucide-react';

const MCP_TOOLS = [
  {
    id: 'find_optimal_route',
    label: 'find_optimal_route',
    icon: Zap,
    description: 'Find lowest-fee, fastest, or most reliable path across Lightning Network using exact BOLT #7 calculations.',
    defaultParams: JSON.stringify(
      {
        target_node: 'Binance',
        amount_sats: 50000,
        strategy: 'cheapest',
      },
      null,
      2
    ),
  },
  {
    id: 'probe_node_liquidity',
    label: 'probe_node_liquidity',
    icon: Radio,
    description: 'Inspect a Lightning node capacity, channels, reliability tier, and location.',
    defaultParams: JSON.stringify(
      {
        node_pubkey_or_alias: 'ACINQ',
      },
      null,
      2
    ),
  },
  {
    id: 'check_fee_sentinel',
    label: 'check_fee_sentinel',
    icon: ShieldAlert,
    description: 'Audit network fee percentiles (median, p90, p99) and detect fee gouging.',
    defaultParams: JSON.stringify(
      {
        target_node: 'bfx-lnd0',
      },
      null,
      2
    ),
  },
  {
    id: 'get_network_health',
    label: 'get_network_health',
    icon: Cpu,
    description: 'Get real-time Lightning Network aggregate capacity, channels, and stats.',
    defaultParams: JSON.stringify({}, null, 2),
  },
];

export default function AgentPage() {
  const [selectedTool, setSelectedTool] = useState(MCP_TOOLS[0]);
  const [paramsInput, setParamsInput] = useState(MCP_TOOLS[0].defaultParams);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const handleToolSelect = (tool: typeof MCP_TOOLS[0]) => {
    setSelectedTool(tool);
    setParamsInput(tool.defaultParams);
    setExecutionOutput(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setExecutionOutput(null);

    try {
      const parsedArgs = JSON.parse(paramsInput);
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool.id,
            arguments: parsedArgs,
          },
        }),
      });

      const data = await res.json();
      setExecutionOutput(data);
    } catch (err: any) {
      setExecutionOutput({
        jsonrpc: '2.0',
        error: { code: -32603, message: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const mcpConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        satnav: {
          command: 'node',
          args: ['bin/satnav-mcp.js'],
          env: {
            NODE_ENV: 'production',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="min-h-screen bg-[#06080D] bg-cypher-grid py-10 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-xs text-[#00F2FE] mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>ANTHROPIC MODEL CONTEXT PROTOCOL (MCP) RUNTIME</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Agent MCP Console</h1>
            <p className="text-xs text-slate-400 mt-1">
              Interact directly with SatNav tool primitives. Plug directly into Claude Desktop, Cursor, or autonomous LLMs.
            </p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(mcpConfigSnippet);
              setCopiedConfig(true);
              setTimeout(() => setCopiedConfig(false), 2000);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-300 transition-colors"
          >
            {copiedConfig ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedConfig ? 'CONFIG COPIED' : 'COPY MCP CONFIG'}</span>
          </button>
        </div>

        {/* Console Workspace */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tool Directory (Left Column) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              AVAILABLE AGENT TOOLS ({MCP_TOOLS.length})
            </h2>

            {MCP_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool.id === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#00F2FE]/10 border-[#00F2FE]/40 text-white shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                      : 'bg-[#090D15] border-white/10 hover:border-white/20 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00F2FE]' : 'text-slate-500'}`} />
                    <span>{tool.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </button>
              );
            })}

            {/* MCP Spec Banner */}
            <div className="p-4 rounded-xl glass-panel border border-white/10 text-xs mt-6">
              <div className="flex items-center gap-2 text-[#F7931A] font-bold">
                <Code className="w-4 h-4" />
                <span>MCP SPEC COMPLIANT</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Tools adhere to the JSON-RPC 2.0 schema and Anthropic Tool Calling protocols. Compatible with any autonomous agent runner.
              </p>
            </div>
          </div>

          {/* Interactive Playground & Output (Right Column) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Input Editor */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#F7931A]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    TOOL PARAMETERS (JSON)
                  </span>
                </div>
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#F7931A] hover:bg-[#ff9f2c] text-black font-bold text-xs tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(247,147,26,0.3)]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{loading ? 'EXECUTING...' : 'DISPATCH TOOL CALL'}</span>
                </button>
              </div>

              <textarea
                value={paramsInput}
                onChange={(e) => setParamsInput(e.target.value)}
                rows={6}
                className="w-full bg-[#070A11] border border-white/15 rounded-xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#F7931A] selection:bg-[#F7931A]/30"
              />
            </div>

            {/* Execution Output Inspector */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00F2FE]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    EXECUTION TERMINAL &amp; JSON-RPC 2.0 RESPONSE
                  </span>
                </div>
                {executionOutput && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      executionOutput.result?.isError || executionOutput.error
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {executionOutput.result?.isError || executionOutput.error ? 'ERROR' : 'SUCCESS 200 OK'}
                  </span>
                )}
              </div>

              {executionOutput ? (
                <div className="space-y-4">
                  {/* Formatted Natural Language text block */}
                  {executionOutput.result?.content?.[0]?.text && (
                    <div className="p-4 rounded-xl bg-[#090D15] border border-white/10 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {executionOutput.result.content[0].text}
                    </div>
                  )}

                  {/* Raw JSON */}
                  <pre className="p-4 rounded-xl bg-[#070A11] border border-white/10 text-[11px] text-slate-400 overflow-x-auto max-h-96">
                    {JSON.stringify(executionOutput, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                  Select a tool and click "DISPATCH TOOL CALL" to inspect real-time agent output.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
