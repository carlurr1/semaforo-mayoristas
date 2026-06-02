'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, FolderOpen, Lock, Check, X } from 'lucide-react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, mesLabel } from '@/lib/utils'
import type { CierreResumen } from '@/lib/gas'

const META_SN1 = 0.70
const META_TMS = 11.5

interface ClosuresViewProps {
  mes: string
  onGasCall: (action: string, params?: Record<string,string>) => Promise<any>
}

// ── Detalle del cierre con gráficas ───────────────────────────
function CierreDetalle({ selected, detalle }: { selected: CierreResumen; detalle: any | null }) {
  // Usar siempre los valores del resumen (KPIs validados del cierre)
  // y solo tomar serieDia/clientes del detalle
  const r = { ...detalle, ...selected.resumen }
  const serieDia: any[] = detalle?.serieDia || []
  const clientes: any[] = detalle?.clientes || []

  const acum = (() => {
    if (!serieDia.length) return []
    return serieDia.map((d: any) => {
      return {
        fecha: d.fecha.slice(5),
        // En cierres: mostrar línea plana con los KPIs globales validados
        tmsCC: r.tms  || 0,
        tmsSC: r.tmss || 0,
        sn1CC: (r.sn1  || 0) * 100,
        sn1SC: (r.sn1s || 0) * 100,
      }
    })
  })()

  const kpis = [
    { label: 'SN1 Con COFO', value: formatPct(r.sn1),  sub: `${r.sn1_hdp||0} HDP / ${r.sn1_n||0} casos`,  status: sn1Status(r.sn1, META_SN1) },
    { label: 'SN1 Sin COFO', value: formatPct(r.sn1s), sub: `${r.sn1s_hdp||0} HDP / ${r.sn1s_n||0} casos`, status: sn1Status(r.sn1s, META_SN1) },
    { label: 'TMS Con COFO', value: formatHMS(r.tms),  sub: `${r.tms_n||0} casos · Meta ${META_TMS}h`,     status: tmsStatus(r.tms, META_TMS) },
    { label: 'TMS Sin COFO', value: formatHMS(r.tmss), sub: `${r.tmss_n||0} casos · Meta ${META_TMS}h`,    status: tmsStatus(r.tmss, META_TMS) },
  ]

  const borderC = (s: string) => s === 'success' ? 'border-l-success' : s === 'danger' ? 'border-l-danger' : 'border-l-warning'
  const valC    = (s: string) => s === 'success' ? 'text-success'     : s === 'danger' ? 'text-danger'     : 'text-warning'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* Header + KPIs */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-mono text-2xl font-bold text-primary">Cierre: {mesLabel(selected.mesAnio)}</h2>
            <p className="text-xs text-muted-foreground mt-1">Capturado: {selected.fechaCaptura}</p>
          </div>
          <span className="font-mono text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5">
            {formatN(r.totalMayoristas)} casos
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <div key={i} className={cn('rounded-xl border border-border border-l-4 bg-card p-4', borderC(k.status))}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{k.label}</p>
              <p className={cn('font-mono text-xl font-bold mb-1', valC(k.status))}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficas acumuladas */}
      {acum.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {([
            { title: 'TMS acumulado (datos congelados)', cc: 'tmsCC', sc: 'tmsSC', meta: META_TMS,       fmt: (v: number) => `${v.toFixed(1)}h`,  yFmt: (v: number) => `${v}h`,  domain: undefined as any },
            { title: 'SN1 acumulado (%)',                cc: 'sn1CC', sc: 'sn1SC', meta: META_SN1 * 100, fmt: (v: number) => `${v.toFixed(1)}%`, yFmt: (v: number) => `${v}%`, domain: [0, 110] as any },
          ] as const).map(({ title, cc, sc, meta, fmt, yFmt, domain }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={acum} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`g1${cc}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id={`g2${sc}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#34d399" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 15%)" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} interval="preserveStartEnd" />
                    <YAxis domain={domain} tick={{ fontSize: 9, fill: 'hsl(240 4% 45%)' }} tickFormatter={yFmt} width={32} />
                    <Tooltip
                      contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [fmt(Number(v))]}
                    />
                    <ReferenceLine y={meta} stroke="#ff3b3b" strokeDasharray="6 3" strokeWidth={2} />
                    <Area type="monotone" dataKey={cc} name="Con COFO" stroke="#60a5fa" fill={`url(#g1${cc})`} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey={sc} name="Sin COFO" stroke="#34d399" fill={`url(#g2${sc})`} strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla clientes del cierre */}
      {clientes.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              TMS y SN1 por cliente — cierre oficial
            </p>
          </div>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b border-border">
                  {['Cliente','Casos','TMS c/COFO','SN1 c/COFO','TMS s/COFO','SN1 s/COFO'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.nombre}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{c.nit}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-muted-foreground">{c.casos}</td>
                    <td className="px-4 py-3 text-center"><span className={cn('font-mono font-bold', (c.tms||0)<=META_TMS?'text-success':'text-danger')}>{formatHMS(c.tms)}</span></td>
                    <td className="px-4 py-3 text-center"><span className={cn('font-mono font-bold', (c.sn1||0)>=META_SN1?'text-success':'text-danger')}>{c.sn1?formatPct(c.sn1):'—'}</span></td>
                    <td className="px-4 py-3 text-center"><span className={cn('font-mono font-bold', (c.tmss||0)<=META_TMS?'text-success':'text-danger')}>{formatHMS(c.tmss)}</span></td>
                    <td className="px-4 py-3 text-center"><span className={cn('font-mono font-bold', (c.sn1s||0)>=META_SN1?'text-success':'text-danger')}>{c.sn1s?formatPct(c.sn1s):'—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Móvil — tarjetas */}
          <div className="md:hidden divide-y divide-border/50">
            {clientes.slice(0, 30).map((c: any, i: number) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{c.nombre}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{c.nit}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground flex-shrink-0 ml-2">{c.casos} casos</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] text-muted-foreground mb-1">TMS Sin COFO</p>
                    <p className={cn('font-mono text-sm font-bold', (c.tmss||0)<=META_TMS?'text-success':'text-danger')}>{formatHMS(c.tmss)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] text-muted-foreground mb-1">SN1 Sin COFO</p>
                    <p className={cn('font-mono text-sm font-bold', (c.sn1s||0)>=META_SN1?'text-success':'text-danger')}>{c.sn1s?formatPct(c.sn1s):'—'}</p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] text-muted-foreground mb-1">TMS Con COFO</p>
                    <p className={cn('font-mono text-sm font-bold', (c.tms||0)<=META_TMS?'text-success':'text-danger')}>{formatHMS(c.tms)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/30 p-2.5">
                    <p className="text-[9px] text-muted-foreground mb-1">SN1 Con COFO</p>
                    <p className={cn('font-mono text-sm font-bold', (c.sn1||0)>=META_SN1?'text-success':'text-danger')}>{c.sn1?formatPct(c.sn1):'—'}</p>
                  </div>
                </div>
              </div>
            ))}
            {clientes.length > 30 && (
              <p className="text-center text-xs text-muted-foreground py-3">
                Mostrando 30 de {clientes.length} clientes
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── Componente principal ───────────────────────────────────────
export function ClosuresView({ mes, onGasCall }: ClosuresViewProps) {
  const [cierres,    setCierres]    = useState<CierreResumen[]>([])
  const [selected,   setSelected]   = useState<CierreResumen | null>(null)
  const [detalle,    setDetalle]    = useState<any | null>(null)
  const [loadingDet, setLoadingDet] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [loadingMes, setLoadingMes] = useState('')
  const [status,     setStatus]     = useState<{ msg: string; ok?: boolean } | null>(null)
  const [importMes,  setImportMes]  = useState(mes)
  const [closeMes,   setCloseMes]   = useState(mes)

  const cargarLista = async () => {
    setLoading(true)
    try {
      const res = await onGasCall('cierres')
      if (res.ok) setCierres(res.lista || [])
    } finally {
      setLoading(false)
    }
  }

  const seleccionarCierre = async (c: CierreResumen) => {
    if (selected?.mesAnio === c.mesAnio) {
      setSelected(null)
      setDetalle(null)
      return
    }
    setSelected(c)
    setDetalle(null)
    setLoadingDet(true)
    try {
      const res = await onGasCall('cierre', { mes: c.mesAnio })
      if (res.ok) setDetalle(res.data)
    } catch (e) {
      console.error('Error cargando cierre:', e)
    } finally {
      setLoadingDet(false)
    }
  }

  useEffect(() => { cargarLista() }, []) // eslint-disable-line

  const handleCargarDrive = async () => {
    setLoadingMes(importMes)
    setStatus({ msg: '⏳ Buscando en Drive y extrayendo datos... ~30s' })
    try {
      const res = await onGasCall('cargarDrive', { mes: importMes })
      if (res.ok) {
        setStatus({ msg: `✅ ${mesLabel(res.mesAnio)} cargado — ${formatN(res.totalCasos)} casos`, ok: true })
        cargarLista()
      } else {
        setStatus({ msg: `❌ ${res.error}`, ok: false })
      }
    } catch (e: any) {
      setStatus({ msg: `❌ ${e.message}`, ok: false })
    } finally {
      setLoadingMes('')
    }
  }

  const handleCerrarMes = async (mesAnterior: boolean) => {
    const target = mesAnterior ? undefined : closeMes
    setStatus({ msg: `⏳ Consultando Salesforce para ${mesAnterior ? 'el mes anterior' : mesLabel(closeMes)}...` })
    try {
      const params: Record<string,string> = {}
      if (target) params.mes = target
      const res = await onGasCall('cerrarMes', params)
      if (res.ok) {
        setStatus({ msg: `✅ Cierre ${mesLabel(res.mesAnio)} guardado — ${formatN(res.totalCasos)} casos`, ok: true })
        cargarLista()
      } else {
        setStatus({ msg: `❌ ${res.error}`, ok: false })
      }
    } catch (e: any) {
      setStatus({ msg: `❌ ${e.message}`, ok: false })
    }
  }

  return (
    <div className="space-y-5 py-4">

      {/* Panels Drive + SF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-xl border border-success/20 bg-success/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-success" />
            <span className="text-sm font-bold text-foreground">Cargar desde Drive</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Lee el Excel del mes desde tu carpeta de Drive, extrae los KPIs exactos del Gerencial y guarda permanentemente en Sheets.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="month" value={importMes}
              onChange={e => setImportMes(e.target.value)}
              className="h-8 rounded-lg border border-border bg-input px-3 text-sm font-mono text-foreground focus:border-success focus:outline-none"
            />
            <button
              onClick={handleCargarDrive}
              disabled={!!loadingMes}
              className="flex items-center gap-2 h-8 px-4 rounded-lg bg-success/20 border border-success/30 text-success text-xs font-bold hover:bg-success/25 transition-colors disabled:opacity-50"
            >
              {loadingMes ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FolderOpen className="h-3 w-3" />}
              Cargar desde Drive
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Cerrar mes desde Salesforce</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Consulta SF con el rango completo del mes y guarda en Google Sheets.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="month" value={closeMes}
              onChange={e => setCloseMes(e.target.value)}
              className="h-8 rounded-lg border border-border bg-input px-3 text-sm font-mono text-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => handleCerrarMes(false)}
              className="h-8 px-4 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
            >
              🔒 Cerrar mes
            </button>
            <button
              onClick={() => handleCerrarMes(true)}
              className="h-8 px-4 rounded-lg bg-accent border border-border text-muted-foreground text-xs font-semibold hover:bg-accent/80 transition-colors"
            >
              ⚡ Mes anterior
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm font-medium',
          status.ok === true  ? 'border-success/30 bg-success/10 text-success' :
          status.ok === false ? 'border-danger/30 bg-danger/10 text-danger' :
          'border-warning/30 bg-warning/10 text-warning'
        )}>
          {status.msg}
        </div>
      )}

      {/* Lista de cierres */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Cierres guardados</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{cierres.length} cierre{cierres.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={cargarLista}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refrescar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Cargando...
          </div>
        ) : cierres.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No hay cierres guardados aún.
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 xl:grid-cols-6 lg:overflow-visible"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {cierres.map(c => {
              const r = c.resumen
              const okTms = r.tmss <= META_TMS
              const okSn1 = r.sn1s >= META_SN1
              const allOk = okTms && okSn1
              const isSelected = selected?.mesAnio === c.mesAnio
              return (
                <motion.button
                  key={c.mesAnio}
                  onClick={() => seleccionarCierre(c)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ minWidth: '160px', scrollSnapAlign: 'start' }}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all flex-shrink-0 lg:flex-shrink',
                    isSelected
                      ? 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border bg-card/50 hover:border-border/80 hover:bg-accent/50'
                  )}
                >
                  <div className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold mb-2',
                    allOk ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  )}>
                    {allOk ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    {allOk ? 'En objetivo' : 'Fuera'}
                  </div>
                  <p className="font-mono text-sm font-bold text-primary">{mesLabel(c.mesAnio)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 mb-3">{c.fechaCaptura?.slice(0, 10)}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">TMS s/COFO</p>
                      <p className={cn('text-xs font-bold font-mono', okTms ? 'text-success' : 'text-danger')}>{formatHMS(r.tmss)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">SN1 s/COFO</p>
                      <p className={cn('text-xs font-bold font-mono', okSn1 ? 'text-success' : 'text-danger')}>{formatPct(r.sn1s)}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2">{formatN(r.totalMayoristas)} casos</p>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Detalle del cierre seleccionado */}
      {selected && (
        loadingDet ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Cargando detalle...
          </div>
        ) : (
          <CierreDetalle selected={selected} detalle={detalle} />
        )
      )}
    </div>
  )
}
