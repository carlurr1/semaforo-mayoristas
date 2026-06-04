'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, formatHMS } from '@/lib/utils'
import type { BDRecord } from '@/lib/gas'

interface DatabaseTableProps {
  records: BDRecord[]
}

// Configuración de columnas (key debe corresponder a campo en BDRecord o getter)
type ColKey = 'caso' | 'idLegado' | 'cliente' | 'idServicio' | 'servicio' | 'cierre' | 'tms' | 'areaSol' | 'n4' | 'masivo' | 'cofoSN1' | 'hdp' | 'propietario'
const COLS: { key: ColKey; label: string }[] = [
  { key: 'caso',        label: 'Caso SF' },
  { key: 'idLegado',    label: 'Id Legado' },
  { key: 'cliente',     label: 'Cliente' },
  { key: 'idServicio',  label: 'ID Servicio' },
  { key: 'servicio',    label: 'Servicio' },
  { key: 'cierre',      label: 'Cierre' },
  { key: 'tms',         label: 'TMS' },
  { key: 'areaSol',     label: 'Área Sol.' },
  { key: 'n4',          label: 'N4' },
  { key: 'masivo',      label: 'Masivo' },
  { key: 'cofoSN1',     label: 'COFO' },
  { key: 'hdp',         label: 'SN1' },
  { key: 'propietario', label: 'Propietario' },
]

function getVal(r: BDRecord, key: ColKey): string | number | boolean {
  if (key === 'tms') return r.tms || 0
  if (key === 'masivo') return !!r.masivo
  if (key === 'cofoSN1') return r.cofoSN1
  if (key === 'hdp') return r.hdp
  return (r as any)[key] || ''
}

// Tarjeta individual para móvil
function RecordCard({ r }: { r: BDRecord }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{r.cliente}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{r.nit}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn('font-mono text-sm font-bold', r.tms > 11.5 ? 'text-danger' : 'text-success')}>
            {formatHMS(r.tms)}
          </p>
          <p className="text-[10px] text-muted-foreground">{r.cierre?.slice(5) || '—'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary">
          {r.caso || '—'}
        </span>
        {r.idServicio && (
          <span className="inline-flex items-center rounded-full bg-accent border border-border px-2 py-0.5 text-[10px] font-mono text-accent-foreground">
            {r.idServicio}
          </span>
        )}
        {r.servicio && (
          <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {r.servicio}
          </span>
        )}
        {r.hdp !== undefined && (
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
            r.hdp ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger')}>
            {r.hdp ? 'HDP' : 'ESC'}
          </span>
        )}
        {r.masivo && (
          <span className="inline-flex items-center rounded-full bg-warning/10 border border-warning/30 px-2 py-0.5 text-[10px] text-warning">
            Masivo
          </span>
        )}
        {r.cofoSN1 && (
          <span className="inline-flex items-center rounded-full bg-warning/10 border border-warning/30 px-2 py-0.5 text-[10px] text-warning">
            COFO
          </span>
        )}
      </div>
      {r.areaSol && (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Área:</span> {r.areaSol}
          {r.n4 && <> · <span className="font-semibold">N4:</span> {r.n4.slice(0, 30)}</>}
        </p>
      )}
    </div>
  )
}

