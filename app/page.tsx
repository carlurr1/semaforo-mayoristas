'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Download, Activity, Database, Calendar, Camera } from 'lucide-react'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, statusLabel, mesLabel, mesActual } from '@/lib/utils'
import type { MetricasData, CierreResumen } from '@/lib/gas'

// ── Componentes internos ─────────────────────────────────────
import { SplashScreen }   from '@/components/dashboard/splash-screen'
import { KPIGrid }        from '@/components/dashboard/kpi-cards'
import { ChartsSection }  from '@/components/dashboard/charts'
import { ClientTable }    from '@/components/dashboard/client-table'
import { DatabaseTable }  from '@/components/dashboard/database-table'
import { ClosuresView }   from '@/components/dashboard/closures-view'
import { ReportView }     from '@/components/dashboard/report-view'

const META_SN1 = 0.70
const META_TMS = 11.5

// ── Tabs ─────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard',     icon: Activity  },
  { id: 'database',  label: 'Base de datos', icon: Database  },
  { id: 'cierres',   label: 'Cierres',       icon: Calendar  },
  { id: 'informe',   label: 'Informe',        icon: Camera    },
]

// ── Helper: llamar al proxy /api/gas ─────────────────────────
async function gasCall(action: string, params: Record<string,string> = {}) {
  const url = new URL('/api/gas', window.location.origin)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function Dashboard() {
  const [loading,     setLoading]     = useState(true)
  const [progress,    setProgress]    = useState(0)
  const [loadMsg,     setLoadMsg]     = useState('Conectando con Salesforce...')
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [refreshing,  setRefreshing]  = useState(false)
  const [mes,         setMes]         = useState(mesActual)
  const [data,        setData]        = useState<MetricasData | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [cierres,     setCierres]     = useState<CierreResumen[]>([])
  const [service,     setService]     = useState('')
  const [tipo,        setTipo]        = useState('')
  const [cliente,     setCliente]     = useState('')

  // ── Carga de métricas ──────────────────────────────────────
  const cargar = useCallback(async (mesParam?: string) => {
    const mesTarget = mesParam || mes
    setRefreshing(true)
    setError(null)
    const msgs = [
      'Conectando con Salesforce...',
      'Cargando casos del período...',
      'Calculando métricas TMS...',
      'Procesando datos SN1...',
      'Preparando dashboard...',
    ]
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + 15 + Math.random() * 10, 90)
      setProgress(Math.round(p))
      setLoadMsg(msgs[Math.min(Math.floor(p / 20), msgs.length - 1)])
    }, 400)

    try {
      const params: Record<string,string> = {}
      if (mesTarget) params.mes = mesTarget
      const d = await gasCall('metricas', params)
      clearInterval(iv)
      setProgress(100)
      setLoadMsg('¡Listo!')
      if (d.ok === false) throw new Error(d.error || 'Sin datos')
      setData(d)
    } catch (e: unknown) {
      clearInterval(iv)
      const msg = e instanceof Error ? e.message : 'Error de conexión'
      setError(msg)
    } finally {
      setRefreshing(false)
      setTimeout(() => setLoading(false), 300)
    }
  }, [mes])

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = () => cargar(mes)

  const handleExport = () => {
    // Reutiliza la misma lógica de exportación que tenía el index.html
    if (!data) return
    alert('Exportación disponible — integra xlsx.js aquí si lo necesitas')
  }

  // ── KPI con filtros aplicados ──────────────────────────────
  const clientesFiltrados = data?.clientes?.filter(c => {
    if (service && c.servicio !== service) return false
    if (tipo    && c.tipo    !== tipo)    return false
    if (cliente && c.nit     !== cliente) return false
    return true
  }) || []

  return (
    <>
      <AnimatePresence>
        {loading && (
          <SplashScreen
            progress={progress}
            message={loadMsg}
            error={error}
            onRetry={() => { setError(null); setLoading(true); cargar() }}
          />
        )}
      </AnimatePresence>

      {!loading && (
        <div className="min-h-screen bg-background">

          {/* ── HEADER ─────────────────────────────────────── */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
            <div className="flex h-[60px] items-center justify-between px-4 lg:px-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm">
                  ETB
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">Semáforo Mayoristas</p>
                  <p className="text-[10px] text-muted-foreground font-mono">E&G Soporte</p>
                </div>
              </div>

              {/* Nav tabs */}
              <nav className="hidden md:flex items-center gap-1">
                {TABS.map(tab => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        active ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </motion.button>
                  )
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {data && (
                  <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground">
                    {formatN(data.totalMayoristas)} casos
                  </span>
                )}
                <button
                  onClick={handleExport}
                  className="hidden sm:flex items-center gap-2 text-xs border border-success/40 text-success bg-success/10 hover:bg-success/15 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </button>
                <button
                  onClick={handleLoad}
                  disabled={refreshing}
                  className="flex items-center gap-2 text-xs border border-border bg-accent hover:bg-accent/80 px-3 py-1.5 rounded-lg font-semibold text-muted-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 lg:px-6 border-t border-border bg-card/40">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mes</span>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={mes}
                  onChange={e => setMes(e.target.value)}
                  className="h-8 w-auto rounded-lg border border-border bg-input px-3 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleLoad}
                  disabled={refreshing}
                  className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Cargar
                </button>
              </div>

              <div className="h-5 w-px bg-border hidden sm:block" />

              {/* Servicio */}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Servicio</span>
              <select
                value={service}
                onChange={e => setService(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Basico">Basico</option>
              </select>

              {/* Tipo */}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</span>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                {[...new Set(data?.clientes.map(c => c.tipo) || [])].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Cliente */}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</span>
              <select
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                {[...(data?.clientes || [])].sort((a,b) => a.nombre.localeCompare(b.nombre)).map(c => (
                  <option key={c.nit} value={c.nit}>{c.nombre}</option>
                ))}
              </select>

              <button
                onClick={() => { setService(''); setTipo(''); setCliente('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar
              </button>

              <div className="ml-auto">
                <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[10px] font-bold text-primary font-mono">
                  {formatN(data?.totalMayoristas || 0)} casos
                </span>
              </div>
            </div>
          </header>

          {/* ── MAIN ───────────────────────────────────────── */}
          <main className="px-4 py-6 lg:px-6 max-w-[1800px] mx-auto">

            {/* Dashboard */}
            {activeTab === 'dashboard' && data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <SectionHeader label="Resumen del período" />
                <KPIGrid data={data} clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} />

                <SectionHeader label="Evolución diaria del mes" />
                <ChartsSection data={data} clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} />

                <SectionHeader label="TMS y SN1 por cliente" />
                <ClientTable clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} />
              </motion.div>
            )}

            {/* BD */}
            {activeTab === 'database' && data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DatabaseTable records={data.bdRecords || []} />
              </motion.div>
            )}

            {/* Cierres */}
            {activeTab === 'cierres' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ClosuresView
                  mes={mes}
                  onGasCall={gasCall}
                />
              </motion.div>
            )}

            {/* Informe */}
            {activeTab === 'informe' && data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReportView data={data} mes={mes} metaSn1={META_SN1} metaTms={META_TMS} />
              </motion.div>
            )}

            {/* Estado vacío */}
            {!data && !loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <p className="text-muted-foreground text-sm">No hay datos cargados.</p>
                <button onClick={handleLoad} className="text-sm text-primary hover:underline">
                  Cargar datos
                </button>
              </div>
            )}
          </main>
        </div>
      )}
    </>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">
      <span>{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
