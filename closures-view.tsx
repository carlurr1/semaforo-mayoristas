'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { cn, formatHMS, formatN } from '@/lib/utils'
import type { MetricasData, ClienteData } from '@/lib/gas'

const META_COLOR = 'hsl(0 84% 60% / 0.4)'

// ── Toggle button ─────────────────────────────────────────────
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all',
        active
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
      )}
    >
      {children}
    </button>
  )
}

// ── Chart card wrapper ────────────────────────────────────────
function ChartCard({ title, children, controls, delay = 0 }: {
  title: string; children: React.ReactNode; controls?: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-black/30"
    >
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {controls && <div className="flex gap-1">{controls}</div>}
      </div>
      {children}
    </motion.div>
  )
}

// ── Tooltip custom ────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── ChartsSection principal ───────────────────────────────────
interface ChartsSectionProps {
  data: MetricasData
  clientes: ClienteData[]
  metaSn1: number
  metaTms: number
}

export function ChartsSection({ data, clientes, metaSn1, metaTms }: ChartsSectionProps) {
  const [showTmsCC, setShowTmsCC] = useState(true)
  const [showTmsSC, setShowTmsSC] = useState(true)
  const [showSn1CC, setShowSn1CC] = useState(true)
  const [showSn1SC, setShowSn1SC] = useState(true)

  // Construir serie acumulada desde serieDia
  const acumulado = useMemo(() => {
    if (!data.serieDia?.length) return []
    let tms_s=0,tms_n=0,tmss_s=0,tmss_n=0
    let sn1_n=0,sn1_h=0,sn1s_n=0,sn1s_h=0
    return data.serieDia.map(d => {
      tms_n += d.casos; tms_s += d.tms * d.casos
      tmss_n += d.casos; tmss_s += d.tmss * d.casos
      sn1_n += d.casos; sn1s_n += d.casos
      return {
        fecha: d.fecha.slice(5),
        tmsCC: tms_n  > 0 ? tms_s /tms_n  : null,
        tmsSC: tmss_n > 0 ? tmss_s/tmss_n : null,
        sn1CC: sn1_n  > 0 ? (data.sn1  * 100) : null,
        sn1SC: sn1s_n > 0 ? (data.sn1s * 100) : null,
      }
    })
  }, [data])

  // Top 10 clientes para barras
  const topClientes = useMemo(() =>
    [...clientes]
      .filter(c => c.tms !== null)
      .sort((a, b) => (b.tms || 0) - (a.tms || 0))
      .slice(0, 8)
  , [clientes])

  // Distribución HDP/Escalado
  const hdpDist = useMemo(() =>
    [...clientes]
      .filter(c => c.sn1s_n > 0)
      .sort((a, b) => b.sn1s_n - a.sn1s_n)
      .slice(0, 8)
      .map(c => ({
        name: c.nombre.length > 18 ? c.nombre.slice(0, 17) + '…' : c.nombre,
        HDP: c.sn1s_hdp,
        Escalado: c.sn1s_esc,
      }))
  , [clientes])

  return (
    <div className="space-y-4">
      {/* TMS + SN1 diario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="TMS acumulado (horas)"
          delay={0.3}
          controls={
            <>
              <Toggle active={showTmsCC} onClick={() => setShowTmsCC(!showTmsCC)}>Con COFO</Toggle>
              <Toggle active={showTmsSC} onClick={() => setShowTmsSC(!showTmsSC)}>Sin COFO</Toggle>
            </>
          }
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acumulado} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTmsCC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(217 91% 65%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTmsSC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(142 71% 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 15%)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <ReferenceLine y={metaTms} stroke={META_COLOR} strokeDasharray="5 4" />
                {showTmsCC && <Area type="monotone" dataKey="tmsCC" name="Con COFO" stroke="hsl(217 91% 65%)" fill="url(#gTmsCC)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                {showTmsSC && <Area type="monotone" dataKey="tmsSC" name="Sin COFO" stroke="hsl(142 71% 45%)" fill="url(#gTmsSC)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="SN1 acumulado (%)"
          delay={0.4}
          controls={
            <>
              <Toggle active={showSn1CC} onClick={() => setShowSn1CC(!showSn1CC)}>Con COFO</Toggle>
              <Toggle active={showSn1SC} onClick={() => setShowSn1SC(!showSn1SC)}>Sin COFO</Toggle>
            </>
          }
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acumulado} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSn1CC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(217 91% 65%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSn1SC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(142 71% 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 15%)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} />
                <YAxis domain={[0, 110]} tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}%`} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} />
                <ReferenceLine y={metaSn1 * 100} stroke={META_COLOR} strokeDasharray="5 4" />
                {showSn1CC && <Area type="monotone" dataKey="sn1CC" name="Con COFO" stroke="hsl(217 91% 65%)" fill="url(#gSn1CC)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                {showSn1SC && <Area type="monotone" dataKey="sn1SC" name="Sin COFO" stroke="hsl(142 71% 45%)" fill="url(#gSn1SC)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* HDP dist + Impacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribución HDP / Escalado (sin COFO)" delay={0.5}>
          <div style={{ height: Math.max(hdpDist.length * 38 + 40, 180) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hdpDist} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(240 6% 15%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="HDP"     name="HDP"     stackId="a" fill="hsl(142 71% 45% / 0.75)" radius={[0,0,0,0]} />
                <Bar dataKey="Escalado" name="Escalado" stackId="a" fill="hsl(0 84% 60% / 0.65)"  radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Clientes mayor impacto TMS (sin COFO)" delay={0.6}>
          <div style={{ height: Math.max(topClientes.length * 38 + 40, 180) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClientes.map(c => ({
                  name: c.nombre.length > 18 ? c.nombre.slice(0, 17) + '…' : c.nombre,
                  tms: c.tmss ?? 0,
                  fuera: (c.tmss ?? 0) > 11.5
                }))}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(240 6% 15%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <Bar dataKey="tms" name="TMS Sin COFO" radius={[0, 4, 4, 0]}>
                  {topClientes.map((c, i) => (
                    <Cell
                      key={i}
                      fill={(c.tmss ?? 0) > 11.5
                        ? 'hsl(0 84% 60% / 0.7)'
                        : 'hsl(142 71% 45% / 0.7)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