export function DatabaseTable({ records }: DatabaseTableProps) {
  const [search,        setSearch]        = useState('')
  const [serviceFilter, setServiceFilter] = useState<string | null>(null)
  const [massiveFilter, setMassiveFilter] = useState<boolean | null>(null)
  const [cofoFilter,    setCofoFilter]    = useState<boolean | null>(null)
  const [hdpFilter,     setHdpFilter]     = useState<boolean | null>(null)
  const [n4Filter,      setN4Filter]      = useState<string | null>(null)
  const [idSrvFilter,   setIdSrvFilter]   = useState<string | null>(null)
  const [sortBy,        setSortBy]        = useState<{ col: ColKey; dir: 'asc' | 'desc' } | null>(null)

  // Listas únicas para filtros N4 e ID Servicio
  const n4Options = useMemo(() => {
    const s = new Set<string>()
    records.forEach(r => { if (r.n4) s.add(r.n4) })
    return Array.from(s).sort()
  }, [records])

  const idSrvOptions = useMemo(() => {
    const s = new Set<string>()
    records.forEach(r => { if (r.idServicio) s.add(r.idServicio) })
    return Array.from(s).sort()
  }, [records])

  const filtered = useMemo(() => {
    const arr = records.filter(r => {
      if (search) {
        const q = search.toLowerCase()
        const hay = (r.caso + r.cliente + r.nit + (r.propietario || '') + (r.n4 || '') + (r.n5 || '') + (r.idServicio || '')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (serviceFilter && r.servicio !== serviceFilter) return false
      if (massiveFilter !== null && !!r.masivo !== massiveFilter) return false
      if (cofoFilter    !== null && r.cofoSN1 !== cofoFilter) return false
      if (hdpFilter     !== null && r.hdp     !== hdpFilter) return false
      if (n4Filter      && r.n4 !== n4Filter) return false
      if (idSrvFilter   && r.idServicio !== idSrvFilter) return false
      return true
    })
    if (sortBy) {
      const { col, dir } = sortBy
      const mult = dir === 'asc' ? 1 : -1
      arr.sort((a, b) => {
        const va = getVal(a, col)
        const vb = getVal(b, col)
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
        return String(va).localeCompare(String(vb), 'es', { numeric: true }) * mult
      })
    }
    return arr
  }, [records, search, serviceFilter, massiveFilter, cofoFilter, hdpFilter, n4Filter, idSrvFilter, sortBy])

  function toggleSort(col: ColKey) {
    setSortBy(prev => {
      if (!prev || prev.col !== col) return { col, dir: 'asc' }
      if (prev.dir === 'asc') return { col, dir: 'desc' }
      return null  // tercer click: limpia
    })
  }

  function descargarExcel() {
    if (!filtered.length) return
    // Formatear TMS como HH:MM:SS para Excel
    const fmtTms = (h: number) => {
      if (!h || h <= 0) return ''
      const s = Math.round(h * 3600)
      return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    }
    const headers = ['Caso SF', 'Id Legado', 'NIT', 'Cliente', 'ID Servicio', 'Servicio', 'Cierre', 'TMS (h)', 'TMS (HMS)', 'Area Sol.', 'N2', 'N4', 'N5', 'Causa Imputabilidad', 'Masivo', 'COFO SN1', 'COFO TMS', 'HDP', 'Propietario']
    const escape = (v: any) => {
      const s = String(v ?? '')
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes(';')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const lines = [headers.map(escape).join(';')]
    filtered.forEach(r => {
      lines.push([
        r.caso, r.idLegado, r.nit, r.cliente, r.idServicio || '', r.servicio,
        r.cierre, (r.tms || 0).toFixed(4).replace('.', ','), fmtTms(r.tms),
        r.areaSol, r.n2 || '', r.n4 || '', r.n5 || '', r.causaImp || '',
        r.masivo || '', r.cofoSN1 ? 'Si' : 'No', r.cofoTMS ? 'Si' : 'No',
        r.hdp ? 'HDP' : 'Escalado', r.propietario || ''
      ].map(escape).join(';'))
    })
    // BOM UTF-8 para que Excel respete tildes
    const csv = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const mes = filtered[0]?.cierre?.slice(0, 7) || new Date().toISOString().slice(0, 7)
    a.download = `BD_Mayoristas_${mes}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setSearch(''); setServiceFilter(null); setMassiveFilter(null)
    setCofoFilter(null); setHdpFilter(null); setN4Filter(null); setIdSrvFilter(null); setSortBy(null)
  }
  const hasFilters = !!(search || serviceFilter || massiveFilter !== null || cofoFilter !== null || hdpFilter !== null || n4Filter || idSrvFilter || sortBy)
  const MAX = 300
  const shown = filtered.slice(0, MAX)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-3 py-4">

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar caso, cliente, NIT, ID Servicio, N4..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {filtered.length}/{records.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={descargarExcel}
            disabled={!filtered.length}
            className="gap-1.5 text-xs h-9"
            title="Descargar registros filtrados (CSV — se abre con Excel)"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Filter className="h-3 w-3" />
                {serviceFilter || 'Servicio'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setServiceFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter('Avanzado')}>Avanzado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter('Basico')}>Basico</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                {massiveFilter === null ? 'Masivo' : massiveFilter ? 'Con masivo' : 'Sin masivo'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setMassiveFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(true)}>Con masivo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(false)}>Sin masivo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                {cofoFilter === null ? 'COFO' : cofoFilter ? 'Con COFO' : 'Sin COFO'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCofoFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(true)}>Con COFO</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(false)}>Sin COFO</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                {hdpFilter === null ? 'HDP/Esc' : hdpFilter ? 'HDP' : 'Escalado'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setHdpFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHdpFilter(true)}>HDP</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHdpFilter(false)}>Escalado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {n4Options.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 max-w-[200px]">
                  <span className="truncate">{n4Filter ? `N4: ${n4Filter.slice(0, 20)}` : 'N4'}</span>
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-auto">
                <DropdownMenuItem onClick={() => setN4Filter(null)}>Todos</DropdownMenuItem>
                {n4Options.map(opt => (
                  <DropdownMenuItem key={opt} onClick={() => setN4Filter(opt)} className="text-xs">
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {idSrvOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 max-w-[200px]">
                  <span className="truncate">{idSrvFilter ? `ID: ${idSrvFilter.slice(0, 18)}` : 'ID Servicio'}</span>
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-auto">
                <DropdownMenuItem onClick={() => setIdSrvFilter(null)}>Todos</DropdownMenuItem>
                {idSrvOptions.map(opt => (
                  <DropdownMenuItem key={opt} onClick={() => setIdSrvFilter(opt)} className="text-xs font-mono">
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-xs h-8">
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Vista móvil — tarjetas */}
      <div className="md:hidden space-y-2">
        {shown.map((r, i) => <RecordCard key={r.caso || i} r={r} />)}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Sin resultados</div>
        )}
        {filtered.length > MAX && (
          <p className="text-center text-xs text-muted-foreground py-3">
            Mostrando {MAX} de {filtered.length} — filtra para ver más
          </p>
        )}
      </div>

      {/* Vista desktop — tabla */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted">
                {COLS.map(({ key, label }) => {
                  const active = sortBy?.col === key
                  const Icon = !active ? ArrowUpDown : sortBy.dir === 'asc' ? ArrowUp : ArrowDown
                  return (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      title="Click para ordenar"
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors',
                        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <Icon className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-30')} />
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.caso || i} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-primary">{r.caso || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{r.idLegado || '—'}</td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-sm font-medium truncate">{r.cliente}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{r.nit}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-accent-foreground">{r.idServicio || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      r.servicio === 'Avanzado' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {r.servicio}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{r.cierre?.slice(5) || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className={cn('text-xs font-mono font-bold', r.tms > 11.5 ? 'text-danger' : 'text-success')}>
                      {formatHMS(r.tms)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{r.areaSol || '—'}</td>
                  <td className="px-4 py-3 max-w-[120px]">
                    <p className="text-[10px] truncate text-muted-foreground" title={r.n4}>{r.n4 || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      r.masivo ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground')}>
                      {r.masivo ? '✓' : '−'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      r.cofoSN1 ? 'bg-danger/20 text-danger' : 'bg-muted text-muted-foreground')}>
                      {r.cofoSN1 ? '✓' : '−'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                      r.hdp ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger')}>
                      {r.hdp ? 'H' : 'E'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[120px] truncate">{r.propietario || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > MAX && (
          <p className="text-center py-3 text-xs text-muted-foreground border-t border-border">
            Mostrando {MAX} de {filtered.length} casos filtrados
          </p>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Sin resultados</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
