'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell, LabelList
} from 'recharts'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, statusLabel, mesLabel } from '@/lib/utils'
import type { MetricasData, ClienteData, BDRecord, SerieDia } from '@/lib/gas'

const META_SN1 = 0.70
const META_TMS = 11.5

// Histórico hardcodeado — igual al index.html original
const HIST_BASE = [
  { mes: 'Dic 25', tms_sc: 7.7375,  tms_cc: 36.3886, sn1_sc: 0.71,  sn1_cc: 0.465 },
  { mes: 'Ene 26', tms_sc: 9.0875,  tms_cc: 28.1456, sn1_sc: 0.712, sn1_cc: 0.537 },
  { mes: 'Feb 26', tms_sc: 8.7333,  tms_cc: 35.4706, sn1_sc: 0.777, sn1_cc: 0.49  },
  { mes: 'Mar 26', tms_sc: 8.7269,  tms_cc: 26.1744, sn1_sc: 0.788, sn1_cc: 0.517 },
  { mes: 'Abr 26', tms_sc: 9.7514,  tms_cc: 28.3022, sn1_sc: 0.791, sn1_cc: 0.559 },
  { mes: 'May 26', tms_sc: 9.4947, tms_cc: 27.8572, sn1_sc: 0.713,  sn1_cc: 0.557 },
]

