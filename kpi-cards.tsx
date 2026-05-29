'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, FolderOpen, Lock, Check, X, Download } from 'lucide-react'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, mesLabel } from '@/lib/utils'
import type { CierreResumen } from '@/lib/gas'

const META_SN1 = 0.70
const META_TMS = 11.5

interface ClosuresViewProps {
  mes: string
  onGasCall: (action: string, params?: Record<string,string>) => Promise<any>
}

export function ClosuresView({ mes, onGasCall }: ClosuresViewProps) {
  const [cierres,     setCierres]     = useState<CierreResumen[]>([])
  const [selected,    setSelected]    = useState<CierreResumen | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMes,  setLoadingMes]  = useState('')
  const [status,      setStatus]      = useState<{ msg: string; ok?: boolean } | null>(null)
  const [importMes,   setImportMes]   = useState(mes)
  const [closeMes,    setCloseMes]    = useState(mes)

  const cargarLista = async () => {
    setLoading(true)
    try {
      const res = await onGasCall('cierres')
      if (res.ok) setCierres(res.lista || [])
    } finally {
      setLoading(false)
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

      {/* Panels de gestión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Drive */}
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

        {/* Salesforce */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {cierres.map(c => {
              const r = c.resumen
              const okTms = r.tmss <= META_TMS
              const okSn1 = r.sn1s >= META_SN1
              const allOk = okTms && okSn1
              return (
                <motion.button
                  key={c.mesAnio}
                  onClick={() => setSelected(selected?.mesAnio === c.mesAnio ? null : c)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all',
                    selected?.mesAnio === c.mesAnio
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
                  <p className="text-[9px] text-muted-foreground mt-0.5 mb-3">
                    {c.fechaCaptura?.slice(0, 10)}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">TMS s/COFO</p>
                      <p className={cn('text-xs font-bold font-mono', okTms ? 'text-success' : 'text-danger')}>
                        {formatHMS(r.tmss)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">SN1 s/COFO</p>
                      <p className={cn('text-xs font-bold font-mono', okSn1 ? 'text-success' : 'text-danger')}>
                        {formatPct(r.sn1s)}
                      </p>
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-mono text-2xl font-bold text-primary">
                Cierre: {mesLabel(selected.mesAnio)}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Capturado: {selected.fechaCaptura}
              </p>
            </div>
            <span className="font-mono text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5">
              {formatN(selected.resumen.totalMayoristas)} casos
            </span>
          </div>

          {/* KPIs del cierre */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'SN1 Con COFO', value: formatPct(selected.resumen.sn1), status: sn1Status(selected.resumen.sn1, META_SN1) },
              { label: 'SN1 Sin COFO', value: formatPct(selected.resumen.sn1s), status: sn1Status(selected.resumen.sn1s, META_SN1) },
              { label: 'TMS Con COFO', value: formatHMS(selected.resumen.tms), status: tmsStatus(selected.resumen.tms, META_TMS) },
              { label: 'TMS Sin COFO', value: formatHMS(selected.resumen.tmss), status: tmsStatus(selected.resumen.tmss, META_TMS) },
            ].map((k, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{k.label}</p>
                <p className={cn('font-mono text-xl font-bold',
                  k.status === 'success' ? 'text-success' :
                  k.status === 'danger'  ? 'text-danger'  : 'text-warning'
                )}>{k.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
