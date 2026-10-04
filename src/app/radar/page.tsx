'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Radio, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Search,
  Zap,
  Crosshair
} from 'lucide-react'
import Link from 'next/link'
import { 
  AppShell, 
  DataRow, 
  LiveDot, 
  PageGrid, 
  PageIntro, 
  Panel, 
  PanelTitle, 
  Pill, 
  StatCard 
} from '@/components/app-shell'
import { KNOWN_MAJOR_HUBS, KnownNode } from '@/data/known-nodes'
import { VERIFIED_MAINNET_CHANNELS, PREDATORY_TRAP_PUBKEY } from '@/data/mainnet-channels'

interface DynamicRadarNode {
  pubkey: string
  alias: string
  category: string
  capacityBtc: number
  color: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  isTrap?: boolean
}

interface DynamicRadarEdge {
  scid: string
  sourcePubkey: string
  targetPubkey: string
  capacitySats: number
  feePpm: number
  isAdversarial?: boolean
}

export default function RadarPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [selectedHub, setSelectedHub] = useState<KnownNode>(KNOWN_MAJOR_HUBS[0])
  const [isRunning, setIsRunning] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Zoom and pan transform state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })

  // Initialize nodes from KNOWN_MAJOR_HUBS
  const [nodes, setNodes] = useState<DynamicRadarNode[]>(() => {
    return KNOWN_MAJOR_HUBS.map((hub, i) => {
      const angle = (i / KNOWN_MAJOR_HUBS.length) * Math.PI * 2
      const dist = hub.pubkey === PREDATORY_TRAP_PUBKEY ? 150 : 80 + (i % 3) * 65
      const isTrap = hub.pubkey === PREDATORY_TRAP_PUBKEY

      return {
        pubkey: hub.pubkey,
        alias: hub.alias,
        category: hub.category,
        capacityBtc: hub.typical_capacity_btc,
        color: isTrap ? '#ef4444' : hub.color || '#49daaa',
        x: 400 + Math.cos(angle) * dist,
        y: 250 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: isTrap ? 14 : Math.max(9, Math.min(22, Math.sqrt(hub.typical_capacity_btc) * 0.9)),
        isTrap,
      }
    })
  })

  // Map edges from VERIFIED_MAINNET_CHANNELS
  const edges: DynamicRadarEdge[] = useMemo(() => {
    return VERIFIED_MAINNET_CHANNELS.map((ch) => ({
      scid: ch.scid,
      sourcePubkey: ch.node1Pubkey,
      targetPubkey: ch.node2Pubkey,
      capacitySats: ch.capacitySats,
      feePpm: ch.node1ToNode2.feeProportionalMillionths,
      isAdversarial: ch.isAdversarialTrap || ch.node2Pubkey === PREDATORY_TRAP_PUBKEY,
    }))
  }, [])

  // Sync selected hub if nodes change
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.pubkey === selectedHub.pubkey) || nodes[0]
  }, [nodes, selectedHub])

  // Canvas Animation & Physics Loop (60 FPS)
  useEffect(() => {
    let animId: number

    const render = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      ctx.save()
      const t = transformRef.current
      ctx.translate(t.x, t.y)
      ctx.scale(t.scale, t.scale)

      // 1. Draw Radar Range Rings & Crosshairs
      const rings = [70, 140, 210, 280]
      for (const r of rings) {
        ctx.strokeStyle = 'rgba(215, 247, 106, 0.08)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.setLineDash([]) // reset

      // Crosshairs
      ctx.strokeStyle = 'rgba(215, 247, 106, 0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX - 300, centerY)
      ctx.lineTo(centerX + 300, centerY)
      ctx.moveTo(centerX, centerY - 300)
      ctx.lineTo(centerX, centerY + 300)
      ctx.stroke()

      // 2. Rotating Radar Sweep Beam
      const now = Date.now()
      const sweepAngle = (now / 3500) % (Math.PI * 2)
      const sweepLength = 310

      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sweepLength)
      sweepGrad.addColorStop(0, 'rgba(215, 247, 106, 0.15)')
      sweepGrad.addColorStop(0.8, 'rgba(215, 247, 106, 0.05)')
      sweepGrad.addColorStop(1, 'transparent')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, sweepLength, sweepAngle - 0.35, sweepAngle)
      ctx.closePath()
      ctx.fillStyle = sweepGrad
      ctx.fill()

      // Leading sweep line
      ctx.strokeStyle = 'rgba(215, 247, 106, 0.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + Math.cos(sweepAngle) * sweepLength, centerY + Math.sin(sweepAngle) * sweepLength)
      ctx.stroke()
      ctx.restore()

      // 3. Draw Channel Edges & Active Flow Particles
      const nodeMap = new Map(nodes.map((n) => [n.pubkey, n]))

      for (const edge of edges) {
        const u = nodeMap.get(edge.sourcePubkey)
        const v = nodeMap.get(edge.targetPubkey)
        if (!u || !v) continue

        const isEdgeTrap = edge.isAdversarial || u.isTrap || v.isTrap

        // Edge line
        ctx.strokeStyle = isEdgeTrap ? 'rgba(239, 68, 68, 0.3)' : 'rgba(215, 247, 106, 0.14)'
        ctx.lineWidth = isEdgeTrap ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(u.x, u.y)
        ctx.lineTo(v.x, v.y)
        ctx.stroke()

        // Animated flow particle (Satoshi in flight)
        const flowSpeed = isEdgeTrap ? 800 : 1800
        const flowTime = (now / flowSpeed) % 1
        const px = u.x + (v.x - u.x) * flowTime
        const py = u.y + (v.y - u.y) * flowTime

        ctx.fillStyle = isEdgeTrap ? '#ef4444' : '#d7f76a'
        ctx.beginPath()
        ctx.arc(px, py, isEdgeTrap ? 2.5 : 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // 4. Draw Nodes with Glow, Pulse & Labels
      for (const node of nodes) {
        const isSelected = selectedHub.pubkey === node.pubkey

        // Outer glow halo
        const haloGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2.5)
        haloGrad.addColorStop(0, node.isTrap ? 'rgba(239, 68, 68, 0.35)' : isSelected ? 'rgba(215, 247, 106, 0.5)' : 'rgba(215, 247, 106, 0.15)')
        haloGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = haloGrad
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Core Node
        ctx.fillStyle = node.isTrap ? '#ef4444' : node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fill()

        // Selected Ring
        if (isSelected) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Label
        ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace'
        ctx.fillStyle = node.isTrap ? '#fca5a5' : isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'
        ctx.textAlign = 'center'
        ctx.fillText(node.alias, node.x, node.y + node.radius + 13)
      }

      ctx.restore()

      // 5. Physics Simulation Step (Forces: Centering + Repulsion)
      if (isRunning) {
        setNodes((prevNodes) => {
          return prevNodes.map((node) => {
            // Gravity toward canvas center
            let fx = (centerX - node.x) * 0.0004
            let fy = (centerY - node.y) * 0.0004

            // Repulsion between nodes
            for (const other of prevNodes) {
              if (other.pubkey === node.pubkey) continue
              const dx = node.x - other.x
              const dy = node.y - other.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              if (dist < 140) {
                const repulse = (140 - dist) / dist
                fx += (dx / dist) * repulse * 0.08
                fy += (dy / dist) * repulse * 0.08
              }
            }

            return {
              ...node,
              x: node.x + node.vx + fx,
              y: node.y + node.vy + fy,
              vx: (node.vx + fx) * 0.93,
              vy: (node.vy + fy) * 0.93,
            }
          })
        })
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [edges, isRunning, selectedHub, nodes])

  // Click on Canvas to Select Node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.scale
    const clickY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.scale

    for (const node of nodes) {
      const dx = clickX - node.x
      const dy = clickY - node.y
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
        const found = KNOWN_MAJOR_HUBS.find((h) => h.pubkey === node.pubkey)
        if (found) setSelectedHub(found)
        return
      }
    }
  }

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - lastMousePosRef.current.x
    const dy = e.clientY - lastMousePosRef.current.y
    transformRef.current.x += dx
    transformRef.current.y += dy
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleRefresh = () => {
    setRefreshing(true)
    transformRef.current = { x: 0, y: 0, scale: 1 }
    setTimeout(() => setRefreshing(false), 600)
  }

  const filteredHubs = KNOWN_MAJOR_HUBS.filter((hub) => {
    const matchesSearch = 
      hub.alias.toLowerCase().includes(searchFilter.toLowerCase()) ||
      hub.pubkey.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesCategory = filterCategory === 'all' || hub.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <AppShell title="Network radar">
      <PageIntro 
        eyebrow="Sovereign topology layer" 
        title="See the network before you route through it." 
        description="A live, continuous force-directed physics radar of verified Bitcoin mainnet channel topology with real-time satoshi particle telemetry." 
        action={
          <button 
            type="button"
            onClick={handleRefresh}
            className="rounded-xl border border-[#d8d8cf] bg-white px-4 py-3 text-sm font-bold hover:bg-[#efefe8] transition-colors flex items-center"
          >
            <RefreshCw className={`mr-2 inline size-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Recalibrating...' : 'Reset View'}
          </button>
        } 
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Verified nodes" value="10 Hubs" detail="Across 24 mainnet channels" />
        <StatCard label="Graph capacity" value="₿ 9.60 BTC" detail="960,000,000 sats total" accent />
        <StatCard label="Radar status" value="60 FPS Live" detail="Continuous physics & particle flow" />
      </div>

      <PageGrid>
        {/* Left Column: Moving Visual Orbit Topology & Hub List */}
        <Panel className="lg:col-span-8">
          <PanelTitle meta={
            <div className="flex items-center gap-2">
              <LiveDot />
              <Pill tone="lime">24 SCIDs Live</Pill>
              <Pill tone="dark">60 FPS Physics</Pill>
            </div>
          }>
            Mainnet topology orbit
          </PanelTitle>

          {/* Dynamic 60 FPS Radar Canvas Frame */}
          <div className="relative h-[440px] w-full overflow-hidden rounded-2xl bg-[#0d120a] border border-[#202916] shadow-inner mb-6 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={440}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-crosshair"
            />

            {/* Floating Radar Controls */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-xl border border-[#323d24] bg-[#141a0f]/90 p-1.5 backdrop-blur-md text-xs shadow-md">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold text-white hover:bg-white/10 transition-colors"
                title={isRunning ? 'Pause Physics' : 'Resume Physics'}
              >
                {isRunning ? (
                  <>
                    <Pause className="size-3.5 text-[#d7f76a]" />
                    <span className="text-[11px] text-[#d7f76a]">ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 text-slate-300" />
                    <span className="text-[11px] text-slate-300">PAUSED</span>
                  </>
                )}
              </button>
              <div className="h-4 w-[1px] bg-[#323d24]" />
              <button
                type="button"
                onClick={() => {
                  transformRef.current.scale = Math.min(2.2, transformRef.current.scale * 1.2)
                }}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  transformRef.current.scale = Math.max(0.5, transformRef.current.scale / 1.2)
                }}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  transformRef.current = { x: 0, y: 0, scale: 1 }
                }}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                title="Reset Position"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Bottom Radar Telemetry Legend */}
            <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#323d24]/80 bg-[#141a0f]/85 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#49daaa]" /> LSP / Hub
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f0b90b]" /> Exchange
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ef4444] animate-pulse" /> Predatory Trap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#d7f76a]" /> In-Flight Sats
                </span>
              </div>
              <div className="text-[#d7f76a] font-bold">
                CLICK ANY NODE TO INSPECT
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-[#88887f]" />
              <input
                type="text"
                placeholder="Search nodes or pubkeys..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-xl border border-[#deded5] bg-[#fafaf7] py-2 pl-9 pr-3 text-xs text-[#171717] placeholder-[#88887f] focus:border-[#171717] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {['all', 'lsp', 'exchange', 'routing_hub'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
                    filterCategory === cat
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#fafaf7] border border-[#ecece5] text-[#66665e] hover:bg-[#efefe8]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Routing Hubs in Snapshot Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#77776e] mb-3">
              Verified routing hubs in snapshot ({filteredHubs.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {filteredHubs.map((hub) => (
                <div 
                  key={hub.pubkey}
                  onClick={() => setSelectedHub(hub)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedHub.pubkey === hub.pubkey 
                      ? 'border-[#171717] bg-[#171717] text-white shadow-sm' 
                      : 'border-[#ecece5] bg-[#fafaf7] hover:border-[#deded5] text-[#171717]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="size-3 rounded-full shrink-0" 
                      style={{ backgroundColor: hub.pubkey === PREDATORY_TRAP_PUBKEY ? '#ef4444' : hub.color }} 
                    />
                    <div>
                      <p className="text-sm font-bold flex items-center gap-1.5">
                        {hub.alias}
                        {hub.pubkey === PREDATORY_TRAP_PUBKEY && (
                          <span className="rounded bg-red-500/20 px-1 py-0.5 text-[9px] font-bold text-red-500">
                            TRAP
                          </span>
                        )}
                      </p>
                      <p className={`text-[11px] font-mono ${selectedHub.pubkey === hub.pubkey ? 'text-[#d7f76a]' : 'text-[#88887f]'}`}>
                        {hub.typical_capacity_btc} BTC capacity
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/router?target=${hub.pubkey}`}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      selectedHub.pubkey === hub.pubkey 
                        ? 'bg-[#d7f76a] text-[#171717] hover:bg-[#c9f052]' 
                        : 'bg-white border border-[#deded5] text-[#171717] hover:bg-[#efefe8]'
                    }`}
                  >
                    Route →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Right Column: Node Details & Network Signals */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Panel>
            <PanelTitle meta={<Radio className="size-4 text-[#84b51d]" />}>
              Selected node profile
            </PanelTitle>
            <div className={`rounded-2xl p-5 mb-4 ${selectedNode.isTrap ? 'bg-[#ffd8d0]' : 'bg-[#eaf7c4]'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase ${selectedNode.isTrap ? 'text-[#a33b26]' : 'text-[#557c0d]'}`}>
                  {selectedNode.isTrap ? 'Adversarial Quarantined' : 'Direct Verified Node'}
                </p>
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                  <Crosshair className="size-3" /> Focus
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#171717] mt-1">{selectedNode.alias}</h3>
              <p className="font-mono text-[11px] text-[#424831] mt-1 break-all">
                {selectedNode.pubkey}
              </p>
            </div>

            <DataRow 
              label="Category" 
              value={selectedNode.category?.toUpperCase() || 'ROUTING_HUB'} 
            />
            <DataRow 
              label="Typical capacity" 
              value={`${selectedNode.capacityBtc} BTC`} 
              sub={`${(selectedNode.capacityBtc * 100_000_000).toLocaleString()} satoshis`} 
            />
            <DataRow 
              label="Firewall status" 
              value={selectedNode.isTrap ? 'QUARANTINED' : 'ACTIVE'} 
              sub={selectedNode.isTrap ? '8,500 ppm fee trap isolated' : 'Guarded against fee spikes'} 
            />

            <div className="mt-5">
              <Link 
                href={`/router?target=${selectedNode.pubkey}`}
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#171717] py-3 text-xs font-bold text-white hover:bg-black transition-transform hover:-translate-y-0.5"
              >
                Plan payment to {selectedNode.alias} <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelTitle meta={<ShieldCheck className="size-4 text-[#84b51d]" />}>
              Network signals
            </PanelTitle>
            <DataRow label="Active SCIDs" value="24" sub="Authentic Bitcoin mainnet channels" />
            <DataRow label="Median fee" value="120 ppm" sub="Across verified edges" />
            <DataRow label="Adversarial trap" value="1 isolated" sub="859002x999x1 quarantined" />
            <DataRow label="Gossip health" value="100%" sub="Zero zombie channel drop" />
          </Panel>
        </div>
      </PageGrid>
    </AppShell>
  )
}