// Calcular acumulado diario — usa bdRecords si los hay, sino serieDia con proporción global
function calcAcumulado(data: MetricasData) {
  const records: any[] = data.bdRecords || []
  const serieDia: any[] = data.serieDia || []
  if (!serieDia.length) return []

  // Detectar si los bdRecords son sintéticos (reconstruidos desde serieDia para cierres históricos)
  const recordsSinteticos = records.length > 0 && records.every((r: any) => r._agregado)
  const usarBdReal = records.length > 0 && !recordsSinteticos

  // Rama 1: bdRecords reales (Salesforce vivo) → calcular desde records
  if (usarBdReal) {
    type DayAcc = { tms_s:number; tms_n:number; tmss_s:number; tmss_n:number; sn1_n:number; sn1_hdp:number; sn1s_n:number; sn1s_hdp:number }
    const byFecha: Record<string, DayAcc> = {}
    records.forEach((r: any) => {
      const f = (r.cierre || '').slice(0, 10)
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
    const acc = { tms_s:0, tms_n:0, tmss_s:0, tmss_n:0, sn1_n:0, sn1_hdp:0, sn1s_n:0, sn1s_hdp:0 }
    return serieDia.map((d: any) => {
      const f = d.fecha.slice(0, 10)
      const b = byFecha[f]
      if (b) {
        acc.tms_s += b.tms_s; acc.tms_n += b.tms_n
        acc.tmss_s += b.tmss_s; acc.tmss_n += b.tmss_n
        acc.sn1_n += b.sn1_n; acc.sn1_hdp += b.sn1_hdp
        acc.sn1s_n += b.sn1s_n; acc.sn1s_hdp += b.sn1s_hdp
      } else {
        const cas = d.casos || 0
        acc.tms_n += cas; acc.tms_s += (d.tms || 0) * cas
        acc.tmss_n += cas; acc.tmss_s += (d.tmss || 0) * cas
        acc.sn1_n += cas; acc.sn1_hdp += Math.round(cas * (data.sn1 || 0))
        acc.sn1s_n += cas; acc.sn1s_hdp += Math.round(cas * (data.sn1s || 0))
      }
      return {
        fecha: d.fecha.slice(5),
        tms:  acc.tms_n  > 0 ? acc.tms_s  / acc.tms_n  : null,
        tmss: acc.tmss_n > 0 ? acc.tmss_s / acc.tmss_n : null,
        sn1:  acc.sn1_n  > 0 ? acc.sn1_hdp  / acc.sn1_n  * 100 : null,
        sn1s: acc.sn1s_n > 0 ? acc.sn1s_hdp / acc.sn1s_n * 100 : null,
      }
    })
  }

  // Rama 2: usar campos diarios de serieDia (cierres históricos)
  let tmsAcumS=0, tmsAcumN=0, tmssAcumS=0, tmssAcumN=0
  let sn1AcumH=0, sn1AcumN=0, sn1sAcumH=0, sn1sAcumN=0
  return serieDia.map((d: any) => {
    const dTmsS  = d.tms_s  ?? ((d.tms  || 0) * (d.tms_n  ?? d.casos ?? 0))
    const dTmsN  = d.tms_n  ?? d.casos ?? 0
    const dTmssS = d.tmss_s ?? ((d.tmss || 0) * (d.tmss_n ?? d.casos ?? 0))
    const dTmssN = d.tmss_n ?? d.casos ?? 0
    tmsAcumS  += dTmsS;  tmsAcumN  += dTmsN
    tmssAcumS += dTmssS; tmssAcumN += dTmssN
    // SN1: usar campos diarios si existen; si no, fallback global proporcional
    if (typeof d.sn1_n === 'number' && typeof d.sn1_hdp === 'number') {
      sn1AcumH += d.sn1_hdp; sn1AcumN += d.sn1_n
    } else {
      const cas = d.casos || 0
      sn1AcumH += Math.round(cas * (data.sn1 || 0)); sn1AcumN += cas
    }
    if (typeof d.sn1s_n === 'number' && typeof d.sn1s_hdp === 'number') {
      sn1sAcumH += d.sn1s_hdp; sn1sAcumN += d.sn1s_n
    } else {
      const cas = d.casos || 0
      sn1sAcumH += Math.round(cas * (data.sn1s || 0)); sn1sAcumN += cas
    }
    return {
      fecha: d.fecha.slice(5),
      tms:  tmsAcumN  > 0 ? tmsAcumS  / tmsAcumN  : null,
      tmss: tmssAcumN > 0 ? tmssAcumS / tmssAcumN : null,
      sn1:  sn1AcumN  > 0 ? sn1AcumH  / sn1AcumN  * 100 : null,
      sn1s: sn1sAcumN > 0 ? sn1sAcumH / sn1sAcumN * 100 : null,
    }
  })
}

// ── Label pill SVG ─────────────────────────────────────────────────────────
function makePillLabel(color: string, bg: string, offsetUp: number, lastIdx: number, fmt: (v: number) => string) {
  return function PillLabelComp(props: any) {
    const { x, y, index, value } = props
    if (value == null) return <g key={`pl-${index}`} />
    const txt = fmt(value)
    const isLast = index === lastIdx
    const w = txt.length * 6 + 12
    const py = offsetUp < 0 ? y + offsetUp - 12 : y + offsetUp + 2
    return (
      <g key={`pl-${index}`}>
        <rect x={x - w / 2} y={py} width={w} height={16} rx={5} fill={bg} opacity={isLast ? 1 : 0.72} />
        <text x={x} y={py + 11} fontSize={isLast ? 10 : 8.5} fill={color} fontWeight={isLast ? 800 : 700} textAnchor="middle">{txt}</text>
      </g>
    )
  }
}

function makeEndLabel(color: string, bg: string, anchorTop: boolean, fmt: (v: number) => string, totalLen: number) {
  return function EndLabelComp(props: any) {
    const { x, y, index, value, viewBox } = props
    if (index !== totalLen - 1 || value == null) return <g key={`el-${index}`} />
    const txt = fmt(value)
    const w = txt.length * 6 + 14
    const chartTop = viewBox?.y ?? 0
    const chartH   = viewBox?.height ?? 160
    const py = anchorTop ? chartTop + 4 : chartTop + chartH - 20
    return (
      <g key={`el-${index}`}>
        <rect x={x + 8} y={py} width={w} height={16} rx={5} fill={bg} />
        <text x={x + 8 + w / 2} y={py + 11} fontSize={9.5} fill={color} fontWeight={800} textAnchor="middle">{txt}</text>
      </g>
    )
  }
}

// Tooltip oscuro
const DarkTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// Badge de estado
function StatusBadge({ status }: { status: ReturnType<typeof sn1Status> }) {
  const colors = {
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger:  'bg-danger/15 text-danger border-danger/30',
    neutral: 'bg-primary/15 text-primary border-primary/30',
  }
  const dots = {
    success: 'bg-success animate-pulse',
    warning: 'bg-warning',
    danger:  'bg-danger',
    neutral: 'bg-primary',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold', colors[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[status])} />
      {statusLabel(status)}
    </span>
  )
}

// KPI Card del informe
function InfKPICard({ label, value, sub, status }: {
  label: string; value: string; sub: string; status: ReturnType<typeof sn1Status>
}) {
  const borderColors = {
    success: 'border-l-success',
    warning: 'border-l-warning',
    danger:  'border-l-danger',
    neutral: 'border-l-primary',
  }
  const valColors = {
    success: 'text-success',
    warning: 'text-warning',
    danger:  'text-danger',
    neutral: 'text-primary',
  }
  return (
    <div className={cn('rounded-xl border border-border border-l-4 bg-card p-4', borderColors[status])}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className={cn('font-mono text-2xl font-bold leading-none mb-1', valColors[status])}>{value}</p>
      <p className="text-[10px] text-muted-foreground mb-3">{sub}</p>
      <StatusBadge status={status} />
    </div>
  )
}

interface ReportViewProps {
  data: MetricasData
  mes: string
  metaSn1: number
  metaTms: number
  histCierres?: any[]
}

export function ReportView({ data, mes, metaSn1, metaTms, histCierres }: ReportViewProps) {
  const slide1Ref = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [ajSn1Cc, setAjSn1Cc] = useState('')
  const [ajSn1Sc, setAjSn1Sc] = useState('')
  const [ajTmsCc, setAjTmsCc] = useState('')
  const [ajTmsSc, setAjTmsSc] = useState('')
  const [downloading, setDownloading] = useState(false)
  // Toggles vista acumulado
  const [acumTmsView, setAcumTmsView] = useState<'both'|'cc'|'sc'>('both')
  const [acumSn1View, setAcumSn1View] = useState<'both'|'cc'|'sc'>('both')

  // Datos con ajuste manual aplicado
  const sn1  = ajSn1Cc ? parseFloat(ajSn1Cc) / 100 : data.sn1
  const sn1s = ajSn1Sc ? parseFloat(ajSn1Sc) / 100 : data.sn1s
  function parseHMS(s: string) {
    if (!s) return null
    const p = s.split(':')
    if (p.length === 3) return parseInt(p[0]) + parseInt(p[1])/60 + parseFloat(p[2])/3600
    return null
  }
  const tms  = parseHMS(ajTmsCc) ?? data.tms
  const tmss = parseHMS(ajTmsSc) ?? data.tmss

  const mLabel = mesLabel(mes)

  // Histórico — usa cierres guardados si están disponibles
  const base = histCierres && histCierres.length >= 3 ? histCierres : [...HIST_BASE]
  const hist = [...base]
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const [yy, mm] = mes.split('-')
  const mL = `${meses[parseInt(mm)]} ${yy.slice(2)}`
  const histFinal = hist.slice(-6)

  // Histórico + mes actual con valores ajustados
  const histSinActual = hist.filter((h: any) => h.mes !== mL)
  const entradaActual: Record<string, any> = {
    mes:    mL,
    tms_sc: tmss,
    tms_cc: tms,
    sn1_sc: sn1s,
    sn1_cc: sn1,
  }
  const histConActual: Record<string, any>[] = [
    ...histSinActual.slice(-5).map((h: any) => ({ ...h })),
    entradaActual,
  ]

  // Promedios históricos
  const avgTmsSc = histFinal.reduce((s, h) => s + (h.tms_sc || 0), 0) / histFinal.length
  const avgTmsCc = histFinal.reduce((s, h) => s + (h.tms_cc || 0), 0) / histFinal.length
  const avgSn1Sc = histFinal.reduce((s, h) => s + (h.sn1_sc || 0), 0) / histFinal.length
  const avgSn1Cc = histFinal.reduce((s, h) => s + (h.sn1_cc || 0), 0) / histFinal.length
  const prev = histFinal.length >= 2 ? histFinal[histFinal.length - 2] : null

  function delta(cur: number, prevV: number | undefined, higherBetter: boolean) {
    if (!prev || !prevV) return null
    const dv = cur - prevV
    const pct = Math.abs(dv / prevV * 100).toFixed(1)
    const up = dv > 0
    const good = higherBetter ? up : !up
    return { txt: `${up ? '↑' : '↓'} ${pct}%`, good }
  }

  // Acumulado diario
  const acum = calcAcumulado(data)

  // Acumulado ajustado
  const acumAjustado = (() => {
    if (!acum.length) return acum
    const last = acum[acum.length - 1]
    const factorTmsCc  = (last.tms  != null && last.tms  > 0 && tms  !== data.tms)  ? tms  / last.tms  : 1
    const factorTmsSc  = (last.tmss != null && last.tmss > 0 && tmss !== data.tmss) ? tmss / last.tmss : 1
    const factorSn1Cc  = (last.sn1  != null && last.sn1  > 0 && sn1  !== data.sn1)  ? (sn1  * 100) / last.sn1  : 1
    const factorSn1Sc  = (last.sn1s != null && last.sn1s > 0 && sn1s !== data.sn1s) ? (sn1s * 100) / last.sn1s : 1
    if (factorTmsCc === 1 && factorTmsSc === 1 && factorSn1Cc === 1 && factorSn1Sc === 1) return acum
    return acum.map(p => ({
      ...p,
      tms:  p.tms  != null ? p.tms  * factorTmsCc  : null,
      tmss: p.tmss != null ? p.tmss * factorTmsSc  : null,
      sn1:  p.sn1  != null ? p.sn1  * factorSn1Cc  : null,
      sn1s: p.sn1s != null ? p.sn1s * factorSn1Sc  : null,
    }))
  })()

  // Top clientes (mantenidos para slide 2)
  const clientes = data.clientes || []
  const tmsKey = (c: any) => (c.tmss != null && c.tmss > 0) ? c.tmss : (c.tms || 0)
  const top10 = [...clientes].filter(c => c.casos > 0).sort((a, b) => b.casos - a.casos).slice(0, 10)

  // Top causas imputabilidad y tipo falla
  const records = data.bdRecords || []
  const causaMap: Record<string, number> = {}
  const fallaMap: Record<string, number> = {}
  records.forEach(r => {
    const ci = (r.causaImp || '').trim()
    if (ci && ci !== '-') causaMap[ci] = (causaMap[ci] || 0) + 1
    const n5 = (r.n5 || '').trim()
    if (n5 && n5 !== '-') fallaMap[n5] = (fallaMap[n5] || 0) + 1
  })
  const top3causas = Object.entries(causaMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const top3fallas = Object.entries(fallaMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // Descargar imagen
  const handleDownload = async () => {
    setDownloading(true)
    const mesStr = (mes || 'informe').replace('-', '_')
    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).htmlToImage) { resolve(); return }
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js'
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
      })
      const htmlToImage = (window as any).htmlToImage
      const wasDark = document.documentElement.classList.contains('dark')
      if (wasDark) {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
      window.scrollTo(0, 0)
      await new Promise(r => setTimeout(r, 800))
      const captureEl = async (el: HTMLElement, filename: string) => {
        const dataUrl = await htmlToImage.toPng(el, {
          quality: 1.0,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: false,
        })
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        link.click()
        await new Promise(r => setTimeout(r, 600))
      }
      if (slide1Ref.current) await captureEl(slide1Ref.current, `Informe_Mayoristas_${mesStr}_Slide1.png`)
      if (slide2Ref.current) await captureEl(slide2Ref.current, `Informe_Mayoristas_${mesStr}_Slide2.png`)
      if (wasDark) {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      }
    } catch (e) {
      console.error('Error capturando:', e)
      alert('Error al generar la imagen: ' + (e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  const now = new Date().toLocaleString('es-CO')

  return (
    <div className="py-4 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Informe Semanal — Mayoristas {mLabel}</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">{mes}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAjusteOpen(!ajusteOpen)
              if (!ajusteOpen) {
                setAjSn1Cc((data.sn1 * 100).toFixed(1))
                setAjSn1Sc((data.sn1s * 100).toFixed(1))
                setAjTmsCc(formatHMS(data.tms))
                setAjTmsSc(formatHMS(data.tmss))
              }
            }}
            className="h-9 px-4 rounded-lg border border-border bg-accent text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors"
          >
            ✏️ Ajuste manual
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            📷 {downloading ? 'Generando...' : 'Descargar imagen'}
          </button>
        </div>
      </div>

      {/* Panel ajuste manual */}
      {ajusteOpen && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-5 no-print">
          <p className="text-xs font-bold text-warning mb-4">⚠️ Modo ajuste — estos valores se usan solo para el informe. El dashboard no cambia.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'SN1 Con COFO (%)', val: ajSn1Cc, set: setAjSn1Cc, ph: '55.9' },
              { label: 'SN1 Sin COFO (%)', val: ajSn1Sc, set: setAjSn1Sc, ph: '77.7' },
              { label: 'TMS Con COFO (HH:MM:SS)', val: ajTmsCc, set: setAjTmsCc, ph: '28:18:08' },
              { label: 'TMS Sin COFO (HH:MM:SS)', val: ajTmsSc, set: setAjTmsSc, ph: '09:45:04' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">{f.label}</label>
                <input
                  type="text"
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="w-full h-9 rounded-lg border border-warning/30 bg-input px-3 font-mono text-sm text-foreground outline-none focus:border-warning"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => { setAjSn1Cc(''); setAjSn1Sc(''); setAjTmsCc(''); setAjTmsSc('') }}
              className="h-8 px-3 rounded-lg border border-border bg-accent text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Restaurar datos reales
            </button>
            <span className="text-[10px] text-muted-foreground">TMS en HH:MM:SS · SN1 en porcentaje (ej: 57.7)</span>
          </div>
        </div>
      )}

      {/* ═══ SLIDE 1 ═══ */}
      <div ref={slide1Ref} className="rounded-2xl border border-border bg-card p-7 space-y-6 print-slide">

        {/* Header slide 1 */}
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-4">
            <img src="/icon-192.png" alt="ETB" className="h-12 w-12 rounded-xl object-contain" />
            <div>
              <p className="text-lg font-bold text-foreground tracking-tight">Indicadores Mayoristas HDP</p>
              <p className="text-xs text-muted-foreground font-mono">ETB E&G Soporte — Customer Operation Success</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-primary tracking-tight">{mLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">Corte: {today}</p>
          </div>
        </div>

        {/* 8 KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InfKPICard label="SN1 Con COFO"    value={formatPct(sn1)}  sub={`${formatN(data.sn1_hdp)} HDP / ${formatN(data.sn1_n)} casos`}   status={sn1Status(sn1, metaSn1)} />
          <InfKPICard label="SN1 Sin COFO"    value={formatPct(sn1s)} sub={`${formatN(data.sn1s_hdp)} HDP / ${formatN(data.sn1s_n)} casos`}  status={sn1Status(sn1s, metaSn1)} />
          <InfKPICard label="TMS Con COFO"    value={formatHMS(tms)}  sub={`${formatN(data.tms_n)} casos · Meta ${metaTms}h`}  status={tmsStatus(tms, metaTms)} />
          <InfKPICard label="TMS Sin COFO"    value={formatHMS(tmss)} sub={`${formatN(data.tmss_n)} casos · Meta ${metaTms}h`} status={tmsStatus(tmss, metaTms)} />
          <InfKPICard label={`Prom TMS s/COFO (${histFinal.length}m)`} value={formatHMS(avgTmsSc)} sub={`Promedio ${histFinal.length} meses`} status={tmsStatus(avgTmsSc, metaTms)} />
          <InfKPICard label={`Prom TMS c/COFO (${histFinal.length}m)`} value={formatHMS(avgTmsCc)} sub={`Promedio ${histFinal.length} meses`} status={tmsStatus(avgTmsCc, metaTms)} />
          <InfKPICard label={`Prom SN1 s/COFO (${histFinal.length}m)`} value={`${(avgSn1Sc * 100).toFixed(1)}%`} sub={`Promedio ${histFinal.length} meses`} status={sn1Status(avgSn1Sc, metaSn1)} />
          <InfKPICard label={`Prom SN1 c/COFO (${histFinal.length}m)`} value={`${(avgSn1Cc * 100).toFixed(1)}%`} sub={`Promedio ${histFinal.length} meses`} status={sn1Status(avgSn1Cc, metaSn1)} />
        </div>

        {/* ── BLOQUE TOP 5 ELIMINADO ── */}

        {/* Evolución diaria TMS + SN1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-accent/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">TMS acumulado (horas)</p>
              <div className="flex gap-1">
                {(['cc','sc'] as const).map(v => (
                  <button key={v} onClick={() => setAcumTmsView(prev => prev === v ? 'both' : v)}
                    className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                      (acumTmsView === v || acumTmsView === 'both')
                        ? v === 'cc' ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'border-border text-muted-foreground opacity-40'
                    )}>
                    {v === 'cc' ? 'CON COFO' : 'SIN COFO'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 185 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={acumAjustado} margin={{ top: 12, right: 85, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217 91% 65%)" stopOpacity={0.2}/><stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.15}/><stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 8, fill: 'hsl(240 4% 45%)' }} />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}h`} />
                  <Tooltip content={<DarkTooltip formatter={(v: number) => formatHMS(v)} />} />
                  <ReferenceLine y={metaTms} stroke="#ff4444" strokeDasharray="6 3" strokeWidth={2} />
                  {(acumTmsView === 'both' || acumTmsView === 'cc') && (
                    <Area type="monotone" dataKey="tms" name="Con COFO" stroke="#60a5fa" fill="url(#rg1)" strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, index, payload } = props
                        if (index !== acumAjustado.length - 1 || payload.tms == null) return <g key={index} />
                        return <circle key={index} cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="#fff" strokeWidth={2} />
                      }}
                      label={makeEndLabel('#93c5fd', '#1e3a5f', true, formatHMS, acumAjustado.length)}
                    />
                  )}
                  {(acumTmsView === 'both' || acumTmsView === 'sc') && (
                    <Area type="monotone" dataKey="tmss" name="Sin COFO" stroke="#34d399" fill="url(#rg2)" strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, index, payload } = props
                        if (index !== acumAjustado.length - 1 || payload.tmss == null) return <g key={index} />
                        return <circle key={index} cx={cx} cy={cy} r={5} fill="#34d399" stroke="#fff" strokeWidth={2} />
                      }}
                      label={makeEndLabel('#6ee7b7', '#14412f', false, formatHMS, acumAjustado.length)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-accent/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SN1 acumulado (%)</p>
              <div className="flex gap-1">
                {(['cc','sc'] as const).map(v => (
                  <button key={v} onClick={() => setAcumSn1View(prev => prev === v ? 'both' : v)}
                    className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                      (acumSn1View === v || acumSn1View === 'both')
                        ? v === 'cc' ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'border-border text-muted-foreground opacity-40'
                    )}>
                    {v === 'cc' ? 'CON COFO' : 'SIN COFO'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 185 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={acumAjustado} margin={{ top: 12, right: 55, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217 91% 65%)" stopOpacity={0.2}/><stop offset="95%" stopColor="hsl(217 91% 65%)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="rg4" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.15}/><stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 8, fill: 'hsl(240 4% 45%)' }} />
                  <YAxis domain={[0, 105]} tick={{ fontSize: 8, fill: 'hsl(240 4% 45%)' }} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<DarkTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} />
                  <ReferenceLine y={metaSn1 * 100} stroke="#ff4444" strokeDasharray="6 3" strokeWidth={2} />
                  {(acumSn1View === 'both' || acumSn1View === 'cc') && (
                    <Area type="monotone" dataKey="sn1" name="Con COFO" stroke="#60a5fa" fill="url(#rg3)" strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, index, payload } = props
                        if (index !== acumAjustado.length - 1 || payload.sn1 == null) return <g key={index} />
                        return <circle key={index} cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="#fff" strokeWidth={2} />
                      }}
                      label={makeEndLabel('#93c5fd', '#1e3a5f', true, (v: number) => `${v.toFixed(1)}%`, acumAjustado.length)}
                    />
                  )}
                  {(acumSn1View === 'both' || acumSn1View === 'sc') && (
                    <Area type="monotone" dataKey="sn1s" name="Sin COFO" stroke="#34d399" fill="url(#rg4)" strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, index, payload } = props
                        if (index !== acumAjustado.length - 1 || payload.sn1s == null) return <g key={index} />
                        return <circle key={index} cx={cx} cy={cy} r={5} fill="#34d399" stroke="#fff" strokeWidth={2} />
                      }}
                      label={makeEndLabel('#6ee7b7', '#14412f', false, (v: number) => `${v.toFixed(1)}%`, acumAjustado.length)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Histórico 6 meses TMS + SN1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { title: 'TMS mensual — tendencia 6 meses', scKey: 'tms_sc', ccKey: 'tms_cc', meta: metaTms, fmt: (v: number) => `${v.toFixed(1)}h`, fmtTbl: formatHMS, yDomain: undefined as any },
            { title: 'SN1 mensual — tendencia 6 meses',  scKey: 'sn1_sc', ccKey: 'sn1_cc', meta: metaSn1 * 100, fmt: (v: number) => `${v.toFixed(0)}%`, fmtTbl: null,       yDomain: [0, 105] },
          ].map(({ title, scKey, ccKey, meta, fmt, fmtTbl, yDomain }) => {
            const isSN1 = scKey === 'sn1_sc'
            const chartData = histConActual.map((h: any) => ({
              mes: h.mes,
              sc: isSN1 ? +((h[scKey] as number) * 100).toFixed(1) : +(h[scKey] as number).toFixed(2),
              cc: isSN1 ? +((h[ccKey] as number) * 100).toFixed(1) : +(h[ccKey] as number).toFixed(2),
            }))
            const lastIdx = chartData.length - 1
            return (
              <div key={title} className="rounded-xl border border-border bg-accent/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
                <div style={{ height: 155 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} />
                      <YAxis domain={yDomain} tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={fmt} width={36} />
                      <Tooltip content={<DarkTooltip formatter={fmt} />} />
                      <ReferenceLine y={meta} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5} />
                      <Line type="monotone" dataKey="sc" name="Sin COFO" stroke="hsl(142 71% 45%)" strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, index } = props
                          return <circle key={`sc-d-${index}`} cx={cx} cy={cy} r={index === lastIdx ? 5 : 3.5} fill="hsl(142 71% 45%)" stroke="#fff" strokeWidth={1.5} />
                        }}
                      />
                      <Line type="monotone" dataKey="cc" name="Con COFO" stroke="hsl(217 91% 65%)" strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, index } = props
                          return <circle key={`cc-d-${index}`} cx={cx} cy={cy} r={index === lastIdx ? 5 : 3.5} fill="hsl(217 91% 65%)" stroke="#fff" strokeWidth={1.5} />
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Tabla de valores */}
                <div className="mt-2 border-t border-border/50 pt-2">
                  <table className="w-full text-center" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <td className="w-14" />
                        {chartData.map((d, i) => (
                          <td key={i} className="text-[9px] text-muted-foreground pb-0.5">{d.mes}</td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-[9px] font-bold text-emerald-400 text-left">s/COFO</td>
                        {chartData.map((d, i) => (
                          <td key={i} className="text-[9px] font-black py-0.5 text-emerald-400">
                            {(fmtTbl ?? fmt)(d.sc)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="text-[9px] font-bold text-blue-400 text-left pt-0.5">c/COFO</td>
                        {chartData.map((d, i) => (
                          <td key={i} className="text-[9px] font-black py-0.5 text-blue-400">
                            {(fmtTbl ?? fmt)(d.cc)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer slide 1 */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">Generado automáticamente · ETB Indicadores Mayoristas HDP</p>
          <p className="text-[10px] text-muted-foreground font-mono">{now}</p>
        </div>
      </div>

      {/* Separador */}
      <div className="flex items-center gap-3 no-print">
        <div className="flex-1 h-px bg-border" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Diapositiva 2 — Top 10 Clientes</p>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ═══ SLIDE 2 ═══ */}
      <div ref={slide2Ref} className="rounded-2xl border border-border bg-card p-7 space-y-5 print-slide">

        {/* Header slide 2 */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="ETB" className="h-10 w-10 rounded-xl object-contain" />
            <div>
              <p className="text-sm font-bold text-foreground tracking-tight">Top 10 Clientes Mayoristas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mes: {mLabel} · Corte: {today}</p>
            </div>
          </div>
          <p className="font-mono text-xl font-bold text-primary tracking-tight">{mLabel}</p>
        </div>

        {/* Top 3 causas */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top 3 — Causa Imputabilidad</p>
          <div className="grid grid-cols-3 gap-3">
            {top3causas.map(([causa, n], i) => {
              const colors = ['border-l-primary', 'border-l-success', 'border-l-warning']
              const txtColors = ['text-primary', 'text-success', 'text-warning']
              const pct = records.length > 0 ? (n / records.length * 100).toFixed(1) : '0'
              return (
                <div key={causa} className={cn('rounded-xl border border-border border-l-4 bg-accent/30 p-4', colors[i])}>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">#{i + 1}</p>
                  <p className="text-xs font-bold text-foreground mb-3 leading-tight">{causa}</p>
                  <p className={cn('font-mono text-2xl font-bold', txtColors[i])}>{n}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">casos · {pct}% del total</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 3 tipo falla */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top 3 — Tipo de Falla (N5)</p>
          <div className="grid grid-cols-3 gap-3">
            {top3fallas.map(([falla, n], i) => {
              const colors = ['border-l-[hsl(262_83%_58%)]', 'border-l-[hsl(199_89%_48%)]', 'border-l-[hsl(173_58%_39%)]']
              const txtColors = ['text-[hsl(262_83%_70%)]', 'text-[hsl(199_89%_60%)]', 'text-[hsl(173_58%_55%)]']
              const pct = records.length > 0 ? (n / records.length * 100).toFixed(1) : '0'
              return (
                <div key={falla} className={cn('rounded-xl border border-border border-l-4 bg-accent/30 p-4', colors[i])}>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">#{i + 1}</p>
                  <p className="text-xs font-bold text-foreground mb-3 leading-tight">{falla}</p>
                  <p className={cn('font-mono text-2xl font-bold', txtColors[i])}>{n}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">casos · {pct}% del total</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabla top 10 clientes — desktop */}
        <div className="hidden md:block rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-gradient-to-r from-blue-900 to-blue-700">
                <th className="px-3 py-2.5 text-white font-bold text-center" rowSpan={2}>Cliente</th>
                <th className="px-3 py-2.5 text-white font-bold text-center" rowSpan={2}>Casos</th>
                <th className="px-3 py-2.5 text-white font-bold text-center border-l-2 border-white/20" colSpan={4}>SIN COFO</th>
                <th className="px-3 py-2.5 text-white font-bold text-center border-l-2 border-white/20" colSpan={4}>CON COFO</th>
              </tr>
              <tr className="bg-blue-800">
                {['TMS', 'SN1%', 'HDP', 'Esc.', 'TMS', 'SN1%', 'HDP', 'Esc.'].map((h, i) => (
                  <th key={i} className={cn('px-2 py-1.5 text-white/80 font-semibold text-center text-[10px]', i === 4 && 'border-l-2 border-white/20')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top10.map((c, i) => {
                const sn1sPct = c.sn1s_n > 0 ? (c.sn1s_hdp / c.sn1s_n * 100).toFixed(1) + '%' : '—'
                const sn1Pct  = c.sn1_n  > 0 ? (c.sn1_hdp  / c.sn1_n  * 100).toFixed(1) + '%' : '—'
                const okTmss = (c.tmss ?? 0) <= metaTms
                const okTms  = (c.tms  ?? 0) <= metaTms
                const okSn1s = c.sn1s_n > 0 && c.sn1s_hdp / c.sn1s_n >= metaSn1
                const okSn1  = c.sn1_n  > 0 && c.sn1_hdp  / c.sn1_n  >= metaSn1
                return (
                  <tr key={c.nit || i} className={i % 2 === 0 ? 'bg-card' : 'bg-accent/20'}>
                    <td className="px-3 py-2 font-semibold text-foreground text-center border-b border-border/50">{c.nombre.slice(0, 32)}</td>
                    <td className="px-3 py-2 text-center font-mono text-muted-foreground border-b border-border/50">{c.casos}</td>
                    <td className={cn('px-2 py-2 text-center font-mono font-bold border-b border-border/50 border-l border-border/30', okTmss ? 'text-success' : 'text-danger')}>{c.tmss !== null ? formatHMS(c.tmss) : '—'}</td>
                    <td className={cn('px-2 py-2 text-center font-mono font-bold border-b border-border/50', okSn1s ? 'text-success' : 'text-danger')}>{sn1sPct}</td>
                    <td className="px-2 py-2 text-center font-mono text-muted-foreground border-b border-border/50">{c.sn1s_hdp ?? '—'}</td>
                    <td className="px-2 py-2 text-center font-mono text-muted-foreground border-b border-border/50">{c.sn1s_esc ?? '—'}</td>
                    <td className={cn('px-2 py-2 text-center font-mono font-bold border-b border-border/50 border-l border-border/30', okTms ? 'text-success' : 'text-danger')}>{c.tms !== null ? formatHMS(c.tms) : '—'}</td>
                    <td className={cn('px-2 py-2 text-center font-mono font-bold border-b border-border/50', okSn1 ? 'text-success' : 'text-danger')}>{sn1Pct}</td>
                    <td className="px-2 py-2 text-center font-mono text-muted-foreground border-b border-border/50">{c.sn1_hdp ?? '—'}</td>
                    <td className="px-2 py-2 text-center font-mono text-muted-foreground border-b border-border/50">{c.sn1_esc ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Top 10 móvil — tarjetas */}
        <div className="md:hidden space-y-2">
          {top10.map((c, i) => {
            const sn1sPct = c.sn1s_n > 0 ? (c.sn1s_hdp / c.sn1s_n * 100).toFixed(1) + '%' : '—'
            const okTmss = (c.tmss ?? 0) <= metaTms
            const okSn1s = c.sn1s_n > 0 && c.sn1s_hdp / c.sn1s_n >= metaSn1
            return (
              <div key={c.nit || i} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{c.nombre.slice(0, 32)}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{c.nit}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{c.casos} casos</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TMS Sin COFO</p>
                    <p className={cn('font-mono text-sm font-bold', okTmss ? 'text-success' : 'text-danger')}>
                      {c.tmss !== null ? formatHMS(c.tmss) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">SN1 Sin COFO</p>
                    <p className={cn('font-mono text-sm font-bold', okSn1s ? 'text-success' : 'text-danger')}>{sn1sPct}</p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">HDP / Esc</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.sn1s_hdp} / {c.sn1s_esc}</p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TMS Con COFO</p>
                    <p className={cn('font-mono text-sm font-bold', (c.tms ?? 0) <= metaTms ? 'text-success' : 'text-danger')}>
                      {c.tms !== null ? formatHMS(c.tms) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer slide 2 */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">Generado automáticamente · ETB Indicadores Mayoristas HDP</p>
          <p className="text-[10px] text-muted-foreground font-mono">{now}</p>
        </div>
      </div>
    </div>
  )
}
