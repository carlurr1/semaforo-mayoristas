'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend
} from 'recharts'
import { cn, formatHMS, formatN } from '@/lib/utils'
import type { MetricasData, ClienteData } from '@/lib/gas'

const META_TMS = 11.5
const META_SN1 = 0.70

// Histórico hardcodeado — igual al original
const HIST_BASE = [
  { mes: 'Dic 25', tms_sc: 7.7375,  tms_cc: 36.3886, sn1_sc: 0.71,  sn1_cc: 0.465 },
  { mes: 'Ene 26', tms_sc: 9.0875,  tms_cc: 28.1456, sn1_sc: 0.712, sn1_cc: 0.537 },
  { mes: 'Feb 26', tms_sc: 8.7333,  tms_cc: 35.4706, sn1_sc: 0.777, sn1_cc: 0.49  },
  { mes: 'Mar 26', tms_sc: 8.7269,  tms_cc: 26.1744, sn1_sc: 0.788, sn1_cc: 0.517 },
  { mes: 'Abr 26', tms_sc: 9.7514,  tms_cc: 28.3022, sn1_sc: 0.791, sn1_cc: 0.559 },
  { mes: 'May 26', tms_sc: 9.4947, tms_cc: 27.8572, sn1_sc: 0.713,  sn1_cc: 0.557 },
]

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

function ChartCard({ title, children, controls, delay = 0 }: {
  title: string; children: React.ReactNode; controls?: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-border bg-card p-4 lg:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {controls && <div className="flex gap-1 flex-shrink-0">{controls}</div>}
      </div>
      {children}
    </motion.div>
  )
}

const DarkTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-xs max-w-[200px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

interface ChartsSectionProps {
  data: MetricasData
  clientes: ClienteData[]
  metaSn1: number
  metaTms: number
  histCierres?: any[]
}

export function ChartsSection({ data, clientes, metaSn1, metaTms, histCierres }: ChartsSectionProps) {
  const [showTmsCC, setShowTmsCC] = useState(true)
  const [showTmsSC, setShowTmsSC] = useState(true)
  const [showSn1CC, setShowSn1CC] = useState(true)
  const [showSn1SC, setShowSn1SC] = useState(true)

  // Acumulado diario — calcula TMS y SN1 desde bdRecords igual que el original
  const acumulado = useMemo(() => {
    const records = data.bdRecords || []
    const serieDia = data.serieDia || []
    if (!serieDia.length) return []

    type DayAcc = { tms_s:number; tms_n:number; tmss_s:number; tmss_n:number; sn1_n:number; sn1_hdp:number; sn1s_n:number; sn1s_hdp:number }
    const byFecha: Record<string, DayAcc> = {}

    records.forEach(r => {
      const f = r.cierre?.slice(0, 10) || ''
      if (!f) return
      if (!byFecha[f]) byFecha[f] = { tms_s:0, tms_n:0, tmss_s:0, tmss_n:0, sn1_n:0, sn1_hdp:0, sn1s_n:0, sn1s_hdp:0 }
      const d = byFecha[f]
      const masRaw = (r.masivo || '').toUpperCase().trim()
      const mSN1 = masRaw !== '' && masRaw !== 'SIN FALLA MASIVA' && masRaw !== 'NONE'
      const mTMS = masRaw === 'CORTE DE CABLE'
      if (!mSN1)               { d.sn1_n++;  if (r.hdp) d.sn1_hdp++ }
      if (!mSN1 && !r.cofoSN1) { d.sn1s_n++; if (r.hdp) d.sn1s_hdp++ }
      if (!mTMS)               { d.tms_n++;  d.tms_s  += r.tms }
      if (!mTMS && !r.cofoTMS) { d.tmss_n++; d.tmss_s += r.tms }
    })

    // Verificar si serieDia ya trae SN1 diario (nuevo formato del GAS)
    const hasSN1enSerie = serieDia.some(d => (d as any).sn1_n > 0)
    const useBD = records.length > 0
    const acc = { tms_s:0, tms_n:0, tmss_s:0, tmss_n:0, sn1_n:0, sn1_hdp:0, sn1s_n:0, sn1s_hdp:0 }

    return serieDia.map(d => {
      const f = d.fecha.slice(0, 10)
      const ds = d as any
      if (hasSN1enSerie) {
        acc.tms_n  += d.casos; acc.tms_s  += d.tms  * d.casos
        acc.tmss_n += d.casos; acc.tmss_s += d.tmss * d.casos
        acc.sn1_n  += ds.sn1_n  || 0; acc.sn1_hdp  += ds.sn1_hdp  || 0
        acc.sn1s_n += ds.sn1s_n || 0; acc.sn1s_hdp += ds.sn1s_hdp || 0
      } else if (useBD && byFecha[f]) {
        const b = byFecha[f]
        acc.tms_s  += b.tms_s;  acc.tms_n  += b.tms_n
        acc.tmss_s += b.tmss_s; acc.tmss_n += b.tmss_n
        acc.sn1_n  += b.sn1_n;  acc.sn1_hdp  += b.sn1_hdp
        acc.sn1s_n += b.sn1s_n; acc.sn1s_hdp += b.sn1s_hdp
      } else {
        acc.tms_n  += d.casos; acc.tms_s  += d.tms  * d.casos
        acc.tmss_n += d.casos; acc.tmss_s += d.tmss * d.casos
        acc.sn1_n  += d.casos; acc.sn1s_n += d.casos
        acc.sn1_hdp  = Math.round(acc.sn1_n  * data.sn1)
        acc.sn1s_hdp = Math.round(acc.sn1s_n * data.sn1s)
      }
      return {
        fecha: d.fecha.slice(5),
        tmsCC: acc.tms_n  > 0 ? acc.tms_s  / acc.tms_n  : null,
        tmsSC: acc.tmss_n > 0 ? acc.tmss_s / acc.tmss_n : null,
        sn1CC: acc.sn1_n  > 0 ? acc.sn1_hdp  / acc.sn1_n  * 100 : null,
        sn1SC: acc.sn1s_n > 0 ? acc.sn1s_hdp / acc.sn1s_n * 100 : null,
      }
    })
  }, [data])

  // Histórico — usa cierres guardados si están disponibles, sino HIST_BASE
  const hist = useMemo(() => {
    const base = histCierres && histCierres.length >= 3 ? histCierres : [...HIST_BASE]
    const h = [...base]
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const mes = data.serieDia?.[0]?.fecha?.slice(0, 7) || ''
    if (mes) {
      const [yy, mm] = mes.split('-')
      const mL = `${meses[parseInt(mm)]} ${yy.slice(2)}`
      const idx = h.findIndex(x => x.mes === mL)
      const entry = { mes: mL, tms_sc: data.tmss, tms_cc: data.tms, sn1_sc: data.sn1s, sn1_cc: data.sn1 }
      if (idx >= 0) h[idx] = entry
      else h.push(entry)
    }
    return h.slice(-7)
  }, [data, histCierres])

  // Top clientes
  const topClientes = useMemo(() =>
    [...clientes].filter(c => c.tms !== null).sort((a, b) => (b.tms || 0) - (a.tms || 0)).slice(0, 8)
  , [clientes])

  const top10best  = useMemo(() => [...clientes].filter(c => c.tms !== null && c.tms > 0).sort((a, b) => (a.tms || 0) - (b.tms || 0)).slice(0, 10), [clientes])
  const top10worst = useMemo(() => [...clientes].filter(c => c.tms !== null && c.tms > 0).sort((a, b) => (b.tms || 0) - (a.tms || 0)).slice(0, 10), [clientes])

  const hdpDist = useMemo(() =>
    [...clientes].filter(c => c.sn1s_n > 0).sort((a, b) => b.sn1s_n - a.sn1s_n).slice(0, 8)
      .map(c => ({
        name: c.nombre.length > 16 ? c.nombre.slice(0, 15) + '…' : c.nombre,
        HDP: c.sn1s_hdp, Escalado: c.sn1s_esc,
      }))
  , [clientes])

  // Promedios históricos para insight cards
  const avgTmsSc = hist.reduce((s, h) => s + (h.tms_sc || 0), 0) / hist.length
  const avgTmsCc = hist.reduce((s, h) => s + (h.tms_cc || 0), 0) / hist.length
  const avgSn1Sc = hist.reduce((s, h) => s + (h.sn1_sc || 0), 0) / hist.length
  const avgSn1Cc = hist.reduce((s, h) => s + (h.sn1_cc || 0), 0) / hist.length
  const prev = hist.length >= 2 ? hist[hist.length - 2] : null

  function delta(cur: number, prevV: number | undefined, higherBetter: boolean) {
    if (!prev || !prevV) return null
    const dv = cur - prevV
    const pct = Math.abs(dv / prevV * 100).toFixed(1)
    const up = dv > 0
    const good = higherBetter ? up : !up
    return { txt: `${up ? '↑' : '↓'} ${pct}%`, good }
  }

  const insightCards = [
    { label: `Prom TMS s/COFO (${hist.length}m)`, value: formatHMS(avgTmsSc), ok: avgTmsSc <= metaTms, d: delta(data.tmss, prev?.tms_sc, false) },
    { label: `Prom TMS c/COFO (${hist.length}m)`, value: formatHMS(avgTmsCc), ok: avgTmsCc <= metaTms, d: delta(data.tms,  prev?.tms_cc, false) },
    { label: `Prom SN1 s/COFO (${hist.length}m)`, value: `${(avgSn1Sc * 100).toFixed(1)}%`, ok: avgSn1Sc >= metaSn1, d: delta(data.sn1s, prev?.sn1_sc, true) },
    { label: `Prom SN1 c/COFO (${hist.length}m)`, value: `${(avgSn1Cc * 100).toFixed(1)}%`, ok: avgSn1Cc >= metaSn1, d: delta(data.sn1,  prev?.sn1_cc, true) },
  ]

  const shortName = (n: string) => n.length > 20 ? n.slice(0, 19) + '…' : n

  return (
    <div className="space-y-4">

      {/* Insight cards — promedios históricos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {insightCards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{c.label}</p>
            <p className={cn('font-mono text-xl font-bold', c.ok ? 'text-success' : 'text-danger')}>{c.value}</p>
            {c.d && (
              <span className={cn('mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                c.d.good ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                {c.d.txt}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* TMS + SN1 diario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="TMS acumulado (horas)" delay={0.1}
          controls={
            <>
              <Toggle active={showTmsCC} onClick={() => setShowTmsCC(!showTmsCC)}>Con COFO</Toggle>
              <Toggle active={showTmsSC} onClick={() => setShowTmsSC(!showTmsSC)}>Sin COFO</Toggle>
            </>
          }
        >
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acumulado} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTmsCC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gTmsSC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} width={35} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <ReferenceLine y={metaTms} stroke="#ff3b3b" strokeDasharray="6 3" strokeWidth={2} />
                {showTmsCC && <Area type="monotone" dataKey="tmsCC" name="Con COFO" stroke="#60a5fa" fill="url(#gTmsCC)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />}
                {showTmsSC && <Area type="monotone" dataKey="tmsSC" name="Sin COFO" stroke="#34d399" fill="url(#gTmsSC)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="SN1 acumulado (%)" delay={0.15}
          controls={
            <>
              <Toggle active={showSn1CC} onClick={() => setShowSn1CC(!showSn1CC)}>Con COFO</Toggle>
              <Toggle active={showSn1SC} onClick={() => setShowSn1SC(!showSn1SC)}>Sin COFO</Toggle>
            </>
          }
        >
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acumulado} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSn1CC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gSn1SC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} interval="preserveStartEnd" />
                <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}%`} width={35} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} />
                <ReferenceLine y={metaSn1 * 100} stroke="#ff3b3b" strokeDasharray="6 3" strokeWidth={2} />
                {showSn1CC && <Area type="monotone" dataKey="sn1CC" name="Con COFO" stroke="#60a5fa" fill="url(#gSn1CC)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />}
                {showSn1SC && <Area type="monotone" dataKey="sn1SC" name="Sin COFO" stroke="#34d399" fill="url(#gSn1SC)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* HDP dist + Impacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribución HDP / Escalado (sin COFO)" delay={0.2}>
          <div style={{ height: Math.max(hdpDist.length * 36 + 40, 160) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hdpDist} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: 'hsl(240 4% 55%)' }} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="HDP"      name="HDP"      stackId="a" fill="hsl(142 71% 45% / 0.75)" radius={[0,0,0,0]} />
                <Bar dataKey="Escalado" name="Escalado" stackId="a" fill="hsl(0 84% 60% / 0.65)"   radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Clientes mayor impacto TMS (sin COFO)" delay={0.25}>
          <div style={{ height: Math.max(topClientes.length * 36 + 40, 160) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClientes.map(c => ({ name: shortName(c.nombre), tms: +(c.tmss ?? 0).toFixed(2) }))}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: 'hsl(240 4% 55%)' }} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <Bar dataKey="tms" name="TMS Sin COFO" radius={[0, 4, 4, 0]}>
                  {topClientes.map((c, i) => (
                    <Cell key={i} fill={(c.tmss ?? 0) > metaTms ? 'hsl(0 84% 60% / 0.7)' : 'hsl(142 71% 45% / 0.7)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Histórico 6 meses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="TMS mensual — tendencia 6 meses" delay={0.3}>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist.map(h => ({ mes: h.mes, sc: +h.tms_sc.toFixed(2), cc: +h.tms_cc.toFixed(2) }))} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} width={35} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <ReferenceLine y={metaTms} stroke="#ff3b3b" strokeDasharray="6 3" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="sc" name="Sin COFO" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4, fill: '#34d399' }} strokeDasharray="" />
                <Line type="monotone" dataKey="cc" name="Con COFO" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 4, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="SN1 mensual — tendencia 6 meses" delay={0.35}>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist.map(h => ({ mes: h.mes, sc: +(h.sn1_sc * 100).toFixed(1), cc: +(h.sn1_cc * 100).toFixed(1) }))} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} />
                <YAxis domain={[0, 105]} tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}%`} width={35} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} />
                <ReferenceLine y={metaSn1 * 100} stroke="#ff3b3b" strokeDasharray="6 3" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="sc" name="Sin COFO" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4, fill: '#34d399' }} strokeDasharray="" />
                <Line type="monotone" dataKey="cc" name="Con COFO" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 4, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top 10 mejor / peor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 clientes — menor TMS (mejor)" delay={0.4}>
          <div style={{ height: Math.max(top10best.length * 30 + 40, 200) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10best.map(c => ({ name: shortName(c.nombre), tms: +(c.tms ?? 0).toFixed(2) }))} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: 'hsl(240 4% 55%)' }} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <Bar dataKey="tms" name="TMS" radius={[0, 4, 4, 0]} barSize={14}>
                  {top10best.map((c, i) => (
                    <Cell key={i} fill={(c.tms ?? 0) <= metaTms ? 'hsl(142 71% 45% / 0.75)' : 'hsl(48 96% 53% / 0.7)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top 10 clientes — mayor TMS (peor)" delay={0.45}>
          <div style={{ height: Math.max(top10worst.length * 30 + 40, 200) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10worst.map(c => ({ name: shortName(c.nombre), tms: +(c.tms ?? 0).toFixed(2) }))} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: 'hsl(240 4% 55%)' }} />
                <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                <Bar dataKey="tms" name="TMS" radius={[0, 4, 4, 0]} barSize={14}>
                  {top10worst.map((c, i) => (
                    <Cell key={i} fill={(c.tms ?? 0) > metaTms * 1.2 ? 'hsl(0 84% 60% / 0.7)' : 'hsl(48 96% 53% / 0.7)'} />
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
