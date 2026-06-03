'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Download, Activity, Database, Calendar, Camera, Sun, Moon } from 'lucide-react'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, statusLabel, mesLabel, mesActual } from '@/lib/utils'
import type { MetricasData, CierreResumen } from '@/lib/gas'

import { SplashScreen }   from '@/components/dashboard/splash-screen'
import { KPIGrid }        from '@/components/dashboard/kpi-cards'
import { ChartsSection }  from '@/components/dashboard/charts'
import { ClientTable }    from '@/components/dashboard/client-table'
import { DatabaseTable }  from '@/components/dashboard/database-table'
import { ClosuresView }   from '@/components/dashboard/closures-view'
import { ReportView }     from '@/components/dashboard/report-view'

const META_SN1 = 0.70
const META_TMS = 11.5

const TABS = [
  { id: 'dashboard', label: 'Dashboard',     icon: Activity  },
  { id: 'database',  label: 'BD',            icon: Database  },
  { id: 'cierres',   label: 'Cierres',       icon: Calendar  },
  { id: 'informe',   label: 'Informe',       icon: Camera    },
]

async function gasCall(action: string, params: Record<string,string> = {}) {
  const url = new URL('/api/gas', window.location.origin)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function Dashboard() {
  const [loading,    setLoading]    = useState(true)
  const [progress,   setProgress]   = useState(0)
  const [loadMsg,    setLoadMsg]    = useState('Conectando con Salesforce...')
  const [activeTab,  setActiveTab]  = useState('dashboard')
  const [refreshing, setRefreshing] = useState(false)
  const [mes,        setMes]        = useState(mesActual)
  const [data,       setData]       = useState<MetricasData | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [theme,      setTheme]      = useState<'dark'|'light'>('dark')
  const [histCierres, setHistCierres] = useState<any[]>([])
  const [service,    setService]    = useState('')
  const [tipo,       setTipo]       = useState('')
  const [cliente,    setCliente]    = useState('')

  const cargar = useCallback(async (mesParam?: string) => {
    const mesTarget = mesParam || mes
    setRefreshing(true)
    setError(null)
    const msgs = [
      'Buscando cierre guardado...',
      'Cargando datos del mes...',
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
      // 1. Intentar primero traer el cierre guardado en Sheets
      let d: any = null
      let fuenteCierre = false
      if (mesTarget) {
        try {
          const cierreRes = await gasCall('cierre', { mes: mesTarget })
          if (cierreRes && cierreRes.ok === true && cierreRes.data) {
            d = { ...cierreRes.data, fuenteCierre: true }
            fuenteCierre = true
              setLoadMsg('Cierre guardado encontrado ✓')
          } else {
            }
        } catch (e) {
        }
      }

      // 2. Si no hay cierre, consultar Salesforce
      if (!d) {
        setLoadMsg('Consultando Salesforce...')
        const params: Record<string,string> = {}
        if (mesTarget) params.mes = mesTarget
        d = await gasCall('metricas', params)
        }

      clearInterval(iv)
      setProgress(100)
      setLoadMsg(fuenteCierre ? '¡Cierre cargado!' : '¡Listo!')
      if (d.ok === false) throw new Error(d.error || 'Sin datos')
      // Forzar nueva referencia para que React detecte el cambio
      setData({ ...d })
    } catch (e: unknown) {
      clearInterval(iv)
      const msg = e instanceof Error ? e.message : 'Error de conexión'
      setError(msg)
    } finally {
      setRefreshing(false)
      setTimeout(() => setLoading(false), 300)
    }
  }, [mes])

  useEffect(() => {
    cargar()
    // Cargar histórico de cierres para las gráficas de tendencia
    gasCall('cierres').then(res => {
      if (res.ok && res.lista?.length) {
        const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        const hist = res.lista
          .filter((c: any) => c.resumen)
          .map((c: any) => {
            const [yy, mm] = c.mesAnio.split('-')
            return {
              mes: `${meses[parseInt(mm)]} ${yy.slice(2)}`,
              tms_sc: c.resumen.tmss,
              tms_cc: c.resumen.tms,
              sn1_sc: c.resumen.sn1s,
              sn1_cc: c.resumen.sn1,
            }
          })
          .sort((a: any, b: any) => {
            const mL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
            const [am, ay] = [mL.indexOf(a.mes.slice(0,3)), parseInt(a.mes.slice(-2))]
            const [bm, by] = [mL.indexOf(b.mes.slice(0,3)), parseInt(b.mes.slice(-2))]
            return ay !== by ? ay - by : am - bm
          })
          .slice(-6) // últimos 6 meses cerrados
        setHistCierres(hist)
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const handleLoad = () => cargar(mes)

  const esCierreActivo = data && (!!(data as any).fuenteCierre || !!(data as any).mesAnio || !!(data as any).fuenteDrive)

  // Debug: ver primer cliente para entender formato del TMS
  if (data?.clientes?.length && esCierreActivo) {
    const enel = data.clientes.find(c => c.nombre?.includes('ENEL')) || data.clientes[0]
    console.log('DEBUG cliente cierre:', enel)
  }

  // Si es cierre, normalizar TMS si vienen como suma absurda en lugar de promedio
  const clientesNormalizados = !data?.clientes ? [] : data.clientes.map(c => {
    if (esCierreActivo) {
      // Si el TMS es absurdamente alto (>100h) y hay varios casos, dividir por casos para obtener el promedio
      const tmsNorm  = (c.tms  !== null && c.tms  > 100 && c.casos > 1)  ? c.tms  / c.casos    : c.tms
      const tmssNorm = (c.tmss !== null && c.tmss > 100 && c.tmss_n > 1) ? c.tmss / c.tmss_n   : c.tmss
      return { ...c, tms: tmsNorm, tmss: tmssNorm }
    }
    return c
  })

  const clientesFiltrados = clientesNormalizados.filter(c => {
    if (service && c.servicio !== service) return false
    if (tipo    && c.tipo    !== tipo)    return false
    if (cliente && c.nit     !== cliente) return false
    return true
  })

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

          {/* HEADER */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
            <div className="flex h-[60px] items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm">
                  ETB
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">Semáforo Mayoristas</p>
                  <p className="text-[10px] text-muted-foreground font-mono">E&G Soporte</p>
                </div>
              </div>

              {/* Tabs desktop */}
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

              <div className="flex items-center gap-2">
                {data && (
                  <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground">
                    {formatN(data.totalMayoristas)} casos
                  </span>
                )}
                <button
                  onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-2 text-xs border border-border bg-accent hover:bg-accent/80 px-3 py-1.5 rounded-lg font-semibold text-muted-foreground transition-colors"
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {theme === 'dark'
                    ? <Sun className="h-3.5 w-3.5" />
                    : <Moon className="h-3.5 w-3.5" />
                  }
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
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 lg:px-6 border-t border-border bg-card/40 overflow-x-auto">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Mes</span>
              <input
                type="month"
                value={mes}
                onChange={e => setMes(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleLoad}
                disabled={refreshing}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Cargar
              </button>
              <div className="h-5 w-px bg-border hidden sm:block" />
              <select
                value={service}
                onChange={e => setService(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Servicio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Basico">Basico</option>
              </select>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Tipo</option>
                {[...new Set(data?.clientes.map(c => c.tipo) || [])].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                className="h-8 rounded-lg border border-border bg-input px-2 text-xs text-foreground focus:border-primary focus:outline-none max-w-[140px]"
              >
                <option value="">Cliente</option>
                {[...(data?.clientes || [])].sort((a,b) => a.nombre.localeCompare(b.nombre)).map(c => (
                  <option key={c.nit} value={c.nit}>{c.nombre}</option>
                ))}
              </select>
              <button
                onClick={() => { setService(''); setTipo(''); setCliente('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Limpiar
              </button>
              <div className="ml-auto">
                <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[10px] font-bold text-primary font-mono whitespace-nowrap">
                  {formatN(data?.totalMayoristas || 0)} casos
                </span>
              </div>
            </div>
          </header>

          {/* MAIN */}
          <main className="px-4 py-6 pb-24 lg:px-6 max-w-[1800px] mx-auto">

            {activeTab === 'dashboard' && data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <SectionHeader label="Resumen del período" />
                <KPIGrid data={data} clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} />
                <SectionHeader label="Evolución diaria del mes" />
                <ChartsSection data={data} clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} histCierres={histCierres} />
                <SectionHeader label="TMS y SN1 por cliente" />
                <ClientTable clientes={clientesFiltrados} metaSn1={META_SN1} metaTms={META_TMS} />
              </motion.div>
            )}

            {activeTab === 'database' && data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DatabaseTable records={data.bdRecords || []} />
              </motion.div>
            )}

            {activeTab === 'cierres' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ClosuresView mes={mes} onGasCall={gasCall} />
              </motion.div>
            )}

            {activeTab === 'informe' && data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReportView data={data} mes={mes} metaSn1={META_SN1} metaTms={META_TMS} histCierres={histCierres} />
              </motion.div>
            )}

            {!data && !loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <p className="text-muted-foreground text-sm">No hay datos cargados.</p>
                <button onClick={handleLoad} className="text-sm text-primary hover:underline">Cargar datos</button>
              </div>
            )}
          </main>

          {/* NAV MÓVIL — solo visible en pantallas pequeñas */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-xl">
            <div className="flex items-center justify-around h-16 px-2">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                      active
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

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
